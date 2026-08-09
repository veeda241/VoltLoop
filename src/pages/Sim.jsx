import React, { useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Card, Button, Pill, PageIn, SectionEyebrow } from "../components/ui";
import MeshCanvas from "../components/MeshCanvas";
import { useStore } from "../state/store";
import { makeOfferPacket } from "../lib/packets";
import { useIsMobile } from "../hooks/useIsMobile";

export default function Sim() {
  const isMobile = useIsMobile();
  const { state, broadcastRelay } = useStore();
  const [density, setDensity] = useState(8);
  const [merchantId, setMerchantId] = useState(state.merchants[0]?.id || "");
  const [log, setLog] = useState([]);
  const canvasRef = useRef(null);

  const merchant = useMemo(
    () => state.merchants.find((m) => m.id === merchantId) || state.merchants[0],
    [state.merchants, merchantId],
  );
  const station = useMemo(
    () => state.stations.find((s) => s.id === merchant?.stationId),
    [state.stations, merchant],
  );

  async function inject() {
    if (!merchant) return;
    const packet = await makeOfferPacket("sim", merchant.id);
    const suppressed = Math.random() < 0.15;
    canvasRef.current?.injectPulse({ suppressed });
    const detail = `${packet.merchantName} · ${packet.discount}% off · ${packet.category}`;
    setLog((l) =>
      [
        {
          id: packet.msgId,
          text: suppressed ? `Duplicate ignored · ${detail}` : `Offer delivered · ${detail}`,
          suppressed,
          ts: Date.now(),
        },
        ...l,
      ].slice(0, 8),
    );
    if (!suppressed) {
      broadcastRelay(packet);
    }
  }

  return (
    <PageIn>
      <div className="pt-6 pb-4">
        <SectionEyebrow>Network</SectionEyebrow>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">Live mesh</h1>
        <p className="text-sm text-muted">
          Watch offers travel between vehicles around a charging hub. The brighter dot is you.
        </p>
      </div>

      <Card className="p-0 overflow-hidden mb-6" glow="volt">
        <MeshCanvas ref={canvasRef} density={density} height={isMobile ? 220 : 340} interactive />
        <div className="px-5 py-4 border-t border-line/70 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-muted">
            Offers hop a few vehicles, then fade. Duplicates are ignored automatically.
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-volt inline-block" /> delivered
            <span className="w-2.5 h-2.5 rounded-full bg-danger inline-block ml-3" /> ignored
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card>
          <h3 className="font-semibold text-sm mb-3">Traffic around the hub</h3>
          <input
            type="range"
            min={3}
            max={24}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="w-full accent-[#c8f542]"
          />
          <div className="flex justify-between text-xs text-muted mt-1.5">
            <span>Quiet</span>
            <span className="text-volt font-mono-tight">{density} vehicles</span>
            <span>Busy</span>
          </div>
        </Card>
        <Card className="flex flex-col justify-center">
          <label className="text-xs text-muted mb-1.5 block">What nearby drivers will see</label>
          <select
            value={merchant?.id || ""}
            onChange={(e) => setMerchantId(e.target.value)}
            className="w-full rounded-xl bg-bg-elev border border-line px-4 py-3 text-sm outline-none focus:border-volt/60 mb-3"
          >
            {state.merchants.map((m) => {
              const st = state.stations.find((s) => s.id === m.stationId);
              return (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.discount}% off · {m.category}
                  {st?.name ? ` · ${st.name}` : ""}
                </option>
              );
            })}
          </select>
          {merchant ? (
            <p className="text-xs text-muted mb-4 leading-relaxed">
              Packet includes <span className="text-text font-medium">{merchant.name}</span>,{" "}
              <span className="text-volt font-medium">{merchant.discount}% off</span>, {merchant.category}
              {station ? `, near ${station.name}` : ""}. Drivers open this on Offers — not a blank ping.
            </p>
          ) : null}
          <Button variant="primary" onClick={() => void inject()} className="w-full">
            Send an offer
          </Button>
          <p className="text-xs text-muted mt-3">
            Sent offers appear instantly in <NavLink to="/offers" className="text-cyan">Offers</NavLink>.
          </p>
        </Card>
      </div>

      <SectionEyebrow>Recent activity</SectionEyebrow>
      <div className="space-y-2">
        {log.length === 0 && <p className="text-sm text-muted">Nothing sent yet — try the button above.</p>}
        {log.map((l) => (
          <Card key={l.id + l.ts} className="flex items-center justify-between py-3">
            <p className="text-sm">{l.text}</p>
            <Pill tone={l.suppressed ? "danger" : "volt"}>{l.suppressed ? "ignored" : "sent"}</Pill>
          </Card>
        ))}
      </div>
    </PageIn>
  );
}
