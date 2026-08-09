#ifndef VOLTLOOP_FRAME_H
#define VOLTLOOP_FRAME_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* VoltLoop ESP-NOW frame — must stay in lockstep with packages/protocol.
 * Little-endian multi-byte fields. Max on-air size 250 bytes. */

#define VL_PROTOCOL_VERSION   0x01
#define VL_MSG_STATION_STATUS 0x01
#define VL_MSG_MERCHANT_OFFER 0x02
#define VL_DEFAULT_TTL        3
#define VL_HEADER_SIZE        16
#define VL_HMAC_SIZE          16
#define VL_MAX_FRAME_SIZE     250
#define VL_MAX_PAYLOAD_SIZE   (VL_MAX_FRAME_SIZE - VL_HEADER_SIZE - VL_HMAC_SIZE)
#define VL_RING_SIZE          64
#define VL_JITTER_MIN_MS      20
#define VL_JITTER_MAX_MS      100

typedef struct __attribute__((packed)) {
  uint8_t  version;
  uint8_t  msg_type;
  uint32_t msg_id;
  uint16_t origin_id;
  uint8_t  ttl;
  uint8_t  hop_count;
  uint32_t timestamp;
  uint16_t payload_len;
} vl_header_t;

#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 201112L
_Static_assert(sizeof(vl_header_t) == VL_HEADER_SIZE, "vl_header_t must be 16 bytes");
#endif

#ifdef __cplusplus
}
#endif

#endif /* VOLTLOOP_FRAME_H */
