import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Card, Button, PageIn } from "../components/ui";
import { useStore, currentUser } from "../state/store";

const ROLE_HOME = { driver: "/map", merchant: "/merchant", cpo: "/cpo" };

export default function Login() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("driver@voltloop.dev");
  const [password, setPassword] = useState("demo1234");

  const user = currentUser(state);
  useEffect(() => {
    if (user) nav(ROLE_HOME[user.role] || "/map", { replace: true });
  }, [user, nav]);

  function submit(e) {
    e.preventDefault();
    dispatch({ type: "LOGIN", payload: { email, password } });
  }

  return (
    <PageIn className="max-w-md mx-auto pt-8 md:pt-16">
      <Card glow="volt">
        <h1 className="font-display text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-sm text-muted mb-6">Sign in to find chargers, earn VL, and order while you wait.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-muted mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-bg-elev border border-line px-4 py-3 text-base outline-none focus:border-volt/60"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-bg-elev border border-line px-4 py-3 text-base outline-none focus:border-volt/60"
              required
            />
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Sign in
          </Button>
        </form>
        <p className="text-xs text-muted mt-5 text-center">
          No account? <NavLink to="/signup" className="text-volt">Sign up</NavLink>
        </p>
      </Card>
    </PageIn>
  );
}
