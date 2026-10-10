-- PWFINTECH — 2026-10-10 — Vérification en deux étapes côté serveur (POST /api/auth/login → /api/auth/verify-2fa).
-- Un défi par connexion : seul le hash du code à 6 chiffres est stocké, 10 minutes, 5 essais.
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent : peut être relancé sans risque.

CREATE TABLE IF NOT EXISTS "OtpChallenge" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "purpose" TEXT NOT NULL DEFAULT 'login',
  "channel" TEXT NOT NULL DEFAULT 'sms',
  "codeHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sends" INTEGER NOT NULL DEFAULT 1,
  "device" TEXT,
  "ip" TEXT,
  "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "OtpChallenge_customerId_idx" ON "OtpChallenge"("customerId");
CREATE INDEX IF NOT EXISTS "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");

-- Ménage facultatif (défis expirés depuis plus d'un jour) :
--   DELETE FROM "OtpChallenge" WHERE "expiresAt" < now() - interval '1 day';
