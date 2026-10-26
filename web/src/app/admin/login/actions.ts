"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  adminMode,
  checkAdminPassword,
  createPendingLogin,
  createSessionToken,
  readPendingLogin,
  sessionCookieOptions,
} from "@/lib/admin-auth";
import { auditAdmin, clientIp, createAdminSession } from "@/lib/admin-guard";
import { adminTotpEnabled, openSecret, verifyAdminTotp, verifyTotp } from "@/lib/admin-totp";
import { activeAdminUserCount, checkAdminUserPassword, normalizeUsername } from "@/lib/admin-users";
import { rateLimit } from "@/lib/rate-limit";
import { safeNext } from "../_server/session";

export type LoginState = {
  error: "invalid" | "rate_limited" | "locked" | "unavailable" | "code" | null;
  /** Étape 2 : mot de passe vérifié, code à 6 chiffres attendu (jeton signé, 5 min). */
  pending?: string;
  next?: string;
};

async function openSession(userId: string | null, h: Headers, ip: string, actor: string, next: string, mfa: boolean): Promise<LoginState> {
  const session = await createSessionToken();
  if (!session) return { error: "locked" };
  try {
    await createAdminSession(session.sid, session.exp, h, userId);
    if (userId) await prisma.adminUser.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  } catch (err) {
    console.error("[admin] session non enregistrée", err);
    return { error: "unavailable" };
  }
  await auditAdmin({ action: "login", actor, sessionId: session.sid, ip, details: { mfa } });
  (await cookies()).set(ADMIN_COOKIE, session.token, sessionCookieOptions());
  redirect(safeNext(next));
}

/**
 * Connexion à l'espace équipe.
 * - Comptes individuels (AdminUser) : identifiant + mot de passe, puis code à 6 chiffres si la personne l'a
 *   activé (2e étape). Dès qu'un compte actif existe, la connexion provisoire par variables est refusée.
 * - Sinon (aucun compte encore créé) : ADMIN_USERNAME / ADMIN_PASSWORD (+ ADMIN_TOTP_SECRET), pour créer les comptes.
 * Chaque tentative, réussie ou non, est inscrite au journal d'audit.
 */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (adminMode() !== "configured") return { error: "locked" };

  const h = await headers();
  const ip = clientIp(h);
  const next = String(formData.get("next") ?? "");
  if (!(await rateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000))) {
    await auditAdmin({ action: "login", ok: false, ip, details: { reason: "rate_limited" } });
    return { error: "rate_limited" };
  }
  // Limite globale en plus de celle par adresse IP (attaque répartie sur beaucoup d'adresses).
  if (!(await rateLimit("admin-login:global", 60, 15 * 60 * 1000))) return { error: "rate_limited" };

  // Étape 2 : code à 6 chiffres d'un compte individuel.
  const pending = String(formData.get("pending") ?? "");
  if (pending) {
    const userId = await readPendingLogin(pending);
    const user = userId ? await prisma.adminUser.findUnique({ where: { id: userId } }) : null;
    const secret = user?.active && user.totpSecretEnc ? openSecret(user.totpSecretEnc) : null;
    const step = secret ? verifyTotp(secret, String(formData.get("code") ?? "")) : null;
    // Un même code ne sert qu'une fois (mise à jour conditionnelle du dernier pas accepté).
    const fresh =
      user && step !== null
        ? (await prisma.adminUser.updateMany({
            where: { id: user.id, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
            data: { totpLastStep: step },
          })).count === 1
        : false;
    if (!user || !fresh) {
      await auditAdmin({ action: "login", actor: user?.username ?? "?", ok: false, ip, details: { reason: "code" } });
      // Jeton encore valide : on reste à l'étape du code.
      return userId ? { error: "code", pending, next } : { error: "invalid" };
    }
    return openSession(user.id, h, ip, user.username, next, true);
  }

  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "");

  let users: number;
  try {
    users = await activeAdminUserCount();
  } catch (err) {
    console.error("[admin] comptes illisibles", err);
    return { error: "unavailable" };
  }

  if (users > 0) {
    const user = await checkAdminUserPassword(username, password);
    if (!user) {
      await auditAdmin({ action: "login", actor: normalizeUsername(username).slice(0, 40) || "?", ok: false, ip, details: { reason: "invalid" } });
      return { error: "invalid" };
    }
    if (user.totpSecretEnc) {
      const token = await createPendingLogin(user.id);
      return token ? { error: null, pending: token, next } : { error: "locked" };
    }
    return openSession(user.id, h, ip, user.username, next, false);
  }

  // Aucun compte individuel : connexion provisoire par variables d'environnement.
  const passwordOk = checkAdminPassword(password, username);
  let totpOk = true;
  if (adminTotpEnabled()) {
    const step = verifyAdminTotp(String(formData.get("code") ?? ""));
    totpOk = step !== null && (await rateLimit(`admin-totp-step:${step}`, 1, 2 * 60 * 1000));
  }
  if (!passwordOk || !totpOk) {
    await auditAdmin({ action: "login", ok: false, ip, details: { reason: "invalid" } });
    return { error: "invalid" };
  }
  return openSession(null, h, ip, process.env.ADMIN_USERNAME?.trim().toLowerCase() || "admin", next, adminTotpEnabled());
}
