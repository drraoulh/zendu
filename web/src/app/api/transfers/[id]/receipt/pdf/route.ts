import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReceiptByTransferId } from "@/lib/receipt";
import { receiptPdfLang, renderReceiptPdf } from "@/lib/receipt-pdf";
import { maskEmail, maskName, maskPhone, notFound, transferAccess } from "../../_access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/transfers/[id]/receipt/pdf?lang=fr|en|es — reçu PDF.
 * Mêmes droits que le reçu JSON : complet pour l'équipe et le client propriétaire (Bearer),
 * coordonnées masquées pour un envoi sans compte consulté par lien, 404 pour un tiers.
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const owner = await prisma.transfer.findUnique({ where: { id }, select: { customerId: true } });
  if (!owner) return NextResponse.json({ error: "Reçu introuvable" }, { status: 404 });
  const access = await transferAccess(request, owner);
  if (access instanceof NextResponse) return access;

  let receipt = await getReceiptByTransferId(id);
  if (!receipt) return notFound();
  if (access !== "full") {
    receipt = {
      ...receipt,
      sender: { name: maskName(receipt.sender.name), email: maskEmail(receipt.sender.email) },
      recipient: { ...receipt.recipient, name: maskName(receipt.recipient.name), phone: maskPhone(receipt.recipient.phone), bankCode: null },
      payoutRef: null,
    };
  }

  const url = new URL(request.url);
  const lang = receiptPdfLang(url.searchParams.get("lang") ?? request.headers.get("accept-language"));
  const pdf = await renderReceiptPdf(receipt, { lang });
  const filename = `recu-${receipt.reference}.pdf`.replace(/[^\w.-]/g, "");
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${url.searchParams.get("download") ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
