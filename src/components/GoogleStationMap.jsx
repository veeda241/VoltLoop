import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { loadIndiaStations, mergeStations } from "../lib/indiaStations";
import { DRIVER_ORIGIN, THOOTHUKUDI_STATIONS } from "../data/thoothukudiStations";

const ORIGIN = DRIVER_ORIGIN;
const MAP_CENTER = [8.77, 78.13];
const MAP_ZOOM = 12;
const TILE_URL = "https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "fast", label: "Fast CCS2" },
  { id: "two", label: "2-wheeler" },
  { id: "rated", label: "Top rated" },
  { id: "india", label: "India catalog" },
];

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function formatKm(km) {
  if (km < 0.1) return "100 m";
  return `${km.toFixed(1)} km`;
}

function hashRating(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 3.8 + (h % 12) / 10;
}

function normalize(station, origin) {
  const lat = Number(station.lat ?? station.latitude);
  const lng = Number(station.lng ?? station.longitude);
  const bays = Number(station.bays ?? station.total_bays ?? 0);
  const occupied = Number(station.occupied ?? 0);
  const vacant = Number(station.vacant ?? Math.max(0, bays - occupied));
  const kw = Number(station.kw ?? station.power_kw ?? 0);
  let status = station.status;
  if (!status) {
    if (vacant === 0) status = "full";
    else if (bays && vacant / bays <= 0.25) status = "almost";
    else status = "free";
  }
  const km = Number.isNaN(lat) || Number.isNaN(lng) ? Infinity : haversineKm(origin, { lat, lng });
  return {
    ...station,
    lat,
    lng,
    kw,
    bays,
    occupied,
    vacant,
    status,
    km,
    distanceLabel: formatKm(km),
    rating: Number(station.rating ?? hashRating(station.id)),
    connector: station.connector || (kw >= 50 ? "CCS2" : "Type2"),
    twoWheeler: Boolean(station.twoWheeler),
  };
}

function bubbleIcon(label, { selected = false, best = false } = {}) {
  const raw = best ? `⚡ Best pick · ${label}` : String(label);
  const safe = raw.replace(/[<>&"]/g, "");
  const w = Math.max(64, Math.round(18 + safe.length * (best ? 7.2 : 8)));
  const h = 36;
  const cls = ["gmaps-bubble"];
  if (selected) cls.push("is-selected");
  if (best) cls.push("is-best");
  return L.divIcon({
    className: "gmaps-bubble-wrap",
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    html: `<div class="${cls.join(" ")}">${safe}</div>`,
  });
}

function youIcon() {
  return L.divIcon({
    className: "gmaps-you",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 0 0 6px rgba(26,115,232,.22)"></div>`,
  });
}

function MapBridge({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

function FitFiltered({ stations, enabled }) {
  const map = useMap();
  const first = useRef(true);
  const key = stations.map((s) => s.id).join("|");
  useEffect(() => {
    if (!enabled || !stations.length) return;
    const bounds = L.latLngBounds(stations.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds.pad(0.22), { animate: !first.current, maxZoom: 12 });
    first.current = false;
  }, [map, key, enabled]);
  return null;
}

function MapClick({ onClick }) {
  useMapEvents({ click: () => onClick() });
  return null;
}

export default function GoogleStationMap({
  stations = [],
  selectedId = null,
  onSelect,
  onStart,
  onRefresh,
  includeCatalog = true,
  className = "",
  height = "100%",
}) {
  const mapRef = useRef(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState("all");
  const [you] = useState(ORIGIN);
  const [india, setIndia] = useState([]);
  const [catalogReady, setCatalogReady] = useState(true);

  useEffect(() => {
    if (!includeCatalog) return undefined;
    let live = true;
    setCatalogReady(false);
    loadIndiaStations()
      .then((rows) => {
        if (live) setIndia(rows);
      })
      .catch(() => {
        if (live) setIndia([]);
      })
      .finally(() => {
        if (live) setCatalogReady(true);
      });
    return () => {
      live = false;
    };
  }, [includeCatalog]);

  const merged = useMemo(
    () => mergeStations(stations, [...THOOTHUKUDI_STATIONS, ...india]),
    [stations, india],
  );

  const list = useMemo(() => {
    return merged
      .map((s) => normalize(s, you))
      .filter((s) => !Number.isNaN(s.lat) && !Number.isNaN(s.lng))
      .sort((a, b) => a.km - b.km);
  }, [merged, you]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((s) => {
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !String(s.kw).includes(q) &&
        !String(s.city || "").toLowerCase().includes(q) &&
        !String(s.address || "").toLowerCase().includes(q) &&
        !String(s.operator || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (filter === "available") return s.vacant > 0;
      if (filter === "fast") return s.kw >= 50 && s.connector === "CCS2";
      if (filter === "two") return s.twoWheeler;
      if (filter === "rated") return s.rating >= 4.5;
      if (filter === "india") return s.source === "india-csv";
      return true;
    });
  }, [list, query, filter]);

  const nearbyCount = useMemo(() => list.filter((s) => s.km <= 40).length, [list]);
  const catalogCount = useMemo(() => list.filter((s) => s.source === "india-csv").length, [list]);

  const bestPickId = useMemo(() => {
    const open = visible.filter((s) => s.vacant > 0 && s.km <= 40);
    if (!open.length) return visible.find((s) => s.vacant > 0)?.id ?? null;
    return open[0].id;
  }, [visible]);

  const selected = visible.find((s) => s.id === selectedId) || null;

  useEffect(() => {
    if (!selected) return;
    mapRef.current?.panTo([selected.lat, selected.lng], { animate: true });
  }, [selected?.id]);

  function pick(station) {
    onSelect?.(station.id);
    setSearching(false);
  }

  return (
    <div className={`gmaps-shell gmaps-finder relative overflow-hidden bg-[#e5e3df] ${className}`} style={{ height }}>
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1200] md:inset-x-4 md:top-4">
        <div className="pointer-events-auto mx-auto max-w-xl overflow-hidden rounded-2xl bg-white text-[#202124] shadow-[0_2px_12px_rgba(0,0,0,.18)]">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[#5f6368]" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              {searching ? (
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chargers or places"
                  className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-[#80868b]"
                />
              ) : (
                <button type="button" className="block w-full text-left" onClick={() => setSearching(true)}>
                  <p className="truncate text-[15px] font-semibold leading-tight">Thoothukudi · EV charging</p>
                  <p className="mt-0.5 text-xs text-[#5f6368]">
                    {catalogReady
                      ? `${nearbyCount} near you · ${catalogCount || india.length} from India catalog`
                      : "Loading India catalog…"}
                  </p>
                </button>
              )}
            </div>
            {searching ? (
              <button
                type="button"
                className="text-sm text-[#5f6368]"
                onClick={() => {
                  setQuery("");
                  setSearching(false);
                }}
              >
                Cancel
              </button>
            ) : onRefresh ? (
              <button type="button" className="text-xs font-medium text-[#1a73e8]" onClick={onRefresh}>
                Update
              </button>
            ) : null}
          </div>

          <div className="flex gap-2 overflow-x-auto px-3 pb-3 no-scrollbar">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
                    active
                      ? "bg-[#202124] text-white"
                      : "border border-[#dadce0] bg-white text-[#202124]"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {searching && query ? (
            <div className="max-h-56 overflow-y-auto border-t border-[#eee]">
              {visible.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[#5f6368]">No chargers found for “{query}”.</p>
              ) : (
                visible.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pick(s)}
                    className="flex w-full items-center justify-between gap-3 border-b border-[#f1f3f4] px-4 py-3 text-left last:border-0 hover:bg-[#f8f9fa]"
                  >
                    <span>
                      <span className="block text-sm font-medium">{s.name}</span>
                      <span className="text-xs text-[#5f6368]">
                        {[s.address, s.city].filter(Boolean).join(" · ")}
                        {s.kw ? ` · ${s.kw} kW` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold">{s.distanceLabel}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>

      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="google-map-tiles h-full w-full"
        zoomControl={false}
        attributionControl
        scrollWheelZoom
      >
        <TileLayer attribution="Map data © Google" url={TILE_URL} subdomains="0123" maxZoom={20} />
        <MapBridge mapRef={mapRef} />
        <MapClick onClick={() => onSelect?.(null)} />
        <FitFiltered stations={visible} enabled={filter !== "all" || Boolean(query.trim())} />
        <Marker position={[you.lat, you.lng]} icon={youIcon()} zIndexOffset={500} />
        {visible.map((s) => {
          const best = s.id === bestPickId;
          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={bubbleIcon(s.distanceLabel, { selected: s.id === selectedId, best })}
              zIndexOffset={s.id === selectedId ? 1000 : best ? 900 : Math.round(400 - s.km)}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e.originalEvent);
                  pick(s);
                },
              }}
            />
          );
        })}
      </MapContainer>

      <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 z-[1100] flex flex-col overflow-hidden rounded-lg shadow-[0_1px_4px_rgba(0,0,0,.3)] md:bottom-6 md:right-4">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="h-px bg-[#dadce0]" />
        <button
          type="button"
          className="grid h-10 w-10 place-items-center bg-white text-[#5f6368] hover:bg-[#f1f3f4]"
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      <button
        type="button"
        className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-3 z-[1100] grid h-10 w-10 place-items-center rounded-full bg-white text-[#1a73e8] shadow-[0_1px_4px_rgba(0,0,0,.3)] md:bottom-6 md:left-4"
        onClick={() => mapRef.current?.setView([you.lat, you.lng], MAP_ZOOM, { animate: true })}
        aria-label="My location"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>

      {selected ? (
        <div className="absolute inset-x-0 bottom-0 z-[1150] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-4 md:pb-4">
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-4 text-[#202124] shadow-[0_-2px_16px_rgba(0,0,0,.18)]">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{selected.name}</p>
                <p className="mt-0.5 text-sm text-[#5f6368]">
                  {selected.distanceLabel} · {selected.kw} kW {selected.connector}
                  {selected.twoWheeler ? " · 2W" : ""} · {selected.vacant} of {selected.bays} free
                </p>
                {selected.city || selected.address ? (
                  <p className="mt-0.5 truncate text-xs text-[#80868b]">
                    {[selected.address, selected.city].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {selected.operator || selected.hours || selected.phone ? (
                  <p className="mt-0.5 truncate text-xs text-[#80868b]">
                    {[selected.operator, selected.hours, selected.phone].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {selected.id === bestPickId ? (
                  <p className="mt-1 text-xs font-medium text-[#188038]">⚡ Best pick near you</p>
                ) : selected.source === "india-csv" ? (
                  <p className="mt-1 text-xs font-medium text-[#1a73e8]">India catalog · archive.zip</p>
                ) : selected.source === "voltloop" ? (
                  <p className="mt-1 text-xs font-medium text-[#1a73e8]">VoltLoop hub</p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full bg-[#f1f3f4] px-2 py-0.5 text-xs font-medium">
                {selected.rating.toFixed(1)} ★
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-full border border-[#dadce0] py-2.5 text-center text-sm font-semibold text-[#202124]"
              >
                Directions
              </a>
              {onStart ? (
                <button
                  type="button"
                  disabled={selected.vacant === 0}
                  onClick={() => onStart(selected)}
                  className="flex-1 rounded-full bg-[#1a73e8] py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {selected.vacant > 0 ? "Start charging" : "All bays in use"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
