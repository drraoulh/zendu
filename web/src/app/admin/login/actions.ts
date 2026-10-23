"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminMode, checkAdminPassword, createSessionToken, sessionCookieOptions } from "@/lib/admin-auth";
import { auditAdmin, clientIp, createAdminSession } from "@/lib/admin-guard";
import { adminTotpEnabled, verifyAdminTotp } from "@/lib/admin-totp";
import { rateLimit } from "@/lib/rate-limit";
import { safeNext } from "../_server/session";

export type LoginState = { error: "invalid" | "rate_limited" | "locked" | "unavailable" | null };

/**
 * Connexion : identifiant (ADMIN_USERNAME, facultatif) + mot de passe + code à 6 chiffres si
 * ADMIN_TOTP_SECRET est défini → session enregistrée en base (révocable) et cookie signé (12 h).
 * Chaque tentative, réussie ou non, est inscrite au journal d'audit.
 */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (adminMode() !== "configured") return { error: "locked" };

  const h = await headers();
  const ip = clientIp(h);
  if (!(await rateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000))) {
    await auditAdmin({ action: "login", ok: false, ip, details: { reason: "rate_limited" } });
    return { error: "rate_limited" };
  }
  // Limite globale en plus de celle par adresse IP (attaque répartie sur beaucoup d'adresses).
  if (!(await rateLimit("admin-login:global", 60, 15 * 60 * 1000))) return { error: "rate_limited" };

  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "");
  const passwordOk = checkAdminPassword(password, username);
  let totpOk = true;
  if (adminTotpEnabled()) {
    const step = verifyAdminTotp(String(formData.get("code") ?? ""));
    // Un même code ne sert qu'une fois.
    totpOk = step !== null && (await rateLimit(`admin-totp-step:${step}`, 1, 2 * 60 * 1000));
  }
  if (!passwordOk || !totpOk) {
    await auditAdmin({ action: "login", ok: false, ip, details: { reason: "invalid" } });
    return { error: "invalid" };
  }

  const session = await createSessionToken();
  if (!session) return { error: "locked" };
  try {
    await createAdminSession(session.sid, session.exp, h);
  } catch (err) {
    console.error("[admin] session non enregistrée", err);
    return { error: "unavailable" };
  }
  await auditAdmin({ action: "login", sessionId: session.sid, ip, details: { mfa: adminTotpEnabled() } });
  (await cookies()).set(ADMIN_COOKIE, session.token, sessionCookieOptions());
  redirect(safeNext(String(formData.get("next") ?? "")));
}
