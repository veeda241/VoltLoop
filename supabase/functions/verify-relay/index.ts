import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HMAC_SIZE = 16;
const HEADER = 16;

function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function readU16(view: DataView, o: number) {
  return view.getUint16(o, true);
}
function readU32(view: DataView, o: number) {
  return view.getUint32(o, true);
}

async function hmac16(data: Uint8Array, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return new Uint8Array(sig).slice(0, HMAC_SIZE);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const { frameHex, originMerchantId } = await req.json();
    const bytes = fromHex(String(frameHex || ""));
    if (bytes.length < HEADER + HMAC_SIZE) return json({ error: "Malformed frame" }, 400);
    const view = new DataView(bytes.buffer);
    const payloadLen = readU16(view, 14);
    if (HEADER + payloadLen + HMAC_SIZE !== bytes.length) return json({ error: "Bad payload_len" }, 400);
    const hopCount = bytes[9];
    if (hopCount < 1) return json({ error: "Hop count must be ≥ 1" }, 400);

    const body = bytes.slice(0, HEADER + payloadLen);
    const hmac = bytes.slice(HEADER + payloadLen);
    const expected = await hmac16(body, Deno.env.get("VOLTLOOP_HMAC_KEY") || "voltloop-demo-hmac-key-2026");
    let diff = 0;
    for (let i = 0; i < HMAC_SIZE; i++) diff |= expected[i] ^ hmac[i];
    if (diff !== 0) return json({ error: "HMAC verification failed" }, 403);

    const msgId = readU32(view, 2);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: existing } = await admin
      .from("ad_relays")
      .select("id")
      .eq("msg_id", msgId)
      .eq("relayed_by_user_id", user.id)
      .maybeSingle();
    if (existing) return json({ credited: false, reason: "already_credited" });

    const reward = 10;
    const hmacHex = Array.from(hmac)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { data: relay, error: relErr } = await admin
      .from("ad_relays")
      .insert({
        msg_id: msgId,
        origin_merchant_id: originMerchantId ?? null,
        relayed_by_user_id: user.id,
        hop_count: hopCount,
        hmac_signature: hmacHex,
      })
      .select()
      .single();
    if (relErr) return json({ error: relErr.message }, 400);

    const { data: profile } = await admin.from("users").select("token_balance").eq("id", user.id).single();
    const next = Number(profile?.token_balance ?? 0) + reward;
    await admin.from("users").update({ token_balance: next }).eq("id", user.id);
    await admin.from("token_ledger").insert({
      user_id: user.id,
      amount: reward,
      transaction_type: "EARNED_RELAY",
      reference_id: relay.id,
    });

    return json({ credited: true, reward, balance: next, relay });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "error" }, 500);
  }
});

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}
