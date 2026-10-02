"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminMode, checkAdminPassword, createSessionToken, sessionCookieOptions } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/requests";
import { safeNext } from "../_server/session";

export type LoginState = { error: "invalid" | "rate_limited" | "locked" | null };

/** Connexion par mot de passe unique (ADMIN_PASSWORD) → cookie de session signé (12 h). */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (adminMode() !== "configured") return { error: "locked" };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  if (!rateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000)) return { error: "rate_limited" };

  const password = String(formData.get("password") ?? "");
  if (!checkAdminPassword(password)) return { error: "invalid" };

  const token = await createSessionToken();
  if (!token) return { error: "locked" };
  (await cookies()).set(ADMIN_COOKIE, token, sessionCookieOptions());
  redirect(safeNext(String(formData.get("next") ?? "")));
}
