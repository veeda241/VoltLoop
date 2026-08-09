"use client";

import { useMemo } from "react";
import { useMerchants, useOrders, useUser } from "@/lib/hooks";
import { MERCHANT_COMMISSION_RATE } from "@/lib/store/seed";
import type { Order, OrderStatus } from "@/lib/store/types";

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "READY",
  READY: "COMPLETED",
};

export default function MerchantPage() {
  const { user } = useUser();
  const { orders, refresh } = useOrders();
  const merchants = useMerchants();

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== "CANCELLED");
    const gmv = live.reduce((a, o) => a + o.total_amount, 0);
    const tokens = live.reduce((a, o) => a + o.tokens_redeemed, 0);
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    return {
      gmv,
      tokens,
      completed,
      conversion: orders.length ? Math.round((completed / orders.length) * 100) : 0,
      commission: gmv * MERCHANT_COMMISSION_RATE,
    };
  }, [orders]);

  async function setStatus(order: Order, status: OrderStatus) {
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await refresh();
  }

  if (user === undefined) return null;
  if (!user) return <p className="text-[var(--muted)]">Sign in as a partner shop to manage orders.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-[var(--muted)]">
          Orders from drivers charging nearby. Thulir’s platform fee is {Math.round(MERCHANT_COMMISSION_RATE * 100)}%.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Sales" value={`₹${stats.gmv.toFixed(0)}`} />
        <Stat label="Platform fee" value={`₹${stats.commission.toFixed(0)}`} />
        <Stat label="VL redeemed" value={String(stats.tokens)} />
        <Stat label="Completed" value={`${stats.conversion}%`} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--bg-elev)] text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Merchant</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Tokens</th>
              <th className="px-3 py-2 font-medium">Ready by</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const m = merchants.find((x) => x.id === o.merchant_id);
              const next = NEXT[o.status];
              return (
                <tr key={o.id} className="border-t border-[var(--line)]">
                  <td className="px-3 py-2">{m?.name ?? o.merchant_id.slice(0, 8)}</td>
                  <td className="px-3 py-2">₹{o.total_amount}</td>
                  <td className="px-3 py-2">{o.tokens_redeemed}</td>
                  <td className="px-3 py-2">{new Date(o.ready_by_time).toLocaleTimeString()}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs">{o.status}</span>
                  </td>
                  <td className="px-3 py-2">
                    {next ? (
                      <button
                        onClick={() => void setStatus(o, next)}
                        className="rounded-lg bg-[var(--volt)] px-2 py-1 text-xs font-medium text-[#0a1208]"
                      >
                        Mark {next}
                      </button>
                    ) : null}
                    {o.status !== "CANCELLED" && o.status !== "COMPLETED" ? (
                      <button
                        onClick={() => void setStatus(o, "CANCELLED")}
                        className="ml-2 text-xs text-[var(--danger)]"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
