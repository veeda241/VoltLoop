import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat") ?? "8.7642";
    const lng = url.searchParams.get("lng") ?? "78.1348";
    const distance = url.searchParams.get("distance") ?? "10";
    const key = Deno.env.get("OCM_API_KEY");
    if (!key) return json({ error: "OCM_API_KEY not set", stations: [] }, 200);

    const ocm = new URL("https://api.openchargemap.io/v3/poi/");
    ocm.searchParams.set("output", "json");
    ocm.searchParams.set("latitude", lat);
    ocm.searchParams.set("longitude", lng);
    ocm.searchParams.set("distance", distance);
    ocm.searchParams.set("maxresults", "10");
    ocm.searchParams.set("distanceunit", "KM");

    const res = await fetch(ocm, { headers: { "X-API-Key": key, Accept: "application/json" } });
    if (!res.ok) return json({ error: `OCM ${res.status}` }, 502);
    const pois = await res.json();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const upserted = [];
    for (const poi of pois as Array<{
      AddressInfo?: { Title?: string; Latitude?: number; Longitude?: number };
      Connections?: { PowerKW?: number }[];
      NumberOfPoints?: number;
    }>) {
      const name = poi.AddressInfo?.Title?.trim();
      const latitude = poi.AddressInfo?.Latitude;
      const longitude = poi.AddressInfo?.Longitude;
      if (!name || latitude == null || longitude == null) continue;
      const power = poi.Connections?.map((c) => c.PowerKW || 0).reduce((a, b) => Math.max(a, b), 0) || 50;
      const bays = poi.NumberOfPoints || 2;
      const { data } = await admin
        .from("stations")
        .insert({
          name,
          latitude,
          longitude,
          total_bays: bays,
          active_bays: bays,
          power_kw: power,
          source: "open_charge_map",
        })
        .select()
        .maybeSingle();
      if (data) upserted.push(data);
    }
    return json({ source: "open_charge_map", stations: upserted });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "error" }, 500);
  }
});

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}
