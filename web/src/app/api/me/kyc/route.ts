import { NextResponse } from "next/server";
import { publicCustomer, requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

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
  const body = (await request.json().catch(() => ({}))) as { document?: unknown };
  const document = typeof body.document === "string" ? body.document.trim().slice(0, 80) : "";
  if (!document) return NextResponse.json({ ok: false, error: "Type de pièce requis" }, { status: 400 });
  const auto = process.env.KYC_AUTO_APPROVE === "true";
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
