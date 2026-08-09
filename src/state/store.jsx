import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useCallback } from "react";
import { seedState } from "./seed";

const STORAGE_KEY = "voltloop_state_v3";
const StoreCtx = createContext(null);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* corrupt storage, fall through */
  }
  return seedState();
}

let toastSeq = 1;

function reducer(state, action) {
  switch (action.type) {
    case "RESET":
      return seedState();

    case "ADD_STATIONS": {
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      const ids = new Set(state.stations.map((s) => s.id));
      const extra = incoming.filter((s) => s?.id && !ids.has(s.id));
      if (!extra.length) return state;
      return { ...state, stations: [...state.stations, ...extra] };
    }

    case "SIGNUP": {
      const { email, password, role, vehicleModel, batteryKWh } = action.payload;
      if (state.users[email]) {
        return pushToast(state, "That email is already registered.", "danger");
      }
      const user = { email, password, role };
      if (role === "driver") {
        user.vehicleModel = vehicleModel || "Tata Nexon EV";
        user.batteryKWh = batteryKWh || 40.5;
        user.vlBalance = 0;
        user.creditedMsgIds = [];
      }
      return {
        ...state,
        users: { ...state.users, [email]: user },
        currentUserEmail: email,
      };
    }

    case "LOGIN": {
      const { email, password } = action.payload;
      const user = state.users[email];
      if (!user || user.password !== password) {
        return pushToast(state, "Invalid email or password.", "danger");
      }
      return { ...state, currentUserEmail: email };
    }

    case "LOGOUT":
      return { ...state, currentUserEmail: null };

    case "INJECT_RELAY": {
      const relay = action.payload;
      const exists = state.relays.some((r) => r.msgId === relay.msgId);
      if (exists) return state;
      return { ...state, relays: [relay, ...state.relays].slice(0, 60) };
    }

    case "SHARE_HOP": {
      const { msgId, email, frameHex, hopCount, ttl } = action.payload;
      const relayIdx = state.relays.findIndex((r) => r.msgId === msgId);
      if (relayIdx === -1) return state;
      const relay = state.relays[relayIdx];
      const user = state.users[email];
      if (!user) return state;

      if ((ttl ?? relay.ttl) <= 0 && relay.ttl <= 0) {
        return pushToast(state, "This offer is no longer circulating.", "warn");
      }
      if ((user.creditedMsgIds || []).includes(msgId)) {
        return pushToast(state, "You’ve already earned VL for this offer.", "muted");
      }

      const updatedRelay = {
        ...relay,
        hopCount: hopCount ?? relay.hopCount + 1,
        ttl: ttl ?? Math.max(0, relay.ttl - 1),
        frameHex: frameHex ?? relay.frameHex,
      };
      const relays = [...state.relays];
      relays[relayIdx] = updatedRelay;

      const updatedUser = {
        ...user,
        vlBalance: (user.vlBalance || 0) + 10,
        creditedMsgIds: [...(user.creditedMsgIds || []), msgId],
      };

      const ledgerEntry = {
        id: `l-${Date.now()}-${toastSeq++}`,
        driverEmail: email,
        type: "EARNED_RELAY",
        amount: 10,
        ts: Date.now(),
        note: `Relay hop · ${relay.type === "offer" ? relay.merchantName : relay.stationName}`,
      };

      const next = {
        ...state,
        relays,
        users: { ...state.users, [email]: updatedUser },
        ledger: [ledgerEntry, ...state.ledger],
      };
      return pushToast(next, "+10 VL added to your wallet.", "volt");
    }

    case "START_SESSION": {
      const { email, stationId, expectedMinutes } = action.payload;
      const alreadyActive = state.sessions.some((s) => s.driverEmail === email && s.status === "ACTIVE");
      if (alreadyActive) {
        return pushToast(state, "You’re already charging somewhere.", "danger");
      }
      const session = {
        id: `sess-${Date.now()}`,
        driverEmail: email,
        stationId,
        startTime: Date.now(),
        expectedFinish: Date.now() + expectedMinutes * 60 * 1000,
        expectedMinutes,
        status: "ACTIVE",
      };
      return pushToast(
        { ...state, sessions: [session, ...state.sessions] },
        "Charging started. Nearby drivers can see when this bay frees up.",
        "volt"
      );
    }

    case "COMPLETE_SESSION": {
      const sessions = state.sessions.map((s) =>
        s.id === action.payload.sessionId ? { ...s, status: "COMPLETED" } : s
      );
      return pushToast({ ...state, sessions }, "Charge complete. Bay is marked free.", "volt");
    }

    case "CANCEL_SESSION": {
      const sessions = state.sessions.map((s) =>
        s.id === action.payload.sessionId ? { ...s, status: "CANCELLED" } : s
      );
      return pushToast({ ...state, sessions }, "Charge cancelled.", "muted");
    }

    case "REDEEM_ON_SESSION": {
      const { email, amount } = action.payload;
      const user = state.users[email];
      if (!user || amount <= 0) return state;
      const redeemAmt = Math.min(amount, user.vlBalance || 0);
      if (redeemAmt <= 0) return pushToast(state, "You don’t have enough VL yet.", "danger");
      const updatedUser = { ...user, vlBalance: user.vlBalance - redeemAmt };
      const ledgerEntry = {
        id: `l-${Date.now()}`,
        driverEmail: email,
        type: "REDEEMED_CHARGING",
        amount: -redeemAmt,
        ts: Date.now(),
        note: "Applied to your charge",
      };
      return pushToast(
        {
          ...state,
          users: { ...state.users, [email]: updatedUser },
          ledger: [ledgerEntry, ...state.ledger],
        },
        `${redeemAmt} VL applied to this charge.`,
        "volt"
      );
    }

    case "PLACE_ORDER": {
      const { email, merchantId, amount, vlRedeem, readyMinutes } = action.payload;
      const user = state.users[email];
      if (!user) return state;
      const redeem = Math.min(vlRedeem, user.vlBalance || 0, amount);
      const order = {
        id: `order-${Date.now()}`,
        driverEmail: email,
        merchantId,
        amount,
        vlRedeemed: redeem,
        readyMinutes,
        status: "PENDING",
        createdAt: Date.now(),
      };
      const updatedUser = { ...user, vlBalance: (user.vlBalance || 0) - redeem };
      const ledgerEntries = [
        {
          id: `l-${Date.now()}-a`,
          driverEmail: email,
          type: "REDEEMED_MERCHANT",
          amount: -redeem,
          ts: Date.now(),
          note: `Order placed · ${state.merchants.find((m) => m.id === merchantId)?.name || merchantId}`,
        },
      ];
      return pushToast(
        {
          ...state,
          orders: [order, ...state.orders],
          users: { ...state.users, [email]: updatedUser },
          ledger: [...ledgerEntries, ...state.ledger],
        },
        "Order placed. Waiting for the shop to accept.",
        "volt"
      );
    }

    case "UPDATE_ORDER_STATUS": {
      const { orderId, status } = action.payload;
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return state;
      const orders = state.orders.map((o) => (o.id === orderId ? { ...o, status } : o));
      let next = { ...state, orders };
      if (status === "COMPLETED") {
        const user = state.users[order.driverEmail];
        if (user) {
          const updatedUser = { ...user, vlBalance: (user.vlBalance || 0) + 25 };
          const ledgerEntry = {
            id: `l-${Date.now()}`,
            driverEmail: order.driverEmail,
            type: "EARNED_ORDER",
            amount: 25,
            ts: Date.now(),
            note: `Order completed · ${state.merchants.find((m) => m.id === order.merchantId)?.name || ""}`,
          };
          next = {
            ...next,
            users: { ...next.users, [order.driverEmail]: updatedUser },
            ledger: [ledgerEntry, ...next.ledger],
          };
        }
      }
      const statusLabel = { ACCEPTED: "accepted", READY: "ready for pickup", COMPLETED: "completed", CANCELLED: "cancelled" }[status] || status.toLowerCase();
      return pushToast(next, `Order ${statusLabel}.`, "volt");
    }

    case "TOAST":
      return pushToast(state, action.payload.message, action.payload.tone);

    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload.id) };

    default:
      return state;
  }
}

function pushToast(state, message, tone = "volt") {
  const toast = { id: `t-${Date.now()}-${toastSeq++}`, message, tone };
  return { ...state, toasts: [...state.toasts, toast] };
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const bcRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage full or unavailable — demo continues in-memory */
    }
  }, [state]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel("voltloop-mesh");
    bcRef.current = bc;
    bc.onmessage = (ev) => {
      if (ev.data?.type === "RELAY") {
        dispatch({ type: "INJECT_RELAY", payload: ev.data.relay });
      }
    };
    return () => bc.close();
  }, []);

  const broadcastRelay = useCallback((relay) => {
    dispatch({ type: "INJECT_RELAY", payload: relay });
    bcRef.current?.postMessage({ type: "RELAY", relay });
  }, []);

  const value = useMemo(() => ({ state, dispatch, broadcastRelay }), [state, dispatch, broadcastRelay]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function currentUser(state) {
  return state.currentUserEmail ? state.users[state.currentUserEmail] : null;
}

export function stationDerived(station) {
  const occupied = station.occupied;
  const vacant = station.bays - occupied;
  let status = "free";
  if (vacant === 0) status = "full";
  else if (vacant / station.bays <= 0.25) status = "almost";
  return { vacant, occupied, status };
}
