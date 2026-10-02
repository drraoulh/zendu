import { NextResponse } from "next/server";
import { z } from "zod";
import { publicTransfer } from "@/lib/bank";
import { prisma } from "@/lib/prisma";
import { completeManualBankPayout } from "@/lib/transfer-service";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  outcome: z.enum(["delivered", "failed"]).default("delivered"),
  bankReference: z.string().trim().max(80).optional(),
  reason: z.string().trim().max(300).optional(),
});

/**
 * Action opérateur : session admin (/admin/login) ou jeton ADMIN_API_TOKEN en
 * `Authorization: Bearer …` (compatibilité scripts). Voir src/lib/admin-auth.ts.
 */
async function guard(request: Request): Promise<NextResponse | null> {
  return requireAdmin(request);
}

/** Opérateur : coordonnées bancaires complètes nécessaires pour émettre le virement. */
export async function GET(request: Request, { params }: Params) {
  const denied = await guard(request);
  if (denied) return denied;
  const { id } = await params;
  const transfer = await prisma.transfer.findUnique({
    where: { id },
    include: { beneficiary: true },
  });
  if (!transfer) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const b = transfer.beneficiary;
  return NextResponse.json({
    reference: transfer.reference,
    status: transfer.status,
    payoutProvider: transfer.payoutProvider,
    amount: transfer.receiveAmountXaf,
    currency: transfer.receiveCurrency,
    fullName: b.fullName,
    phone: b.phone,
    country: b.country,
    bankName: b.bankName,
    accountNumber: b.accountNumber,
    bankCode: b.bankCode,
  });
}

/**
 * Opérateur : clôture un virement bancaire traité manuellement (payoutProvider "manual_bank").
 * POST { outcome: "delivered" | "failed", bankReference?, reason? }
 */
export async function POST(request: Request, { params }: Params) {
  const denied = await guard(request);
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const updated = await completeManualBankPayout(id, body);
    return NextResponse.json(updated ? publicTransfer(updated) : updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Erreur virement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
