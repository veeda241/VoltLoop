declare module "@/src/components/GoogleStationMap.jsx" {
  import type { ComponentType } from "react";

  export type GoogleMapStation = {
    id: string;
    name: string;
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    kw?: number;
    power_kw?: number;
    bays?: number;
    total_bays?: number;
    vacant?: number;
    occupied?: number;
    status?: string;
    minutesList?: number[];
    city?: string;
    address?: string;
    state?: string;
    source?: string;
    connector?: string;
    twoWheeler?: boolean;
    rating?: number;
    operator?: string;
    hours?: string;
    phone?: string;
  };

  const GoogleStationMap: ComponentType<{
    stations?: GoogleMapStation[];
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
    onStart?: (station: GoogleMapStation) => void;
    onRefresh?: () => void;
    includeCatalog?: boolean;
    className?: string;
    height?: number | string;
  }>;

  export default GoogleStationMap;
}
