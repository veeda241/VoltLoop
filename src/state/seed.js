import { THOOTHUKUDI_STATIONS } from "../data/thoothukudiStations";

export const STATIONS = THOOTHUKUDI_STATIONS;

export const MERCHANTS = [
  { id: "portside-coffee", name: "Portside Filter Coffee", category: "Cafe", discount: 15, stationId: "ather-harbour" },
  { id: "dwell-dosa", name: "Dwell Time Dosa", category: "Restaurant", discount: 20, stationId: "psk-complex" },
  { id: "charge-carry", name: "Charge & Carry Mart", category: "Convenience", discount: 10, stationId: "psk-complex" },
  { id: "palm-grove", name: "Palm Grove Juice Bar", category: "Cafe", discount: 12, stationId: "tata-ganesh" },
  { id: "spic-quick", name: "SPIC Quick Service", category: "Auto care", discount: 8, stationId: "ather-cge" },
  { id: "temple-bakery", name: "Temple Road Bakery", category: "Bakery", discount: 18, stationId: "zeon-pearl" },
];

const now = Date.now();

export function seedState() {
  return {
    currentUserEmail: null,
    users: {
      "driver@voltloop.dev": {
        email: "driver@voltloop.dev",
        password: "demo1234",
        role: "driver",
        vehicleModel: "Tata Nexon EV",
        batteryKWh: 40.5,
        vlBalance: 120,
        creditedMsgIds: [],
      },
      "merchant@voltloop.dev": {
        email: "merchant@voltloop.dev",
        password: "demo1234",
        role: "merchant",
        merchantId: "dwell-dosa",
      },
      "cpo@voltloop.dev": {
        email: "cpo@voltloop.dev",
        password: "demo1234",
        role: "cpo",
      },
    },
    stations: STATIONS,
    merchants: MERCHANTS,
    sessions: [
      {
        id: "sess-seed-1",
        driverEmail: "driver@voltloop.dev",
        stationId: "psk-complex",
        startTime: now - 12 * 60 * 1000,
        expectedFinish: now + 28 * 60 * 1000,
        expectedMinutes: 40,
        status: "ACTIVE",
      },
    ],
    orders: [
      {
        id: "order-seed-1",
        driverEmail: "driver@voltloop.dev",
        merchantId: "dwell-dosa",
        amount: 280,
        vlRedeemed: 40,
        readyMinutes: 15,
        status: "PENDING",
        createdAt: now - 6 * 60 * 1000,
      },
    ],
    ledger: [
      { id: "l1", driverEmail: "driver@voltloop.dev", type: "EARNED_RELAY", amount: 10, ts: now - 3600_000, note: "Relay hop · Portside Filter Coffee" },
      { id: "l2", driverEmail: "driver@voltloop.dev", type: "EARNED_ORDER", amount: 25, ts: now - 2400_000, note: "Order completed · Temple Road Bakery" },
      { id: "l3", driverEmail: "driver@voltloop.dev", type: "REDEEMED_MERCHANT", amount: -40, ts: now - 360_000, note: "Order placed · Dwell Time Dosa" },
    ],
    relays: [],
    toasts: [],
  };
}
