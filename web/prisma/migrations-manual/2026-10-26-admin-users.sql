-- PWFINTECH — 2026-10-26 — Comptes admin individuels et double validation Interac.
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent.

CREATE TABLE IF NOT EXISTS "AdminUser" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
  "totpSecretEnc" TEXT,
  "totpLastStep" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "lastLoginAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_username_key" ON "AdminUser"("username");

ALTER TABLE "AdminSession" ADD COLUMN IF NOT EXISTS "adminUserId" TEXT;

ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "interacApprovedBy" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "interacApprovedByName" TEXT;
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "interacApprovedAt" TIMESTAMP(3);

ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "AdminUser" FROM anon, authenticated;
