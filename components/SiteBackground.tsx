"use client";

import dynamic from "next/dynamic";

const GradientWaves = dynamic(() => import("@/src/components/GradientWaves.jsx"), {
  ssr: false,
});

export function SiteBackground() {
  return (
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
        mouseInteraction
        parallaxStrength={0.5}
        grain
        grainIntensity={0.05}
      />
      <div className="absolute inset-0 bg-[var(--bg)]/15" />
    </div>
  );
}
