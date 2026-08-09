"use client";

import dynamic from "next/dynamic";
import type { StationWithVacancy } from "@/lib/occupancy";

const GoogleStationMap = dynamic(() => import("@/src/components/GoogleStationMap.jsx"), {
  ssr: false,
});

export default function StationMap({
  stations,
  onSelect,
  selectedId,
  onStart,
  onRefresh,
}: {
  stations: StationWithVacancy[];
  onSelect?: (id: string | null) => void;
  selectedId?: string | null;
  onStart?: (station: StationWithVacancy) => void;
  onRefresh?: () => void;
  canStart?: boolean;
}) {
  return (
    <GoogleStationMap
      className="h-full rounded-none border-0"
      height="100%"
      stations={stations.map((s) => ({
        id: s.id,
        name: s.name,
        lat: s.latitude,
        lng: s.longitude,
        kw: s.power_kw,
        bays: s.total_bays,
        vacant: s.vacant,
        occupied: s.occupied,
        minutesList: s.occupants.map((o) => o.minutes_remaining),
        source: "voltloop",
      }))}
      selectedId={selectedId}
      onSelect={onSelect}
      onRefresh={onRefresh}
      onStart={
        onStart
          ? (st: { id: string }) => {
              const match = stations.find((s) => s.id === st.id);
              onStart((match ?? st) as StationWithVacancy);
            }
          : undefined
      }
    />
  );
}
