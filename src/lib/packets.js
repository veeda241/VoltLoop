import {
  MSG_MERCHANT_OFFER,
  MSG_STATION_STATUS,
  buildUnsigned,
  decodePacket,
  encodeFrame,
  fromHex,
  hopFrame,
  rotatingOriginId,
  signFrame,
  toHex,
} from "@protocol/index";
import { hmacKeyBytes } from "./hmac-key";
import { MERCHANTS, STATIONS } from "../state/seed";

const KEY = hmacKeyBytes();

export async function makeOfferPacket(via = "sim", merchantId) {
  const merchant = merchantId
    ? MERCHANTS.find((m) => m.id === merchantId) || MERCHANTS[0]
    : MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
  const station = STATIONS.find((s) => s.id === merchant.stationId);
  const signed = await signFrame(
    buildUnsigned({
      msgType: MSG_MERCHANT_OFFER,
      originId: rotatingOriginId(),
      hopCount: 1,
      ttl: 3,
      payload: {
        kind: "offer",
        merchantName: merchant.name,
        category: merchant.category,
        discountPct: merchant.discount,
        stationName: station?.name || "",
        merchantId: merchant.id,
      },
    }),
    KEY,
  );
  return {
    msgId: String(signed.msgId),
    type: "offer",
    merchantId: merchant.id,
    merchantName: merchant.name,
    category: merchant.category,
    discount: merchant.discount,
    stationId: station?.id,
    stationName: station?.name,
    hopCount: signed.hopCount,
    ttl: signed.ttl,
    via,
    ts: Date.now(),
    frameHex: toHex(encodeFrame(signed)),
  };
}

export async function makeStatusPacket(via = "sim") {
  const station = STATIONS[Math.floor(Math.random() * STATIONS.length)];
  const occupied = station.occupied;
  const eta = station.minutesList.length ? Math.min(...station.minutesList) : 0;
  const signed = await signFrame(
    buildUnsigned({
      msgType: MSG_STATION_STATUS,
      originId: rotatingOriginId(),
      hopCount: 1,
      ttl: 3,
      payload: {
        kind: "status",
        stationName: station.name,
        totalBays: station.bays,
        activeBays: occupied,
        etaMin: eta,
      },
    }),
    KEY,
  );
  return {
    msgId: String(signed.msgId),
    type: "status",
    stationId: station.id,
    stationName: station.name,
    activeBays: occupied,
    totalBays: station.bays,
    etaMinutes: eta,
    hopCount: signed.hopCount,
    ttl: signed.ttl,
    via,
    ts: Date.now(),
    frameHex: toHex(encodeFrame(signed)),
  };
}

export async function makePacket(via = "sim") {
  return Math.random() < 0.7 ? makeOfferPacket(via) : makeStatusPacket(via);
}

export async function hopSignedFrame(frameHex) {
  const packet = decodePacket(fromHex(frameHex));
  if (!packet) throw new Error("Malformed VoltLoop frame");
  const next = hopFrame(packet);
  if (!next) throw new Error("TTL expired");
  const signed = await signFrame(next, KEY);
  return {
    hopCount: signed.hopCount,
    ttl: signed.ttl,
    frameHex: toHex(encodeFrame(signed)),
    parsed: packet.parsed,
  };
}
