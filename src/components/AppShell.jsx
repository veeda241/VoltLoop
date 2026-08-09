import React, { useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Logo, TokenChip, Button } from "./ui";
import { useStore, currentUser } from "../state/store";
import GradientWaves from "./GradientWaves";
import PillNav from "./PillNav";

const DRIVER_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Map", href: "/map" },
  { label: "Offers", href: "/offers" },
  { label: "Charge", href: "/session" },
  { label: "Wallet", href: "/wallet" },
  { label: "Mesh", href: "/sim" },
];

const GUEST_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Map", href: "/map" },
  { label: "Mesh", href: "/sim" },
  { label: "Legal", href: "/legal" },
];

const MERCHANT_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Orders", href: "/merchant" },
  { label: "Mesh", href: "/sim" },
];

const CPO_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Stations", href: "/cpo" },
  { label: "Mesh", href: "/sim" },
];

export default function AppShell({ children }) {
  const { state, dispatch } = useStore();
  const user = currentUser(state);
  const nav = useNavigate();
  const loc = useLocation();
  const isLanding = loc.pathname === "/";
  const isMap = loc.pathname === "/map";

  const items = useMemo(() => {
    if (!user) return GUEST_ITEMS;
    if (user.role === "merchant") return MERCHANT_ITEMS;
    if (user.role === "cpo") return CPO_ITEMS;
    return DRIVER_ITEMS;
  }, [user]);

  function logout() {
    dispatch({ type: "LOGOUT" });
    nav("/");
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <GradientWaves
          horizonColor="#1A0C08"
          waveColor="#C45C26"
          crestColor="#F0D9A0"
          speed={0.4}
          amplitude={2.8}
          waveScale={0.65}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1}
          height={5.5}
          fogDepth={18}
          detail="medium"
          brightness={1.15}
          opacity={1}
          mouseInteraction={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={0.05}
        />
        <div className="absolute inset-0 bg-bg/20" />
      </div>

      <header className="sticky top-0 z-50">
        <div
          className={`mx-auto items-center gap-3 md:gap-4 ${
            isLanding
              ? "flex max-w-[1680px] justify-between px-6 py-3 md:px-10 md:py-4 lg:px-16"
              : isMap
                ? "grid max-w-none grid-cols-[1fr_auto_1fr] px-3 py-3 md:px-4"
                : "grid max-w-6xl grid-cols-[1fr_auto_1fr] px-4 py-3 md:px-6 md:py-4"
          }`}
        >
          <NavLink to="/" className="justify-self-start shrink-0">
            <Logo />
          </NavLink>

          {!isLanding && (
            <div className="justify-self-center">
              <PillNav
                hideLogo
                logo="/logo-mark.svg"
                logoAlt="Thulir"
                items={items}
                activeHref={loc.pathname}
                ease="power2.easeOut"
                baseColor="#E8B84A"
                pillColor="#FFF8EE"
                hoveredPillTextColor="#FFF8EE"
                pillTextColor="#1A0C08"
                initialLoadAnimation
              />
            </div>
          )}

          <div className="flex shrink-0 items-center justify-end gap-2 justify-self-end md:gap-3">
            {user ? (
              <>
                {user.role === "driver" && <TokenChip balance={user.vlBalance ?? 0} />}
                <span className="hidden lg:inline text-xs text-muted font-mono-tight">{user.email}</span>
                <Button variant="ghost" className="px-3 py-2" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button as={NavLink} to="/login" variant="ghost" className="px-3 py-2">
                  Log in
                </Button>
                <Button as={NavLink} to="/signup" variant="primary" className="px-4 py-2">
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className={`relative z-10 flex-1 w-full mx-auto ${
          isLanding
            ? "max-w-[1680px] px-6 md:px-10 lg:px-16 pb-16 md:pb-20"
            : isMap
              ? "max-w-none px-0 pb-0 min-h-0"
              : "max-w-6xl px-4 md:px-6 pb-10"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
