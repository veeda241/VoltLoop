export const PROTOCOL_VERSION = 0x01;
export const MSG_STATION_STATUS = 0x01;
export const MSG_MERCHANT_OFFER = 0x02;
export const DEFAULT_TTL = 3;
export const HEADER_SIZE = 16;
export const HMAC_SIZE = 16;
export const MAX_FRAME_SIZE = 250;
export const MAX_PAYLOAD_SIZE = MAX_FRAME_SIZE - HEADER_SIZE - HMAC_SIZE; // 218

export type MsgType = typeof MSG_STATION_STATUS | typeof MSG_MERCHANT_OFFER;

export type StationStatusPayload = {
  kind: "status";
  stationName: string;
  totalBays: number;
  activeBays: number;
  etaMin: number;
};

export type MerchantOfferPayload = {
  kind: "offer";
  merchantName: string;
  category: string;
  discountPct: number;
  stationName: string;
  merchantId?: string;
};

export type FramePayload = StationStatusPayload | MerchantOfferPayload;

export type VoltLoopFrame = {
  version: number;
  msgType: MsgType;
  msgId: number;
  originId: number;
  ttl: number;
  hopCount: number;
  timestamp: number;
  payload: Uint8Array;
  hmac: Uint8Array;
};

export type DecodedPacket = VoltLoopFrame & {
  parsed: FramePayload | null;
};

export type RelayReceipt = {
  msgId: number;
  originId: number;
  hopCount: number;
  ttl: number;
  timestamp: number;
  msgType: number;
  payloadHex: string;
  hmacHex: string;
};
