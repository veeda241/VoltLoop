import type { User } from "@/lib/store/types";

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _pw, ...rest } = user;
  void _pw;
  return rest;
}
