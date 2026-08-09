# VoltLoop ESP32 firmware

VANET-inspired **ESP-NOW** mesh (hackathon proxy for DSRC/C-V2X) + **BLE GATT** phone bridge.

## Roles

| Env | Behavior |
|---|---|
| `vehicle` | Receive ESP-NOW → storm suppress → optional hop; BLE notify phone; Share write triggers hop |
| `rsu` | Periodic merchant-offer beacon over ESP-NOW broadcast |

```bash
pio run -e vehicle
pio run -e rsu
pio run -e vehicle -t upload --upload-port COM5
pio device monitor -b 115200
```

## BLE (must match `lib/ble.ts`)

- Device name: `VoltLoop-XXXX` (rotating origin id)
- Service `6b1d0001-7c4a-4f8e-9b21-a1b2c3d4e5f6`
- `packet_rx` notify, `share_tx` write, `node_id` read (u16 LE)
- No pairing PIN

## HMAC

Demo key matches `VOLTLOOP_HMAC_KEY` / `hmac_key.h`. For production copy `include/hmac_key.h.example` → `hmac_key.h` and rotate the secret on the server too.

## Judge demo

Disable Wi-Fi and cellular on the phone. Dongle still delivers offers over BLE after ESP-NOW hops between boards.
