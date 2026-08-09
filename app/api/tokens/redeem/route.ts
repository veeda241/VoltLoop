import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { randomId } from "@/lib/crypto-hash";
import { mutateStore } from "@/lib/store/demo-store";
import type { LedgerType } from "@/lib/store/types";

export async function POST(req: Request) {
  try {
    const user = await requireUser(["driver"]);
    const body = (await req.json()) as {
      amount?: number;
      type?: "REDEEMED_CHARGING" | "REDEEMED_MERCHANT";
      reference_id?: string | null;
    };
    const amount = Number(body.amount || 0);
    if (!(amount > 0)) return json({ error: "amount must be > 0" }, 400);
    const type: LedgerType = body.type === "REDEEMED_MERCHANT" ? "REDEEMED_MERCHANT" : "REDEEMED_CHARGING";

    const result = mutateStore((s) => {
      const row = s.users.find((u) => u.id === user.id);
      if (!row) return { error: "User not found" as const };
      if (row.token_balance < amount) return { error: "Insufficient token balance" as const };
      row.token_balance = Number((row.token_balance - amount).toFixed(2));
      const entry = {
        id: randomId(),
        user_id: user.id,
        amount: -amount,
        transaction_type: type,
        reference_id: body.reference_id ?? null,
        created_at: new Date().toISOString(),
      };
      s.token_ledger.push(entry);
      return { ok: true as const, balance: row.token_balance, entry };
    });

    if ("error" in result) return json({ error: result.error }, result.error === "Insufficient token balance" ? 400 : 404);
    return json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
