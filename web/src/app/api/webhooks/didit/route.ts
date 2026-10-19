import { after, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { diditConfigured, syncDiditDecision, verifyDiditSignature } from "@/lib/didit";
import { isLiveMode } from "@/lib/mode";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Webhook Didit : POST https://<domaine>/api/webhooks/didit (destination déclarée dans la console Didit,
 * secret dans DIDIT_WEBHOOK_SECRET). Événements utiles à abonner : status.updated, data.updated,
 * user.status.updated (les autres sont acceptés et enregistrés sans effet).
 *
 * 1. Corps lu en brut, signature vérifiée AVANT tout traitement (X-Signature brut, X-Signature-V2, Simple),
 *    puis fraîcheur sur le `timestamp` signé du corps (≤ 5 min).
 * 2. Anti-doublon atomique et durable : insertion de event_id (clé primaire) ; un doublon répond 200 sans rien refaire.
 * 3. Réponse 200 immédiate ; le traitement se fait juste après (after) : la décision est redemandée à Didit
 *    avec notre clé, jamais lue dans le corps. Filet de sécurité : l'appli relit aussi le statut (GET /api/me).
 * Aucune donnée d'identité n'est journalisée ni stockée ici.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const signature = verifyDiditSignature(raw, body, request.headers);
  // Sans secret, rien n'est accepté en mode réel ; en démo la décision est de toute façon relue chez Didit.
  if (!signature || (signature === "none" && isLiveMode())) {
    // Pour diagnostiquer, uniquement des métadonnées (jamais le corps : il contient des données d'identité).
    console.error("[didit] webhook refusé (signature ou horodatage)", {
      bytes: raw.length,
      type: typeof body.webhook_type === "string" ? body.webhook_type : null,
      v2: request.headers.has("x-signature-v2"),
      raw: request.headers.has("x-signature"),
      simple: request.headers.has("x-signature-simple"),
    });
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  const str = (v: unknown, max = 120) => (typeof v === "string" && v ? v.slice(0, max) : null);
  const webhookType = str(body.webhook_type) ?? "unknown";
  const sessionId = str(body.session_id);
  const status = str(body.status, 40);
  // Clé d'unicité : event_id, sinon session_id + status + webhook_type + timestamp (secours documenté).
  const eventId = str(body.event_id) ?? `${sessionId ?? "-"}:${status ?? "-"}:${webhookType}:${String(body.timestamp ?? "")}`;

  try {
    await prisma.diditWebhookEvent.create({ data: { eventId, webhookType, sessionId, status, signature } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Base indisponible : 5xx pour que Didit réessaie (≈ 1 min puis ≈ 4 min).
    console.error("[didit] enregistrement du webhook impossible", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Réessayez plus tard" }, { status: 503 });
  }

  after(() => processEvent(eventId, webhookType, sessionId, body, signature));
  return NextResponse.json({ received: true });
}

async function processEvent(
  eventId: string,
  webhookType: string,
  sessionId: string | null,
  body: Record<string, unknown>,
  signature: string,
) {
  let outcome = "ignored";
  try {
    if ((webhookType === "status.updated" || webhookType === "data.updated") && sessionId && diditConfigured()) {
      // Seule la dernière session du client compte (une ancienne session ne peut rien changer).
      const customer = await prisma.customer.findFirst({ where: { kycProvider: "didit", kycSessionId: sessionId } });
      if (customer) {
        const updated = await syncDiditDecision(customer);
        outcome = `kyc:${updated.kycStatus}`;
      } else {
        outcome = "unknown_session";
      }
    } else if (webhookType === "user.status.updated") {
      // Entité Didit ACTIVE / FLAGGED / BLOCKED (vendor_data = notre id client). BLOCKED (liste noire,
      // décision de l'équipe dans la console) bloque les envois — seulement si tout le corps est signé.
      const entity = typeof body.status === "string" ? body.status.slice(0, 20) : "?";
      outcome = `user:${entity}`;
      const customerId = typeof body.vendor_data === "string" ? body.vendor_data : null;
      if (entity === "BLOCKED" && customerId && (signature === "raw" || signature === "v2")) {
        const { count } = await prisma.customer.updateMany({
          where: { id: customerId, kycProvider: "didit" },
          data: { kycStatus: "rejected", kycReviewedAt: new Date(), kycNote: "Compte bloqué après vérification. Contactez le support." },
        });
        outcome = count ? "user:BLOCKED:applied" : "user:BLOCKED:unknown";
      }
    }
  } catch (error) {
    outcome = `error:${(error instanceof Error ? error.message : "inconnue").slice(0, 120)}`;
    console.error("[didit] traitement du webhook impossible", eventId, outcome);
  }
  await prisma.diditWebhookEvent
    .update({ where: { eventId }, data: { processedAt: new Date(), outcome } })
    .catch(() => undefined);
}
