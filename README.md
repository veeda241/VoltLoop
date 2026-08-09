# VoltLoop

VoltLoop turns EV charging dwell-time into a hyper-local marketplace for merchants using an **offline vehicle mesh**.

**Frontend:** Vite + React PWA from the VoltLoop UI kit (`voltloop.zip`)  
**Also in repo:** shared ESP-NOW protocol, ESP32 firmware, Supabase schema / Edge Functions, optional Next.js API

**Built for:** AICCI National Startup Summit 2026 — Thoothukudi to Global

> **Judge framing:** VANET-inspired prototype. Radio uses **ESP-NOW** (2.4 GHz) as a hackathon proxy for DSRC / C-V2X. Tokens are **closed-loop store credit** (no INR cash-out / RBI PPI). Vacancy is **self-reported**, not fake OCPP.

## Quick start (frontend demo)

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy (static SPA)

The live app is the Vite build (`dist/`). Demo logins work with no backend.

```bash
npm install
npm run build
npm run preview   # http://localhost:4173
```

**Netlify:** connect the repo — `netlify.toml` already sets `npm run build` → `dist` and SPA redirects.

**Vercel:** import the repo — `vercel.json` forces the Vite framework (not Next.js) and SPA rewrites.

**Render:** New → Blueprint — `render.yaml` on `main` builds the Vite SPA (`dist/`) with SPA rewrites.

Optional env on the host:

| Variable | Purpose |
|---|---|
| `VITE_VOLTLOOP_HMAC_KEY` | HMAC secret for mesh hop signing (defaults to demo key; set in Render if you rotate it) |

Web Bluetooth needs **HTTPS** (or localhost). Google map tiles and the India station CSV ship with the static build.

| Role | Email | Password |
|---|---|---|
| Driver | `driver@voltloop.dev` | `demo1234` |
| Merchant | `merchant@voltloop.dev` | `demo1234` |
| CPO | `cpo@voltloop.dev` | `demo1234` |

State lives in React context + localStorage. Mesh packets sync across tabs via `BroadcastChannel`. Hops are HMAC-SHA256 signed with `packages/protocol` (same frame as ESP32).

## 3-minute demo path

1. `/sim` — inject an offer, watch hops (lime = delivered, red = storm-suppressed)
2. `/offers` — **Share hop** → +10 VL (HMAC re-signed)
3. `/map` — start a session, log self-reported finish time
4. `/wallet` — dwell order + redeem VL
5. `/merchant` — PENDING → ACCEPTED → READY → COMPLETED
6. `/cpo` — occupancy, impressions, attributed GMV

Full checklist: [docs/DEMO.md](docs/DEMO.md)

## Optional Next.js API + Supabase

```bash
npm run dev:api   # http://localhost:3001 — Vite proxies /api here
```

Migrations: `supabase/migrations/001_init.sql` + `supabase/seed.sql`  
Edge Functions: `verify-relay`, `redeem-tokens`, `place-order`, `ocm-proxy`

## ESP32 firmware

See [firmware/README.md](firmware/README.md). `/offers` → **Connect dongle** uses Web Bluetooth (Chrome + HTTPS/localhost, no PIN).

## Repo layout

```
src/                 Vite driver / merchant / CPO / sim UI (voltloop.zip)
packages/protocol/   250-byte frame + HMAC + storm suppression
firmware/            PlatformIO ESP32 (RSU + vehicle + BLE GATT)
supabase/            schema, RLS, seed, Edge Functions
app/api/             optional Next.js API (demo store fallback)
docs/                EULA + demo checklist
```

## Legal

In-app `/legal` + [docs/EULA.md](docs/EULA.md). DPDP Act 2023 consent at signup. Tokens: no cash-out, no transfer, anti-forge.

## License

MIT — see [LICENSE](LICENSE).
