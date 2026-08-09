import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { randomId } from "@/lib/crypto-hash";
import { mutateStore, readStore } from "@/lib/store/demo-store";

export async function GET() {
  try {
    const user = await requireUser();
    const store = readStore();
    const mine = store.charging_sessions.filter((s) => s.user_id === user.id);
    return json({ sessions: mine });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(["driver"]);
    const body = (await req.json()) as { station_id?: string; expected_finish_at?: string; minutes?: number };
    if (!body.station_id) return json({ error: "station_id required" }, 400);

    const store = readStore();
    const station = store.stations.find((s) => s.id === body.station_id);
    if (!station) return json({ error: "Station not found" }, 404);

    const expected =
      body.expected_finish_at ||
      new Date(Date.now() + Math.max(10, Number(body.minutes || 40)) * 60_000).toISOString();

    const session = mutateStore((s) => {
      const existing = s.charging_sessions.find((x) => x.user_id === user.id && x.status === "ACTIVE");
      if (existing) existing.status = "CANCELLED";
      const created = {
        id: randomId(),
        user_id: user.id,
        station_id: body.station_id!,
        started_at: new Date().toISOString(),
        expected_finish_at: expected,
        status: "ACTIVE" as const,
      };
      s.charging_sessions.push(created);
      return created;
    });

    return json({ session }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
