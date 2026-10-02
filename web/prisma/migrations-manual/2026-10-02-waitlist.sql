-- PWFINTECH — 2026-10-02 — Liste d'attente de l'application WorldSoft Transfer (POST /api/waitlist)
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent : peut être relancé sans risque.

CREATE TABLE IF NOT EXISTS "WaitlistSignup" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "country" TEXT,
  "locale" TEXT,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "WaitlistSignup_email_key" ON "WaitlistSignup"("email");
