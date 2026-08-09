interface BluetoothRemoteGATTCharacteristic {
  value?: DataView;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  readValue(): Promise<DataView>;
  writeValueWithoutResponse(value: Uint8Array | ArrayBuffer): Promise<void>;
  addEventListener(type: string, listener: (ev: Event) => void): void;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
  connected: boolean;
}

interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer;
  name?: string;
}

interface BluetoothRequestDeviceOptions {
  filters?: { namePrefix?: string; services?: string[] }[];
  optionalServices?: string[];
}

interface Bluetooth {
  requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
}

interface Navigator {
  bluetooth?: Bluetooth;
}
