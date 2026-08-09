import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, Button, Pill, PageIn, SectionEyebrow, StatBlock } from "../components/ui";
import { useStore, currentUser } from "../state/store";
import { fmtTime, minutesFromNow } from "../lib/format";

export default function Session() {
  const { state, dispatch } = useStore();
  const user = currentUser(state);
  const [stationId, setStationId] = useState(state.stations[0]?.id);
  const [expectedMinutes, setExpectedMinutes] = useState(40);
  const [redeemAmt, setRedeemAmt] = useState(10);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => forceTick((x) => x + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const mySessions = state.sessions
    .filter((s) => s.driverEmail === user.email)
    .sort((a, b) => b.startTime - a.startTime);
  const active = mySessions.find((s) => s.status === "ACTIVE");

  function plugIn(e) {
    e.preventDefault();
    dispatch({
      type: "START_SESSION",
      payload: { email: user.email, stationId, expectedMinutes: Number(expectedMinutes) },
    });
  }

  function complete() {
    dispatch({ type: "COMPLETE_SESSION", payload: { sessionId: active.id } });
  }
  function cancel() {
    dispatch({ type: "CANCEL_SESSION", payload: { sessionId: active.id } });
  }
  function redeem() {
    dispatch({ type: "REDEEM_ON_SESSION", payload: { email: user.email, amount: Number(redeemAmt) } });
  }

  const station = active ? state.stations.find((s) => s.id === active.stationId) : null;
  const remaining = active ? minutesFromNow(active.expectedFinish) : 0;
  const progress = active ? Math.min(100, Math.max(0, 100 - (remaining / active.expectedMinutes) * 100)) : 0;

  return (
    <PageIn className="max-w-2xl">
      <div className="pt-6 pb-4">
        <SectionEyebrow>Charging</SectionEyebrow>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Charge</h1>
      </div>

      {!active ? (
        <Card glow="volt">
          <h2 className="font-semibold mb-4">Start a charge</h2>
          <form onSubmit={plugIn} className="space-y-4">
            <div>
              <label className="text-xs text-muted mb-1.5 block">Station</label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full rounded-xl bg-bg-elev border border-line px-4 py-3 text-sm outline-none focus:border-volt/60"
              >
                {state.stations.map((s) => {
                  const vacant = s.bays - s.occupied;
                  const place = [s.address, s.city].filter(Boolean).join(", ");
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name}{place ? ` · ${place}` : ""} · {vacant} free
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">How long will you stay?</label>
              <input
                type="number"
                min={10}
                max={120}
                value={expectedMinutes}
                onChange={(e) => setExpectedMinutes(e.target.value)}
                className="w-full rounded-xl bg-bg-elev border border-line px-4 py-3 text-sm outline-none focus:border-volt/60"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full">
              Start charging
            </Button>
          </form>
          <p className="text-xs text-muted mt-4 leading-relaxed">
            Sharing your finish time helps other drivers see when a bay will free up. You can apply VL to this charge.
          </p>
        </Card>
      ) : (
        <Card glow="volt">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-semibold text-lg">{station?.name}</h2>
              <p className="text-xs text-muted mt-1">Started {fmtTime(active.startTime)} · expected {fmtTime(active.expectedFinish)}</p>
            </div>
            <Pill tone="volt">Charging</Pill>
          </div>

          <div className="mb-5">
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span>Charging progress</span>
              <span>{remaining}m remaining</span>
            </div>
            <div className="h-2 rounded-full bg-line overflow-hidden">
              <motion.div
                className="h-full bg-volt rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <Button variant="primary" className="flex-1" onClick={complete}>
              Finish charging
            </Button>
            <Button variant="danger" className="flex-1" onClick={cancel}>
              Cancel charge
            </Button>
          </div>

          <div className="border-t border-line pt-5">
            <p className="text-xs text-muted mb-2">Apply VL to this charge</p>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={user.vlBalance}
                value={redeemAmt}
                onChange={(e) => setRedeemAmt(e.target.value)}
                className="flex-1 rounded-xl bg-bg-elev border border-line px-4 py-2.5 text-sm outline-none focus:border-volt/60"
              />
              <Button variant="secondary" onClick={redeem}>
                Apply
              </Button>
            </div>
          </div>
        </Card>
      )}

      {mySessions.length > 0 && (
        <div className="mt-8">
          <SectionEyebrow>Past charges</SectionEyebrow>
          <div className="space-y-2">
            {mySessions.map((s) => {
              const st = state.stations.find((x) => x.id === s.stationId);
              const tone = s.status === "ACTIVE" ? "volt" : s.status === "COMPLETED" ? "cyan" : "danger";
              const label = s.status === "ACTIVE" ? "Charging" : s.status === "COMPLETED" ? "Completed" : "Cancelled";
              return (
                <Card key={s.id} className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-medium">{st?.name}</p>
                    <p className="text-xs text-muted">{fmtTime(s.startTime)} · {s.expectedMinutes} min stay</p>
                  </div>
                  <Pill tone={tone}>{label}</Pill>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </PageIn>
  );
}
