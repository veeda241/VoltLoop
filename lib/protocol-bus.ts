import type { DecodedPacket } from "@protocol/index";

export const BUS_CHANNEL = "voltloop-mesh";

export type BusEvent =
  | { type: "packet"; packet: DecodedPacket; frameHex: string; via: "sim" | "ble" | "share" }
  | { type: "share"; frameHex: string }
  | { type: "node-count"; count: number };

export function getBus(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(BUS_CHANNEL);
}

export function publish(event: BusEvent) {
  getBus()?.postMessage(event);
}
