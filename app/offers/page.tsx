"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BleConnect } from "@/components/BleConnect";
import { demoHop } from "@/lib/ble";
import { useMerchants, useUser } from "@/lib/hooks";
import { publish } from "@/lib/protocol-bus";
import type { DecodedPacket, FramePayload } from "@protocol/index";

type OfferItem = {
  id: string;
  packet: DecodedPacket;
  frameHex: string;
  via: "ble" | "sim";
  credited?: boolean;
  creditMsg?: string;
};

export default function OffersPage() {
  const { user } = useUser();
  const merchants = useMerchants();
  const router = useRouter();
  const [items, setItems] = useState<OfferItem[]>([]);

  const onPacket = useCallback((packet: DecodedPacket, frameHex: string, via: "ble" | "sim") => {
    setItems((prev) => {
      if (prev.some((p) => p.packet.msgId === packet.msgId && p.packet.hopCount === packet.hopCount)) {
        return prev;
      }
      return [{ id: `${packet.msgId}-${packet.hopCount}`, packet, frameHex, via }, ...prev].slice(0, 20);
    });
  }, []);

  async function share(item: OfferItem) {
    const hopped = await demoHop(item.packet);
    if (!hopped) {
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, creditMsg: "TTL expired — cannot hop" } : p)),
      );
      return;
    }
    publish({ type: "share", frameHex: hopped.frameHex });
    publish({ type: "packet", packet: hopped.packet, frameHex: hopped.frameHex, via: "share" });

    if (!user) {
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, creditMsg: "Shared locally. Log in to earn tokens." } : p)),
      );
      return;
    }

    const origin = item.packet.parsed?.kind === "offer" ? item.packet.parsed.merchantId : undefined;
    const res = await fetch("/api/relays/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frameHex: hopped.frameHex, originMerchantId: origin ?? null }),
    });
    const data = (await res.json()) as {
      credited?: boolean;
      reason?: string;
      reward?: number;
      balance?: number;
      error?: string;
    };
    setItems((prev) =>
      prev.map((p) =>
        p.id === item.id
          ? {
              ...p,
              credited: Boolean(data.credited),
              creditMsg: data.error
                ? data.error
                : data.credited
                  ? `+${data.reward} VL credited · balance ${data.balance}`
                  : data.reason === "already_credited"
                    ? "Already credited for this msg_id"
                    : "Hop shared",
            }
          : p,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Offers</h1>
        <p className="text-sm text-[var(--muted)]">
          Shops around charging hubs reach you through vehicles nearby.
        </p>
      </div>

      <BleConnect onPacket={onPacket} />

      {!items.length ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-[var(--muted)]">
          Nothing nearby yet. Open the{" "}
          <button className="text-[var(--volt)]" onClick={() => router.push("/sim")}>live mesh</button>{" "}
          or connect your vehicle to preview offers.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-4">
              <OfferBody parsed={item.packet.parsed} packet={item.packet} via={item.via} />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void share(item)}
                  className="rounded-xl bg-[var(--volt)] px-3 py-1.5 text-sm font-medium text-[#0a1208]"
                >
                  Pass along · +10 VL
                </button>
                {item.packet.parsed?.kind === "offer" ? (
                  <button
                    onClick={() => router.push(`/wallet?order=${item.packet.parsed && item.packet.parsed.kind === "offer" ? item.packet.parsed.merchantId ?? "" : ""}`)}
                    className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm"
                  >
                    Order for pickup
                  </button>
                ) : null}
                <span className="text-xs text-[var(--muted)]">{item.creditMsg}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <h2 className="mb-2 font-semibold">Partner merchants (seed)</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {merchants.map((m) => (
            <button
              key={m.id}
              onClick={() => router.push(`/wallet?order=${m.id}`)}
              className="rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] p-3 text-left"
            >
              <div className="font-medium">{m.name}</div>
              <div className="text-xs text-[var(--muted)]">
                {m.category} · {m.discount_pct}% off with tokens
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OfferBody({
  parsed,
  packet,
  via,
}: {
  parsed: FramePayload | null;
  packet: DecodedPacket;
  via: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
        <span>
          msg 0x{packet.msgId.toString(16)} · hop {packet.hopCount} · ttl {packet.ttl} · via {via}
        </span>
        <span>origin {packet.originId}</span>
      </div>
      {parsed?.kind === "offer" ? (
        <>
          <h2 className="mt-1 text-lg font-semibold">{parsed.merchantName}</h2>
          <p className="text-sm text-[var(--muted)]">
            {parsed.category} near {parsed.stationName} · {parsed.discountPct}% dwell discount
          </p>
        </>
      ) : parsed?.kind === "status" ? (
        <>
          <h2 className="mt-1 text-lg font-semibold">{parsed.stationName}</h2>
          <p className="text-sm text-[var(--muted)]">
            {parsed.activeBays}/{parsed.totalBays} bays active · ETA {parsed.etaMin} min
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm">Unparsed payload ({packet.payload.length} bytes)</p>
      )}
    </div>
  );
}
