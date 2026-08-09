import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { randomId } from "@/lib/crypto-hash";
import { mutateStore } from "@/lib/store/demo-store";
import { ORDER_TOKEN_REWARD } from "@/lib/store/seed";
import type { OrderStatus } from "@/lib/store/types";

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(["merchant", "cpo", "driver"]);
    const { id } = await params;
    const body = (await req.json()) as { status?: OrderStatus };
    if (!body.status) return json({ error: "status required" }, 400);

    const result = mutateStore((s) => {
      const order = s.orders.find((o) => o.id === id);
      if (!order) return { error: "Not found" as const, code: 404 };
      if (user.role === "driver" && order.user_id !== user.id) return { error: "Forbidden" as const, code: 403 };
      if (user.role === "driver" && body.status !== "CANCELLED") {
        return { error: "Drivers can only cancel" as const, code: 403 };
      }
      if (!ALLOWED[order.status].includes(body.status!)) {
        return { error: `Cannot go from ${order.status} to ${body.status}` as const, code: 400 };
      }

      order.status = body.status!;

      if (order.status === "COMPLETED") {
        const driver = s.users.find((u) => u.id === order.user_id);
        if (driver) {
          driver.token_balance = Number((driver.token_balance + ORDER_TOKEN_REWARD).toFixed(2));
          s.token_ledger.push({
            id: randomId(),
            user_id: driver.id,
            amount: ORDER_TOKEN_REWARD,
            transaction_type: "EARNED_ORDER",
            reference_id: order.id,
            created_at: new Date().toISOString(),
          });
        }
      }

      if (order.status === "CANCELLED" && order.tokens_redeemed > 0) {
        const driver = s.users.find((u) => u.id === order.user_id);
        if (driver) {
          driver.token_balance = Number((driver.token_balance + order.tokens_redeemed).toFixed(2));
          s.token_ledger.push({
            id: randomId(),
            user_id: driver.id,
            amount: order.tokens_redeemed,
            transaction_type: "EARNED_ORDER",
            reference_id: order.id,
            created_at: new Date().toISOString(),
          });
        }
      }

      return { order };
    });

    if ("error" in result) return json({ error: result.error }, result.code);
    return json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
