import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { withVacancy } from "@/lib/occupancy";
import { readStore } from "@/lib/store/demo-store";
import { MERCHANT_COMMISSION_RATE } from "@/lib/store/seed";

export async function GET() {
  try {
    await requireUser(["cpo", "admin", "merchant"]);
    const store = readStore();

    const stations = store.stations.map((st) => {
      const vacancy = withVacancy(st, store.charging_sessions);
      const sessions = store.charging_sessions.filter((s) => s.station_id === st.id);
      const completed = sessions.filter((s) => s.status === "COMPLETED");
      const dwellMins = completed.map((s) =>
        Math.max(0, (new Date(s.expected_finish_at).getTime() - new Date(s.started_at).getTime()) / 60_000),
      );
      const avgDwell = dwellMins.length ? dwellMins.reduce((a, b) => a + b, 0) / dwellMins.length : 0;
      const merchants = store.merchants.filter((m) => m.station_id === st.id);
      const impressions = store.ad_relays.filter((r) =>
        merchants.some((m) => m.id === r.origin_merchant_id),
      ).length;
      const orders = store.orders.filter((o) => merchants.some((m) => m.id === o.merchant_id));
      const gmv = orders.filter((o) => o.status !== "CANCELLED").reduce((a, o) => a + o.total_amount, 0);
      return {
        ...vacancy,
        occupancy_pct: st.total_bays ? Math.round((vacancy.occupied / st.total_bays) * 100) : 0,
        avg_dwell_min: Math.round(avgDwell),
        impressions,
        orders: orders.length,
        gmv,
        estimated_commission: Number((gmv * MERCHANT_COMMISSION_RATE).toFixed(2)),
      };
    });

    const totals = stations.reduce(
      (acc, s) => {
        acc.impressions += s.impressions;
        acc.orders += s.orders;
        acc.gmv += s.gmv;
        acc.commission += s.estimated_commission;
        acc.occupied += s.occupied;
        acc.bays += s.total_bays;
        return acc;
      },
      { impressions: 0, orders: 0, gmv: 0, commission: 0, occupied: 0, bays: 0 },
    );

    return json({
      stations,
      totals: {
        ...totals,
        occupancy_pct: totals.bays ? Math.round((totals.occupied / totals.bays) * 100) : 0,
      },
      relay_count: store.ad_relays.length,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
