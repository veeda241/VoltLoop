import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import { Card, Button, Pill, EmptyState, PageIn, SectionEyebrow } from "../components/ui";
import { useStore, currentUser } from "../state/store";
import { hopSignedFrame, makePacket } from "../lib/packets";
import { bleSupported, connectDongle } from "../lib/ble";
import { timeAgo } from "../lib/format";

function PacketCard({ relay, onShare, onOrder, credited }) {
  const isOffer = relay.type === "offer";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-volt via-cyan to-transparent opacity-60" />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Pill tone={isOffer ? "volt" : "cyan"}>{isOffer ? "Offer" : "Station status"}</Pill>
              <Pill tone="muted">{relay.via === "ble" ? "Your vehicle" : "Nearby mesh"}</Pill>
            </div>
            <h3 className="font-semibold text-text">
              {isOffer ? relay.merchantName : relay.stationName}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {isOffer
                ? `${relay.category} · ${relay.discount}% off · near ${relay.stationName}`
                : `${relay.activeBays}/${relay.totalBays} bays active · ETA ${relay.etaMinutes}m`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-muted font-mono-tight">{timeAgo(relay.ts)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted mb-4">
          <span>Passed along <span className="text-text font-medium">{relay.hopCount}</span> time{relay.hopCount === 1 ? "" : "s"}</span>
          <span className={relay.ttl === 0 ? "text-danger" : ""}>{relay.ttl === 0 ? "Expired" : "Still circulating"}</span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="primary"
            className="w-full sm:flex-1"
            disabled={relay.ttl === 0 || credited}
            onClick={() => onShare(relay)}
          >
            {credited ? "Already earned" : relay.ttl === 0 ? "Offer expired" : "Pass along · +10 VL"}
          </Button>
          {isOffer && (
            <Button variant="secondary" className="w-full sm:flex-1" onClick={() => onOrder(relay)}>
              Order for pickup
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export default function Offers() {
  const { state, dispatch, broadcastRelay } = useStore();
  const nav = useNavigate();
  const user = currentUser(state);
  const [bleStatus, setBleStatus] = useState("demo");
  const [bleError, setBleError] = useState("");

  async function inject() {
    broadcastRelay(await makePacket("sim"));
  }

  async function connectBle() {
    setBleError("");
    if (!bleSupported()) {
      setBleError("Bluetooth isn’t available in this browser. You can still preview offers here.");
      setBleStatus("demo");
      return;
    }
    try {
      await connectDongle((packet, frameHex) => {
        const parsed = packet.parsed;
        if (parsed?.kind === "offer") {
          broadcastRelay({
            msgId: String(packet.msgId),
            type: "offer",
            merchantId: parsed.merchantId,
            merchantName: parsed.merchantName,
            category: parsed.category,
            discount: parsed.discountPct,
            stationName: parsed.stationName,
            hopCount: packet.hopCount,
            ttl: packet.ttl,
            via: "ble",
            ts: Date.now(),
            frameHex,
          });
        } else if (parsed?.kind === "status") {
          broadcastRelay({
            msgId: String(packet.msgId),
            type: "status",
            stationName: parsed.stationName,
            activeBays: parsed.activeBays,
            totalBays: parsed.totalBays,
            etaMinutes: parsed.etaMin,
            hopCount: packet.hopCount,
            ttl: packet.ttl,
            via: "ble",
            ts: Date.now(),
            frameHex,
          });
        }
      });
      setBleStatus("connected");
    } catch (err) {
      setBleStatus("demo");
      setBleError(err instanceof Error ? err.message : "BLE connect failed");
    }
  }

  async function share(relay) {
    if (relay.ttl <= 0) return;
    try {
      if (relay.frameHex) {
        const hopped = await hopSignedFrame(relay.frameHex);
        dispatch({
          type: "SHARE_HOP",
          payload: {
            msgId: relay.msgId,
            email: user.email,
            frameHex: hopped.frameHex,
            hopCount: hopped.hopCount,
            ttl: hopped.ttl,
          },
        });
        return;
      }
    } catch (err) {
      dispatch({
        type: "TOAST",
        payload: { message: err instanceof Error ? err.message : "Hop failed", tone: "danger" },
      });
      return;
    }
    dispatch({ type: "SHARE_HOP", payload: { msgId: relay.msgId, email: user.email } });
  }

  function order(relay) {
    nav(`/wallet?order=${relay.merchantId}`);
  }

  const relays = state.relays.filter((r) => r.type === "offer" || r.type === "status");
  const creditedIds = new Set(user?.creditedMsgIds || []);

  return (
    <PageIn>
      <div className="pt-6 pb-4">
        <SectionEyebrow>Nearby</SectionEyebrow>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">Offers</h1>
        <p className="text-sm text-muted">Shops around charging hubs reach you through vehicles nearby.</p>
      </div>

      <Card className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${bleStatus === "connected" ? "bg-volt animate-pulse" : "bg-muted"}`} />
          <div>
            <p className="text-sm font-semibold">{bleStatus === "connected" ? "Vehicle connected" : "Listening nearby"}</p>
            <p className="text-xs text-muted">Your phone stays private. The car talks to Thulir — not to shops.</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant={bleStatus === "connected" ? "secondary" : "cyan"}
            className="w-full sm:w-auto"
            onClick={() => {
              if (bleStatus === "connected") {
                setBleStatus("demo");
                return;
              }
              void connectBle();
            }}
          >
            {bleStatus === "connected" ? "Disconnect vehicle" : "Connect vehicle"}
          </Button>
          <Button variant="primary" className="w-full sm:w-auto" onClick={() => void inject()}>
            Preview an offer
          </Button>
        </div>
        {bleError ? <p className="w-full text-xs text-warn mt-2">{bleError}</p> : null}
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mb-10">
        <AnimatePresence mode="popLayout">
          {relays.length === 0 && (
            <div className="md:col-span-2">
              <EmptyState
                title="Nothing nearby yet"
                body="Drive closer to a charging hub, or preview how offers arrive."
                action={
                  <Button variant="primary" onClick={() => void inject()}>
                    Preview an offer
                  </Button>
                }
              />
            </div>
          )}
          {relays.map((r) => (
            <PacketCard
              key={r.msgId}
              relay={r}
              onShare={(r) => void share(r)}
              onOrder={order}
              credited={creditedIds.has(r.msgId)}
            />
          ))}
        </AnimatePresence>
      </div>

      <SectionEyebrow>Partner shops</SectionEyebrow>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        {state.merchants.map((m) => (
          <NavLink key={m.id} to={`/wallet?order=${m.id}`}>
            <Card className="h-full hover:border-volt/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <Pill tone="volt">{m.discount}% off</Pill>
                <span className="text-[10px] text-muted uppercase tracking-wide">{m.category}</span>
              </div>
              <h4 className="font-semibold text-sm">{m.name}</h4>
              <p className="text-xs text-muted mt-1">
                {(() => {
                  const st = state.stations.find((s) => s.id === m.stationId);
                  if (!st) return null;
                  return [st.name, st.address].filter(Boolean).join(" · ");
                })()}
              </p>
            </Card>
          </NavLink>
        ))}
      </div>
    </PageIn>
  );
}
