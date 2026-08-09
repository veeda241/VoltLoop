VoltLoop Token EULA & Privacy Notice (hackathon prototype)
==========================================================

Effective: August 2026 · AICCI National Startup Summit

1. Closed-loop tokens
   Tokens are store credit inside VoltLoop only. They are not e-money, not a Prepaid
   Payment Instrument, and cannot be withdrawn as INR/cash, transferred to a bank
   account, or sold to another person. A future cash-out path would require a licensed
   PPI partner and is not part of this product.

2. No resale or transfer
   Tokens cannot be transferred between accounts. Attempting to sell, barter, or
   gift tokens is a breach of this EULA.

3. Anti-fraud
   Relay hops are HMAC-signed on the dongle. The phone never holds the signing key.
   VoltLoop may suspend accounts that attempt to forge hop receipts, replay msg_id
   values, or otherwise farm tokens.

4. DPDP Act 2023 (India)
   We process location and dwell-time only to route nearby merchant offers and to
   estimate charging-station vacancy from self-reported session finish times.
   We do not sell this data to third parties. You may request access or deletion.
   Location history is not retained indefinitely tied to your real identity.

5. Anonymity on the mesh
   ESP-NOW / BLE device identifiers rotate and are not phone numbers, Aadhaar, or
   any government ID. The phone speaks only to the in-vehicle dongle over Bluetooth
   Low Energy.

6. Honest charging data
   Station locations come from Open Charge Map (crowd-sourced) and demo seed data.
   Live vacancy is self-reported by drivers who start a session in-app. We do not
   claim live OCPP feeds from network operators.

7. VANET disclaimer
   VoltLoop is a VANET-inspired prototype. Radio uses ESP-NOW on 2.4 GHz as a
   hackathon-feasible proxy for automotive DSRC (802.11p) / C-V2X. It is not a
   certified OBU and does not operate in the licensed 5.9 GHz ITS band.
