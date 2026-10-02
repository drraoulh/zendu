-- PWFINTECH (Paul World Finances and Technologies) schema for Supabase Postgres
-- Run in SQL Editor: https://supabase.com/dashboard/project/xfjhzohooeppjimvtlzu/sql

CREATE TABLE IF NOT EXISTS "Beneficiary" (
  "id" TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "network" TEXT NOT NULL DEFAULT 'MTN',
  "country" TEXT NOT NULL DEFAULT 'CM',
  "bankName" TEXT,
  "accountNumber" TEXT,
  "bankCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Quote" (
  "id" TEXT PRIMARY KEY,
  "corridorId" TEXT NOT NULL DEFAULT 'CA-CM',
  "sendCurrency" TEXT NOT NULL DEFAULT 'CAD',
  "receiveCurrency" TEXT NOT NULL DEFAULT 'XAF',
  "sendAmountCad" DOUBLE PRECISION NOT NULL,
  "receiveAmountXaf" DOUBLE PRECISION NOT NULL,
  "rate" DOUBLE PRECISION NOT NULL,
  "feeCad" DOUBLE PRECISION NOT NULL,
  "totalCad" DOUBLE PRECISION NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Transfer" (
  "id" TEXT PRIMARY KEY,
  "reference" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'awaiting_payment',
  "corridorId" TEXT NOT NULL DEFAULT 'CA-CM',
  "sourceCountry" TEXT NOT NULL DEFAULT 'CA',
  "destCountry" TEXT NOT NULL DEFAULT 'CM',
  "sendCurrency" TEXT NOT NULL DEFAULT 'CAD',
  "receiveCurrency" TEXT NOT NULL DEFAULT 'XAF',
  "senderName" TEXT NOT NULL,
  "senderEmail" TEXT NOT NULL,
  "sendAmountCad" DOUBLE PRECISION NOT NULL,
  "receiveAmountXaf" DOUBLE PRECISION NOT NULL,
  "rate" DOUBLE PRECISION NOT NULL,
  "feeCad" DOUBLE PRECISION NOT NULL,
  "totalCad" DOUBLE PRECISION NOT NULL,
  "payInProvider" TEXT NOT NULL DEFAULT 'mock',
  "payInRef" TEXT,
  "payoutProvider" TEXT NOT NULL DEFAULT 'mock_momo',
  "payoutRef" TEXT,
  "failureReason" TEXT,
  "quoteId" TEXT UNIQUE,
  "beneficiaryId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  CONSTRAINT "Transfer_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Transfer_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TransferEvent" (
  "id" TEXT PRIMARY KEY,
  "transferId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransferEvent_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Transfer_senderEmail_idx" ON "Transfer"("senderEmail");
CREATE INDEX IF NOT EXISTS "Transfer_status_idx" ON "Transfer"("status");
CREATE INDEX IF NOT EXISTS "Transfer_createdAt_idx" ON "Transfer"("createdAt");
CREATE INDEX IF NOT EXISTS "TransferEvent_transferId_idx" ON "TransferEvent"("transferId");

-- Installations existantes : colonnes ajoutées après coup (idempotent)
ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE "Beneficiary" ADD COLUMN IF NOT EXISTS "bankCode" TEXT;

-- Liste d'attente de l'application WorldSoft Transfer (2026-10-02)
CREATE TABLE IF NOT EXISTS "WaitlistSignup" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL,
  "country" TEXT,
  "locale" TEXT,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "WaitlistSignup_email_key" ON "WaitlistSignup"("email");

-- Demandes de service et colis Shipping (2026-10-03)
CREATE TABLE IF NOT EXISTS "ServiceRequest" (
  "id" TEXT PRIMARY KEY,
  "reference" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "locale" TEXT,
  "payload" JSONB NOT NULL,
  "adminNote" TEXT,
  "slotKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceRequest_reference_key" ON "ServiceRequest"("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceRequest_slotKey_key" ON "ServiceRequest"("slotKey");
CREATE INDEX IF NOT EXISTS "ServiceRequest_kind_idx" ON "ServiceRequest"("kind");
CREATE INDEX IF NOT EXISTS "ServiceRequest_status_idx" ON "ServiceRequest"("status");
CREATE INDEX IF NOT EXISTS "ServiceRequest_createdAt_idx" ON "ServiceRequest"("createdAt");

CREATE TABLE IF NOT EXISTS "Shipment" (
  "id" TEXT PRIMARY KEY,
  "number" TEXT NOT NULL,
  "requestId" TEXT,
  "origin" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'received',
  "weightKg" DOUBLE PRECISION,
  "estimatedDelivery" TIMESTAMP(3),
  "recipientName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Shipment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_number_key" ON "Shipment"("number");
CREATE INDEX IF NOT EXISTS "Shipment_requestId_idx" ON "Shipment"("requestId");
CREATE INDEX IF NOT EXISTS "Shipment_status_idx" ON "Shipment"("status");
CREATE INDEX IF NOT EXISTS "Shipment_createdAt_idx" ON "Shipment"("createdAt");

CREATE TABLE IF NOT EXISTS "ShipmentEvent" (
  "id" TEXT PRIMARY KEY,
  "shipmentId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "location" TEXT,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ShipmentEvent_shipmentId_idx" ON "ShipmentEvent"("shipmentId");
