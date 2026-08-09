# VoltLoop — VANET-Based Ad Dissemination & EV Charging Rewards

**Built for:** AICCI National Startup Summit 2026 Hackathon — Thoothukudi to Global (Aug 20–21, 2026)
**Track fit:** Industry 4.0 / EV Technology / Logistics & Mobility
**Team:** 7 members, 3rd-year B.Tech (AI & Data Science)

---

## 1. Problem Statement

- **Driver dead time:** EV drivers on DC fast chargers are stationary for 30–45 minutes with no structured way to discover nearby offers.
- **Merchant blind spot:** Local businesses near charging hubs can't reach the highest-intent audience passing right outside — people with guaranteed dwell time and nowhere to be.
- **Connectivity gaps:** Highway and semi-urban corridors have patchy cellular coverage, so offer-discovery apps that depend on the internet fail exactly where they'd be most useful.
- **No unified charging visibility:** Drivers can't easily see which nearby stations are free right now, or how long the current occupant will be.

---

## 2. Solution & Core Workflow

**The core insight:** a moving vehicle is a data mule. It doesn't need the internet to carry a message — it just needs to physically pass within range of a broadcaster and, later, another vehicle.

```
Vehicle enters ad zone (near RSU / charging-station beacon)
        │
        ▼  short-range broadcast, no pairing required
Dongle in vehicle receives ad packet → BLE → driver's phone app
        │
        ▼  driver taps "share" (this IS the ad hop, not a message send)
Packet rebroadcast automatically to the next vehicle passed on the road
        │
        ▼  each cryptographically verified, unique hop = token credited
Driver arrives at an EV charging station
        │
        ▼  app shows: locator + live vacancy + self-reported "time remaining"
Driver charges → redeems accumulated tokens as a discount on the session
```

**Why not phone numbers, SMS, or WhatsApp?** Routing ads that way turns this into an ordinary marketing app and reintroduces everything VANET is meant to avoid: cellular dependency, per-message cost, and a personal identifier (phone number) attached to every ad interaction. Instead:

- Delivery is **proximity-based broadcast** — any vehicle in range receives it automatically, no address needed.
- Each device uses a **random, rotating ID**, not a phone number, so nothing personally identifying ever leaves the vehicle.
- The phone only talks to the in-car dongle over **Bluetooth Low Energy (BLE)** — never directly to the broadcaster.

---

## 3. Technical Architecture

### 3.1 Honest framing: VANET-inspired prototype, not DSRC/C-V2X

Real automotive VANET uses a reserved 5.9 GHz band (DSRC/802.11p) or cellular-based C-V2X — licensed spectrum, expensive certified hardware, not buildable by a student team in 12 days. This build uses **ESP32 + ESP-NOW** (a connectionless 2.4 GHz protocol) as a functional stand-in for the same broadcast/relay behavior. State this explicitly to judges: *"VANET-inspired mesh network, ESP-NOW as a hackathon-feasible proxy for DSRC/C-V2X."* It reads as informed rather than uninformed.

China is a useful technical precedent here — it has a real, large-scale, government-backed C-V2X program (national standards since 2017, pilot cities like Wuxi, a roadmap through 2035) — but that program is safety/traffic-focused infrastructure, not a documented consumer ad-token app. Cite it as *"this class of connected-vehicle tech is already national policy in China,"* not as *"China has this exact product,"* since the latter can't be substantiated if a judge asks for a source.

### 3.2 System Diagram

```
[ Charging Station RSU / Merchant Beacon ]
                 │
                 ▼  ESP-NOW Broadcast (2.4 GHz, no handshake, <10 ms latency)
        [ Passing Vehicle A — dongle ]
                 │
                 ▼  Store-Carry-Forward Relay (V2V, works with zero cellular signal)
        [ Approaching Vehicle B — dongle ]
                 │
                 ▼  BLE to Smartphone
[ Driver App: Local Offers + Token Wallet + Charging Locator ]
```

### 3.3 Message Frame Spec (250 bytes max)

| Offset (bytes) | Field | Type | Description |
|---|---|---|---|
| 0 | `version` | uint8 | Protocol version (e.g. `0x01`) |
| 1 | `msg_type` | uint8 | `0x01` = Station Status, `0x02` = Merchant Offer |
| 2..5 | `msg_id` | uint32 | Unique message hash (prevents replay/double-crediting) |
| 6..7 | `origin_id` | uint16 | Source node ID (rotating, non-personal) |
| 8 | `ttl` | uint8 | Time-to-live / hop limit (starts at 3) |
| 9 | `hop_count` | uint8 | Increments at each relay — this is what tokens pay for |
| 10..13 | `timestamp` | uint32 | Unix timestamp |
| 14..15 | `payload_len` | uint16 | Length of variable data |
| 16..N | `payload` | bytes | Offer content / station status (UTF-8 or binary) |
| N+1..N+16 | `hmac` | bytes16 | Truncated HMAC-SHA256 — proves the hop chain wasn't faked |

### 3.4 Anti-Spam / Broadcast Storm Suppression

Without this, drivers could fake relay hops to farm tokens, and the mesh could choke itself with duplicate rebroadcasts.

- Every node keeps a 64-entry ring buffer of recently seen `msg_id` values.
- On receiving a new frame, the node waits a random jitter of 20–100 ms before rebroadcasting.
- If it hears the same `msg_id` rebroadcast ≥ 2 times in that window, it suppresses its own transmission (avoids duplicate storms).
- Otherwise it decrements `ttl`, increments `hop_count`, re-signs, and rebroadcasts.
- Tokens are credited server-side only when the backend verifies the HMAC chain across hops — a phone claiming hops it never actually relayed can't forge the signature.

### 3.5 Phone Bridge

- ESP32 dongle exposes a **BLE GATT server**; the driver app connects via **Web Bluetooth** or a native BLE client — no pairing PIN, no phone number exchange.
- App shows live offers, current token balance, and pushes a "share" action that triggers the next rebroadcast.

---

## 4. EV Charging Integration

### 4.1 Locator

Use the **Open Charge Map API** (free, global, crowd-sourced registry of charging locations) as the base map layer:
```
GET /api/v3/poi/?output=json&latitude={lat}&longitude={lng}&distance=10&maxresults=10
```
This is realistic to integrate in a hackathon; real Indian network operators (Statiq, ChargeZone, Kazam) won't grant live OCPP/API access to a student team in 12 days, so don't plan around that.

### 4.2 Vacancy & "time remaining"

Don't fake real-time occupancy data you don't have. Instead:
- When a driver starts a charging session in-app, they log their **expected finish time**.
- Other users approaching that station see: bay count, how many are occupied, and the self-reported time remaining for each occupied bay.
- This is honest, buildable in the timeframe, and still demoable live.

---

## 5. Token Economy & Redemption Model

**Important correction from the original plan:** tokens must **not** be redeemable directly for cash/INR to a bank account. In India, converting a reward token into cash is regulated by the RBI as a Prepaid Payment Instrument (PPI); a full cash-out PPI requires RBI authorization, KYC infrastructure, and capital adequacy — not something a student team can legally stand up by demo day.

**Fix — make it closed-loop:**
- Tokens are earned per cryptographically verified relay hop (see 3.3–3.4) and per completed merchant order.
- Tokens are redeemable **only** as a discount on charging sessions or at partner merchants — never withdrawn as cash. This is the same shape as airline miles or a retailer's store credit, and closed-system instruments like this don't require RBI authorization.
- **Roadmap item for the pitch (not a hackathon deliverable):** a future "cash-out via a licensed PPI partner" phase, once the network has scale and a formal partnership. Mentioning this in the pitch shows the judges you understand the regulation rather than having missed it.

---

## 6. Database Schema (Supabase / PostgreSQL)

```sql
-- Users and EV Driver Profile
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    vehicle_model TEXT NOT NULL,
    battery_capacity_kwh NUMERIC(5,2) NOT NULL,
    token_balance NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Charging Stations
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    total_bays INT NOT NULL,
    active_bays INT NOT NULL,
    power_kw NUMERIC(6,2) NOT NULL,
    source TEXT DEFAULT 'open_charge_map'
);

-- Active/self-reported charging sessions (drives vacancy + time-remaining display)
CREATE TABLE charging_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    station_id UUID REFERENCES stations(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expected_finish_at TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED'))
);

-- Merchants near charging stations
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES stations(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    discount_pct INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Ad packets and verified relay chain (proves hop count, prevents token farming)
CREATE TABLE ad_relays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    msg_id BIGINT NOT NULL,
    origin_merchant_id UUID REFERENCES merchants(id),
    relayed_by_user_id UUID REFERENCES users(id),
    hop_count INT NOT NULL,
    hmac_signature TEXT NOT NULL,
    relayed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (msg_id, relayed_by_user_id)
);

-- Orders placed with merchants
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    merchant_id UUID REFERENCES merchants(id),
    total_amount NUMERIC(10,2) NOT NULL,
    tokens_redeemed NUMERIC(10,2) DEFAULT 0.00,
    status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED')),
    ready_by_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Closed-loop token ledger (audit trail — no cash-out path)
CREATE TABLE token_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount NUMERIC(10,2) NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('EARNED_RELAY', 'EARNED_ORDER', 'REDEEMED_CHARGING', 'REDEEMED_MERCHANT')),
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Business Model

```
     [ Local Merchants ] --(12–18% order commission)--> +----------------------+
                                                          |   VoltLoop Engine    |
  [ EV Drivers ] <--(Token discounts on charging)-------- +----------------------+
                                                               ^
                                                               | (footfall & utilization analytics)
                                                       [ CPOs / Station Hosts ]
```

1. **Merchant commissions (primary revenue):** 12–18% on pre-orders placed during a vehicle's dwell time at a charging station.
2. **CPO analytics subscription (secondary revenue):** charge point operators pay for footfall-attribution and station-utilization dashboards.
3. **Targeted hyper-local ad placements (future phase):** once mesh density is high enough for reliable delivery.

---

## 8. Legal, Privacy & EULA Essentials

- **Token EULA terms:** no resale or transfer of tokens between accounts; no cash redemption (ties to the closed-loop model in §5); right to suspend accounts that attempt to forge relay hops.
- **Data minimization:** location and dwell-time data is used only to route relevant offers and estimate charging vacancy — never sold to third parties.
- **India's DPDP Act 2023 applies:** you're processing location data, so you need explicit consent at signup, a way for users to view/delete their data, and no indefinite retention of location history tied to a real identity.
- **Anonymity by design:** device IDs used in the mesh are rotating and non-personal — this is a genuine privacy advantage to lead with in the pitch, not just a compliance checkbox.

---

## 9. Team Task Allocation (7-Person Split)

| Role | Primary Responsibility | Key Deliverables |
|---|---|---|
| Dev 1 (Firmware) | ESP-NOW mesh protocol | Node framing, TTL counter, storm-suppression logic |
| Dev 2 (Embedded BLE) | ESP32-to-phone bridge | BLE GATT server, Web Bluetooth interface |
| Dev 3 (Frontend) | Driver PWA | Live map, active session UI, offer feed, token wallet |
| Dev 4 (Simulator) | Mesh visualizer | Canvas rendering of vehicle hops, range, packet suppression — key for a live demo without needing dozens of real cars |
| Dev 5 (Backend) | Supabase & API services | Schema, order state machine, token ledger, HMAC verification |
| Dev 6 (Dashboards) | Merchant & CPO consoles | Order management panel, conversion/revenue attribution |
| Lead (Pitch & Research) | Validation & video | Pitch deck, 3-min demo video, primary driver/merchant survey data |

---

## 10. 12-Day Execution Timeline

```
Day 01–02: Lock message frame spec → set up Supabase & Next.js repo → order ESP32 hardware
Day 03–05: Build ESP-NOW firmware → build mesh visualizer → scaffold driver PWA
Day 06–08: Integrate BLE-to-Web-Bluetooth → wire up order state machine → build merchant console
Day 09–10: End-to-end testing → run primary driver/merchant surveys → build CPO dashboard
Day 11–12: Record 3-min demo video → finalize README → submit prototype & deck
```

---

## 11. Hardware BOM (≈ ₹6,000 total)

- 7× ESP32 Development Boards (WROOM-32)
- 4× 10,000 mAh power banks
- Enclosures, LEDs, breadboards, jumper wires

---

## 12. 3-Minute Demo Video Script

- **0:00–0:20 | The problem:** EV plugged into a highway charger, driver visibly bored with 35 minutes left.
- **0:20–0:40 | The core insight:** "The charging cable is collateral" — plugged-in drivers are guaranteed local dwell time.
- **0:40–1:30 | Platform demo:** driver PWA — discovering an offer, placing an order, redeeming tokens against the charging bill.
- **1:30–2:15 | Hardware & mesh relay:** phone with mobile data and Wi-Fi disabled; show an ESP-NOW packet hopping across physical boards to trigger the offer. Cut to the mesh visualizer scaling with node density.
- **2:15–2:40 | Merchant & CPO value:** order console + footfall dashboard; present survey findings.
- **2:40–3:00 | Call to action:** roadmap and ask for summit support.

---

## 13. Anticipated Judge Questions & Prepared Answers

| Question | Answer |
|---|---|
| "Is this real DSRC/C-V2X?" | No — it's a VANET-inspired prototype using ESP-NOW as a hackathon-feasible proxy. Real DSRC needs licensed spectrum and certified OBUs; this proves the concept and behavior at a fraction of the cost. |
| "How do you stop people faking hops for tokens?" | Every relay is HMAC-signed and checked server-side against a hop chain; tokens are credited only on verified chains, not client-reported claims. |
| "Can I cash out my tokens?" | Not directly — tokens are a closed-loop discount on charging and partner merchants, which keeps VoltLoop outside RBI's PPI cash-instrument licensing requirement. A licensed cash-out partnership is a stated future-phase item. |
| "Where does your charging-station data come from?" | Open Charge Map for the base locator; live vacancy is self-reported by users starting a session, since real network operators won't grant API access to a student team yet. |
| "Has this been done before?" | China has large-scale, government-backed C-V2X infrastructure as a technical precedent, but we're not aware of a documented consumer ad-token product doing this exact model — this is the differentiator, not a copy. |
