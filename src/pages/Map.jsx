import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleStationMap from "../components/GoogleStationMap";
import { useStore, stationDerived } from "../state/store";

export default function MapPage() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const [selected, setSelected] = useState(null);

  const stations = state.stations.map((s) => ({ ...s, ...stationDerived(s) }));

  function startSession(station) {
    dispatch({
      type: "ADD_STATIONS",
      payload: [
        {
          id: station.id,
          name: station.name,
          lat: station.lat,
          lng: station.lng,
          bays: station.bays,
          kw: station.kw,
          occupied: station.occupied ?? 0,
          minutesList: station.minutesList || [],
          rating: station.rating,
          connector: station.connector,
          twoWheeler: station.twoWheeler,
          city: station.city,
          address: station.address,
          source: station.source,
        },
      ],
    });
    dispatch({
      type: "START_SESSION",
      payload: { email: state.currentUserEmail, stationId: station.id, expectedMinutes: 40 },
    });
    nav("/session");
  }

  function refreshOCM() {
    dispatch({
      type: "TOAST",
      payload: { message: "India catalog refreshed from archive.zip.", tone: "muted" },
    });
  }

  return (
    <div className="h-[calc(100dvh-4.25rem)] md:h-[calc(100dvh-4.75rem)]">
      <GoogleStationMap
        className="h-full rounded-none border-0"
        height="100%"
        stations={stations}
        selectedId={selected}
        onSelect={setSelected}
        onStart={startSession}
        onRefresh={refreshOCM}
        includeCatalog
      />
    </div>
  );
}
