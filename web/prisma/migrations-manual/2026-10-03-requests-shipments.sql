-- PWFINTECH — 2026-10-03 — Demandes de service (POST /api/requests, /admin/demandes) et colis Shipping
-- (suivi public GET /api/shipments/track, /admin/colis).
-- À exécuter une fois dans Supabase > SQL Editor. Idempotent : peut être relancé sans risque.
-- "slotKey" (unique) empêche la double réservation d'un créneau de rendez-vous Finances.

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
