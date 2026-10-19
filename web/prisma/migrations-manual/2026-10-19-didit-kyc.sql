-- PWFINTECH — 2026-10-19 — Vérification d'identité par Didit (POST /api/me/kyc/didit, webhook /api/webhooks/didit).
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent : peut être relancé sans risque.

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "kycProvider" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "kycSessionId" TEXT;
CREATE INDEX IF NOT EXISTS "Customer_kycSessionId_idx" ON "Customer"("kycSessionId");
