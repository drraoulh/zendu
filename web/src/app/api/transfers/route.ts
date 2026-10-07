import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildQuote, QuoteLimitError } from "@/lib/quote";
import { createReference } from "@/lib/money";
import { getPayInMode } from "@/lib/providers/payin";
import { mockPayIn } from "@/lib/providers/mock-payin";
import { createStripePayIn } from "@/lib/providers/stripe";
import { INTERAC_PROVIDER, interacInstructions } from "@/lib/providers/interac";
import { getPayoutMode } from "@/lib/providers/payout";
import { getCorridor, getCountry } from "@/lib/corridors";
import { isBankNetwork, MANUAL_BANK_PROVIDER, MOCK_BANK_PROVIDER, publicTransfer } from "@/lib/bank";
import { beneficiaryInputSchema, normalizeBeneficiary } from "@/lib/beneficiary-input";
import { requireAdmin } from "@/lib/admin-auth";
import { getCustomer, hasBearer } from "@/lib/customer-auth";
import { zodIssues } from "@/lib/requests";

const createSchema = z.object({
  corridorId: z.string().default("CA-CM"),
  sendAmount: z.number().positive().optional(),
  sendAmountCad: z.number().positive().optional(),
  // Facultatifs pour un client connecté (remplacés par le titulaire du compte), vérifiés plus bas sinon.
  senderName: z.string().trim().min(2).max(120).optional(),
  senderEmail: z.string().trim().toLowerCase().pipe(z.email().max(254)).optional(),
  beneficiary: beneficiaryInputSchema,
  /** "interac" : virement Interac (envois depuis le Canada en CAD) ; "card" : carte de débit. */
  payMethod: z.enum(["card", "interac"]).default("card"),
});

/** Libellés lisibles des erreurs de validation (le premier est renvoyé dans `error`). */
const FIELD_ERRORS: Record<string, string> = {
  corridorId: "Corridor invalide",
  sendAmount: "Montant invalide",
  sendAmountCad: "Montant invalide",
  senderName: "Nom de l'expéditeur requis (2 caractères minimum)",
  senderEmail: "Courriel de l'expéditeur invalide",
  "beneficiary.fullName": "Nom du bénéficiaire requis (2 caractères minimum)",
  "beneficiary.phone": "Numéro du bénéficiaire invalide",
  "beneficiary.network": "Réseau de réception requis",
  "beneficiary.bankName": "Nom de la banque invalide",
  "beneficiary.accountNumber": "Numéro de compte invalide",
  "beneficiary.bankCode": "Code SWIFT/BIC ou code banque invalide",
  beneficiary: "Coordonnées du bénéficiaire requises",
};

function validationError(error: z.ZodError) {
  const issues = zodIssues(error);
  const first = issues[0];
  const message = (first && FIELD_ERRORS[first.path]) ?? "Données invalides";
  return NextResponse.json({ error: message, issues }, { status: 400 });
}

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
    const json = await request.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    const data = createSchema.parse(json);
    const sendAmount = data.sendAmount ?? data.sendAmountCad;
    if (sendAmount == null) {
      return NextResponse.json({ error: "Montant requis" }, { status: 400 });
    }

    // Client de l'appli connecté : identité vérifiée obligatoire, l'expéditeur est le titulaire du compte.
    const authed = await getCustomer(request);
    // Jeton fourni mais expiré, révoqué ou compte suspendu : on refuse plutôt que de créer
    // un transfert anonyme détaché du compte (et non soumis au contrôle d'identité).
    if (!authed && hasBearer(request)) {
      return NextResponse.json(
        { ok: false, code: "unauthorized", error: "Session expirée. Reconnectez-vous." },
        { status: 401 },
      );
    }
    if (authed && authed.customer.kycStatus !== "verified") {
      return NextResponse.json(
        { error: "Votre identité doit être vérifiée avant d'envoyer de l'argent.", code: "kyc_required" },
        { status: 403 },
      );
    }
    const senderName = authed ? `${authed.customer.firstName} ${authed.customer.lastName}` : data.senderName;
    const senderEmail = authed ? authed.customer.email : data.senderEmail;
    if (!senderName) {
      return NextResponse.json({ error: FIELD_ERRORS.senderName }, { status: 400 });
    }
    if (!senderEmail) {
      return NextResponse.json({ error: FIELD_ERRORS.senderEmail }, { status: 400 });
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
    if (data.payMethod === "interac" && quoteData.sendCurrency !== "CAD") {
      return NextResponse.json({ error: "Le virement Interac n'est possible que pour les envois depuis le Canada (CAD)." }, { status: 400 });
    }
    const interac = data.payMethod === "interac";
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
        senderName,
        senderEmail,
        customerId: authed?.customer.id ?? null,
        sendAmountCad: quoteData.sendAmount,
        receiveAmountXaf: quoteData.receiveAmount,
        rate: quoteData.rate,
        feeCad: quoteData.fee,
        totalCad: quoteData.total,
        payInProvider: interac ? INTERAC_PROVIDER : getPayInMode(),
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
            message: interac
              ? `Transfert ${quoteData.corridorId} créé — en attente du virement Interac`
              : `Transfert ${quoteData.corridorId} créé — en attente de paiement`,
          },
        },
      },
      include: { beneficiary: true },
    });

    if (interac) {
      const payInRef = `interac_${transfer.reference}`;
      await prisma.transfer.update({ where: { id: transfer.id }, data: { payInRef } });
      return NextResponse.json({
        transfer: publicTransfer(transfer),
        payIn: { provider: "interac", sessionId: payInRef, interac: interacInstructions(transfer) },
      });
    }

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
      return validationError(error);
    }
    if (error instanceof QuoteLimitError) {
      return NextResponse.json(
        { error: error.messageFr, code: error.code, limit: error.limit, currency: error.currency },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Erreur création";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
