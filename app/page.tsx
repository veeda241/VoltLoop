import Link from "next/link";
import { ArrowRight, Radio, Shield, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16 md:space-y-24">
      <section className="grid min-h-[calc(100vh-8rem)] gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--volt)]">
            Now live in Thoothukudi
          </p>
          <h1 className="text-5xl font-semibold leading-[0.98] tracking-tight md:text-7xl">
            The charging cable is collateral.
            <span className="mt-3 block text-2xl font-medium text-[var(--muted)] md:text-3xl">
              Charge time, spent well.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg text-[var(--muted)]">
            Those 30–45 minutes at the charger are guaranteed local time. Thulir turns them into nearby
            offers, honest bay status, and rewards you actually spend before you unplug.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--volt)] px-5 py-2.5 font-medium text-[#0a1208]"
            >
              Find a charger <ArrowRight size={16} />
            </Link>
            <Link
              href="/sim"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-5 py-2.5 text-[var(--text)]"
            >
              See the live mesh
            </Link>
            <Link href="/legal" className="inline-flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--muted)]">
              Privacy & terms
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-6 md:p-8">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">For drivers, shops, and stations</p>
          <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <li>Find a bay before you detour.</li>
            <li>Earn VL by passing nearby offers along.</li>
            <li>Spend rewards on charging or partner stores.</li>
          </ul>
          <Link href="/login" className="mt-6 inline-block text-sm font-medium text-[var(--volt)]">
            Sign in →
          </Link>
        </div>
      </section>

      <section className="space-y-10 md:space-y-14">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cyan)] md:text-base">
            Why Thulir
          </p>
          <h2 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Charge time, spent well.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          <Card icon={<Radio className="text-[var(--volt)]" size={28} />} title="Offers that find you">
            Nearby shops reach drivers through vehicles around the hub. No phone numbers, no SMS, no spam.
          </Card>
          <Card icon={<Zap className="text-[var(--cyan)]" size={28} />} title="Rewards you can spend">
            Pass an offer along and you earn VL. Use it on charging or at partner stores — not as cash.
          </Card>
          <Card icon={<Shield className="text-[var(--warn)]" size={28} />} title="Bays you can trust">
            Drivers share when they’ll unplug. Others see when a bay is likely free — before they detour.
          </Card>
        </div>
      </section>

      <p className="text-sm text-[var(--muted)]">
        VL is in-app credit for charging and partner stores. It is not cash, cannot be withdrawn, and is not transferable.
      </p>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-8 md:p-10 lg:p-12">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-semibold md:text-2xl">{title}</h3>
      <p className="mt-3 text-base leading-relaxed text-[var(--muted)] md:text-lg">{children}</p>
    </div>
  );
}
