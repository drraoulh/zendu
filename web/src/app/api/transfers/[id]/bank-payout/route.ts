import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { publicTransfer } from "@/lib/bank";
import { prisma } from "@/lib/prisma";
import { completeManualBankPayout } from "@/lib/transfer-service";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  outcome: z.enum(["delivered", "failed"]).default("delivered"),
  bankReference: z.string().trim().max(80).optional(),
  reason: z.string().trim().max(300).optional(),
});

/** Le site n'a pas de rôle « admin » : cette action opérateur est protégée par ADMIN_API_TOKEN. */
function authorized(request: Request): boolean {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ")
    ? header.slice(7)
    : (request.headers.get("x-admin-token") ?? "");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function guard(request: Request): NextResponse | null {
  if (!process.env.ADMIN_API_TOKEN) {
    return NextResponse.json(
      { error: "Action opérateur désactivée : définissez ADMIN_API_TOKEN" },
      { status: 503 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Jeton opérateur invalide" }, { status: 401 });
  }
  return null;
}

/** Opérateur : coordonnées bancaires complètes nécessaires pour émettre le virement. */
export async function GET(request: Request, { params }: Params) {
  const denied = guard(request);
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
  const denied = guard(request);
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
