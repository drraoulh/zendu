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

export async function createDiditSession(customer: Pick<Customer, "id">): Promise<{ sessionId: string; url: string; sessionToken: string | null }> {
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
  const data = (await res.json().catch(() => null)) as { session_id?: string; url?: string; session_token?: string } | null;
  if (!res.ok || !data?.session_id || !data.url) {
    console.error("[didit] création de session refusée", res.status);
    throw new DiditError("La vérification n'a pas pu démarrer. Réessayez dans un instant.");
  }
  return { sessionId: data.session_id, url: data.url, sessionToken: typeof data.session_token === "string" ? data.session_token : null };
}

/**
 * Statut exact de la session chez Didit (sensible à la casse) : "Approved", "Declined", "In Review",
 * "In Progress", "Not Started", "Abandoned", "Expired", "Kyc Expired", "Resubmitted", "Awaiting User".
 */
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
  if (customer.kycProvider !== "didit" || !customer.kycSessionId) return customer;
  const { status, vendorData } = await getDiditStatus(customer.kycSessionId);
  // Une identité validée ne change plus, sauf expiration de la vérification (politique Didit).
  if (customer.kycStatus === "verified" && status !== "Kyc Expired" && status !== "KYC Expired") return customer;
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
  } else if (status === "In Review" || status === "In Progress") {
    // En cours ou en examen manuel chez Didit : le client attend.
    data = { kycStatus: "pending", kycNote: null };
  } else if (status === "Resubmitted") {
    // Didit demande de refaire certaines étapes : le client relance la vérification depuis l'appli.
    data = { kycStatus: "rejected", kycReviewedAt: now, kycNote: "Certaines étapes sont à refaire (photo floue ou incomplète). Reprenez la vérification." };
  } else if (status === "Kyc Expired" || status === "KYC Expired") {
    data = { kycStatus: "none", kycNote: "Votre vérification d'identité a expiré : refaites-la pour continuer à envoyer." };
  } else if ((status === "Abandoned" || status === "Expired") && customer.kycStatus === "pending") {
    // Parcours non terminé : le client peut recommencer.
    data = { kycStatus: "none", kycNote: null };
  }
  // "Not Started", "Awaiting User" : rien ne change.
  if (!data || (data.kycStatus === customer.kycStatus && data.kycNote === customer.kycNote)) return customer;
  return prisma.customer.update({ where: { id: customer.id }, data });
}

/** Normalisation de Didit : un flottant entier est écrit comme un entier (100.0 → 100). */
function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(shortenFloats);
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, shortenFloats(v)]));
  }
  if (typeof data === "number" && !Number.isInteger(data) && data % 1 === 0) return Math.trunc(data);
  return data;
}

function sortKeys(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(sortKeys);
  if (data !== null && typeof data === "object") {
    const o = data as Record<string, unknown>;
    return Object.keys(o)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys(o[k]);
        return acc;
      }, {});
  }
  return data;
}

function sameHex(expected: string, given: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type DiditSignature = "raw" | "v2" | "simple" | "none";

/**
 * Signature des webhooks Didit (https://docs.didit.me/integration/webhooks), comparée en temps constant :
 * 1. X-Signature : HMAC-SHA256 des octets bruts reçus (le plus strict, rien n'est réencodé) ;
 * 2. X-Signature-V2 (recommandée) : HMAC du JSON canonique (clés triées, compact, Unicode conservé) ;
 * 3. X-Signature-Simple (dépréciée) : HMAC de "{timestamp}:{session_id}:{status}:{webhook_type}" —
 *    n'authentifie pas la décision, mais on ne la lit jamais dans le corps (relue chez Didit).
 * Ensuite seulement, fraîcheur sur le champ SIGNÉ `timestamp` du corps (≤ 5 min). L'en-tête X-Timestamp
 * n'est couvert par aucune signature : il n'est jamais utilisé.
 * Renvoie la méthode acceptée, ou null. Sans DIDIT_WEBHOOK_SECRET : "none" (refusé en mode réel).
 */
export function verifyDiditSignature(raw: string, body: Record<string, unknown>, headers: Headers): DiditSignature | null {
  const secret = process.env.DIDIT_WEBHOOK_SECRET?.trim();
  if (!secret) return "none";
  const hmac = (text: string) => createHmac("sha256", secret).update(text, "utf8").digest("hex");

  let method: DiditSignature | null = null;
  const rawSig = headers.get("x-signature");
  const v2 = headers.get("x-signature-v2");
  const simple = headers.get("x-signature-simple");
  if (rawSig && sameHex(hmac(raw), rawSig)) method = "raw";
  else if (v2 && sameHex(hmac(JSON.stringify(sortKeys(shortenFloats(body)))), v2)) method = "v2";
  else if (simple) {
    const canonical = [body.timestamp ?? "", body.session_id ?? "", body.status ?? "", body.webhook_type ?? ""].map(String).join(":");
    if (sameHex(hmac(canonical), simple)) method = "simple";
  }
  if (!method) return null;

  const ts = Number(body.timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return null;
  return method;
}
