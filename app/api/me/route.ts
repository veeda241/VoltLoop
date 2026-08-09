import { getPublicSession } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { readStore } from "@/lib/store/demo-store";

export async function GET() {
  try {
    const user = await getPublicSession();
    if (!user) return json({ user: null }, 200);
    const fresh = readStore().users.find((u) => u.id === user.id);
    if (!fresh) return json({ user: null });
    const { passwordHash: _pw, ...pub } = fresh;
    void _pw;
    return json({ user: pub });
  } catch (err) {
    return errorResponse(err);
  }
}
