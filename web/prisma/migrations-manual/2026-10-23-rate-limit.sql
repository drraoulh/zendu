-- PWFINTECH — 2026-10-23 — Limite anti-abus partagée entre les instances serveur (src/lib/rate-limit.ts).
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent : peut être relancé sans risque.
-- "key" = empreinte SHA-256 de la clé (jamais d'adresse IP ni de courriel en clair).

CREATE TABLE IF NOT EXISTS "RateLimit" (
  "key" TEXT PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 1,
  "resetAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");
-- Accès uniquement par le serveur (Prisma) : aucune politique pour les rôles publics de Supabase.
ALTER TABLE "RateLimit" ENABLE ROW LEVEL SECURITY;
