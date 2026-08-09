-- VoltLoop schema (blueprint §6 + auth/role/DPDP fields)

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    vehicle_model TEXT NOT NULL DEFAULT 'EV',
    battery_capacity_kwh NUMERIC(5,2) NOT NULL DEFAULT 40,
    token_balance NUMERIC(10,2) DEFAULT 0.00,
    role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'merchant', 'cpo', 'admin')),
    dpdp_consent_at TIMESTAMPTZ,
    eula_accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    total_bays INT NOT NULL,
    active_bays INT NOT NULL,
    power_kw NUMERIC(6,2) NOT NULL,
    source TEXT DEFAULT 'open_charge_map'
);

CREATE TABLE IF NOT EXISTS public.charging_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    station_id UUID REFERENCES public.stations(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expected_finish_at TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES public.stations(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    discount_pct INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.ad_relays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    msg_id BIGINT NOT NULL,
    origin_merchant_id UUID REFERENCES public.merchants(id),
    relayed_by_user_id UUID REFERENCES public.users(id),
    hop_count INT NOT NULL,
    hmac_signature TEXT NOT NULL,
    relayed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (msg_id, relayed_by_user_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    merchant_id UUID REFERENCES public.merchants(id),
    total_amount NUMERIC(10,2) NOT NULL,
    tokens_redeemed NUMERIC(10,2) DEFAULT 0.00,
    status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED')),
    ready_by_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.token_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    amount NUMERIC(10,2) NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN (
        'EARNED_RELAY', 'EARNED_ORDER', 'REDEEMED_CHARGING', 'REDEEMED_MERCHANT'
    )),
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_relays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_self_update ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY stations_read ON public.stations FOR SELECT USING (true);
CREATE POLICY merchants_read ON public.merchants FOR SELECT USING (true);

CREATE POLICY sessions_read ON public.charging_sessions
    FOR SELECT USING (true);
CREATE POLICY sessions_insert ON public.charging_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY sessions_update ON public.charging_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY orders_driver_read ON public.orders
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY orders_driver_insert ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY orders_driver_cancel ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY relays_read_own ON public.ad_relays
    FOR SELECT USING (auth.uid() = relayed_by_user_id);

CREATE POLICY ledger_read_own ON public.token_ledger
    FOR SELECT USING (auth.uid() = user_id);

-- Profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, vehicle_model, battery_capacity_kwh, dpdp_consent_at, eula_accepted_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'vehicle_model', 'EV'),
    COALESCE((NEW.raw_user_meta_data->>'battery_capacity_kwh')::numeric, 40),
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'dpdp_consent', 'false') = 'true' THEN NOW() ELSE NULL END,
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'eula_accepted', 'false') = 'true' THEN NOW() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ledger + relays are written only via service role / Edge Functions (no insert policies for authenticated).
