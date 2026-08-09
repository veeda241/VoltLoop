"use client";

import dynamic from "next/dynamic";

const GradientWaves = dynamic(() => import("@/src/components/GradientWaves.jsx"), {
  ssr: false,
});

export function SiteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <GradientWaves
        horizonColor="#0B1A3A"
        waveColor="#4D8DFF"
        crestColor="#E8F4FF"
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
        brightness={1.2}
        opacity={1}
        mouseInteraction
        parallaxStrength={0.5}
        grain
        grainIntensity={0.04}
      />
      <div className="absolute inset-0 bg-[var(--bg)]/15" />
    </div>
  );
}
