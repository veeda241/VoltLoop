"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSessions, useStations, useUser, useWallet } from "@/lib/hooks";

function SessionInner() {
  const params = useSearchParams();
  const preselect = params.get("station");
  const { user } = useUser();
  const { stations } = useStations();
  const { sessions, refresh } = useSessions();
  const { balance, refresh: refreshWallet } = useWallet();
  const [stationId, setStationId] = useState(preselect || "");
  const [minutes, setMinutes] = useState(40);
  const [redeem, setRedeem] = useState(0);
  const [msg, setMsg] = useState("");

  const active = useMemo(() => sessions.find((s) => s.status === "ACTIVE"), [sessions]);
  const activeStation = stations.find((s) => s.id === active?.station_id);

  async function start() {
    setMsg("");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ station_id: stationId || stations[0]?.id, minutes }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Could not start");
      return;
    }
    await refresh();
    setMsg("Session started. Others approaching this station will see your time remaining.");
  }

  async function end(status: "COMPLETED" | "CANCELLED") {
    if (!active) return;
    await fetch(`/api/sessions/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await refresh();
    setMsg(status === "COMPLETED" ? "Session completed." : "Session cancelled.");
  }

  async function redeemOnCharge() {
    if (!active || redeem <= 0) return;
    const res = await fetch("/api/tokens/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: redeem,
        type: "REDEEMED_CHARGING",
        reference_id: active.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Redeem failed");
      return;
    }
    await refreshWallet();
    setMsg(`Redeemed ${redeem} VL against this charging session. New balance ${data.balance}.`);
  }

  if (user === undefined) return null;
  if (!user) {
    return <p className="text-[var(--muted)]">Sign in as a driver to start charging.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Charge</h1>
        <p className="text-sm text-[var(--muted)]">
          Share how long you’ll stay so nearby drivers can see when a bay frees up. Apply VL to this charge.
        </p>
      </div>

      {active ? (
        <div className="rounded-2xl border border-[var(--volt)] bg-[var(--bg-card)] p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Active</p>
          <h2 className="mt-1 text-lg font-semibold">{activeStation?.name ?? "Station"}</h2>
          <p className="text-sm text-[var(--muted)]">
            Started {new Date(active.started_at).toLocaleTimeString()} · expected finish{" "}
            {new Date(active.expected_finish_at).toLocaleTimeString()}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => void end("COMPLETED")}
              className="rounded-xl bg-[var(--volt)] px-4 py-2 text-sm font-medium text-[#0a1208]"
            >
              Finish charging
            </button>
            <button
              onClick={() => void end("CANCELLED")}
              className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm"
            >
              Cancel charge
            </button>
          </div>
          <div className="mt-5 border-t border-[var(--line)] pt-4">
            <p className="text-sm">
              Wallet: <span className="text-[var(--volt)]">{balance.toFixed(0)} VL</span>
            </p>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                min={0}
                max={balance}
                value={redeem}
                onChange={(e) => setRedeem(Number(e.target.value))}
                className="w-28 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
              />
              <button
                onClick={() => void redeemOnCharge()}
                className="rounded-xl border border-[var(--volt)] px-4 py-2 text-sm text-[var(--volt)]"
              >
                Redeem on session
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-5">
          <label className="block text-sm text-[var(--muted)]">Station</label>
          <select
            value={stationId || stations[0]?.id || ""}
            onChange={(e) => setStationId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg-card)] px-3 py-2"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.vacant} free)
              </option>
            ))}
          </select>
          <label className="mt-4 block text-sm text-[var(--muted)]">Expected minutes remaining</label>
          <input
            type="number"
            min={10}
            max={120}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg-card)] px-3 py-2"
          />
          <button
            onClick={() => void start()}
            className="mt-4 rounded-xl bg-[var(--volt)] px-4 py-2 font-medium text-[#0a1208]"
          >
            Plug in & log finish time
          </button>
        </div>
      )}

      {msg ? <p className="text-sm text-[var(--cyan)]">{msg}</p> : null}

      <div>
        <h2 className="mb-2 font-semibold">History</h2>
        <ul className="space-y-2 text-sm">
          {sessions.map((s) => (
            <li key={s.id} className="rounded-xl border border-[var(--line)] px-3 py-2 text-[var(--muted)]">
              {s.status} · {stations.find((st) => st.id === s.station_id)?.name} ·{" "}
              {new Date(s.started_at).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Loading session…</p>}>
      <SessionInner />
    </Suspense>
  );
}
