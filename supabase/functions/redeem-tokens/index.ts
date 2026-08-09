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

    const { amount, type, reference_id } = await req.json();
    const n = Number(amount);
    if (!(n > 0)) return json({ error: "amount must be > 0" }, 400);
    const tx = type === "REDEEMED_MERCHANT" ? "REDEEMED_MERCHANT" : "REDEEMED_CHARGING";

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await admin.from("users").select("token_balance").eq("id", user.id).single();
    const bal = Number(profile?.token_balance ?? 0);
    if (bal < n) return json({ error: "Insufficient token balance" }, 400);
    const next = Number((bal - n).toFixed(2));
    await admin.from("users").update({ token_balance: next }).eq("id", user.id);
    const { data: entry } = await admin
      .from("token_ledger")
      .insert({
        user_id: user.id,
        amount: -n,
        transaction_type: tx,
        reference_id: reference_id ?? null,
      })
      .select()
      .single();
    return json({ ok: true, balance: next, entry });
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
