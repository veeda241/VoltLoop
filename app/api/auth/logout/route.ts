import { clearSession } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";

export async function POST() {
  try {
    await clearSession();
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
