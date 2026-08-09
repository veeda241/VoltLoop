import { createSession, hashPassword } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { randomId } from "@/lib/crypto-hash";
import { toPublicUser } from "@/lib/public-user";
import { mutateStore, readStore } from "@/lib/store/demo-store";
import type { UserRole } from "@/lib/store/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      vehicle_model?: string;
      battery_capacity_kwh?: number;
      dpdp_consent?: boolean;
      eula_accepted?: boolean;
      role?: UserRole;
    };

    const email = body.email?.trim().toLowerCase();
    if (!email || !body.password) return json({ error: "Email and password required" }, 400);
    if (!body.dpdp_consent) return json({ error: "DPDP Act 2023 consent is required" }, 400);
    if (!body.eula_accepted) return json({ error: "Token EULA must be accepted" }, 400);
    if (body.password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);

    const existing = readStore().users.find((u) => u.email === email);
    if (existing) return json({ error: "Email already registered" }, 409);

    const role: UserRole = body.role && ["driver", "merchant", "cpo"].includes(body.role) ? body.role : "driver";
    const ts = new Date().toISOString();
    const user = mutateStore((s) => {
      const created = {
        id: randomId(),
        email,
        passwordHash: "",
        vehicle_model: body.vehicle_model?.trim() || "EV",
        battery_capacity_kwh: Number(body.battery_capacity_kwh || 40),
        token_balance: 0,
        role,
        dpdp_consent_at: ts,
        eula_accepted_at: ts,
        created_at: ts,
      };
      s.users.push(created);
      return created;
    });
    user.passwordHash = await hashPassword(body.password);
    mutateStore((s) => {
      const row = s.users.find((u) => u.id === user.id);
      if (row) row.passwordHash = user.passwordHash;
    });

    await createSession(user.id);
    return json({ user: toPublicUser(user) }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
