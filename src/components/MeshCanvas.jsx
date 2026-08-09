import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const COLORS = {
  volt: "#c8f542",
  cyan: "#7dd3fc",
  muted: "#475569",
  danger: "#ff6b6b",
  line: "#1e293b",
  text: "#e8eef8",
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Interactive/ambient canvas mesh: vehicles travel along a road toward an RSU beacon.
 * Call ref.injectPulse() to animate a packet hop chain (lime = delivered, red = suppressed dup).
 */
const MeshCanvas = forwardRef(function MeshCanvas(
  { density = 8, interactive = false, height = 320, onHop },
  ref
) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ vehicles: [], pulses: [], hops: [], w: 0, h: 0, beacon: { x: 0, y: 0 } });
  const rafRef = useRef(null);

  function buildVehicles(n, w, h) {
    const laneY = [h * 0.35, h * 0.5, h * 0.65];
    const vehicles = [];
    for (let i = 0; i < n; i++) {
      vehicles.push({
        id: i,
        x: rand(0, w),
        y: laneY[i % laneY.length] + rand(-8, 8),
        speed: rand(0.25, 0.7) * (i % 2 === 0 ? 1 : -1),
        isYou: i === 0,
        r: i === 0 ? 6 : 4,
      });
    }
    return vehicles;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const w = parent.clientWidth;
      const h = height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      stateRef.current.w = w;
      stateRef.current.h = h;
      stateRef.current.beacon = { x: w * 0.82, y: h * 0.5 };
      stateRef.current.vehicles = buildVehicles(density, w, h);
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function draw() {
      const st = stateRef.current;
      const { w, h, vehicles, beacon } = st;
      ctx.clearRect(0, 0, w, h);

      // road band
      ctx.fillStyle = "rgba(30,41,59,0.45)";
      ctx.fillRect(0, h * 0.28, w, h * 0.46);
      ctx.strokeStyle = "rgba(138,163,150,0.15)";
      ctx.setLineDash([8, 10]);
      for (const ly of [h * 0.42, h * 0.58]) {
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(w, ly);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // beacon
      const beaconPulse = (Math.sin(Date.now() / 500) + 1) / 2;
      ctx.beginPath();
      ctx.arc(beacon.x, beacon.y, 18 + beaconPulse * 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(62,224,192,${0.35 - beaconPulse * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(beacon.x, beacon.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.cyan;
      ctx.fill();

      // vehicles
      for (const v of vehicles) {
        v.x += v.speed;
        if (v.x > w + 10) v.x = -10;
        if (v.x < -10) v.x = w + 10;

        ctx.beginPath();
        ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
        ctx.fillStyle = v.isYou ? COLORS.volt : COLORS.muted;
        ctx.fill();
        if (v.isYou) {
          ctx.beginPath();
          ctx.arc(v.x, v.y, v.r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(200,245,66,0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // hop chains
      st.hops = st.hops.filter((hop) => hop.life > 0);
      for (const hop of st.hops) {
        const t = 1 - hop.life / hop.maxLife;
        ctx.beginPath();
        ctx.moveTo(hop.from.x, hop.from.y);
        const midX = hop.from.x + (hop.to.x - hop.from.x) * t;
        const midY = hop.from.y + (hop.to.y - hop.from.y) * t;
        ctx.lineTo(midX, midY);
        ctx.strokeStyle = hop.suppressed ? COLORS.danger : COLORS.volt;
        ctx.lineWidth = 2;
        ctx.globalAlpha = hop.life / hop.maxLife;
        ctx.stroke();
        ctx.globalAlpha = 1;
        hop.life -= 1;
      }

      // pulses (ring bursts)
      st.pulses = st.pulses.filter((p) => p.life > 0);
      for (const p of st.pulses) {
        const t = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + t * 22, 0, Math.PI * 2);
        ctx.strokeStyle = p.suppressed ? COLORS.danger : COLORS.volt;
        ctx.globalAlpha = 1 - t;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
        p.life -= 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useImperativeHandle(ref, () => ({
    injectPulse(opts = {}) {
      const st = stateRef.current;
      const { vehicles, beacon } = st;
      if (!vehicles.length) return;
      const suppressed = opts.suppressed ?? Math.random() < 0.15;
      // pick up to 3 hops: beacon -> v1 -> v2 -> v3
      const sorted = [...vehicles].sort(
        (a, b) => Math.hypot(a.x - beacon.x, a.y - beacon.y) - Math.hypot(b.x - beacon.x, b.y - beacon.y)
      );
      const chain = [beacon, ...sorted.slice(0, 3)];
      let delay = 0;
      chain.forEach((node, i) => {
        if (i === chain.length - 1) return;
        setTimeout(() => {
          const from = chain[i];
          const to = chain[i + 1];
          const isSuppressedHop = suppressed && i === chain.length - 2;
          st.hops.push({ from, to, life: 22, maxLife: 22, suppressed: isSuppressedHop });
          st.pulses.push({ x: to.x, y: to.y, life: 24, maxLife: 24, suppressed: isSuppressedHop });
          onHop && onHop({ hopIndex: i, suppressed: isSuppressedHop, isLast: i === chain.length - 2 });
        }, delay);
        delay += rand(120, 260);
      });
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className={`w-full block rounded-2xl ${interactive ? "cursor-crosshair" : ""}`}
      style={{ height }}
    />
  );
});

export default MeshCanvas;
