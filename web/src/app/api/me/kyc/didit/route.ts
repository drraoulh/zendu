import { NextResponse } from "next/server";
import { publicCustomer, requireCustomer } from "@/lib/customer-auth";
import { createDiditSession, DiditError, diditConfigured, syncDiditDecision } from "@/lib/didit";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/me/kyc/didit → { url, customer } : ouvre une session Didit (pièce + selfie) pour le client.
 * GET  /api/me/kyc/didit → { customer, available } : relit la décision chez Didit (au retour dans l'appli) ;
 *   `available` dit à l'appli si la vérification Didit est branchée.
 * Sans DIDIT_API_KEY / DIDIT_WORKFLOW_ID : 503 { code: "didit_unavailable" } (l'appli garde l'ancien parcours).
 */
export async function POST(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  if (!diditConfigured()) {
    return NextResponse.json({ ok: false, code: "didit_unavailable", error: "Vérification en ligne indisponible" }, { status: 503 });
  }
  if (authed.customer.kycStatus === "verified") return NextResponse.json({ customer: publicCustomer(authed.customer) });
  try {
    const { sessionId, url } = await createDiditSession(authed.customer);
    const customer = await prisma.customer.update({
      where: { id: authed.customer.id },
      data: {
        kycProvider: "didit",
        kycSessionId: sessionId,
        kycDocument: "Vérification Didit (pièce d'identité + selfie)",
        kycStatus: "pending",
        kycSubmittedAt: new Date(),
        kycReviewedAt: null,
        kycNote: null,
      },
    });
    return NextResponse.json({ url, customer: publicCustomer(customer) });
  } catch (error) {
    const message = error instanceof DiditError ? error.message : "La vérification n'a pas pu démarrer.";
    return NextResponse.json({ ok: false, code: "didit_error", error: message }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  try {
    const customer = diditConfigured() ? await syncDiditDecision(authed.customer) : authed.customer;
    return NextResponse.json({ customer: publicCustomer(customer), available: diditConfigured() });
  } catch (error) {
    console.error("[didit] lecture de la décision impossible", error instanceof Error ? error.message : error);
    return NextResponse.json({ customer: publicCustomer(authed.customer), available: true });
  }
}
