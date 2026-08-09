import { requireUser } from "@/lib/auth";
import { json, errorResponse } from "@/lib/api";
import { mutateStore } from "@/lib/store/demo-store";
import type { SessionStatus } from "@/lib/store/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = (await req.json()) as { status?: SessionStatus; expected_finish_at?: string };
    const session = mutateStore((s) => {
      const row = s.charging_sessions.find((x) => x.id === id);
      if (!row) return null;
      if (row.user_id !== user.id && user.role === "driver") return "forbidden" as const;
      if (body.status) row.status = body.status;
      if (body.expected_finish_at) row.expected_finish_at = body.expected_finish_at;
      return row;
    });
    if (!session) return json({ error: "Not found" }, 404);
    if (session === "forbidden") return json({ error: "Forbidden" }, 403);
    return json({ session });
  } catch (err) {
    return errorResponse(err);
  }
}
