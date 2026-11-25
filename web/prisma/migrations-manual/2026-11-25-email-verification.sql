-- Vérification du courriel à l'inscription : défis à code (table nouvelle) + date de vérification sur le client.
-- Additif seulement (table nouvelle, colonne facultative) : sans effet sur l'existant.
CREATE TABLE IF NOT EXISTS "EmailVerification" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sends" INTEGER NOT NULL DEFAULT 1,
  "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "usedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "EmailVerification_email_idx" ON "EmailVerification" ("email");
CREATE INDEX IF NOT EXISTS "EmailVerification_expiresAt_idx" ON "EmailVerification" ("expiresAt");
ALTER TABLE "EmailVerification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
