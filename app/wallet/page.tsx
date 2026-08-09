"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMerchants, useOrders, useUser, useWallet } from "@/lib/hooks";

function WalletInner() {
  const params = useSearchParams();
  const preOrder = params.get("order");
  const { user } = useUser();
  const { balance, ledger, refresh } = useWallet();
  const merchants = useMerchants();
  const { orders, refresh: refreshOrders } = useOrders();
  const [merchantId, setMerchantId] = useState(preOrder || "");
  const [amount, setAmount] = useState(220);
  const [tokens, setTokens] = useState(20);
  const [minutes, setMinutes] = useState(18);
  const [msg, setMsg] = useState("");

  const merchant = useMemo(
    () => merchants.find((m) => m.id === (merchantId || preOrder || merchants[0]?.id)),
    [merchants, merchantId, preOrder],
  );

  async function placeOrder() {
    setMsg("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: merchant?.id,
        total_amount: amount,
        tokens_redeemed: tokens,
        ready_by_minutes: minutes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Order failed");
      return;
    }
    await refresh();
    await refreshOrders();
    setMsg(`Order placed. Ready by ${new Date(data.order.ready_by_time).toLocaleTimeString()}.`);
  }

  if (user === undefined) return null;
  if (!user) return <p className="text-[var(--muted)]">Log in to view your closed-loop wallet.</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Token balance</p>
        <p className="mt-1 text-4xl font-semibold text-[var(--volt)]">{balance.toFixed(0)} VL</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          VL is in-app credit. 1 VL = ₹1 off at VoltLoop partners. It can’t be withdrawn as cash.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-5">
          <h2 className="font-semibold">Order while you charge</h2>
          <label className="mt-3 block text-sm text-[var(--muted)]">Merchant</label>
          <select
            value={merchant?.id || ""}
            onChange={(e) => setMerchantId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg-card)] px-3 py-2"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.discount_pct}% off)
              </option>
            ))}
          </select>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Num label="₹ total" value={amount} onChange={setAmount} />
            <Num label="VL redeem" value={tokens} onChange={setTokens} />
            <Num label="Ready min" value={minutes} onChange={setMinutes} />
          </div>
          <button
            onClick={() => void placeOrder()}
            className="mt-4 w-full rounded-xl bg-[var(--volt)] py-2 font-medium text-[#0a1208]"
          >
            Place order
          </button>
          {msg ? <p className="mt-2 text-sm text-[var(--cyan)]">{msg}</p> : null}
        </div>

        <div>
          <h2 className="font-semibold">Ledger</h2>
          <ul className="mt-3 max-h-80 space-y-2 overflow-auto text-sm">
            {ledger.map((l) => (
              <li key={l.id} className="flex justify-between rounded-xl border border-[var(--line)] px-3 py-2">
                <span className="text-[var(--muted)]">{l.transaction_type}</span>
                <span className={l.amount >= 0 ? "text-[var(--volt)]" : "text-[var(--danger)]"}>
                  {l.amount >= 0 ? "+" : ""}
                  {l.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h2 className="font-semibold">My orders</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {orders
            .filter((o) => o.user_id === user.id)
            .map((o) => (
              <li key={o.id} className="rounded-xl border border-[var(--line)] px-3 py-2 text-[var(--muted)]">
                {o.status} · ₹{o.total_amount} · {o.tokens_redeemed} VL · ready{" "}
                {new Date(o.ready_by_time).toLocaleTimeString()}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="text-xs text-[var(--muted)]">
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg-card)] px-2 py-2 text-sm text-[var(--text)]"
      />
    </label>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Loading wallet…</p>}>
      <WalletInner />
    </Suspense>
  );
}
