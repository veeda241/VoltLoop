import { decodePacket, encodeFrame, hopFrame, signFrame, toHex, type DecodedPacket } from "@protocol/index";
import { keyFromSecret } from "@protocol/hmac";
import { DEFAULT_HMAC_SECRET } from "@/lib/hmac-key";

/** VoltLoop BLE GATT UUIDs — keep in sync with firmware/src/main.cpp */
export const VL_SERVICE_UUID = "6b1d0001-7c4a-4f8e-9b21-a1b2c3d4e5f6";
export const VL_CHAR_PACKET_RX = "6b1d0002-7c4a-4f8e-9b21-a1b2c3d4e5f6";
export const VL_CHAR_SHARE_TX = "6b1d0003-7c4a-4f8e-9b21-a1b2c3d4e5f6";
export const VL_CHAR_NODE_ID = "6b1d0004-7c4a-4f8e-9b21-a1b2c3d4e5f6";

export type BleConnection = {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  packetChar: BluetoothRemoteGATTCharacteristic;
  shareChar: BluetoothRemoteGATTCharacteristic;
  nodeId: number;
};

export function bleSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.bluetooth);
}

export async function connectDongle(
  onPacket: (packet: DecodedPacket, frameHex: string) => void,
): Promise<BleConnection> {
  const bluetooth = navigator.bluetooth;
  if (!bluetooth) throw new Error("Web Bluetooth not available — use Chrome over HTTPS or localhost.");

  const device = await bluetooth.requestDevice({
    filters: [{ namePrefix: "VoltLoop" }, { services: [VL_SERVICE_UUID] }],
    optionalServices: [VL_SERVICE_UUID],
  });
  if (!device.gatt) throw new Error("GATT not available on this device.");
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(VL_SERVICE_UUID);
  const packetChar = await service.getCharacteristic(VL_CHAR_PACKET_RX);
  const shareChar = await service.getCharacteristic(VL_CHAR_SHARE_TX);
  const nodeChar = await service.getCharacteristic(VL_CHAR_NODE_ID);
  const nodeRaw = await nodeChar.readValue();
  const nodeId = new DataView(nodeRaw.buffer).getUint16(0, true);

  await packetChar.startNotifications();
  packetChar.addEventListener("characteristicvaluechanged", (ev) => {
    const target = ev.target as unknown as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;
    const bytes = new Uint8Array(target.value.buffer);
    const packet = decodePacket(bytes);
    if (packet) onPacket(packet, toHex(bytes));
  });

  return { device, server, packetChar, shareChar, nodeId };
}

export async function writeShare(conn: BleConnection, frameBytes: Uint8Array) {
  await conn.shareChar.writeValueWithoutResponse(frameBytes);
}

/** Demo-mode hop when no dongle is present: re-sign locally with the shared demo key. */
export async function demoHop(packet: DecodedPacket, secret = DEFAULT_HMAC_SECRET): Promise<{ packet: DecodedPacket; frameHex: string } | null> {
  const next = hopFrame(packet);
  if (!next) return null;
  const signed = await signFrame(next, keyFromSecret(secret));
  const bytes = encodeFrame(signed);
  return { packet: { ...signed, parsed: packet.parsed }, frameHex: toHex(bytes) };
}
