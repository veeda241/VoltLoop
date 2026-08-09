"use client";

import { useEffect, useRef } from "react";
import {
  MSG_MERCHANT_OFFER,
  MSG_STATION_STATUS,
  StormSuppressor,
  buildUnsigned,
  decodePacket,
  encodeFrame,
  fromHex,
  hopFrame,
  rotatingOriginId,
  signFrame,
  toHex,
  type DecodedPacket,
  type FramePayload,
} from "@protocol/index";
import { keyFromSecret } from "@protocol/hmac";
import { DEFAULT_HMAC_SECRET } from "@/lib/hmac-key";
import { getBus, publish } from "@/lib/protocol-bus";

type SimNode = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: "rsu" | "vehicle";
  storm: StormSuppressor;
  flashes: { life: number; color: string }[];
};

type FlyingHop = {
  from: SimNode;
  to: SimNode;
  t: number;
  suppress: boolean;
};

const RANGE = 110;
const EGO_INDEX = 1;
const KEY = keyFromSecret(DEFAULT_HMAC_SECRET);

export function MeshCanvas({ density, inject }: { density: number; inject: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const hopsRef = useRef<FlyingHop[]>([]);
  const densityRef = useRef(density);
  const originIdRef = useRef(rotatingOriginId());
  const injectSeen = useRef(0);

  densityRef.current = density;

  useEffect(() => {
    if (inject === injectSeen.current) return;
    injectSeen.current = inject;
    if (inject === 0) return;
    void broadcastFromRsu(inject % 2 === 0 ? MSG_MERCHANT_OFFER : MSG_STATION_STATUS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inject]);

  useEffect(() => {
    const bus = getBus();
    const onShare = (ev: MessageEvent) => {
      const data = ev.data as { type?: string; frameHex?: string };
      if (data?.type !== "share" || !data.frameHex) return;
      const ego = nodesRef.current[EGO_INDEX];
      if (!ego) return;
      void relayFromNode(ego, data.frameHex, false);
    };
    bus?.addEventListener("message", onShare);
    return () => bus?.removeEventListener("message", onShare);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    seedNodes(canvas.clientWidth, canvas.clientHeight, densityRef.current, nodesRef);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(canvas, dt, densityRef.current, nodesRef.current, hopsRef);
      draw(ctx, canvas, nodesRef.current, hopsRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  async function broadcastFromRsu(msgType: typeof MSG_MERCHANT_OFFER | typeof MSG_STATION_STATUS) {
    const rsu = nodesRef.current.find((n) => n.kind === "rsu");
    if (!rsu) return;
    const payload: FramePayload =
      msgType === MSG_MERCHANT_OFFER
        ? {
            kind: "offer",
            merchantName: "Dwell Time Dosa",
            category: "Restaurant",
            discountPct: 20,
            stationName: "Harbour Expressway Charging Plaza",
            merchantId: "f2222222-2222-4222-8222-222222222222",
          }
        : {
            kind: "status",
            stationName: "Harbour Expressway Charging Plaza",
            totalBays: 8,
            activeBays: 5,
            etaMin: 28,
          };
    const built = buildUnsigned({
      msgType,
      originId: originIdRef.current,
      payload,
      hopCount: 0,
      ttl: 3,
    });
    const signed = await signFrame(built, KEY);
    fanout(rsu, { ...signed, parsed: payload }, toHex(encodeFrame(signed)));
  }

  async function relayFromNode(node: SimNode, frameHex: string, notifyEgo: boolean) {
    const frame = decodePacket(fromHex(frameHex));
    if (!frame) return;
    const next = hopFrame(frame);
    if (!next) return;
    const signed = await signFrame(next, KEY);
    const packet: DecodedPacket = { ...signed, parsed: frame.parsed };
    fanout(node, packet, toHex(encodeFrame(signed)), notifyEgo);
  }

  function fanout(from: SimNode, packet: DecodedPacket, frameHex: string, notifyEgo = true) {
    for (const other of nodesRef.current) {
      if (other === from) continue;
      if (Math.hypot(from.x - other.x, from.y - other.y) > RANGE) continue;
      const decision = other.storm.observe(packet.msgId);
      hopsRef.current.push({ from, to: other, t: 0, suppress: decision.suppress });
      other.flashes.push({ life: 1, color: decision.suppress ? "#ff6b6b" : "#c8f542" });
      if (!decision.suppress && notifyEgo && other === nodesRef.current[EGO_INDEX]) {
        publish({ type: "packet", packet, frameHex, via: "sim" });
      }
      if (!decision.suppress && packet.ttl > 1 && other.kind === "vehicle") {
        window.setTimeout(() => {
          if (other.storm.observe(packet.msgId).suppress) return;
          void relayFromNode(other, frameHex, true);
        }, decision.jitterMs);
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="h-[480px] w-full rounded-2xl border border-[var(--line)] bg-[#050807]"
    />
  );
}

function seedNodes(w: number, h: number, density: number, nodesRef: { current: SimNode[] }) {
  const count = Math.max(3, density);
  const nodes: SimNode[] = [
    { id: 0, x: w * 0.18, y: h * 0.5, vx: 0, vy: 0, kind: "rsu", storm: new StormSuppressor(), flashes: [] },
  ];
  for (let i = 1; i < count; i++) {
    nodes.push({
      id: i,
      x: w * (0.3 + Math.random() * 0.65),
      y: h * (0.15 + Math.random() * 0.7),
      vx: (Math.random() * 40 + 20) * (Math.random() < 0.5 ? -1 : 1),
      vy: (Math.random() - 0.5) * 18,
      kind: "vehicle",
      storm: new StormSuppressor(),
      flashes: [],
    });
  }
  nodesRef.current = nodes;
}

function step(
  canvas: HTMLCanvasElement,
  dt: number,
  density: number,
  nodes: SimNode[],
  hopsRef: { current: FlyingHop[] },
) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  while (nodes.length < density) {
    nodes.push({
      id: nodes.length,
      x: w * 0.4 + Math.random() * w * 0.5,
      y: Math.random() * h,
      vx: 30,
      vy: 0,
      kind: "vehicle",
      storm: new StormSuppressor(),
      flashes: [],
    });
  }
  while (nodes.length > Math.max(2, density) && nodes[nodes.length - 1].kind === "vehicle") {
    nodes.pop();
  }
  for (const n of nodes) {
    if (n.kind === "rsu") continue;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    if (n.x < 40 || n.x > w - 20) n.vx *= -1;
    if (n.y < 20 || n.y > h - 20) n.vy *= -1;
    n.flashes = n.flashes.filter((f) => {
      f.life -= dt * 1.8;
      return f.life > 0;
    });
  }
  hopsRef.current = hopsRef.current.filter((hop) => {
    hop.t += dt * 2.2;
    return hop.t < 1;
  });
}

function draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, nodes: SimNode[], hops: FlyingHop[]) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#08110d";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#1a2a22";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);
  ctx.lineTo(w, h * 0.5);
  ctx.stroke();

  for (const n of nodes) {
    ctx.beginPath();
    ctx.strokeStyle = n.kind === "rsu" ? "rgba(62,224,192,0.25)" : "rgba(200,245,66,0.12)";
    ctx.lineWidth = 1;
    ctx.arc(n.x, n.y, RANGE, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const hop of hops) {
    const x = hop.from.x + (hop.to.x - hop.from.x) * hop.t;
    const y = hop.from.y + (hop.to.y - hop.from.y) * hop.t;
    ctx.fillStyle = hop.suppress ? "#ff6b6b" : "#c8f542";
    ctx.beginPath();
    ctx.arc(x, y, hop.suppress ? 3 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  nodes.forEach((n, i) => {
    for (const f of n.flashes) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = n.kind === "rsu" ? "#7dd3fc" : i === EGO_INDEX ? "#c8f542" : "#8b9bb4";
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.kind === "rsu" ? 8 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8f5ee";
    ctx.font = "11px ui-sans-serif, system-ui";
    ctx.fillText(n.kind === "rsu" ? "RSU" : i === EGO_INDEX ? "YOU" : `V${n.id}`, n.x + 8, n.y - 8);
  });
}
