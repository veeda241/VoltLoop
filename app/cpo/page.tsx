"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks";

type CpoStation = {
  id: string;
  name: string;
  total_bays: number;
  occupied: number;
  vacant: number;
  occupancy_pct: number;
  avg_dwell_min: number;
  impressions: number;
  orders: number;
  gmv: number;
  estimated_commission: number;
  power_kw: number;
};

type Stats = {
  stations: CpoStation[];
  totals: {
    impressions: number;
    orders: number;
    gmv: number;
    commission: number;
    occupancy_pct: number;
  };
  relay_count: number;
};

export default function CpoPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/cpo/stats");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load CPO stats");
        return;
      }
      setStats(data);
    })();
  }, []);

  if (user === undefined) return null;
  if (!user) return <p className="text-[var(--muted)]">Sign in as a station operator to view the network.</p>;
  if (error) return <p className="text-[var(--danger)]">{error}</p>;
  if (!stats) return <p className="text-[var(--muted)]">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Network overview</h1>
        <p className="text-sm text-[var(--muted)]">
          Occupancy from active charges. Offer reach and spend tied back to each hub.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Network occupancy" value={`${stats.totals.occupancy_pct}%`} />
        <Stat label="Offer reach" value={String(stats.relay_count)} />
        <Stat label="Orders" value={String(stats.totals.orders)} />
        <Stat label="Attributed sales" value={`₹${stats.totals.gmv.toFixed(0)}`} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[var(--bg-elev)] text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Station</th>
              <th className="px-3 py-2 font-medium">Occupancy</th>
              <th className="px-3 py-2 font-medium">Avg dwell</th>
              <th className="px-3 py-2 font-medium">Impressions</th>
              <th className="px-3 py-2 font-medium">Orders</th>
              <th className="px-3 py-2 font-medium">GMV</th>
              <th className="px-3 py-2 font-medium">Est. commission</th>
            </tr>
          </thead>
          <tbody>
            {stats.stations.map((s) => (
              <tr key={s.id} className="border-t border-[var(--line)]">
                <td className="px-3 py-2">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-[var(--muted)]">{s.power_kw} kW</div>
                </td>
                <td className="px-3 py-2">
                  {s.occupied}/{s.total_bays} ({s.occupancy_pct}%)
                </td>
                <td className="px-3 py-2">{s.avg_dwell_min || "—"} min</td>
                <td className="px-3 py-2">{s.impressions}</td>
                <td className="px-3 py-2">{s.orders}</td>
                <td className="px-3 py-2">₹{s.gmv.toFixed(0)}</td>
                <td className="px-3 py-2 text-[var(--volt)]">₹{s.estimated_commission.toFixed(0)}</td>
              </tr>
            ))}
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
