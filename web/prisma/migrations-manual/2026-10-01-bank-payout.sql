-- PWFINTECH — 2026-10-01 — Livraison sur compte bancaire (Virement bancaire / Bank account)
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent : peut être relancé sans risque.
-- Les lignes existantes ne sont pas modifiées (colonnes NULL pour mobile money / retrait).

ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "bankCode" TEXT;
