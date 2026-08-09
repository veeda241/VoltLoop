import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Card, Pill, PageIn, SectionEyebrow } from "../components/ui";
import MeshCanvas from "../components/MeshCanvas";
import KolamDivider from "../components/KolamDivider";
import { useIsMobile } from "../hooks/useIsMobile";

const FEATURES = [
  {
    title: "Offers that find you",
    body: "Nearby shops reach drivers through vehicles around the hub. No phone numbers, no SMS, no spam.",
    tone: "volt",
    image: "/tn/filter-coffee.jpg",
    alt: "Tamil filter coffee in a traditional davara tumbler",
  },
  {
    title: "Rewards you can spend",
    body: "Pass an offer along and you earn VL. Use it on charging or at partner stores — not as cash.",
    tone: "cyan",
    image: "/tn/kolam.jpg",
    alt: "Traditional Tamil kolam at a doorway",
  },
  {
    title: "Bays you can trust",
    body: "Drivers share when they’ll unplug. Others see when a bay is likely free — before they detour.",
    tone: "warn",
    image: "/tn/tiruchendur-coast.jpg",
    alt: "Sunrise on the Tiruchendur coast in Thoothukudi district",
  },
];

const STEPS = [
  [
    "Find a charger",
    "/map",
    "See nearby hubs, distance, and how soon a bay opens.",
    "/tn/kapaleeshwarar.jpg",
    "Kapaleeshwarar Temple gopuram in Chennai",
  ],
  [
    "Start charging",
    "/session",
    "Plug in and share how long you’ll stay.",
    "/tn/thanjavur.jpg",
    "Brihadisvara Temple in Thanjavur",
  ],
  [
    "Catch nearby offers",
    "/offers",
    "Cafés and shops around the hub reach you while you wait.",
    "/tn/dosa.jpg",
    "Masala dosa with chutney and sambar",
  ],
  [
    "Pass it on, earn VL",
    "/offers",
    "Share an offer with the next vehicle and earn rewards.",
    "/tn/pamban.jpg",
    "Train crossing the Pamban Bridge toward Rameswaram",
  ],
  [
    "Order while you wait",
    "/wallet",
    "Food, coffee, or a quick service — ready before you unplug.",
    "/tn/idli.jpg",
    "Idli and sambar ready for pickup",
  ],
  [
    "Run the station",
    "/cpo",
    "Occupancy, offer reach, and spend attributed to each hub.",
    "/tn/tiruchendur.jpg",
    "Tiruchendur Murugan Temple in Thoothukudi district",
  ],
];

export default function Landing() {
  const isMobile = useIsMobile();

  return (
    <PageIn className="min-w-0 w-full overflow-x-hidden">
      <section className="relative flex flex-col justify-center pt-4 pb-6 md:min-h-[calc(100dvh-5rem)] md:pt-14 md:pb-10">
        <div className="grid min-w-0 lg:grid-cols-[1.05fr_1fr] gap-5 md:gap-8 xl:gap-16 items-center">
          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Pill tone="gold">Thoothukudi</Pill>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display mt-3 text-[1.65rem] font-extrabold leading-snug tracking-tight break-words sm:mt-5 sm:text-5xl sm:leading-[0.98] sm:text-balance lg:text-7xl xl:text-8xl"
            >
              The charging cable is <span className="text-volt">collateral.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-muted mt-3 sm:mt-6 text-sm md:text-xl max-w-2xl leading-relaxed"
            >
              {isMobile
                ? "Those 30–45 minutes at the charger become nearby offers, honest bay status, and rewards you spend before you unplug."
                : "Those 30–45 minutes at the charger are guaranteed local time along the Tuticorin coast. Thulir turns them into nearby offers, honest bay status, and rewards you actually spend before you unplug."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 mt-5 sm:mt-8"
            >
              <Button as={NavLink} to="/map" variant="primary" className="w-full sm:w-auto">
                Find a charger
              </Button>
              <Button as={NavLink} to="/sim" variant="secondary" className="w-full sm:w-auto">
                See the live mesh
              </Button>
              <Button as={NavLink} to="/legal" variant="ghost" className="hidden sm:inline-flex">
                Privacy &amp; terms
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0"
          >
            <Card className="p-0 overflow-hidden" glow="volt">
              <div className="px-3 pt-3 md:px-5 md:pt-5 flex items-center justify-between gap-2 min-w-0">
                <SectionEyebrow className="mb-0 truncate">Around the hub</SectionEyebrow>
                <Pill tone="volt" className="shrink-0">Live mesh</Pill>
              </div>
              <MeshCanvas density={isMobile ? 6 : 12} height={isMobile ? 150 : 420} />
              <div className="px-3 pb-3 pt-1 md:px-5 md:pb-5 text-[11px] md:text-xs text-muted">
                Teal lines are offers reaching the next vehicle. The brighter dot is you.
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <KolamDivider className="py-2 md:py-6" />

      <section className="py-8 md:py-28 lg:py-32 min-w-0">
        <SectionEyebrow className="mb-3">Why Thulir</SectionEyebrow>
        <h2 className="font-display text-[1.65rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mt-1 mb-6 md:mb-14 max-w-4xl leading-snug break-words">
          Charge time, spent well.
        </h2>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card className="h-full overflow-hidden p-0">
                <img src={f.image} alt={f.alt} className="h-36 w-full object-cover md:h-52" />
                <div className="p-4 md:p-8">
                  <div
                    className={`mb-5 grid h-11 w-11 place-items-center rounded-xl md:h-12 md:w-12 ${
                      f.tone === "volt"
                        ? "bg-volt/15 text-volt"
                        : f.tone === "cyan"
                          ? "bg-cyan/15 text-cyan"
                          : "bg-warn/15 text-warn"
                    }`}
                  >
                    <span className="font-mono-tight text-sm font-bold md:text-base">{i + 1}</span>
                  </div>
                  <h3 className="mb-1.5 text-lg font-semibold text-text md:text-2xl">{f.title}</h3>
                  <p className="text-sm md:text-base leading-relaxed text-muted">{f.body}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <KolamDivider className="py-2 md:py-6" />

      <section className="py-8 md:py-28 lg:py-32 min-w-0">
        <SectionEyebrow className="mb-3">How it works</SectionEyebrow>
        <h2 className="font-display text-[1.65rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mt-1 mb-6 md:mb-14 leading-snug break-words">
          From plug-in to pickup.
        </h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map(([title, to, body, image, alt], i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <NavLink to={to} className="block h-full">
                <Card className="group h-full overflow-hidden p-0 transition-colors hover:border-volt/40">
                  <img src={image} alt={alt} className="h-32 w-full object-cover md:h-44" />
                  <div className="p-4 md:p-8">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono-tight text-sm font-semibold text-cyan">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm text-muted transition-colors group-hover:text-volt">Open</span>
                    </div>
                    <h3 className="mb-1.5 text-lg font-semibold md:text-2xl">{title}</h3>
                    <p className="text-sm md:text-base leading-relaxed text-muted">{body}</p>
                  </div>
                </Card>
              </NavLink>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="py-8 md:py-12 border-t border-line/70 mt-4 md:mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm text-muted max-w-xl leading-relaxed">
          Made for the Tamil Nadu EV corridor, starting in Thoothukudi. VL is in-app credit for charging
          and partner stores — not cash, not withdrawable, not transferable.
        </p>
        <div className="flex gap-4 text-sm text-muted">
          <NavLink to="/legal" className="hover:text-text">Privacy &amp; terms</NavLink>
          <NavLink to="/login" className="hover:text-text">Sign in</NavLink>
        </div>
      </footer>
    </PageIn>
  );
}
