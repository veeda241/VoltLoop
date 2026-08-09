import { json, errorResponse } from "@/lib/api";
import { readStore } from "@/lib/store/demo-store";

export async function GET(req: Request) {
  try {
    const stationId = new URL(req.url).searchParams.get("station_id");
    const store = readStore();
    const merchants = store.merchants.filter((m) => m.is_active && (!stationId || m.station_id === stationId));
    return json({ merchants });
  } catch (err) {
    return errorResponse(err);
  }
}
