-- PWFINTECH — 2026-10-04 — Comptes clients de l'application WorldSoft Transfer
-- (POST /api/auth/*, /api/me/*, backoffice /admin/clients) + rattachement des transferts.
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent : peut être relancé sans risque.

CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "region" TEXT,
  "birthDate" TEXT,
  "occupation" TEXT,
  "jobTitle" TEXT,
  "address" JSONB,
  "passwordHash" TEXT NOT NULL,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  "passwordChangedAt" TIMESTAMP(3),
  "kycStatus" TEXT NOT NULL DEFAULT 'none',
  "kycDocument" TEXT,
  "kycSubmittedAt" TIMESTAMP(3),
  "kycReviewedAt" TIMESTAMP(3),
  "kycNote" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "marketing" BOOLEAN NOT NULL DEFAULT false,
  "adminNote" TEXT,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Customer_kycStatus_idx" ON "Customer"("kycStatus");
CREATE INDEX IF NOT EXISTS "Customer_status_idx" ON "Customer"("status");
CREATE INDEX IF NOT EXISTS "Customer_createdAt_idx" ON "Customer"("createdAt");

CREATE TABLE IF NOT EXISTS "CustomerSession" (
  "id" TEXT PRIMARY KEY,
  "tokenHash" TEXT NOT NULL,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "device" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerSession_tokenHash_key" ON "CustomerSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "CustomerSession_customerId_idx" ON "CustomerSession"("customerId");

ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
CREATE INDEX IF NOT EXISTS "Transfer_customerId_idx" ON "Transfer"("customerId");
DO $$ BEGIN
  ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Compte de démonstration (identité déjà vérifiée) :
--   courriel : demo@pwfintech.test   mot de passe : Demo2026!
-- À supprimer avant l'ouverture au public : DELETE FROM "Customer" WHERE "email" = 'demo@pwfintech.test';
INSERT INTO "Customer" ("id", "email", "phone", "firstName", "lastName", "country", "region", "birthDate", "occupation",
  "address", "passwordHash", "passwordChangedAt", "kycStatus", "kycDocument", "kycSubmittedAt", "kycReviewedAt", "kycNote", "updatedAt")
VALUES ('cust_demo_pwfintech', 'demo@pwfintech.test', '+1 4165550142', 'Paul', 'Démo', 'CA', 'Ontario', '14/03/1990', 'Salarié(e)',
  '{"line1": "120, rue King Ouest", "city": "Toronto", "region": "Ontario", "postalCode": "M5H 1A1"}',
  'scrypt$16384$L1aIrD9roH7eAnm9hJ29fQ==$PBvpFho5RMpR7Bo4C9HUnITbxeqLY3QvBo5qUKGlS/Q=', CURRENT_TIMESTAMP, 'verified', 'Passeport', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Compte de démonstration', CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO NOTHING;
