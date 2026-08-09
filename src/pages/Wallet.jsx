import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, Button, Pill, PageIn, SectionEyebrow, StatBlock } from "../components/ui";
import { useStore, currentUser } from "../state/store";
import { fmtVL, fmtINR, timeAgo } from "../lib/format";

const LEDGER_TONE = {
  EARNED_RELAY: "volt",
  EARNED_ORDER: "volt",
  REDEEMED_CHARGING: "danger",
  REDEEMED_MERCHANT: "danger",
};

const LEDGER_LABEL = {
  EARNED_RELAY: "Earned for sharing",
  EARNED_ORDER: "Earned from an order",
  REDEEMED_CHARGING: "Used on a charge",
  REDEEMED_MERCHANT: "Used at a shop",
};

const ORDER_LABEL = {
  PENDING: "Waiting",
  ACCEPTED: "Accepted",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function Wallet() {
  const { state, dispatch } = useStore();
  const user = currentUser(state);
  const [params] = useSearchParams();

  const [merchantId, setMerchantId] = useState(params.get("order") || state.merchants[0]?.id);
  const [amount, setAmount] = useState(220);
  const [vlRedeem, setVlRedeem] = useState(20);
  const [readyMinutes, setReadyMinutes] = useState(18);

  useEffect(() => {
    if (params.get("order")) setMerchantId(params.get("order"));
  }, [params]);

  function placeOrder(e) {
    e.preventDefault();
    dispatch({
      type: "PLACE_ORDER",
      payload: {
        email: user.email,
        merchantId,
        amount: Number(amount),
        vlRedeem: Math.min(Number(vlRedeem), user.vlBalance, Number(amount)),
        readyMinutes: Number(readyMinutes),
      },
    });
  }

  const myOrders = state.orders
    .filter((o) => o.driverEmail === user.email)
    .sort((a, b) => b.createdAt - a.createdAt);
  const myLedger = state.ledger.filter((l) => l.driverEmail === user.email);

  return (
    <PageIn className="max-w-2xl">
      <div className="pt-6 pb-4">
        <SectionEyebrow>Rewards</SectionEyebrow>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Wallet</h1>
      </div>

      <Card glow="volt" className="mb-6 text-center py-8">
        <motion.p
          key={user.vlBalance}
          initial={{ scale: 1.15, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="font-display text-5xl font-extrabold text-volt font-mono-tight"
        >
          {user.vlBalance} VL
        </motion.p>
        <p className="text-xs text-muted mt-3 max-w-sm mx-auto">
          VL is in-app credit. 1 VL = ₹1 off at VoltLoop partners. It can’t be withdrawn as cash.
        </p>
      </Card>

      <Card className="mb-8">
        <h2 className="font-semibold mb-4">Order while you charge</h2>
        <form onSubmit={placeOrder} className="space-y-4">
          <div>
            <label className="text-xs text-muted mb-1.5 block">Merchant</label>
            <select
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="w-full rounded-xl bg-bg-elev border border-line px-4 py-3 text-sm outline-none focus:border-volt/60"
            >
              {state.merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.discount}% off
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted mb-1.5 block">Order total (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl bg-bg-elev border border-line px-3 py-2.5 text-sm outline-none focus:border-volt/60"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">Redeem VL</label>
              <input
                type="number"
                max={Math.min(user.vlBalance, amount)}
                value={vlRedeem}
                onChange={(e) => setVlRedeem(e.target.value)}
                className="w-full rounded-xl bg-bg-elev border border-line px-3 py-2.5 text-sm outline-none focus:border-volt/60"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">Ready in (min)</label>
              <input
                type="number"
                value={readyMinutes}
                onChange={(e) => setReadyMinutes(e.target.value)}
                className="w-full rounded-xl bg-bg-elev border border-line px-3 py-2.5 text-sm outline-none focus:border-volt/60"
              />
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Place order
          </Button>
        </form>
      </Card>

      <SectionEyebrow>Your orders</SectionEyebrow>
      <div className="space-y-2 mb-8">
        {myOrders.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
        {myOrders.map((o) => {
          const m = state.merchants.find((x) => x.id === o.merchantId);
          return (
            <Card key={o.id} className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-sm font-medium">{m?.name}</p>
                <p className="text-xs text-muted">{fmtINR(o.amount)} · {o.vlRedeemed} VL redeemed · ready {o.readyMinutes}m</p>
              </div>
              <Pill tone={o.status === "COMPLETED" ? "volt" : o.status === "CANCELLED" ? "danger" : "cyan"}>
                {ORDER_LABEL[o.status] || o.status}
              </Pill>
            </Card>
          );
        })}
      </div>

      <SectionEyebrow>Activity</SectionEyebrow>
      <div className="space-y-2">
        {myLedger.map((l) => (
          <Card key={l.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">{LEDGER_LABEL[l.type] || l.type.replaceAll("_", " ")}</p>
              <p className="text-xs text-muted">{l.note} · {timeAgo(l.ts)}</p>
            </div>
            <span className={`font-mono-tight text-sm font-semibold ${l.amount > 0 ? "text-volt" : "text-danger"}`}>
              {fmtVL(l.amount)}
            </span>
          </Card>
        ))}
      </div>
    </PageIn>
  );
}
