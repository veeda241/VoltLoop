declare module "@/src/data/thoothukudiStations" {
  export const DRIVER_ORIGIN: { lat: number; lng: number };

  export type ThoothukudiStation = {
    id: string;
    name: string;
    address?: string;
    city?: string;
    lat: number;
    lng: number;
    connector?: string;
    twoWheeler?: boolean;
    kw: number;
    bays: number;
    occupied: number;
    minutesList?: number[];
    rating?: number;
    operator?: string;
    hours?: string;
    phone?: string;
    source?: string;
  };

  export const THOOTHUKUDI_STATIONS: ThoothukudiStation[];
}
