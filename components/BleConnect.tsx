"use client";

import { useEffect, useState } from "react";
import { bleSupported, connectDongle, type BleConnection } from "@/lib/ble";
import type { DecodedPacket } from "@protocol/index";
import { getBus, publish } from "@/lib/protocol-bus";

export function BleConnect({
  onPacket,
}: {
  onPacket: (packet: DecodedPacket, frameHex: string, via: "ble" | "sim") => void;
}) {
  const [status, setStatus] = useState<"off" | "demo" | "ble">("demo");
  const [conn, setConn] = useState<BleConnection | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const bus = getBus();
    if (!bus) return;
    const handler = (ev: MessageEvent) => {
      const data = ev.data as { type?: string; packet?: DecodedPacket; frameHex?: string; via?: string };
      if (data?.type === "packet" && data.packet && data.frameHex) {
        onPacket(data.packet, data.frameHex, data.via === "ble" ? "ble" : "sim");
        setStatus((s) => (s === "ble" ? s : "demo"));
      }
    };
    bus.addEventListener("message", handler);
    return () => bus.removeEventListener("message", handler);
  }, [onPacket]);

  async function connect() {
    setError("");
    try {
      const c = await connectDongle((packet, frameHex) => {
        publish({ type: "packet", packet, frameHex, via: "ble" });
        onPacket(packet, frameHex, "ble");
      });
      setConn(c);
      setStatus("ble");
    } catch (err) {
      setError(err instanceof Error ? err.message : "BLE connect failed");
      setStatus("demo");
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Phone bridge</p>
          <p className="font-semibold">
            {status === "ble" ? `Dongle connected · node 0x${conn?.nodeId.toString(16)}` : "Demo mode (simulator / no dongle)"}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Web Bluetooth: Chrome + HTTPS/localhost. ESP32 GATT, no pairing PIN.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void connect()}
            disabled={!bleSupported()}
            className="rounded-xl bg-[var(--volt)] px-3 py-2 text-sm font-medium text-[#0a1208] disabled:opacity-40"
          >
            Connect dongle
          </button>
          <button
            onClick={() => {
              setStatus("demo");
              setConn(null);
            }}
            className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
          >
            Demo mode
          </button>
        </div>
      </div>
      {!bleSupported() ? (
        <p className="mt-2 text-xs text-[var(--warn)]">This browser has no Web Bluetooth — use the mesh simulator.</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
