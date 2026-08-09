import {
  DEFAULT_TTL,
  HEADER_SIZE,
  HMAC_SIZE,
  MAX_FRAME_SIZE,
  MAX_PAYLOAD_SIZE,
  MSG_MERCHANT_OFFER,
  MSG_STATION_STATUS,
  PROTOCOL_VERSION,
  type DecodedPacket,
  type FramePayload,
  type MerchantOfferPayload,
  type MsgType,
  type StationStatusPayload,
  type VoltLoopFrame,
} from "./types";

function writeU32LE(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

function writeU16LE(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value & 0xffff, true);
}

function readU32LE(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

function readU16LE(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

export function randomMsgId(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] >>> 0;
  }
  return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
}

export function rotatingOriginId(): number {
  return Math.floor(Math.random() * 0xfffe) + 1;
}

export function encodePayload(payload: FramePayload): Uint8Array {
  const json = JSON.stringify(
    payload.kind === "offer"
      ? {
          k: "o",
          n: payload.merchantName,
          c: payload.category,
          d: payload.discountPct,
          s: payload.stationName,
          i: payload.merchantId,
        }
      : {
          k: "s",
          n: payload.stationName,
          t: payload.totalBays,
          a: payload.activeBays,
          e: payload.etaMin,
        },
  );
  const bytes = new TextEncoder().encode(json);
  if (bytes.length > MAX_PAYLOAD_SIZE) {
    throw new Error(`Payload ${bytes.length} exceeds max ${MAX_PAYLOAD_SIZE}`);
  }
  return bytes;
}

export function decodePayload(bytes: Uint8Array): FramePayload | null {
  try {
    const raw = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    if (raw.k === "o") {
      const offer: MerchantOfferPayload = {
        kind: "offer",
        merchantName: String(raw.n ?? ""),
        category: String(raw.c ?? ""),
        discountPct: Number(raw.d ?? 0),
        stationName: String(raw.s ?? ""),
        merchantId: raw.i ? String(raw.i) : undefined,
      };
      return offer;
    }
    if (raw.k === "s") {
      const status: StationStatusPayload = {
        kind: "status",
        stationName: String(raw.n ?? ""),
        totalBays: Number(raw.t ?? 0),
        activeBays: Number(raw.a ?? 0),
        etaMin: Number(raw.e ?? 0),
      };
      return status;
    }
  } catch {
    return null;
  }
  return null;
}

export function signedBytes(frame: Pick<VoltLoopFrame, "version" | "msgType" | "msgId" | "originId" | "ttl" | "hopCount" | "timestamp" | "payload">): Uint8Array {
  const payloadLen = frame.payload.length;
  const buf = new Uint8Array(HEADER_SIZE + payloadLen);
  const view = new DataView(buf.buffer);
  view.setUint8(0, frame.version);
  view.setUint8(1, frame.msgType);
  writeU32LE(view, 2, frame.msgId);
  writeU16LE(view, 6, frame.originId);
  view.setUint8(8, frame.ttl);
  view.setUint8(9, frame.hopCount);
  writeU32LE(view, 10, frame.timestamp);
  writeU16LE(view, 14, payloadLen);
  buf.set(frame.payload, HEADER_SIZE);
  return buf;
}

export function encodeFrame(frame: VoltLoopFrame): Uint8Array {
  const body = signedBytes(frame);
  const out = new Uint8Array(body.length + HMAC_SIZE);
  if (out.length > MAX_FRAME_SIZE) {
    throw new Error(`Frame ${out.length} exceeds ${MAX_FRAME_SIZE} bytes`);
  }
  out.set(body, 0);
  out.set(frame.hmac, body.length);
  return out;
}

export function decodeFrame(bytes: Uint8Array): VoltLoopFrame | null {
  if (bytes.length < HEADER_SIZE + HMAC_SIZE || bytes.length > MAX_FRAME_SIZE) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const payloadLen = readU16LE(view, 14);
  if (HEADER_SIZE + payloadLen + HMAC_SIZE !== bytes.length) return null;
  const msgType = view.getUint8(1) as MsgType;
  if (msgType !== MSG_STATION_STATUS && msgType !== MSG_MERCHANT_OFFER) return null;
  return {
    version: view.getUint8(0),
    msgType,
    msgId: readU32LE(view, 2),
    originId: readU16LE(view, 6),
    ttl: view.getUint8(8),
    hopCount: view.getUint8(9),
    timestamp: readU32LE(view, 10),
    payload: bytes.slice(HEADER_SIZE, HEADER_SIZE + payloadLen),
    hmac: bytes.slice(HEADER_SIZE + payloadLen),
  };
}

export function decodePacket(bytes: Uint8Array): DecodedPacket | null {
  const frame = decodeFrame(bytes);
  if (!frame) return null;
  return { ...frame, parsed: decodePayload(frame.payload) };
}

export function hopFrame(frame: VoltLoopFrame): Omit<VoltLoopFrame, "hmac"> | null {
  if (frame.ttl <= 1) return null;
  return {
    version: frame.version,
    msgType: frame.msgType,
    msgId: frame.msgId,
    originId: frame.originId,
    ttl: frame.ttl - 1,
    hopCount: frame.hopCount + 1,
    timestamp: frame.timestamp,
    payload: frame.payload,
  };
}

export function buildUnsigned(opts: {
  msgType: MsgType;
  originId: number;
  payload: FramePayload;
  ttl?: number;
  hopCount?: number;
  msgId?: number;
  timestamp?: number;
}): Omit<VoltLoopFrame, "hmac"> {
  return {
    version: PROTOCOL_VERSION,
    msgType: opts.msgType,
    msgId: opts.msgId ?? randomMsgId(),
    originId: opts.originId,
    ttl: opts.ttl ?? DEFAULT_TTL,
    hopCount: opts.hopCount ?? 0,
    timestamp: opts.timestamp ?? Math.floor(Date.now() / 1000),
    payload: encodePayload(opts.payload),
  };
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/i, "").replace(/\s+/g, "");
  if (clean.length % 2 !== 0) throw new Error("Invalid hex");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
