import type { DemoStore } from "./types";
import { THOOTHUKUDI_STATIONS } from "@/src/data/thoothukudiStations";

/** Thoothukudi / Tuticorin corridor — demo stations + nearby merchants. */
export const SEED_PASSWORD_HASH =
  "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d"; // sha256("demo1234")

const now = () => new Date().toISOString();

export function createSeedStore(): DemoStore {
  const created = now();

  const driverId = "11111111-1111-4111-8111-111111111111";
  const merchantUserId = "22222222-2222-4222-8222-222222222222";
  const cpoId = "33333333-3333-4333-8333-333333333333";

  const stationVoc = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const stationPalayam = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const stationHarbour = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const stationSpic = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  const stationTiruchendur = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

  const merchCafe = "f1111111-1111-4111-8111-111111111111";
  const merchDosa = "f2222222-2222-4222-8222-222222222222";
  const merchMart = "f3333333-3333-4333-8333-333333333333";
  const merchJuice = "f4444444-4444-4444-8444-444444444444";
  const merchGarage = "f5555555-5555-4555-8555-555555555555";
  const merchBakery = "f6666666-6666-4666-8666-666666666666";

  const partnerIds: Record<string, string> = {
    "ather-harbour": stationVoc,
    "tata-ganesh": stationPalayam,
    "psk-complex": stationHarbour,
    "ather-cge": stationSpic,
    "zeon-pearl": stationTiruchendur,
  };

  return {
    users: [
      {
        id: driverId,
        email: "driver@voltloop.dev",
        passwordHash: SEED_PASSWORD_HASH,
        vehicle_model: "Tata Nexon EV",
        battery_capacity_kwh: 40.5,
        token_balance: 120,
        role: "driver",
        dpdp_consent_at: created,
        eula_accepted_at: created,
        created_at: created,
      },
      {
        id: merchantUserId,
        email: "merchant@voltloop.dev",
        passwordHash: SEED_PASSWORD_HASH,
        vehicle_model: "N/A",
        battery_capacity_kwh: 0,
        token_balance: 0,
        role: "merchant",
        dpdp_consent_at: created,
        eula_accepted_at: created,
        created_at: created,
      },
      {
        id: cpoId,
        email: "cpo@voltloop.dev",
        passwordHash: SEED_PASSWORD_HASH,
        vehicle_model: "N/A",
        battery_capacity_kwh: 0,
        token_balance: 0,
        role: "cpo",
        dpdp_consent_at: created,
        eula_accepted_at: created,
        created_at: created,
      },
    ],
    stations: THOOTHUKUDI_STATIONS.map((s) => ({
      id: partnerIds[s.id] ?? s.id,
      name: s.name,
      latitude: s.lat,
      longitude: s.lng,
      total_bays: s.bays,
      active_bays: Math.max(0, s.bays - s.occupied),
      power_kw: s.kw,
      source: "seed",
    })),
    charging_sessions: [
      {
        id: "s1111111-1111-4111-8111-111111111111",
        user_id: driverId,
        station_id: stationHarbour,
        started_at: new Date(Date.now() - 12 * 60_000).toISOString(),
        expected_finish_at: new Date(Date.now() + 28 * 60_000).toISOString(),
        status: "ACTIVE",
      },
    ],
    merchants: [
      {
        id: merchCafe,
        station_id: stationVoc,
        name: "Portside Filter Coffee",
        category: "Cafe",
        discount_pct: 15,
        is_active: true,
      },
      {
        id: merchDosa,
        station_id: stationHarbour,
        name: "Dwell Time Dosa",
        category: "Restaurant",
        discount_pct: 20,
        is_active: true,
      },
      {
        id: merchMart,
        station_id: stationHarbour,
        name: "Charge & Carry Mart",
        category: "Convenience",
        discount_pct: 10,
        is_active: true,
      },
      {
        id: merchJuice,
        station_id: stationPalayam,
        name: "Palm Grove Juice Bar",
        category: "Cafe",
        discount_pct: 12,
        is_active: true,
      },
      {
        id: merchGarage,
        station_id: stationSpic,
        name: "SPIC Quick Service",
        category: "Auto care",
        discount_pct: 8,
        is_active: true,
      },
      {
        id: merchBakery,
        station_id: stationTiruchendur,
        name: "Temple Road Bakery",
        category: "Bakery",
        discount_pct: 18,
        is_active: true,
      },
    ],
    ad_relays: [
      {
        id: "r1111111-1111-4111-8111-111111111111",
        msg_id: 1840291,
        origin_merchant_id: merchDosa,
        relayed_by_user_id: driverId,
        hop_count: 1,
        hmac_signature: "seed-demo-hmac",
        relayed_at: created,
      },
    ],
    orders: [
      {
        id: "o1111111-1111-4111-8111-111111111111",
        user_id: driverId,
        merchant_id: merchDosa,
        total_amount: 280,
        tokens_redeemed: 40,
        status: "PENDING",
        ready_by_time: new Date(Date.now() + 20 * 60_000).toISOString(),
        created_at: created,
      },
    ],
    token_ledger: [
      {
        id: "l1111111-1111-4111-8111-111111111111",
        user_id: driverId,
        amount: 10,
        transaction_type: "EARNED_RELAY",
        reference_id: "r1111111-1111-4111-8111-111111111111",
        created_at: created,
      },
      {
        id: "l2222222-2222-4222-8222-222222222222",
        user_id: driverId,
        amount: 150,
        transaction_type: "EARNED_ORDER",
        reference_id: null,
        created_at: created,
      },
      {
        id: "l3333333-3333-4333-8333-333333333333",
        user_id: driverId,
        amount: -40,
        transaction_type: "REDEEMED_MERCHANT",
        reference_id: "o1111111-1111-4111-8111-111111111111",
        created_at: created,
      },
    ],
    sessions: [],
  };
}

export const RELAY_TOKEN_REWARD = 10;
export const ORDER_TOKEN_REWARD = 25;
export const MERCHANT_COMMISSION_RATE = 0.15;
