-- Idempotence de la création des transferts (en-tête Idempotency-Key envoyé par l'appli).
-- Ajout sans risque : colonne facultative, l'ancien code continue de fonctionner. À appliquer avant le déploiement.
ALTER TABLE "Transfer" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Transfer_customerId_idempotencyKey_key" ON "Transfer" ("customerId", "idempotencyKey");
