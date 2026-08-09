import type { ChargingSession, Station } from "@/lib/store/types";

export type BayOccupant = {
  sessionId: string;
  expected_finish_at: string;
  minutes_remaining: number;
};

export type StationWithVacancy = Station & {
  occupied: number;
  vacant: number;
  occupants: BayOccupant[];
};

export function withVacancy(
  station: Station,
  sessions: ChargingSession[],
  now = Date.now(),
): StationWithVacancy {
  const active = sessions.filter((s) => s.station_id === station.id && s.status === "ACTIVE");
  const occupants = active.map((s) => ({
    sessionId: s.id,
    expected_finish_at: s.expected_finish_at,
    minutes_remaining: Math.max(0, Math.round((new Date(s.expected_finish_at).getTime() - now) / 60_000)),
  }));
  const occupied = Math.min(station.total_bays, occupants.length);
  return {
    ...station,
    occupied,
    vacant: Math.max(0, station.total_bays - occupied),
    occupants,
  };
}
