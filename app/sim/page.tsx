"use client";

import { useState } from "react";
import { MeshCanvas } from "@/components/MeshCanvas";

export default function SimPage() {
  const [density, setDensity] = useState(8);
  const [inject, setInject] = useState(0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Live mesh</h1>
        <p className="text-sm text-[var(--muted)]">
          Watch offers travel between vehicles around a charging hub. Open Offers in another tab to see them arrive.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          Density
          <input
            type="range"
            min={3}
            max={24}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
          />
          <span className="text-[var(--text)]">{density}</span>
        </label>
        <button
          onClick={() => setInject((n) => n + 1)}
          className="rounded-xl bg-[var(--volt)] px-4 py-2 text-sm font-medium text-[#0a1208]"
        >
          Send an offer
        </button>
        <span className="text-xs text-[var(--muted)]">Offers hop a few vehicles, then fade. Duplicates are ignored.</span>
      </div>

      <MeshCanvas density={density} inject={inject} />

      <ul className="grid gap-2 text-xs text-[var(--muted)] md:grid-cols-3">
        <li className="rounded-xl border border-[var(--line)] p-3">Hub beacon — where offers start</li>
        <li className="rounded-xl border border-[var(--line)] p-3">Bright dot — your vehicle</li>
        <li className="rounded-xl border border-[var(--line)] p-3">Red pulse — duplicate ignored</li>
      </ul>
    </div>
  );
}
