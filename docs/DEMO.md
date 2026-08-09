# VoltLoop live demo checklist (≈3 minutes)

Matches blueprint §12. Use Chrome. `npm run dev` (Vite UI at http://localhost:5173) then open two tabs.

## Accounts

| Role | Email | Password |
|---|---|---|
| Driver | driver@voltloop.dev | demo1234 |
| Merchant | merchant@voltloop.dev | demo1234 |
| CPO | cpo@voltloop.dev | demo1234 |

## Software-only path (no ESP32)

1. Tab A → `/sim`. Raise density, click **Inject offer / status**. Lime hops = delivery; red = storm suppress.
2. Tab B → log in as driver → `/offers`. Packet from YOU vehicle appears. Tap **Share hop** → wallet credits +10 VL (HMAC verified).
3. `/map` — Thoothukudi stations, self-reported vacancy. Start a session with expected finish.
4. `/wallet` — place a dwell-time order, redeem tokens (closed-loop, not cash).
5. Log in as merchant → `/merchant` — PENDING → ACCEPTED → READY → COMPLETED.
6. Log in as CPO → `/cpo` — occupancy %, impressions from relays, attributed GMV.

## Hardware path (optional)

1. Flash one board `pio run -e rsu -t upload`, one+ `pio run -e vehicle -t upload`.
2. Phone: disable Wi-Fi + cellular. Chrome → `/offers` → **Connect dongle** (Web Bluetooth, no PIN).
3. Drive/walk vehicle board past RSU; offer appears; Share triggers ESP-NOW hop. Serial shows `msg_id`, hop, ttl.

## Talking points

- Not DSRC/C-V2X — ESP-NOW proxy on 2.4 GHz.
- Tokens are store credit only (no RBI PPI cash-out).
- Vacancy is self-reported, not fake OCPP.
- Mesh IDs rotate; phone never holds the HMAC key.
