import React from "react";
import { Card, Pill, PageIn, SectionEyebrow, StatBlock } from "../components/ui";
import { useStore, stationDerived } from "../state/store";
import { fmtINR } from "../lib/format";

export default function Cpo() {
  const { state } = useStore();

  const rows = state.stations.map((s) => {
    const { occupied } = stationDerived(s);
    const occPct = Math.round((occupied / s.bays) * 100);
    const sessions = state.sessions.filter((sess) => sess.stationId === s.id);
    const avgDwell = sessions.length
      ? Math.round(sessions.reduce((sum, sess) => sum + sess.expectedMinutes, 0) / sessions.length)
      : 0;
    const impressions = state.relays.filter((r) => r.stationId === s.id).reduce((sum, r) => sum + r.hopCount, 0);
    const stationMerchants = state.merchants.filter((m) => m.stationId === s.id).map((m) => m.id);
    const orders = state.orders.filter((o) => stationMerchants.includes(o.merchantId));
    const gmv = orders.reduce((sum, o) => sum + o.amount, 0);
    const commission = Math.round(gmv * 0.15);
    return { station: s, occPct, occupied, avgDwell, impressions, orderCount: orders.length, gmv, commission };
  });

  const totalOcc = Math.round(rows.reduce((s, r) => s + r.occPct, 0) / rows.length);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalOrders = rows.reduce((s, r) => s + r.orderCount, 0);
  const totalGmv = rows.reduce((s, r) => s + r.gmv, 0);

  return (
    <PageIn>
      <div className="pt-6 pb-4">
        <SectionEyebrow>Station operator</SectionEyebrow>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">Network overview</h1>
        <p className="text-sm text-muted">
          Occupancy from active charges. Offer reach and spend tied back to each hub.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card><StatBlock label="Network occupancy" value={`${totalOcc}%`} tone="volt" /></Card>
        <Card><StatBlock label="Offer reach" value={totalImpressions} tone="cyan" /></Card>
        <Card><StatBlock label="Orders" value={totalOrders} /></Card>
        <Card><StatBlock label="Attributed sales" value={fmtINR(totalGmv)} tone="warn" /></Card>
      </div>

      <SectionEyebrow>Per station</SectionEyebrow>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-xs text-muted uppercase tracking-wide">
              <th className="px-3 font-medium">Station</th>
              <th className="px-3 font-medium">Occupancy</th>
              <th className="px-3 font-medium">Avg dwell</th>
              <th className="px-3 font-medium">Offer reach</th>
              <th className="px-3 font-medium">Orders</th>
              <th className="px-3 font-medium">Sales</th>
              <th className="px-3 font-medium">Platform fee</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.station.id} className="bg-bg-card border border-line">
                <td className="px-3 py-3 rounded-l-xl font-medium">
                  {r.station.name}
                  {r.station.address || r.station.city ? (
                    <span className="block text-xs font-normal text-muted">
                      {[r.station.address, r.station.city].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  <Pill tone={r.occPct >= 100 ? "danger" : r.occPct >= 75 ? "warn" : "volt"}>
                    {r.occupied}/{r.station.bays} · {r.occPct}%
                  </Pill>
                </td>
                <td className="px-3 py-3 font-mono-tight text-muted">{r.avgDwell || "—"}m</td>
                <td className="px-3 py-3 font-mono-tight">{r.impressions}</td>
                <td className="px-3 py-3 font-mono-tight">{r.orderCount}</td>
                <td className="px-3 py-3 font-mono-tight">{fmtINR(r.gmv)}</td>
                <td className="px-3 py-3 rounded-r-xl font-mono-tight text-cyan">{fmtINR(r.commission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageIn>
  );
}
