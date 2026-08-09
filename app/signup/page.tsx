"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicle, setVehicle] = useState("Tata Nexon EV");
  const [kwh, setKwh] = useState("40.5");
  const [dpdp, setDpdp] = useState(false);
  const [eula, setEula] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        vehicle_model: vehicle,
        battery_capacity_kwh: Number(kwh),
        dpdp_consent: dpdp,
        eula_accepted: eula,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Signup failed");
      return;
    }
    router.push("/map");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Join VoltLoop to find chargers and earn rewards while you wait.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <Field label="Email" value={email} onChange={setEmail} type="email" />
        <Field label="Password" value={password} onChange={setPassword} type="password" />
        <Field label="Vehicle model" value={vehicle} onChange={setVehicle} type="text" />
        <Field label="Battery capacity (kWh)" value={kwh} onChange={setKwh} type="number" />
        <label className="flex items-start gap-2 text-sm text-[var(--muted)]">
          <input type="checkbox" checked={dpdp} onChange={(e) => setDpdp(e.target.checked)} className="mt-1" />
          I agree that VoltLoop may use my location and charge time to show nearby offers and bay status.
          This data is never sold. I can view or delete it anytime.
        </label>
        <label className="flex items-start gap-2 text-sm text-[var(--muted)]">
          <input type="checkbox" checked={eula} onChange={(e) => setEula(e.target.checked)} className="mt-1" />
          I accept the{" "}
          <Link href="/legal" className="text-[var(--volt)]">
            VoltLoop terms
          </Link>
          : VL is in-app credit only — not cash, not transferable, and not for resale.
        </label>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-[var(--volt)] py-2.5 font-medium text-[#0a1208] disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--muted)]">
        Already have an account? <Link href="/login" className="text-[var(--volt)]">Log in</Link>
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--bg-card)] px-3 py-2 outline-none focus:border-[var(--volt)]"
      />
    </label>
  );
}
