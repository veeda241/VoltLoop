import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { readStore } from "@/lib/store/demo-store";

export async function GET() {
  try {
    const user = await requireUser();
    const store = readStore();
    const fresh = store.users.find((u) => u.id === user.id)!;
    const ledger = store.token_ledger
      .filter((l) => l.user_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return json({ balance: fresh.token_balance, ledger });
  } catch (err) {
    return errorResponse(err);
  }
}
