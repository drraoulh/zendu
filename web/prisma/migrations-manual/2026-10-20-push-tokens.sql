-- PWFINTECH — 2026-10-20 — Notifications push de l'appli WorldSoft Transfer (POST /api/me/push-token).
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent : peut être relancé sans risque.

CREATE TABLE IF NOT EXISTS "PushToken" (
  "token" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "platform" TEXT NOT NULL,
  "lang" TEXT NOT NULL DEFAULT 'fr',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "disabledAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "PushToken_customerId_idx" ON "PushToken"("customerId");
-- Accès uniquement par le serveur (Prisma) : aucune politique pour les rôles publics de Supabase.
ALTER TABLE "PushToken" ENABLE ROW LEVEL SECURITY;
