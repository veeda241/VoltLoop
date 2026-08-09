import { createSession, hashPassword } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { toPublicUser } from "@/lib/public-user";
import { readStore } from "@/lib/store/demo-store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !body.password) return json({ error: "Email and password required" }, 400);

    const user = readStore().users.find((u) => u.email === email);
    if (!user) return json({ error: "Invalid credentials" }, 401);
    const hash = await hashPassword(body.password);
    if (hash !== user.passwordHash) return json({ error: "Invalid credentials" }, 401);

    await createSession(user.id);
    return json({ user: toPublicUser(user) });
  } catch (err) {
    return errorResponse(err);
  }
}
