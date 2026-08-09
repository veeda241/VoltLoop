import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { merchant_id, total_amount, tokens_redeemed, ready_by_minutes } = await req.json();
    const total = Number(total_amount);
    const redeem = Math.max(0, Number(tokens_redeemed || 0));
    if (!merchant_id || !(total > 0)) return json({ error: "Invalid order" }, 400);
    if (redeem > total) return json({ error: "Cannot redeem more than total" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: merchant } = await admin.from("merchants").select("*").eq("id", merchant_id).single();
    if (!merchant?.is_active) return json({ error: "Merchant not found" }, 404);

    const { data: profile } = await admin.from("users").select("token_balance").eq("id", user.id).single();
    const bal = Number(profile?.token_balance ?? 0);
    if (redeem > bal) return json({ error: "Insufficient tokens" }, 400);

    const ready = new Date(Date.now() + Math.max(5, Number(ready_by_minutes || 20)) * 60_000).toISOString();
    const { data: order, error } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        merchant_id,
        total_amount: total,
        tokens_redeemed: redeem,
        status: "PENDING",
        ready_by_time: ready,
      })
      .select()
      .single();
    if (error) return json({ error: error.message }, 400);

    if (redeem > 0) {
      await admin.from("users").update({ token_balance: Number((bal - redeem).toFixed(2)) }).eq("id", user.id);
      await admin.from("token_ledger").insert({
        user_id: user.id,
        amount: -redeem,
        transaction_type: "REDEEMED_MERCHANT",
        reference_id: order.id,
      });
    }

    return json({ order, balance: Number((bal - redeem).toFixed(2)) });
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
