import { NextResponse } from "next/server";
import { publicCustomer, requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { diditConfigured } from "@/lib/didit";
import { isLiveMode } from "@/lib/mode";

export const dynamic = "force-dynamic";

/**
 * POST /api/me/kyc { document } → { customer } — dossier soumis, statut « pending ».
 * Validation par l'équipe dans /admin/clients. KYC_AUTO_APPROVE=true (démo) valide immédiatement.
 * Les photos ne transitent pas encore : à brancher sur le SDK d'un prestataire KYC.
 */
export async function POST(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  if (authed.customer.kycStatus === "verified") return NextResponse.json({ customer: publicCustomer(authed.customer) });
  // Didit branché : la déclaration sans photo n'est plus acceptée (POST /api/me/kyc/didit).
  if (diditConfigured()) {
    return NextResponse.json({ ok: false, code: "use_didit", error: "Faites la vérification en ligne (pièce d'identité + selfie)." }, { status: 409 });
  }
  const body = (await request.json().catch(() => ({}))) as { document?: unknown };
  const document = typeof body.document === "string" ? body.document.trim().slice(0, 80) : "";
  if (!document) return NextResponse.json({ ok: false, error: "Type de pièce requis" }, { status: 400 });
  // Démo seulement : en mode réel, aucune identité n'est validée sans contrôle.
  const auto = process.env.KYC_AUTO_APPROVE === "true" && !isLiveMode();
  const now = new Date();
  const customer = await prisma.customer.update({
    where: { id: authed.customer.id },
    data: {
      kycDocument: document,
      kycSubmittedAt: now,
      kycStatus: auto ? "verified" : "pending",
      kycReviewedAt: auto ? now : null,
      kycNote: auto ? "Validation automatique (mode démo)" : null,
    },
  });
  return NextResponse.json({ customer: publicCustomer(customer) });
}
