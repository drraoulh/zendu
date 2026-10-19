import { createHmac, timingSafeEqual } from "node:crypto";
import type { Customer, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Vérification d'identité par Didit (https://didit.me) : pièce d'identité + selfie sur la page
 * hébergée par Didit, puis décision automatique.
 *
 * Variables (Vercel) :
 * - DIDIT_API_KEY : clé API (console business.didit.me) ;
 * - DIDIT_WORKFLOW_ID : identifiant du parcours de vérification créé dans la console ;
 * - DIDIT_WEBHOOK_SECRET : secret du webhook (facultatif mais recommandé) ;
 * - DIDIT_CALLBACK_URL : page affichée à la fin (défaut : NEXT_PUBLIC_APP_URL/kyc/termine) ;
 * - DIDIT_API_URL : défaut https://verification.didit.me.
 *
 * Le résultat n'est jamais cru sur parole : à chaque rappel, on redemande la décision à Didit
 * avec notre clé (GET /v3/session/{id}/decision/), et c'est elle qui fait foi.
 */

export function diditConfigured(): boolean {
  return Boolean(process.env.DIDIT_API_KEY?.trim() && process.env.DIDIT_WORKFLOW_ID?.trim());
}

function base(): string {
  return (process.env.DIDIT_API_URL?.trim() || "https://verification.didit.me").replace(/\/$/, "");
}

function headers() {
  return { "x-api-key": process.env.DIDIT_API_KEY!.trim(), "Content-Type": "application/json", Accept: "application/json" };
}

export class DiditError extends Error {}

export async function createDiditSession(customer: Pick<Customer, "id">): Promise<{ sessionId: string; url: string }> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  let res: Response;
  try {
    res = await fetch(`${base()}/v3/session/`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        workflow_id: process.env.DIDIT_WORKFLOW_ID!.trim(),
        // Notre identifiant client : jamais le courriel ni le nom.
        vendor_data: customer.id,
        // Page de vérification en français.
        language: "fr",
        callback: process.env.DIDIT_CALLBACK_URL?.trim() || `${appUrl}/kyc/termine`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new DiditError("Service de vérification injoignable. Réessayez dans un instant.");
  }
  const data = (await res.json().catch(() => null)) as { session_id?: string; url?: string } | null;
  if (!res.ok || !data?.session_id || !data.url) {
    console.error("[didit] création de session refusée", res.status);
    throw new DiditError("La vérification n'a pas pu démarrer. Réessayez dans un instant.");
  }
  return { sessionId: data.session_id, url: data.url };
}

/** Statut de la session chez Didit : "Approved", "Declined", "In Review", "Not Started", "In Progress", "Abandoned", "Expired"… */
export async function getDiditStatus(sessionId: string): Promise<{ status: string; vendorData: string | null }> {
  const res = await fetch(`${base()}/v3/session/${encodeURIComponent(sessionId)}/decision/`, {
    headers: headers(),
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as { status?: string; vendor_data?: string } | null;
  if (!res.ok || typeof data?.status !== "string") throw new DiditError(`Décision Didit indisponible (${res.status})`);
  return { status: data.status, vendorData: typeof data.vendor_data === "string" ? data.vendor_data : null };
}

/**
 * Applique la décision Didit au compte client. Une identité déjà validée n'est jamais rétrogradée
 * par une ancienne session ; un refus fait par l'équipe n'est remplacé que par une nouvelle décision.
 */
export async function syncDiditDecision(customer: Customer): Promise<Customer> {
  if (customer.kycProvider !== "didit" || !customer.kycSessionId || customer.kycStatus === "verified") return customer;
  const { status, vendorData } = await getDiditStatus(customer.kycSessionId);
  // La session doit bien appartenir à ce client.
  if (vendorData && vendorData !== customer.id) {
    console.error("[didit] session d'un autre client ignorée");
    return customer;
  }
  const now = new Date();
  let data: (Prisma.CustomerUpdateInput & { kycStatus: string; kycNote: string | null }) | null = null;
  if (status === "Approved") {
    data = { kycStatus: "verified", kycReviewedAt: now, kycNote: "Identité vérifiée par Didit" };
  } else if (status === "Declined") {
    data = {
      kycStatus: "rejected",
      kycReviewedAt: now,
      kycNote: "Vérification refusée : document illisible, expiré ou selfie non concordant. Recommencez avec une pièce valide.",
    };
  } else if (status === "In Review") {
    data = { kycStatus: "pending", kycNote: null };
  } else if ((status === "Abandoned" || status === "Expired" || status === "KYC Expired") && customer.kycStatus === "pending") {
    // Parcours non terminé : le client peut recommencer.
    data = { kycStatus: "none", kycNote: null };
  }
  if (!data || (data.kycStatus === customer.kycStatus && data.kycNote === customer.kycNote)) return customer;
  return prisma.customer.update({ where: { id: customer.id }, data });
}

/**
 * Signature « simple » des webhooks Didit (en-tête X-Signature-Simple) :
 * HMAC-SHA256 de "{timestamp}:{session_id}:{status}:{webhook_type}" avec le secret du webhook.
 * Insensible au réencodage du JSON. Rappels de plus de 5 minutes refusés.
 */
export function verifyDiditSignature(
  body: { timestamp?: unknown; session_id?: unknown; status?: unknown; webhook_type?: unknown },
  signature: string | null,
  timestampHeader: string | null,
): boolean {
  const secret = process.env.DIDIT_WEBHOOK_SECRET?.trim();
  if (!secret) return true; // Pas de secret : la décision est de toute façon redemandée à Didit.
  if (!signature) return false;
  const ts = Number(timestampHeader ?? body.timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;
  const canonical = [body.timestamp ?? "", body.session_id ?? "", body.status ?? "", body.webhook_type ?? ""].map(String).join(":");
  const expected = Buffer.from(createHmac("sha256", secret).update(canonical, "utf8").digest("hex"), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}
