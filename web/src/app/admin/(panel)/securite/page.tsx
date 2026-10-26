import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ADMIN_PASSWORD_MIN_LENGTH, adminPasswordTooShort } from "@/lib/admin-auth";
import { adminTotpEnabled } from "@/lib/admin-totp";
import { adminPageAccess } from "../../_server/session";
import { SecurityView, type SecurityData } from "../../_ui/security-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sécurité" };

async function load(currentSid: string | null): Promise<SecurityData["db"]> {
  const now = new Date();
  const [sessions, audit, users] = await Promise.all([
    prisma.adminSession.findMany({
      where: { revokedAt: null, expiresAt: { gt: now } },
      orderBy: { lastSeenAt: "desc" },
      take: 50,
    }),
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  const names = new Map(users.map((u) => [u.id, u.displayName]));
  return {
    sessions: sessions.map((s) => ({
      id: s.id.slice(0, 6),
      current: s.id === currentSid,
      createdAt: s.createdAt.toISOString(),
      lastSeenAt: s.lastSeenAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      ip: s.ip,
      userAgent: s.userAgent,
      who: s.adminUserId ? (names.get(s.adminUserId) ?? "?") : "Compte provisoire",
    })),
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      active: u.active,
      mfa: Boolean(u.totpSecretEnc),
      mustChangePassword: u.mustChangePassword,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    })),
    audit: audit.map((a) => ({
      id: a.id,
      createdAt: a.createdAt.toISOString(),
      action: a.action,
      actor: a.actor,
      ip: a.ip,
      ok: a.ok,
    })),
  };
}

export default async function AdminSecurityPage() {
  const { session, identity } = await adminPageAccess();
  const db = await load(session?.sid ?? null).catch((err: unknown) => {
    console.error("[admin] sécurité indisponible", err);
    return null;
  });
  // Comptes individuels : code activé par tous ; sinon (compte provisoire) : variables d'environnement.
  const personal = db?.users.filter((u) => u.active) ?? [];
  return (
    <SecurityView
      data={{
        mfa: personal.length ? personal.every((u) => u.mfa) : adminTotpEnabled(),
        passwordShort: personal.length ? false : adminPasswordTooShort(),
        minLength: ADMIN_PASSWORD_MIN_LENGTH,
        db,
        meId: identity?.userId ?? null,
      }}
    />
  );
}
