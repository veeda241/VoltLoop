import { json, errorResponse } from "@/lib/api";
import { randomId } from "@/lib/crypto-hash";
import { mutateStore, readStore } from "@/lib/store/demo-store";
import { withVacancy } from "@/lib/occupancy";

type OcmPoi = {
  ID?: number;
  AddressInfo?: {
    Title?: string;
    Latitude?: number;
    Longitude?: number;
  };
  Connections?: { PowerKW?: number }[];
  NumberOfPoints?: number;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lat = Number(url.searchParams.get("lat") ?? "8.7642");
    const lng = Number(url.searchParams.get("lng") ?? "78.1348");
    const distance = Number(url.searchParams.get("distance") ?? "10");
    const key = process.env.OCM_API_KEY;

    if (!key) {
      const store = readStore();
      return json({
        source: "seed",
        stations: store.stations.map((st) => withVacancy(st, store.charging_sessions)),
        note: "OCM_API_KEY not set — returning Thoothukudi seed stations.",
      });
    }

    const ocmUrl = new URL("https://api.openchargemap.io/v3/poi/");
    ocmUrl.searchParams.set("output", "json");
    ocmUrl.searchParams.set("latitude", String(lat));
    ocmUrl.searchParams.set("longitude", String(lng));
    ocmUrl.searchParams.set("distance", String(distance));
    ocmUrl.searchParams.set("maxresults", "10");
    ocmUrl.searchParams.set("distanceunit", "KM");

    const res = await fetch(ocmUrl, {
      headers: { "X-API-Key": key, Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return json({ error: `Open Charge Map error ${res.status}` }, 502);

    const pois = (await res.json()) as OcmPoi[];
    const upserted = mutateStore((store) => {
      for (const poi of pois) {
        const name = poi.AddressInfo?.Title?.trim();
        const latitude = poi.AddressInfo?.Latitude;
        const longitude = poi.AddressInfo?.Longitude;
        if (!name || latitude == null || longitude == null) continue;
        const existing = store.stations.find(
          (s) => Math.abs(s.latitude - latitude) < 0.0005 && Math.abs(s.longitude - longitude) < 0.0005,
        );
        const power = poi.Connections?.map((c) => c.PowerKW || 0).reduce((a, b) => Math.max(a, b), 0) || 50;
        const bays = poi.NumberOfPoints || 2;
        if (existing) {
          existing.name = name;
          existing.power_kw = power;
          existing.total_bays = bays;
          existing.source = "open_charge_map";
        } else {
          store.stations.push({
            id: randomId(),
            name,
            latitude,
            longitude,
            total_bays: bays,
            active_bays: bays,
            power_kw: power,
            source: "open_charge_map",
          });
        }
      }
      return store.stations.map((st) => withVacancy(st, store.charging_sessions));
    });

    return json({ source: "open_charge_map", stations: upserted });
  } catch (err) {
    return errorResponse(err);
  }
}
