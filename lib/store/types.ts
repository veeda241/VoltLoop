export type UserRole = "driver" | "merchant" | "cpo" | "admin";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  vehicle_model: string;
  battery_capacity_kwh: number;
  token_balance: number;
  role: UserRole;
  dpdp_consent_at: string | null;
  eula_accepted_at: string | null;
  created_at: string;
};

export type Station = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  total_bays: number;
  active_bays: number;
  power_kw: number;
  source: string;
};

export type SessionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type ChargingSession = {
  id: string;
  user_id: string;
  station_id: string;
  started_at: string;
  expected_finish_at: string;
  status: SessionStatus;
};

export type Merchant = {
  id: string;
  station_id: string;
  name: string;
  category: string;
  discount_pct: number;
  is_active: boolean;
};

export type AdRelay = {
  id: string;
  msg_id: number;
  origin_merchant_id: string | null;
  relayed_by_user_id: string;
  hop_count: number;
  hmac_signature: string;
  relayed_at: string;
};

export type OrderStatus = "PENDING" | "ACCEPTED" | "READY" | "COMPLETED" | "CANCELLED";

export type Order = {
  id: string;
  user_id: string;
  merchant_id: string;
  total_amount: number;
  tokens_redeemed: number;
  status: OrderStatus;
  ready_by_time: string;
  created_at: string;
};

export type LedgerType =
  | "EARNED_RELAY"
  | "EARNED_ORDER"
  | "REDEEMED_CHARGING"
  | "REDEEMED_MERCHANT";

export type TokenLedger = {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: LedgerType;
  reference_id: string | null;
  created_at: string;
};

export type SessionToken = {
  token: string;
  user_id: string;
  created_at: string;
};

export type DemoStore = {
  users: User[];
  stations: Station[];
  charging_sessions: ChargingSession[];
  merchants: Merchant[];
  ad_relays: AdRelay[];
  orders: Order[];
  token_ledger: TokenLedger[];
  sessions: SessionToken[];
};
