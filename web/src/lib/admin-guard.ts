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

/** Session en base encore active (cookie déjà vérifié). Met à jour « vu pour la dernière fois » au plus toutes les 5 min. */
export async function adminSessionActive(claims: SessionClaims): Promise<boolean> {
  try {
    const session = await prisma.adminSession.findUnique({ where: { id: claims.sid } });
    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now) return false;
    if (now.getTime() - session.lastSeenAt.getTime() > 5 * 60_000) {
      await prisma.adminSession.update({ where: { id: session.id }, data: { lastSeenAt: now } }).catch(() => undefined);
    }
    return true;
  } catch (err) {
    // Base injoignable : on refuse (échec fermé), l'admin ne fonctionne de toute façon pas sans base.
    console.error("[admin] vérification de session impossible", err);
    return false;
  }
}

/** Claims de la session admin du cookie, seulement si elle est encore active en base. */
export async function activeSessionFromCookie(cookieValue: string | null | undefined): Promise<SessionClaims | null> {
  const claims = await readSessionToken(cookieValue);
  if (!claims) return null;
  return (await adminSessionActive(claims)) ? claims : null;
}

export async function createAdminSession(sid: string, exp: number, headers: Headers): Promise<void> {
  await prisma.adminSession.create({
    data: {
      id: sid,
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

type AdminAuth = { ok: true; via: "token" | "session" | "dev"; sid?: string } | { ok: false; reason: "unauthorized" | "origin" };

async function resolveAdmin(request: Request): Promise<AdminAuth> {
  if (hasValidApiToken(request)) return { ok: true, via: "token" };
  const mode = adminMode();
  if (mode === "dev-open") return { ok: true, via: "dev" };
  if (mode === "locked") return { ok: false, reason: "unauthorized" };
  const claims = await activeSessionFromCookie(readCookie(request.headers.get("cookie"), ADMIN_COOKIE));
  if (!claims) return { ok: false, reason: "unauthorized" };
  if (!SAFE_METHODS.has(request.method.toUpperCase()) && !sameOrigin(request)) return { ok: false, reason: "origin" };
  return { ok: true, via: "session", sid: claims.sid };
}

function pathOf(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return request.url;
  }
}

/**
 * Requête de l'équipe autorisée ? (jeton opérateur, session active, ou développement local ouvert).
 * Une modification autorisée est journalisée ; une modification venue d'un autre site est refusée.
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const auth = await resolveAdmin(request);
  const method = request.method.toUpperCase();
  if (!auth.ok) {
    if (auth.reason === "origin") {
      await auditAdmin({ action: `${method} ${pathOf(request)}`, ok: false, ip: clientIp(request.headers), details: { reason: "origin" } });
    }
    return false;
  }
  if (!SAFE_METHODS.has(method)) {
    await auditAdmin({
      action: `${method} ${pathOf(request)}`,
      actor: auth.via === "token" ? "api-token" : auth.via === "dev" ? "dev" : "admin",
      sessionId: auth.sid ?? null,
      ip: clientIp(request.headers),
    });
  }
  return true;
}

/**
 * À appeler en tête de chaque route API admin : null si autorisé, sinon la réponse d'erreur
 * (401 non authentifié, 403 origine refusée, 503 admin non configuré).
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const auth = await resolveAdmin(request);
  if (auth.ok) {
    if (!SAFE_METHODS.has(request.method.toUpperCase())) {
      await auditAdmin({
        action: `${request.method.toUpperCase()} ${pathOf(request)}`,
        actor: auth.via === "token" ? "api-token" : auth.via === "dev" ? "dev" : "admin",
        sessionId: auth.sid ?? null,
        ip: clientIp(request.headers),
      });
    }
    return null;
  }
  if (auth.reason === "origin") {
    await auditAdmin({ action: `${request.method.toUpperCase()} ${pathOf(request)}`, ok: false, ip: clientIp(request.headers), details: { reason: "origin" } });
    return NextResponse.json({ ok: false, code: "bad_origin", error: "Requête refusée (origine)" }, { status: 403 });
  }
  if (adminMode() === "locked" && !process.env.ADMIN_API_TOKEN) {
    return NextResponse.json(
      { ok: false, code: "admin_not_configured", error: "Administration fermée : définissez ADMIN_PASSWORD et ADMIN_SESSION_SECRET" },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: false, code: "unauthorized", error: "Authentification administrateur requise" }, { status: 401 });
}
