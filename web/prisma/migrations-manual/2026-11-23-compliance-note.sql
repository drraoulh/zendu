-- Journal des décisions de conformité (page de détail d'un transfert, espace équipe).
-- Table nouvelle, sans effet sur l'existant. À appliquer avant le déploiement.
CREATE TABLE IF NOT EXISTS "ComplianceNote" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "transferId" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "decision" TEXT NOT NULL DEFAULT 'note',
  "note" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "ComplianceNote_transferId_idx" ON "ComplianceNote" ("transferId");
ALTER TABLE "ComplianceNote" ENABLE ROW LEVEL SECURITY;
