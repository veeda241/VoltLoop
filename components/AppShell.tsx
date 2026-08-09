"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks";
import {
  Bolt,
  LayoutDashboard,
  MapPin,
  Radio,
  Store,
  Wallet,
  Zap,
} from "lucide-react";
import { SiteBackground } from "@/components/SiteBackground";

const DRIVER_LINKS = [
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/offers", label: "Offers", icon: Radio },
  { href: "/session", label: "Charge", icon: Zap },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

const EXTRA_LINKS = [
  { href: "/merchant", label: "Orders", icon: Store, roles: ["merchant", "admin", "cpo"] },
  { href: "/cpo", label: "Stations", icon: LayoutDashboard, roles: ["cpo", "admin", "merchant"] },
  { href: "/sim", label: "Mesh", icon: Radio, roles: ["driver", "merchant", "cpo", "admin"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user } = useUser();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <SiteBackground />
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] backdrop-blur-md">
        <div
          className={`mx-auto flex w-full items-center justify-between gap-4 py-3 ${
            path === "/" ? "max-w-[1680px] px-6 md:px-10 lg:px-16" : path === "/map" ? "max-w-none px-4" : "max-w-6xl px-4"
          }`}
        >
          <Link href="/" className="flex items-center gap-3 font-extrabold tracking-tight text-2xl md:text-3xl">
            <span className="grid h-10 w-10 md:h-11 md:w-11 place-items-center rounded-xl bg-[var(--volt)] text-[#0a1208]">
              <Bolt size={22} />
            </span>
            VoltLoop
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {DRIVER_LINKS.map((l) => (
              <NavLink key={l.href} href={l.href} active={path.startsWith(l.href)} icon={l.icon}>
                {l.label}
              </NavLink>
            ))}
            {EXTRA_LINKS.filter((l) => !user || l.roles.includes(user.role)).map((l) => (
              <NavLink key={l.href} href={l.href} active={path.startsWith(l.href)} icon={l.icon}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            {user === undefined ? null : user ? (
              <>
                <span className="hidden text-[var(--muted)] sm:inline">{user.email}</span>
                <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--volt)]">
                  {user.token_balance.toFixed(0)} VL
                </span>
                <button
                  onClick={() => void logout()}
                  className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-[var(--muted)] hover:text-white"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-1.5 text-[var(--muted)] hover:text-white">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-[var(--volt)] px-3 py-1.5 font-medium text-[#0a1208]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-[var(--line)] px-2 py-2 md:hidden">
          {DRIVER_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                path.startsWith(l.href) ? "bg-[var(--volt)] text-[#0a1208]" : "text-[var(--muted)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/sim" className="whitespace-nowrap rounded-full px-3 py-1 text-xs text-[var(--muted)]">
            Sim
          </Link>
        </div>
      </header>
      <main
        className={`relative z-10 mx-auto w-full flex-1 ${
          path === "/"
            ? "max-w-[1680px] px-6 py-10 md:px-10 lg:px-16 md:py-14"
            : path === "/map"
              ? "max-w-none px-0 py-0"
              : "max-w-6xl px-4 py-6"
        }`}
      >
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ${
        active ? "bg-[var(--bg-card)] text-[var(--volt)]" : "text-[var(--muted)] hover:text-white"
      }`}
    >
      <Icon size={14} />
      {children}
    </Link>
  );
}
