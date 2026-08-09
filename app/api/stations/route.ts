import { json, errorResponse } from "@/lib/api";
import { withVacancy } from "@/lib/occupancy";
import { readStore } from "@/lib/store/demo-store";

export async function GET() {
  try {
    const store = readStore();
    const stations = store.stations.map((st) => withVacancy(st, store.charging_sessions));
    return json({ stations });
  } catch (err) {
    return errorResponse(err);
  }
}
