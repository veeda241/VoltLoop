const TUTICORIN = { lat: 8.7642, lng: 78.1348 };
const CATALOG_URL = "/data/ev-charging-stations-india.csv";

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

export function parseCsv(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? "").trim();
    });
    return row;
  });
}

function hash(str) {
  let h = 0;
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function isTamilNadu(row) {
  const blob = `${row.state || ""} ${row.city || ""} ${row.address || ""}`.toLowerCase();
  return blob.includes("tamil");
}

function inferCharger(row) {
  const name = row.name || "";
  const typeNum = Number(row.type) || 0;
  const dc = /dc\b|fast|ccs|supercharger|highway|iocl|bpcl|hpcl|eesl|kseb/i.test(name);
  const twoWheeler = /ather|2[\s-]?wheeler|scooter|type\s*2/i.test(name) || typeNum === 6;
  let kw;
  let connector;
  if (dc || typeNum >= 11) {
    kw = typeNum >= 19 ? 120 : typeNum >= 16 ? 90 : typeNum >= 12 ? 60 : 50;
    connector = "CCS2";
  } else if (twoWheeler || typeNum <= 7) {
    kw = typeNum <= 6 ? 7 : 22;
    connector = "Type2";
  } else {
    kw = 30;
    connector = "Type2";
  }
  const bays = Math.min(10, Math.max(2, typeNum >= 6 && typeNum <= 20 ? Math.round(typeNum / 2) || 4 : 4));
  const occupied = hash(name) % (bays + 1);
  const minutesList = Array.from({ length: occupied }, (_, i) => 8 + ((hash(name + i) % 35)));
  return {
    kw,
    connector,
    twoWheeler: connector === "Type2" && kw <= 22,
    bays,
    occupied,
    minutesList,
    rating: 3.8 + (hash(name) % 12) / 10,
  };
}

export function rowToStation(row) {
  const lat = Number(row.lattitude ?? row.latitude);
  const lng = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const name = (row.name || "").trim();
  if (!name) return null;
  const inferred = inferCharger(row);
  const id = `in-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}-${Math.round(lat * 10000)}-${Math.round(lng * 10000)}`;
  return {
    id,
    name,
    lat,
    lng,
    city: (row.city || "").trim(),
    state: (row.state || "").trim(),
    address: (row.address || "").trim(),
    source: "india-csv",
    ...inferred,
  };
}

export function isProjectCorridor(station, origin = TUTICORIN) {
  if (station.state && /tamil/i.test(station.state)) return true;
  return haversineKm(origin, station) <= 220;
}

export function mergeStations(primary = [], catalog = []) {
  const out = [];
  const seen = new Set();
  const points = [];

  function nearbyIndex(lat, lng) {
    return points.findIndex((p) => Math.abs(p.lat - lat) < 0.002 && Math.abs(p.lng - lng) < 0.002);
  }

  for (const s of primary) {
    const lat = Number(s.lat ?? s.latitude);
    const lng = Number(s.lng ?? s.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    points.push({ lat, lng });
    out.push({ ...s, source: s.source || "voltloop", lat, lng });
  }

  for (const s of catalog) {
    if (!s || seen.has(s.id) || !isProjectCorridor(s)) continue;
    const idx = nearbyIndex(s.lat, s.lng);
    if (idx >= 0) {
      const existing = out[idx];
      out[idx] = {
        ...s,
        ...existing,
        connector: existing.connector || s.connector,
        twoWheeler: existing.twoWheeler ?? s.twoWheeler,
        rating: existing.rating ?? s.rating,
        address: existing.address || s.address,
        city: existing.city || s.city,
        operator: existing.operator || s.operator,
        hours: existing.hours || s.hours,
        phone: existing.phone || s.phone,
      };
      continue;
    }
    seen.add(s.id);
    points.push({ lat: s.lat, lng: s.lng });
    out.push(s);
  }
  return out;
}

let cached = null;

export async function loadIndiaStations() {
  if (cached) return cached;
  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error("Could not load charging station catalog");
  const text = await res.text();
  const stations = [];
  const seen = new Set();
  for (const row of parseCsv(text)) {
    const station = rowToStation(row);
    if (!station || seen.has(station.id)) continue;
    seen.add(station.id);
    stations.push(station);
  }
  cached = stations;
  return cached;
}
