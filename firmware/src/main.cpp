#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <mbedtls/md.h>
#include <esp_idf_version.h>
#include "voltloop_frame.h"
#if __has_include("hmac_key.h")
#include "hmac_key.h"
#else
static const uint8_t VL_HMAC_KEY[] = {
    'v','o','l','t','l','o','o','p','-','d','e','m','o','-',
    'h','m','a','c','-','k','e','y','-','2','0','2','6'
};
#define VL_HMAC_KEY_LEN (sizeof(VL_HMAC_KEY))
#endif

#if defined(VL_ROLE_VEHICLE)
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#endif

#ifndef VL_ROLE_RSU
#ifndef VL_ROLE_VEHICLE
#define VL_ROLE_VEHICLE 1
#endif
#endif

static const uint8_t BROADCAST_MAC[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

#define BLE_SERVICE_UUID  "6b1d0001-7c4a-4f8e-9b21-a1b2c3d4e5f6"
#define BLE_CHAR_RX_UUID  "6b1d0002-7c4a-4f8e-9b21-a1b2c3d4e5f6"
#define BLE_CHAR_TX_UUID  "6b1d0003-7c4a-4f8e-9b21-a1b2c3d4e5f6"
#define BLE_CHAR_ID_UUID  "6b1d0004-7c4a-4f8e-9b21-a1b2c3d4e5f6"

struct RingEntry {
  uint32_t msg_id;
  uint8_t hears;
  uint32_t first_ms;
  uint16_t window_ms;
  bool suppressed;
};

static RingEntry ring[VL_RING_SIZE];
static uint8_t ring_count = 0;
static uint8_t ring_cursor = 0;
static uint16_t g_origin_id = 0;

#if defined(VL_ROLE_VEHICLE)
static BLECharacteristic *g_rx_char = nullptr;
static BLECharacteristic *g_tx_char = nullptr;
static bool g_ble_connected = false;
static uint8_t g_last_frame[VL_MAX_FRAME_SIZE];
static uint16_t g_last_frame_len = 0;
#endif

static uint32_t read_u32_le(const uint8_t *p) {
  return (uint32_t)p[0] | ((uint32_t)p[1] << 8) | ((uint32_t)p[2] << 16) | ((uint32_t)p[3] << 24);
}
static uint16_t read_u16_le(const uint8_t *p) {
  return (uint16_t)p[0] | ((uint16_t)p[1] << 8);
}
static void write_u32_le(uint8_t *p, uint32_t v) {
  p[0] = v & 0xFF; p[1] = (v >> 8) & 0xFF; p[2] = (v >> 16) & 0xFF; p[3] = (v >> 24) & 0xFF;
}
static void write_u16_le(uint8_t *p, uint16_t v) {
  p[0] = v & 0xFF; p[1] = (v >> 8) & 0xFF;
}

static bool hmac_trunc16(const uint8_t *data, size_t len, uint8_t out[VL_HMAC_SIZE]) {
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  const mbedtls_md_info_t *info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  if (!info) return false;
  if (mbedtls_md_setup(&ctx, info, 1) != 0) {
    mbedtls_md_free(&ctx);
    return false;
  }
  mbedtls_md_hmac_starts(&ctx, VL_HMAC_KEY, VL_HMAC_KEY_LEN);
  mbedtls_md_hmac_update(&ctx, data, len);
  uint8_t full[32];
  mbedtls_md_hmac_finish(&ctx, full);
  mbedtls_md_free(&ctx);
  memcpy(out, full, VL_HMAC_SIZE);
  return true;
}

static bool verify_frame(const uint8_t *buf, uint16_t len) {
  if (len < VL_HEADER_SIZE + VL_HMAC_SIZE || len > VL_MAX_FRAME_SIZE) return false;
  uint16_t payload_len = read_u16_le(buf + 14);
  if (VL_HEADER_SIZE + payload_len + VL_HMAC_SIZE != len) return false;
  uint8_t expect[VL_HMAC_SIZE];
  if (!hmac_trunc16(buf, VL_HEADER_SIZE + payload_len, expect)) return false;
  return memcmp(expect, buf + VL_HEADER_SIZE + payload_len, VL_HMAC_SIZE) == 0;
}

static void sign_in_place(uint8_t *buf, uint16_t payload_len) {
  hmac_trunc16(buf, VL_HEADER_SIZE + payload_len, buf + VL_HEADER_SIZE + payload_len);
}

static uint16_t jitter_ms() {
  return VL_JITTER_MIN_MS + (esp_random() % (VL_JITTER_MAX_MS - VL_JITTER_MIN_MS + 1));
}

struct StormDecision {
  bool is_new;
  bool suppress;
  uint16_t wait_ms;
};

static StormDecision storm_observe(uint32_t msg_id) {
  uint32_t now = millis();
  for (uint8_t i = 0; i < ring_count; i++) {
    if (ring[i].msg_id == msg_id) {
      ring[i].hears++;
      if ((now - ring[i].first_ms) <= ring[i].window_ms && ring[i].hears >= 3) {
        ring[i].suppressed = true;
      }
      StormDecision d = {false, ring[i].suppressed, 0};
      return d;
    }
  }
  RingEntry e = {msg_id, 1, now, jitter_ms(), false};
  if (ring_count < VL_RING_SIZE) {
    ring[ring_count++] = e;
  } else {
    ring[ring_cursor % VL_RING_SIZE] = e;
    ring_cursor++;
  }
  StormDecision d = {true, false, e.window_ms};
  return d;
}

static void espnow_send(const uint8_t *data, uint16_t len) {
  esp_err_t err = esp_now_send(BROADCAST_MAC, data, len);
  Serial.printf("[ESPNOW] send %u bytes err=%d\n", len, (int)err);
}

static void hop_and_send(uint8_t *buf, uint16_t len) {
  if (buf[8] <= 1) {
    Serial.println("[HOP] ttl expired");
    return;
  }
  buf[8] = buf[8] - 1;
  buf[9] = buf[9] + 1;
  uint16_t payload_len = read_u16_le(buf + 14);
  sign_in_place(buf, payload_len);
  espnow_send(buf, len);
  Serial.printf("[HOP] msg=%lu hop=%u ttl=%u\n",
                (unsigned long)read_u32_le(buf + 2), buf[9], buf[8]);
}

#if defined(VL_ROLE_VEHICLE)
class ServerCbs : public BLEServerCallbacks {
  void onConnect(BLEServer *) override { g_ble_connected = true; Serial.println("[BLE] phone connected"); }
  void onDisconnect(BLEServer *s) override {
    g_ble_connected = false;
    Serial.println("[BLE] phone disconnected");
    s->startAdvertising();
  }
};

class ShareCbs : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    String v = c->getValue();
    if (v.length() == 0) return;
    uint8_t tmp[VL_MAX_FRAME_SIZE];
    uint16_t len = min((uint16_t)v.length(), (uint16_t)VL_MAX_FRAME_SIZE);
    memcpy(tmp, v.c_str(), len);
    if (!verify_frame(tmp, len)) {
      Serial.println("[BLE] share write failed HMAC");
      return;
    }
    hop_and_send(tmp, len);
  }
};

static void ble_notify_frame(const uint8_t *buf, uint16_t len) {
  if (!g_rx_char || !g_ble_connected) return;
  g_rx_char->setValue((uint8_t *)buf, len);
  g_rx_char->notify();
}

static void setup_ble() {
  char name[24];
  snprintf(name, sizeof(name), "VoltLoop-%04X", g_origin_id);
  BLEDevice::init(name);
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCbs());
  BLEService *svc = server->createService(BLE_SERVICE_UUID);

  g_rx_char = svc->createCharacteristic(
      BLE_CHAR_RX_UUID, BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ);
  g_rx_char->addDescriptor(new BLE2902());

  g_tx_char = svc->createCharacteristic(BLE_CHAR_TX_UUID, BLECharacteristic::PROPERTY_WRITE);
  g_tx_char->setCallbacks(new ShareCbs());

  BLECharacteristic *idc =
      svc->createCharacteristic(BLE_CHAR_ID_UUID, BLECharacteristic::PROPERTY_READ);
  uint8_t idb[2] = {(uint8_t)(g_origin_id & 0xFF), (uint8_t)(g_origin_id >> 8)};
  idc->setValue(idb, 2);

  svc->start();
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(BLE_SERVICE_UUID);
  adv->setScanResponse(true);
  BLEDevice::startAdvertising();
  Serial.printf("[BLE] advertising as %s\n", name);
}
#endif

#if ESP_IDF_VERSION >= ESP_IDF_VERSION_VAL(5, 0, 0)
static void on_espnow_recv(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  (void)info;
#else
static void on_espnow_recv(const uint8_t *mac, const uint8_t *data, int len) {
  (void)mac;
#endif
  if (len < VL_HEADER_SIZE + VL_HMAC_SIZE || len > VL_MAX_FRAME_SIZE) return;
  uint8_t buf[VL_MAX_FRAME_SIZE];
  memcpy(buf, data, len);
  if (!verify_frame(buf, (uint16_t)len)) {
    Serial.println("[ESPNOW] drop bad HMAC");
    return;
  }
  uint32_t msg_id = read_u32_le(buf + 2);
  StormDecision d = storm_observe(msg_id);
  Serial.printf("[ESPNOW] rx msg=%lu hop=%u ttl=%u new=%d suppress=%d\n",
                (unsigned long)msg_id, buf[9], buf[8], d.is_new, d.suppress);

#if defined(VL_ROLE_VEHICLE)
  memcpy(g_last_frame, buf, len);
  g_last_frame_len = (uint16_t)len;
  ble_notify_frame(buf, (uint16_t)len);
#endif

  if (d.suppress) return;
#if defined(VL_ROLE_VEHICLE)
  delay(d.wait_ms);
  StormDecision again = storm_observe(msg_id);
  if (again.suppress) {
    Serial.println("[STORM] suppressed after jitter");
    return;
  }
  hop_and_send(buf, (uint16_t)len);
#endif
}

#if defined(VL_ROLE_RSU)
static void build_offer_frame(uint8_t *out, uint16_t *out_len) {
  const char *json =
      "{\"k\":\"o\",\"n\":\"Dwell Time Dosa\",\"c\":\"Restaurant\",\"d\":20,"
      "\"s\":\"Harbour Expressway Charging Plaza\",\"i\":\"f2222222-2222-4222-8222-222222222222\"}";
  uint16_t payload_len = (uint16_t)strlen(json);
  out[0] = VL_PROTOCOL_VERSION;
  out[1] = VL_MSG_MERCHANT_OFFER;
  write_u32_le(out + 2, esp_random());
  write_u16_le(out + 6, g_origin_id);
  out[8] = VL_DEFAULT_TTL;
  out[9] = 0;
  write_u32_le(out + 10, (uint32_t)(millis() / 1000));
  write_u16_le(out + 14, payload_len);
  memcpy(out + VL_HEADER_SIZE, json, payload_len);
  sign_in_place(out, payload_len);
  *out_len = VL_HEADER_SIZE + payload_len + VL_HMAC_SIZE;
}
#endif

void setup() {
  Serial.begin(115200);
  delay(200);
  g_origin_id = (uint16_t)((esp_random() & 0xFFFE) + 1);

#if defined(VL_ROLE_RSU)
  Serial.println("=== VoltLoop RSU / merchant beacon ===");
#else
  Serial.println("=== VoltLoop vehicle dongle ===");
#endif
  Serial.printf("origin_id=0x%04X\n", g_origin_id);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }
  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, BROADCAST_MAC, 6);
  peer.channel = 0;
  peer.encrypt = false;
  esp_now_add_peer(&peer);
  esp_now_register_recv_cb(on_espnow_recv);

#if defined(VL_ROLE_VEHICLE)
  setup_ble();
#endif
}

void loop() {
#if defined(VL_ROLE_RSU)
  static uint32_t last = 0;
  if (millis() - last > 4000) {
    last = millis();
    uint8_t frame[VL_MAX_FRAME_SIZE];
    uint16_t len = 0;
    build_offer_frame(frame, &len);
    storm_observe(read_u32_le(frame + 2));
    espnow_send(frame, len);
    Serial.printf("[RSU] beacon msg=%lu bytes=%u\n", (unsigned long)read_u32_le(frame + 2), len);
  }
#endif
  delay(10);
}
