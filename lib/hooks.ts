"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicUser } from "@/lib/public-user";
import type { ChargingSession, Merchant, Order, TokenLedger } from "@/lib/store/types";
import type { StationWithVacancy } from "@/lib/occupancy";

export function useUser() {
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/me");
    const data = (await res.json()) as { user: PublicUser | null };
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { user, refresh, setUser };
}

export function useStations() {
  const [stations, setStations] = useState<StationWithVacancy[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/stations");
    const data = (await res.json()) as { stations: StationWithVacancy[] };
    setStations(data.stations ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  return { stations, loading, refresh };
}

export function useMerchants(stationId?: string) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  useEffect(() => {
    const q = stationId ? `?station_id=${stationId}` : "";
    void fetch(`/api/merchants${q}`)
      .then((r) => r.json())
      .then((d: { merchants: Merchant[] }) => setMerchants(d.merchants ?? []));
  }, [stationId]);
  return merchants;
}

export function useWallet() {
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<TokenLedger[]>([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/wallet");
    if (!res.ok) return;
    const data = (await res.json()) as { balance: number; ledger: TokenLedger[] };
    setBalance(data.balance);
    setLedger(data.ledger ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { balance, ledger, refresh };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const refresh = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (!res.ok) return;
    const data = (await res.json()) as { orders: Order[] };
    setOrders(data.orders ?? []);
  }, []);
  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 8_000);
    return () => clearInterval(id);
  }, [refresh]);
  return { orders, refresh };
}

export function useSessions() {
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const refresh = useCallback(async () => {
    const res = await fetch("/api/sessions");
    if (!res.ok) return;
    const data = (await res.json()) as { sessions: ChargingSession[] };
    setSessions(data.sessions ?? []);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { sessions, refresh };
}
