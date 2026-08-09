import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { randomId } from "@/lib/crypto-hash";
import { mutateStore, readStore } from "@/lib/store/demo-store";
import { ORDER_TOKEN_REWARD } from "@/lib/store/seed";

export async function GET() {
  try {
    const user = await requireUser();
    const store = readStore();
    if (user.role === "merchant" || user.role === "cpo" || user.role === "admin") {
      return json({ orders: store.orders });
    }
    return json({ orders: store.orders.filter((o) => o.user_id === user.id) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(["driver"]);
    const body = (await req.json()) as {
      merchant_id?: string;
      total_amount?: number;
      tokens_redeemed?: number;
      ready_by_minutes?: number;
    };
    if (!body.merchant_id) return json({ error: "merchant_id required" }, 400);
    const total = Number(body.total_amount ?? 0);
    if (!(total > 0)) return json({ error: "total_amount must be > 0" }, 400);
    const redeem = Math.max(0, Number(body.tokens_redeemed || 0));

    const result = mutateStore((s) => {
      const merchant = s.merchants.find((m) => m.id === body.merchant_id && m.is_active);
      if (!merchant) return { error: "Merchant not found" as const };
      const row = s.users.find((u) => u.id === user.id)!;
      if (redeem > row.token_balance) return { error: "Insufficient tokens" as const };
      if (redeem > total) return { error: "Cannot redeem more tokens than order total" as const };

      if (redeem > 0) {
        row.token_balance = Number((row.token_balance - redeem).toFixed(2));
      }

      const order = {
        id: randomId(),
        user_id: user.id,
        merchant_id: merchant.id,
        total_amount: total,
        tokens_redeemed: redeem,
        status: "PENDING" as const,
        ready_by_time: new Date(Date.now() + Math.max(5, Number(body.ready_by_minutes || 20)) * 60_000).toISOString(),
        created_at: new Date().toISOString(),
      };
      s.orders.push(order);
      if (redeem > 0) {
        s.token_ledger.push({
          id: randomId(),
          user_id: user.id,
          amount: -redeem,
          transaction_type: "REDEEMED_MERCHANT",
          reference_id: order.id,
          created_at: order.created_at,
        });
      }
      return { order, balance: row.token_balance };
    });

    if ("error" in result) return json({ error: result.error }, 400);
    void ORDER_TOKEN_REWARD;
    return json(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
