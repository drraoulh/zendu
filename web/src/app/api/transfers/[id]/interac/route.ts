import { publicErrorMessage } from "@/lib/api-error";
import { NextResponse } from "next/server";
import { z } from "zod";
import { publicTransfer } from "@/lib/bank";
import { prisma } from "@/lib/prisma";
import { requireAdminIdentity } from "@/lib/admin-guard";
import { interacDualApprovalThreshold, needsDualApproval } from "@/lib/interac-approval";
import { getCustomer } from "@/lib/customer-auth";
import { INTERAC_PROVIDER } from "@/lib/providers/interac";
import { markPaymentDetected } from "@/lib/transfer-service";
import { assertTransition } from "@/lib/transfer-machine";
import { notifyCustomer } from "@/lib/transfer-notify";

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

  const me = await requireAdminIdentity(request);
  if (me instanceof NextResponse) return me;

  try {
    if (body.action === "received") {
      const ref = body.interacReference ? `interac:${body.interacReference}` : `interac:${transfer.reference}`;
      if (needsDualApproval(transfer.totalCad)) {
        if (!["awaiting_payment", "expired", "payment_mismatch"].includes(transfer.status)) {
          throw new Error("Ce transfert vient d'être traité par ailleurs. Rechargez la page.");
        }
        if (!transfer.interacApprovedBy) {
          // 1re validation : enregistrée, rien n'est versé. Conditionnelle (deux clics simultanés).
          const { count } = await prisma.transfer.updateMany({
            where: { id, interacApprovedBy: null },
            data: { interacApprovedBy: me.key, interacApprovedByName: me.displayName, interacApprovedAt: new Date() },
          });
          if (!count) throw new Error("Une première validation vient d'être faite par ailleurs. Rechargez la page.");
          await prisma.transferEvent.create({
            data: {
              transferId: id,
              type: "interac_first_approval",
              message: `Virement Interac reçu — 1re validation par ${me.displayName} (${me.username})${body.interacReference ? `, réf. ${body.interacReference}` : ""}. Montant ≥ ${interacDualApprovalThreshold()} : une 2e personne doit approuver.`,
            },
          });
          return NextResponse.json({ ok: true, pendingSecondApproval: true });
        }
        if (transfer.interacApprovedBy === me.key) {
          return NextResponse.json(
            { error: "La 2e validation doit être faite par une autre personne de l'équipe.", code: "same_approver" },
            { status: 409 },
          );
        }
        await prisma.transferEvent.create({
          data: { transferId: id, type: "interac_second_approval", message: `2e validation par ${me.displayName} (${me.username}) : versement autorisé.` },
        });
      }
      const updated = await markPaymentDetected(id, ref);
      return NextResponse.json(updated ? publicTransfer(updated) : updated);
    }

    assertTransition(transfer.status, "payment_mismatch");
    const reason = body.reason || "Montant ou message du virement Interac incorrect";
    // Conditionnel : un double clic n'enregistre (et ne notifie) qu'une fois.
    const { count } = await prisma.transfer.updateMany({
      where: { id, status: transfer.status },
      // Une 1re validation éventuelle ne compte plus : tout est à revérifier.
      data: { status: "payment_mismatch", failureReason: reason, interacApprovedBy: null, interacApprovedByName: null, interacApprovedAt: null },
    });
    if (!count) throw new Error("Ce transfert vient d'être traité par ailleurs. Rechargez la page.");
    await prisma.transferEvent.create({ data: { transferId: id, type: "payment_mismatch", message: reason } });
    await notifyCustomer(id, "payment_mismatch");
    const updated = await prisma.transfer.findUnique({ where: { id }, include: { beneficiary: true } });
    return NextResponse.json(updated ? publicTransfer(updated) : updated);
  } catch (error) {
    return NextResponse.json({ error: publicErrorMessage(error) }, { status: 400 });
  }
}
