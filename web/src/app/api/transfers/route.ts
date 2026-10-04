import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildQuote } from "@/lib/quote";
import { createReference } from "@/lib/money";
import { getPayInMode } from "@/lib/providers/payin";
import { mockPayIn } from "@/lib/providers/mock-payin";
import { createStripePayIn } from "@/lib/providers/stripe";
import { getPayoutMode } from "@/lib/providers/payout";
import { getCorridor, getCountry } from "@/lib/corridors";
import { isBankNetwork, MANUAL_BANK_PROVIDER, MOCK_BANK_PROVIDER, publicTransfer } from "@/lib/bank";
import { beneficiaryInputSchema, normalizeBeneficiary } from "@/lib/beneficiary-input";
import { requireAdmin } from "@/lib/admin-auth";

const createSchema = z.object({
  corridorId: z.string().default("CA-CM"),
  sendAmount: z.number().positive().optional(),
  sendAmountCad: z.number().positive().optional(),
  senderName: z.string().min(2),
  senderEmail: z.string().email(),
  beneficiary: beneficiaryInputSchema,
});

/** Liste complète : réservée à l'admin (contient les données de tous les clients). */
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const transfers = await prisma.transfer.findMany({
    include: { beneficiary: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(transfers.map(publicTransfer));
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createSchema.parse(json);
    const sendAmount = data.sendAmount ?? data.sendAmountCad;
    if (sendAmount == null) {
      return NextResponse.json({ error: "Montant requis" }, { status: 400 });
    }

    const corridor = getCorridor(data.corridorId);
    if (!corridor?.active) {
      return NextResponse.json(
        { error: "Corridor indisponible" },
        { status: 400 },
      );
    }

    const normalized = await normalizeBeneficiary(data.beneficiary, corridor.destination);
    if (!normalized.ok) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }
    const bank = isBankNetwork(normalized.data.network, corridor.destination);

    const quoteData = await buildQuote({
      corridorId: data.corridorId,
      sendAmount,
    });
    const reference = createReference();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const beneficiary = await prisma.beneficiary.create({
      data: normalized.data,
    });

    const quote = await prisma.quote.create({
      data: {
        corridorId: quoteData.corridorId,
        sendCurrency: quoteData.sendCurrency,
        receiveCurrency: quoteData.receiveCurrency,
        sendAmountCad: quoteData.sendAmount,
        receiveAmountXaf: quoteData.receiveAmount,
        rate: quoteData.rate,
        feeCad: quoteData.fee,
        totalCad: quoteData.total,
        expiresAt: quoteData.expiresAt,
      },
    });

    const transfer = await prisma.transfer.create({
      data: {
        reference,
        status: "awaiting_payment",
        corridorId: quoteData.corridorId,
        sourceCountry: quoteData.sourceCountry,
        destCountry: quoteData.destCountry,
        sendCurrency: quoteData.sendCurrency,
        receiveCurrency: quoteData.receiveCurrency,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        sendAmountCad: quoteData.sendAmount,
        receiveAmountXaf: quoteData.receiveAmount,
        rate: quoteData.rate,
        feeCad: quoteData.fee,
        totalCad: quoteData.total,
        payInProvider: getPayInMode(),
        // MoMo ne paie pas de comptes bancaires : simulation en démo, traitement manuel sinon.
        payoutProvider: bank
          ? getPayoutMode() === "momo"
            ? MANUAL_BANK_PROVIDER
            : MOCK_BANK_PROVIDER
          : getPayoutMode(),
        quoteId: quote.id,
        beneficiaryId: beneficiary.id,
        events: {
          create: {
            type: "created",
            message: `Transfert ${quoteData.corridorId} créé — en attente de paiement`,
          },
        },
      },
      include: { beneficiary: true },
    });

    const payIn =
      getPayInMode() === "stripe" ? createStripePayIn() : mockPayIn;

    const session = await payIn.createSession({
      transferId: transfer.id,
      reference: transfer.reference,
      amountCad: transfer.totalCad,
      currency: transfer.sendCurrency,
      routeLabel: `${getCountry(transfer.sourceCountry).name} → ${getCountry(transfer.destCountry).name}`,
      customerEmail: transfer.senderEmail,
      successUrl: `${appUrl}/transfers/${transfer.id}?paid=1`,
      cancelUrl: `${appUrl}/transfers/${transfer.id}?cancelled=1`,
    });

    await prisma.transfer.update({
      where: { id: transfer.id },
      data: { payInRef: session.sessionId },
    });

    return NextResponse.json({
      transfer: publicTransfer(transfer),
      payIn: session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Erreur création";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
