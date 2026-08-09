import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Internal error";
  console.error(err);
  return NextResponse.json({ error: message }, { status: 500 });
}
