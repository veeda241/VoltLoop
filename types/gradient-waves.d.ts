declare module "@/src/components/GradientWaves.jsx" {
  import type { ComponentType } from "react";

  const GradientWaves: ComponentType<{
    horizonColor?: string;
    waveColor?: string;
    crestColor?: string;
    speed?: number;
    amplitude?: number;
    waveScale?: number;
    waveRatio?: number;
    swell?: number;
    turbulence?: number;
    tilt?: number;
    zoom?: number;
    height?: number;
    fogDepth?: number;
    detail?: "low" | "medium" | "high";
    brightness?: number;
    opacity?: number;
    mouseInteraction?: boolean;
    parallaxStrength?: number;
    grain?: boolean;
    grainIntensity?: number;
    className?: string;
  }>;

  export default GradientWaves;
}
