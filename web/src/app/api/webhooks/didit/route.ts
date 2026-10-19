import { NextResponse } from "next/server";
import { diditConfigured, syncDiditDecision, verifyDiditSignature } from "@/lib/didit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Webhook Didit (à déclarer dans la console Didit : https://<domaine>/api/webhooks/didit).
 * On ne retient que session_id (signature vérifiée si DIDIT_WEBHOOK_SECRET est défini), puis la
 * décision est redemandée à Didit avec notre clé : un faux rappel ne peut pas valider une identité.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  let body: { session_id?: unknown; status?: unknown; timestamp?: unknown; webhook_type?: unknown } | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body || !verifyDiditSignature(body, request.headers.get("x-signature-simple"), request.headers.get("x-timestamp"))) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }
  const sessionId = typeof body.session_id === "string" ? body.session_id.slice(0, 100) : "";
  if (!sessionId || !diditConfigured()) return NextResponse.json({ received: true });

  const customer = await prisma.customer.findFirst({ where: { kycProvider: "didit", kycSessionId: sessionId } });
  if (customer) {
    try {
      await syncDiditDecision(customer);
    } catch (error) {
      console.error("[didit] décision introuvable après rappel", error instanceof Error ? error.message : error);
    }
  }
  // Réponse identique dans tous les cas : le rappel ne révèle pas quelles sessions existent.
  return NextResponse.json({ received: true });
}
