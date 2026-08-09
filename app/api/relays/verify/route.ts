import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { randomId } from "@/lib/crypto-hash";
import { getHmacKey } from "@/lib/hmac-key";
import { mutateStore } from "@/lib/store/demo-store";
import { RELAY_TOKEN_REWARD } from "@/lib/store/seed";
import { decodeFrame, fromHex, verifyFrame } from "@protocol/index";

export async function POST(req: Request) {
  try {
    const user = await requireUser(["driver"]);
    const body = (await req.json()) as {
      frameHex?: string;
      originMerchantId?: string | null;
    };
    if (!body.frameHex) return json({ error: "frameHex required" }, 400);

    let bytes: Uint8Array;
    try {
      bytes = fromHex(body.frameHex);
    } catch {
      return json({ error: "Invalid frame hex" }, 400);
    }

    const frame = decodeFrame(bytes);
    if (!frame) return json({ error: "Malformed VoltLoop frame" }, 400);
    if (frame.hopCount < 1) return json({ error: "Hop count must be ≥ 1 to earn relay tokens" }, 400);

    const ok = await verifyFrame(frame, getHmacKey());
    if (!ok) return json({ error: "HMAC verification failed — hop not credited" }, 403);

    const result = mutateStore((s) => {
      const dup = s.ad_relays.find((r) => r.msg_id === frame.msgId && r.relayed_by_user_id === user.id);
      if (dup) return { credited: false, reason: "already_credited" as const, relay: dup, balance: user.token_balance };

      const relay = {
        id: randomId(),
        msg_id: frame.msgId,
        origin_merchant_id: body.originMerchantId ?? null,
        relayed_by_user_id: user.id,
        hop_count: frame.hopCount,
        hmac_signature: Array.from(frame.hmac)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
        relayed_at: new Date().toISOString(),
      };
      s.ad_relays.push(relay);
      s.token_ledger.push({
        id: randomId(),
        user_id: user.id,
        amount: RELAY_TOKEN_REWARD,
        transaction_type: "EARNED_RELAY",
        reference_id: relay.id,
        created_at: new Date().toISOString(),
      });
      const row = s.users.find((u) => u.id === user.id);
      if (row) row.token_balance = Number((row.token_balance + RELAY_TOKEN_REWARD).toFixed(2));
      return {
        credited: true,
        reason: "ok" as const,
        relay,
        balance: row?.token_balance ?? user.token_balance,
        reward: RELAY_TOKEN_REWARD,
      };
    });

    return json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
