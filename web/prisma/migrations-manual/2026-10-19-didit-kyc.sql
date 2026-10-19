-- PWFINTECH — 2026-10-19 — Vérification d'identité par Didit (POST /api/me/kyc/didit, webhook /api/webhooks/didit).
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent : peut être relancé sans risque.

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "kycProvider" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "kycSessionId" TEXT;
CREATE INDEX IF NOT EXISTS "Customer_kycSessionId_idx" ON "Customer"("kycSessionId");

-- Webhooks Didit reçus : anti-doublon sur event_id (clé primaire), sans donnée d'identité.
CREATE TABLE IF NOT EXISTS "DiditWebhookEvent" (
  "eventId" TEXT PRIMARY KEY,
  "webhookType" TEXT NOT NULL,
  "sessionId" TEXT,
  "status" TEXT,
  "signature" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "outcome" TEXT
);
CREATE INDEX IF NOT EXISTS "DiditWebhookEvent_sessionId_idx" ON "DiditWebhookEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "DiditWebhookEvent_receivedAt_idx" ON "DiditWebhookEvent"("receivedAt");
-- Ménage facultatif : DELETE FROM "DiditWebhookEvent" WHERE "receivedAt" < now() - interval '90 days';
