import React from "react";
import { Card, Button, Pill, PageIn, SectionEyebrow, StatBlock } from "../components/ui";
import { useStore, currentUser } from "../state/store";
import { fmtINR, fmtTime } from "../lib/format";

const NEXT_STATUS = { PENDING: "ACCEPTED", ACCEPTED: "READY", READY: "COMPLETED" };
const FLOW = ["PENDING", "ACCEPTED", "READY", "COMPLETED"];
const STATUS_LABEL = { PENDING: "Waiting", ACCEPTED: "Accepted", READY: "Ready", COMPLETED: "Completed", CANCELLED: "Cancelled" };
const NEXT_LABEL = { PENDING: "Accept", ACCEPTED: "Mark ready", READY: "Complete" };

export default function Merchant() {
  const { state, dispatch } = useStore();
  const user = currentUser(state);
  const scoped = user.merchantId ? state.orders.filter((o) => o.merchantId === user.merchantId) : state.orders;

  const gmv = scoped.reduce((sum, o) => sum + o.amount, 0);
  const commission = Math.round(gmv * 0.15);
  const tokensRedeemed = scoped.reduce((sum, o) => sum + o.vlRedeemed, 0);
  const completed = scoped.filter((o) => o.status === "COMPLETED").length;
  const nonCancelled = scoped.filter((o) => o.status !== "CANCELLED").length;
  const completionRate = nonCancelled ? Math.round((completed / nonCancelled) * 100) : 0;

  function advance(order) {
    const next = NEXT_STATUS[order.status];
    if (next) dispatch({ type: "UPDATE_ORDER_STATUS", payload: { orderId: order.id, status: next } });
  }
  function cancelOrder(order) {
    dispatch({ type: "UPDATE_ORDER_STATUS", payload: { orderId: order.id, status: "CANCELLED" } });
  }

  return (
    <PageIn>
      <div className="pt-6 pb-4">
        <SectionEyebrow>Partner dashboard</SectionEyebrow>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
          {state.merchants.find((m) => m.id === user.merchantId)?.name || "All shops"}
        </h1>
        <p className="text-sm text-muted">Orders from drivers charging nearby. VoltLoop’s platform fee is 15%.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><StatBlock label="Sales" value={fmtINR(gmv)} tone="volt" /></Card>
        <Card><StatBlock label="Platform fee" value={fmtINR(commission)} tone="cyan" /></Card>
        <Card><StatBlock label="VL redeemed" value={`${tokensRedeemed} VL`} /></Card>
        <Card><StatBlock label="Completed" value={`${completionRate}%`} tone="warn" /></Card>
      </div>

      <SectionEyebrow>Orders</SectionEyebrow>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs text-muted uppercase tracking-wide">
              <th className="px-3 font-medium">Shop</th>
              <th className="px-3 font-medium">Amount</th>
              <th className="px-3 font-medium">VL used</th>
              <th className="px-3 font-medium">Ready by</th>
              <th className="px-3 font-medium">Status</th>
              <th className="px-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {scoped.map((o) => {
              const m = state.merchants.find((x) => x.id === o.merchantId);
              return (
                <tr key={o.id} className="bg-bg-card border border-line">
                  <td className="px-3 py-3 rounded-l-xl">{m?.name}</td>
                  <td className="px-3 py-3 font-mono-tight">{fmtINR(o.amount)}</td>
                  <td className="px-3 py-3 font-mono-tight text-volt">{o.vlRedeemed} VL</td>
                  <td className="px-3 py-3 text-muted">{fmtTime(o.createdAt + o.readyMinutes * 60000)}</td>
                  <td className="px-3 py-3">
                    <Pill tone={o.status === "COMPLETED" ? "volt" : o.status === "CANCELLED" ? "danger" : "cyan"}>
                      {STATUS_LABEL[o.status] || o.status}
                    </Pill>
                  </td>
                  <td className="px-3 py-3 rounded-r-xl text-right whitespace-nowrap">
                    {FLOW.includes(o.status) && o.status !== "COMPLETED" && (
                      <Button variant="secondary" className="px-3 py-1.5 text-xs mr-2" onClick={() => advance(o)}>
                        {NEXT_LABEL[o.status] || `Mark ${NEXT_STATUS[o.status]}`}
                      </Button>
                    )}
                    {o.status !== "COMPLETED" && o.status !== "CANCELLED" && (
                      <Button variant="ghost" className="px-2 py-1.5 text-xs" onClick={() => cancelOrder(o)}>
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {scoped.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted text-sm">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageIn>
  );
}
