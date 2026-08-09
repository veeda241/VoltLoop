import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppShell from "./components/AppShell";
import Toaster from "./components/Toaster";
import RequireRole from "./components/RequireRole";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Legal from "./pages/Legal";

const MapPage = lazy(() => import("./pages/Map"));
const Offers = lazy(() => import("./pages/Offers"));
const Session = lazy(() => import("./pages/Session"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Sim = lazy(() => import("./pages/Sim"));
const Merchant = lazy(() => import("./pages/Merchant"));
const Cpo = lazy(() => import("./pages/Cpo"));

function PageFallback() {
  return <div className="px-4 py-16 text-sm text-muted">Loading…</div>;
}

function AnimatedRoutes() {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={loc} key={loc.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/sim" element={<Sim />} />
        <Route
          path="/map"
          element={
            <RequireRole roles={["driver"]}>
              <MapPage />
            </RequireRole>
          }
        />
        <Route
          path="/offers"
          element={
            <RequireRole roles={["driver"]}>
              <Offers />
            </RequireRole>
          }
        />
        <Route
          path="/session"
          element={
            <RequireRole roles={["driver"]}>
              <Session />
            </RequireRole>
          }
        />
        <Route
          path="/wallet"
          element={
            <RequireRole roles={["driver"]}>
              <Wallet />
            </RequireRole>
          }
        />
        <Route
          path="/merchant"
          element={
            <RequireRole roles={["merchant", "cpo"]}>
              <Merchant />
            </RequireRole>
          }
        />
        <Route
          path="/cpo"
          element={
            <RequireRole roles={["cpo", "merchant"]}>
              <Cpo />
            </RequireRole>
          }
        />
        <Route path="*" element={<Landing />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<PageFallback />}>
          <AnimatedRoutes />
        </Suspense>
      </AppShell>
      <Toaster />
    </BrowserRouter>
  );
}
