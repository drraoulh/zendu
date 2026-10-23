-- PWFINTECH — 2026-10-23 — Sessions admin révocables et journal d'audit (src/lib/admin-guard.ts).
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent.

CREATE TABLE IF NOT EXISTS "AdminSession" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "ip" TEXT,
  "userAgent" TEXT
);
CREATE INDEX IF NOT EXISTS "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sessionId" TEXT,
  "actor" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "target" TEXT,
  "ip" TEXT,
  "ok" BOOLEAN NOT NULL DEFAULT true,
  "details" JSONB
);
CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- Accès uniquement par le serveur (Prisma) : RLS sans politique et aucun droit pour les rôles publics.
ALTER TABLE "AdminSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminAuditLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "AdminSession" FROM anon, authenticated;
REVOKE ALL ON "AdminAuditLog" FROM anon, authenticated;
