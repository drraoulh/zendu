import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  adminMode,
  hasValidApiToken,
  readCookie,
  readSessionToken,
  type SessionClaims,
} from "@/lib/admin-auth";

/**
 * Contrôle complet d'un accès admin, côté serveur (Node) :
 * - cookie signé ET session présente en base, ni expirée ni révoquée (déconnexion, « déconnecter
 *   toutes les sessions ») ;
 * - pour une modification (POST, PATCH, PUT, DELETE) avec le cookie : l'en-tête Origin doit être
 *   celui du site (protection contre les requêtes envoyées depuis un autre site) ;
 * - chaque modification autorisée est inscrite au journal d'audit.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

/** Personne connectée à l'espace équipe. `key` sert à la double validation et au journal. */
export type AdminIdentity = {
  sid: string | null;
  userId: string | null;
  /** Identifiant stable : id du compte, "env:<identifiant>" (connexion provisoire), "api-token" ou "dev". */
  key: string;
  username: string;
  displayName: string;
  mustChangePassword: boolean;
};

/** Session en base encore active (cookie déjà vérifié), avec la personne connectée. */
export async function adminSessionIdentity(claims: SessionClaims): Promise<AdminIdentity | null> {
  try {
    const session = await prisma.adminSession.findUnique({ where: { id: claims.sid } });
    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now) return null;
    let identity: AdminIdentity;
    if (session.adminUserId) {
      const user = await prisma.adminUser.findUnique({ where: { id: session.adminUserId } });
      if (!user || !user.active) return null;
      identity = {
        sid: session.id,
        userId: user.id,
        key: user.id,
        username: user.username,
        displayName: user.displayName,
        mustChangePassword: user.mustChangePassword,
      };
    } else {
      const username = process.env.ADMIN_USERNAME?.trim().toLowerCase() || "admin";
      identity = { sid: session.id, userId: null, key: `env:${username}`, username, displayName: "Compte provisoire", mustChangePassword: false };
    }
    if (now.getTime() - session.lastSeenAt.getTime() > 5 * 60_000) {
      await prisma.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: now } }).catch(() => undefined);
    }
    return identity;
  } catch (err) {
    // Base injoignable : on refuse (échec fermé), l'admin ne fonctionne de toute façon pas sans base.
    console.error("[admin] vérification de session impossible", err);
    return null;
  }
}

export async function adminSessionActive(claims: SessionClaims): Promise<boolean> {
  return (await adminSessionIdentity(claims)) !== null;
}

/** Personne connectée d'après le cookie, seulement si sa session est encore active en base. */
export async function identityFromCookie(cookieValue: string | null | undefined): Promise<AdminIdentity | null> {
  const claims = await readSessionToken(cookieValue);
  return claims ? adminSessionIdentity(claims) : null;
}

/** Claims de la session admin du cookie, seulement si elle est encore active en base. */
export async function activeSessionFromCookie(cookieValue: string | null | undefined): Promise<SessionClaims | null> {
  const claims = await readSessionToken(cookieValue);
  if (!claims) return null;
  return (await adminSessionActive(claims)) ? claims : null;
}

export async function createAdminSession(sid: string, exp: number, headers: Headers, adminUserId: string | null = null): Promise<void> {
  await prisma.adminSession.create({
    data: {
      id: sid,
      adminUserId,
      expiresAt: new Date(exp),
      ip: clientIp(headers),
      userAgent: headers.get("user-agent")?.slice(0, 300) ?? null,
    },
  });
}

export async function revokeAdminSession(sid: string): Promise<void> {
  await prisma.adminSession.updateMany({ where: { id: sid, revokedAt: null }, data: { revokedAt: new Date() } });
}

/** Révoque toutes les sessions actives, sauf éventuellement celle indiquée. Renvoie le nombre révoqué. */
export async function revokeAllAdminSessions(exceptSid?: string): Promise<number> {
  const res = await prisma.adminSession.updateMany({
    where: { revokedAt: null, expiresAt: { gt: new Date() }, ...(exceptSid ? { id: { not: exceptSid } } : {}) },
    data: { revokedAt: new Date() },
  });
  return res.count;
}

type AuditEntry = {
  action: string;
  actor?: string;
  sessionId?: string | null;
  target?: string | null;
  ip?: string | null;
  ok?: boolean;
  details?: Record<string, unknown>;
};

/** Ajoute une ligne au journal d'audit. Ne fait jamais échouer l'action (erreur seulement journalisée). */
export async function auditAdmin(entry: AuditEntry): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        action: entry.action.slice(0, 200),
        actor: entry.actor ?? "admin",
        sessionId: entry.sessionId ?? null,
        target: entry.target?.slice(0, 300) ?? null,
        ip: entry.ip ?? null,
        ok: entry.ok ?? true,
        details: entry.details ? (entry.details as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (err) {
    console.error("[admin] journal d'audit indisponible", entry.action, err);
  }
}

/** Origine de la requête identique à l'hôte du site (Origin, ou Referer à défaut). */
export function sameOrigin(request: Request): boolean {
  const source = request.headers.get("origin") ?? request.headers.get("referer");
  if (!source) return false;
  let host: string;
  try {
    host = new URL(source).host;
  } catch {
    return false;
  }
  const hosts = new Set<string>();
  const fwd = request.headers.get("x-forwarded-host");
  if (fwd) hosts.add(fwd.split(",")[0].trim());
  const h = request.headers.get("host");
  if (h) hosts.add(h);
  try {
    hosts.add(new URL(request.url).host);
  } catch {
    /* URL relative : ignorée */
  }
  return hosts.has(host);
}

type AdminAuth =
  | { ok: true; via: "token" | "session" | "dev"; identity: AdminIdentity }
  | { ok: false; reason: "unauthorized" | "origin" | "password_change" };

const TOKEN_IDENTITY: AdminIdentity = { sid: null, userId: null, key: "api-token", username: "api-token", displayName: "Jeton opérateur", mustChangePassword: false };
const DEV_IDENTITY: AdminIdentity = { sid: null, userId: null, key: "dev", username: "dev", displayName: "Développement local", mustChangePassword: false };

/** Routes encore ouvertes avec un mot de passe temporaire : changer son mot de passe, se déconnecter. */
const TEMPORARY_PASSWORD_PATHS = ["/api/admin/me/password"];

function pathOf(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return request.url;
  }
}

async function resolveAdmin(request: Request): Promise<AdminAuth> {
  if (hasValidApiToken(request)) return { ok: true, via: "token", identity: TOKEN_IDENTITY };
  const mode = adminMode();
  if (mode === "dev-open") return { ok: true, via: "dev", identity: DEV_IDENTITY };
  if (mode === "locked") return { ok: false, reason: "unauthorized" };
  const identity = await identityFromCookie(readCookie(request.headers.get("cookie"), ADMIN_COOKIE));
  if (!identity) return { ok: false, reason: "unauthorized" };
  if (!SAFE_METHODS.has(request.method.toUpperCase()) && !sameOrigin(request)) return { ok: false, reason: "origin" };
  if (identity.mustChangePassword && !TEMPORARY_PASSWORD_PATHS.includes(pathOf(request))) return { ok: false, reason: "password_change" };
  return { ok: true, via: "session", identity };
}

async function auditMutation(request: Request, identity: AdminIdentity) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;
  await auditAdmin({
    action: `${request.method.toUpperCase()} ${pathOf(request)}`,
    actor: identity.username,
    sessionId: identity.sid,
    ip: clientIp(request.headers),
  });
}

/** Personne à l'origine de la requête admin (null si non autorisée). Ne journalise rien. */
export async function currentAdmin(request: Request): Promise<AdminIdentity | null> {
  const auth = await resolveAdmin(request);
  return auth.ok ? auth.identity : null;
}

/**
 * Requête de l'équipe autorisée ? (jeton opérateur, session active, ou développement local ouvert).
 * Une modification autorisée est journalisée ; une modification venue d'un autre site est refusée.
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const auth = await resolveAdmin(request);
  if (!auth.ok) {
    if (auth.reason === "origin") {
      await auditAdmin({ action: `${request.method.toUpperCase()} ${pathOf(request)}`, ok: false, ip: clientIp(request.headers), details: { reason: "origin" } });
    }
    return false;
  }
  await auditMutation(request, auth.identity);
  return true;
}

async function guard(request: Request): Promise<{ identity: AdminIdentity } | { denied: NextResponse }> {
  const auth = await resolveAdmin(request);
  if (auth.ok) {
    await auditMutation(request, auth.identity);
    return { identity: auth.identity };
  }
  if (auth.reason === "origin") {
    await auditAdmin({ action: `${request.method.toUpperCase()} ${pathOf(request)}`, ok: false, ip: clientIp(request.headers), details: { reason: "origin" } });
    return { denied: NextResponse.json({ ok: false, code: "bad_origin", error: "Requête refusée (origine)" }, { status: 403 }) };
  }
  if (auth.reason === "password_change") {
    return {
      denied: NextResponse.json({ ok: false, code: "password_change_required", error: "Choisissez d'abord votre mot de passe (Mon compte)." }, { status: 403 }),
    };
  }
  if (adminMode() === "locked" && !process.env.ADMIN_API_TOKEN) {
    return {
      denied: NextResponse.json(
        { ok: false, code: "admin_not_configured", error: "Administration fermée : définissez ADMIN_PASSWORD et ADMIN_SESSION_SECRET" },
        { status: 503 },
      ),
    };
  }
  return { denied: NextResponse.json({ ok: false, code: "unauthorized", error: "Authentification administrateur requise" }, { status: 401 }) };
}

/**
 * À appeler en tête de chaque route API admin : null si autorisé, sinon la réponse d'erreur
 * (401 non authentifié, 403 origine refusée ou mot de passe à changer, 503 admin non configuré).
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const r = await guard(request);
  return "denied" in r ? r.denied : null;
}

/** Comme requireAdmin, mais renvoie la personne connectée (double validation, journal). */
export async function requireAdminIdentity(request: Request): Promise<AdminIdentity | NextResponse> {
  const r = await guard(request);
  return "denied" in r ? r.denied : r.identity;
}
