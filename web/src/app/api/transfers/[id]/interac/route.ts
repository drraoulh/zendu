import { NextResponse } from "next/server";
import { z } from "zod";
import { publicTransfer } from "@/lib/bank";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getCustomer } from "@/lib/customer-auth";
import { INTERAC_PROVIDER } from "@/lib/providers/interac";
import { markPaymentDetected } from "@/lib/transfer-service";
import { assertTransition } from "@/lib/transfer-machine";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.discriminatedUnion("action", [
  /** Client (titulaire du transfert) : « j'ai envoyé le virement » — simple signal pour l'équipe. */
  z.object({ action: z.literal("declare") }),
  /** Équipe : virement reçu sur le compte de dépôt → paiement confirmé, le versement part. */
  z.object({ action: z.literal("received"), interacReference: z.string().trim().max(80).optional() }),
  /** Équipe : virement reçu mais montant ou message incorrect. */
  z.object({ action: z.literal("mismatch"), reason: z.string().trim().max(300).optional() }),
]);

const DECLARED = "interac_declared";

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  const body = parsed.data;

  const transfer = await prisma.transfer.findUnique({ where: { id } });
  if (!transfer || transfer.payInProvider !== INTERAC_PROVIDER) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (body.action === "declare") {
    const authed = await getCustomer(request);
    if (!authed || authed.customer.id !== transfer.customerId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (transfer.status !== "awaiting_payment") return NextResponse.json({ ok: true, status: transfer.status });
    const already = await prisma.transferEvent.findFirst({ where: { transferId: id, type: DECLARED } });
    if (!already) {
      await prisma.transferEvent.create({
        data: { transferId: id, type: DECLARED, message: "Le client indique avoir envoyé le virement Interac" },
      });
    }
    return NextResponse.json({ ok: true, status: transfer.status });
  }

  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    if (body.action === "received") {
      const ref = body.interacReference ? `interac:${body.interacReference}` : `interac:${transfer.reference}`;
      const updated = await markPaymentDetected(id, ref);
      return NextResponse.json(updated ? publicTransfer(updated) : updated);
    }

    assertTransition(transfer.status, "payment_mismatch");
    const reason = body.reason || "Montant ou message du virement Interac incorrect";
    await prisma.transfer.update({ where: { id }, data: { status: "payment_mismatch", failureReason: reason } });
    await prisma.transferEvent.create({ data: { transferId: id, type: "payment_mismatch", message: reason } });
    const updated = await prisma.transfer.findUnique({ where: { id }, include: { beneficiary: true } });
    return NextResponse.json(updated ? publicTransfer(updated) : updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur" }, { status: 400 });
  }
}
