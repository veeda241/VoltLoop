import { decodePacket, toHex } from "@protocol/index";

export const VL_SERVICE_UUID = "6b1d0001-7c4a-4f8e-9b21-a1b2c3d4e5f6";
export const VL_CHAR_PACKET_RX = "6b1d0002-7c4a-4f8e-9b21-a1b2c3d4e5f6";
export const VL_CHAR_SHARE_TX = "6b1d0003-7c4a-4f8e-9b21-a1b2c3d4e5f6";
export const VL_CHAR_NODE_ID = "6b1d0004-7c4a-4f8e-9b21-a1b2c3d4e5f6";

export function bleSupported() {
  return typeof navigator !== "undefined" && Boolean(navigator.bluetooth);
}

export async function connectDongle(onFrame) {
  if (!bleSupported()) {
    throw new Error("Web Bluetooth not available — use Chrome over HTTPS or localhost.");
  }
  const device = await navigator.bluetooth.requestDevice({
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
    const target = ev.target;
    if (!target?.value) return;
    const bytes = new Uint8Array(target.value.buffer);
    const packet = decodePacket(bytes);
    if (packet) onFrame(packet, toHex(bytes));
  });

  return { device, server, packetChar, shareChar, nodeId };
}

export async function writeShare(conn, frameBytes) {
  await conn.shareChar.writeValueWithoutResponse(frameBytes);
}
