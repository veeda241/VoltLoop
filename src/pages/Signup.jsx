import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Card, Button, PageIn } from "../components/ui";
import { useStore, currentUser } from "../state/store";

const ROLE_HOME = { driver: "/map", merchant: "/merchant", cpo: "/cpo" };

export default function Signup() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("driver");
  const [vehicleModel, setVehicleModel] = useState("Tata Nexon EV");
  const [batteryKWh, setBatteryKWh] = useState(40.5);
  const [dpdp, setDpdp] = useState(false);
  const [eula, setEula] = useState(false);

  const user = currentUser(state);
  useEffect(() => {
    if (user) nav(ROLE_HOME[user.role] || "/map", { replace: true });
  }, [user, nav]);

  function submit(e) {
    e.preventDefault();
    if (!dpdp || !eula) return;
    dispatch({
      type: "SIGNUP",
      payload: { email, password, role, vehicleModel, batteryKWh: Number(batteryKWh) },
    });
  }

  return (
    <PageIn className="max-w-md mx-auto py-12">
      <Card glow="cyan">
        <h1 className="font-display text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-sm text-muted mb-6">Join Thulir to find chargers and earn rewards while you wait.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-muted mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-bg-elev border border-line px-4 py-3 text-sm outline-none focus:border-volt/60"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-bg-elev border border-line px-4 py-3 text-sm outline-none focus:border-volt/60"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["driver", "Driver"],
                ["merchant", "Merchant"],
                ["cpo", "Operator"],
              ].map(([r, label]) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                    role === r ? "border-volt/60 bg-volt/10 text-volt" : "border-line text-muted hover:text-text"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {role === "driver" && (
            <>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Vehicle model</label>
                <input
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full rounded-xl bg-bg-elev border border-line px-4 py-3 text-sm outline-none focus:border-volt/60"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1.5 block">Battery capacity (kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  value={batteryKWh}
                  onChange={(e) => setBatteryKWh(e.target.value)}
                  className="w-full rounded-xl bg-bg-elev border border-line px-4 py-3 text-sm outline-none focus:border-volt/60"
                />
              </div>
            </>
          )}

          <label className="flex gap-3 items-start text-xs text-muted cursor-pointer">
            <input type="checkbox" checked={dpdp} onChange={(e) => setDpdp(e.target.checked)} className="mt-0.5 accent-[#c8f542]" />
            <span>
              I agree that Thulir may use my location and charge time to show nearby offers and bay status.
              This data is never sold. I can view or delete it anytime.
            </span>
          </label>
          <label className="flex gap-3 items-start text-xs text-muted cursor-pointer">
            <input type="checkbox" checked={eula} onChange={(e) => setEula(e.target.checked)} className="mt-0.5 accent-[#c8f542]" />
            <span>
              I accept the <NavLink to="/legal" className="text-text underline underline-offset-2">Thulir terms</NavLink>:
              VL is in-app credit only — not cash, not transferable, and not for resale.
            </span>
          </label>

          <Button type="submit" variant="primary" className="w-full" disabled={!dpdp || !eula}>
            Create account
          </Button>
        </form>
        <p className="text-xs text-muted mt-5 text-center">
          Already have an account? <NavLink to="/login" className="text-volt">Log in</NavLink>
        </p>
      </Card>
    </PageIn>
  );
}
