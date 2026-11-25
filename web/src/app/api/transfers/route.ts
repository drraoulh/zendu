import { publicErrorMessage } from "@/lib/api-error";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildQuote, QuoteLimitError } from "@/lib/quote";
import { createReference } from "@/lib/money";
import { getPayInMode } from "@/lib/providers/payin";
import { mockPayIn } from "@/lib/providers/mock-payin";
import { createStripePayIn } from "@/lib/providers/stripe";
import { INTERAC_PROVIDER, interacInstructions } from "@/lib/providers/interac";
import { MANUAL_PAYIN_PROVIDER, manualPayInInstructions, manualPayInMax } from "@/lib/providers/manual-payin";
import { payoutProviderFor } from "@/lib/providers/payout";
import { isLiveMode, payMethodsFor, transferLimits } from "@/lib/mode";
import { getFxRate, rateIsTrustworthy } from "@/lib/fx";
import { getCorridor, getCountry } from "@/lib/corridors";
import { customerTransfer, isBankNetwork, publicTransfer } from "@/lib/bank";
import { beneficiaryInputSchema, normalizeBeneficiary } from "@/lib/beneficiary-input";
import { requireAdmin } from "@/lib/admin-guard";
import { alertTeam } from "@/lib/team-alert";
import { getCustomer, hasBearer, passwordChangeRequired } from "@/lib/customer-auth";
import { zodIssues } from "@/lib/requests";
import { rateLimit } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

const createSchema = z.object({
  corridorId: z.string().default("CA-CM"),
  sendAmount: z.number().positive().optional(),
  sendAmountCad: z.number().positive().optional(),
  /** Montant exact que le destinataire doit recevoir (le montant envoyé est alors calculé). */
  receiveAmount: z.number().positive().optional(),
  // Facultatifs pour un client connecté (remplacés par le titulaire du compte), vérifiés plus bas sinon.
  senderName: z.string().trim().min(2).max(120).optional(),
  senderEmail: z.string().trim().toLowerCase().pipe(z.email().max(254)).optional(),
  beneficiary: beneficiaryInputSchema,
  /** "interac" : virement Interac (envois depuis le Canada en CAD) ; "card" : carte de débit. */
  payMethod: z.enum(["card", "interac", "manual"]).default("card"),
  /** Total et montant reçu que le client a vus : refusé (409) si le taux a changé depuis. */
  expectedTotal: z.number().positive().optional(),
  expectedReceive: z.number().positive().optional(),
});

/** Clé d'idempotence valide (UUID ou équivalent) envoyée par l'appli. */
function idempotencyKeyOf(request: Request): string | null {
  const v = request.headers.get("idempotency-key")?.trim();
  return v && /^[A-Za-z0-9_-]{8,80}$/.test(v) ? v : null;
}

type ExistingTransfer = Awaited<ReturnType<typeof findExisting>>;

function findExisting(customerId: string, key: string) {
  return prisma.transfer.findFirst({ where: { customerId, idempotencyKey: key }, include: { beneficiary: true } });
}

/** Même demande renvoyée (réessai après coupure) : on rend le transfert déjà créé, sans en créer un autre. */
function replayExisting(existing: NonNullable<ExistingTransfer>) {
  if (existing.payInProvider === INTERAC_PROVIDER && existing.payInRef) {
    return NextResponse.json({
      transfer: customerTransfer(existing),
      payIn: { provider: "interac", sessionId: existing.payInRef, interac: interacInstructions(existing) },
    });
  }
  if (existing.payInProvider === MANUAL_PAYIN_PROVIDER && existing.payInRef) {
    return NextResponse.json({
      transfer: customerTransfer(existing),
      payIn: { provider: "manual", sessionId: existing.payInRef, manual: manualPayInInstructions(existing, !isLiveMode()) },
    });
  }
  return NextResponse.json({ error: "Ce transfert a déjà été créé. Consultez-le dans votre historique.", code: "duplicate_request", transferId: existing.id }, { status: 409 });
}

/** Libellés lisibles des erreurs de validation (le premier est renvoyé dans `error`). */
const FIELD_ERRORS: Record<string, string> = {
  corridorId: "Corridor invalide",
  sendAmount: "Montant invalide",
  sendAmountCad: "Montant invalide",
  receiveAmount: "Montant invalide",
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

class CustomerLimitError extends Error {
  constructor(readonly left: number, readonly period: string, readonly max: number, readonly currency = "$") {
    super("customer_limit");
  }
}

export async function POST(request: Request) {
  // Renseigné une fois le client identifié : sert à rejouer la réponse si deux demandes identiques se croisent.
  let replayKey: { customerId: string; key: string } | null = null;
  try {
    const json = await request.json().catch(() => null);
    if (!json || typeof json !== "object") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    const data = createSchema.parse(json);
    const sendAmount = data.sendAmount ?? data.sendAmountCad;
    const receiveAmount = sendAmount == null ? data.receiveAmount : undefined;
    if (sendAmount == null && receiveAmount == null) {
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
    // Mode réel : uniquement depuis un compte client à l'identité vérifiée (jamais d'envoi anonyme).
    if (!authed && isLiveMode()) {
      return NextResponse.json(
        { error: "Créez un compte et vérifiez votre identité pour envoyer de l'argent.", code: "account_required" },
        { status: 401 },
      );
    }
    if (authed?.customer.mustChangePassword) return passwordChangeRequired();
    if (authed && !(await rateLimit(`transfer:${authed.customer.id}`, 30))) {
      return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de demandes. Réessayez dans une heure." }, { status: 429 });
    }
    const idemKey = authed ? idempotencyKeyOf(request) : null;
    if (authed && idemKey) {
      replayKey = { customerId: authed.customer.id, key: idemKey };
      const existing = await findExisting(authed.customer.id, idemKey);
      if (existing) return replayExisting(existing);
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

    // Compte bancaire réutilisé par son id : il doit appartenir à un transfert de ce client
    // (en mode réel, jamais le compte enregistré par quelqu'un d'autre).
    if (data.beneficiary.savedId && !data.beneficiary.accountNumber?.trim() && (authed || isLiveMode())) {
      const owned = authed
        ? await prisma.transfer.findFirst({ where: { customerId: authed.customer.id, beneficiaryId: data.beneficiary.savedId }, select: { id: true } })
        : null;
      if (!owned) {
        return NextResponse.json({ error: "Compte du destinataire introuvable : saisissez de nouveau le numéro de compte." }, { status: 400 });
      }
    }

    const normalized = await normalizeBeneficiary(data.beneficiary, corridor.destination);
    if (!normalized.ok) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    // Mode réel : taux frais exigé (jamais le taux de secours ni un cache ancien).
    const live = isLiveMode();
    if (live) {
      await getFxRate(getCountry(corridor.source).currency, getCountry(corridor.destination).currency, true).catch(() => null);
    }
    const quoteData = await buildQuote({
      corridorId: data.corridorId,
      sendAmount,
      receiveAmount,
      network: normalized.data.network,
    });
    if (data.payMethod === "interac" && quoteData.sendCurrency !== "CAD") {
      return NextResponse.json({ error: "Le virement Interac n'est possible que pour les envois depuis le Canada (CAD)." }, { status: 400 });
    }
    if (data.payMethod === "manual" && !["XAF", "CNY"].includes(quoteData.sendCurrency)) {
      return NextResponse.json({ error: "L'encaissement manuel n'est possible que pour les envois depuis le Cameroun ou la Chine." }, { status: 400 });
    }
    if (!payMethodsFor(quoteData.sourceCountry).includes(data.payMethod)) {
      return NextResponse.json(
        {
          error:
            quoteData.sourceCountry === "CA"
              ? "Le paiement par carte n'est pas encore disponible. Payez par virement Interac."
              : "L'envoi depuis ce pays n'est pas encore ouvert. Les envois partent pour l'instant du Canada.",
          code: "pay_method_unavailable",
        },
        { status: 400 },
      );
    }
    if (live && !rateIsTrustworthy(quoteData.fx)) {
      return NextResponse.json(
        { error: "Le taux de change est momentanément indisponible. Réessayez dans quelques minutes.", code: "rate_unavailable" },
        { status: 503 },
      );
    }

    // Le client confirme ce qu'il a vu : si le taux ou le total ont changé depuis le récapitulatif, il revalide.
    const totalChanged = data.expectedTotal != null && Math.abs(quoteData.total - data.expectedTotal) > 0.01;
    const receiveChanged = data.expectedReceive != null && Math.abs(quoteData.receiveAmount - data.expectedReceive) > Math.max(1, data.expectedReceive * 0.005);
    if (totalChanged || receiveChanged) {
      return NextResponse.json(
        {
          error: "Le taux a changé depuis le récapitulatif. Vérifiez le nouveau montant avant de continuer.",
          code: "quote_changed",
          total: quoteData.total,
          receiveAmount: quoteData.receiveAmount,
        },
        { status: 409 },
      );
    }

    const limits = transferLimits();
    // Portefeuilles MTN / Orange : un versement trop gros serait refusé par l'opérateur.
    if (!isBankNetwork(normalized.data.network, corridor.destination) && quoteData.receiveCurrency === "XAF" && quoteData.receiveAmount > limits.mobileMoneyMaxXaf) {
      return NextResponse.json(
        {
          error: `Vers un portefeuille Mobile Money, le maximum est de ${limits.mobileMoneyMaxXaf.toLocaleString("fr-FR")} FCFA par envoi. Réduisez le montant ou choisissez un compte bancaire.`,
          code: "wallet_limit",
        },
        { status: 400 },
      );
    }

    const interac = data.payMethod === "interac";
    const manual = data.payMethod === "manual";
    const manualMax = manual ? manualPayInMax(quoteData.sendCurrency) : null;
    if (manualMax != null && quoteData.total > manualMax) {
      return NextResponse.json(
        {
          error: `Pendant le lancement, le maximum est de ${manualMax.toLocaleString("fr-FR")} ${quoteData.sendCurrency} par envoi depuis ce pays. Réduisez le montant.`,
          code: "manual_limit",
        },
        { status: 400 },
      );
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const transfer = await prisma.$transaction(
      async (tx) => {
        // Plafonds par client (24 h et 30 jours), sur les envois payés en dollars canadiens. Un verrou par client
        // fait attendre une 2e demande simultanée : deux envois lancés en même temps ne peuvent pas dépasser le plafond.
        if (live && authed && quoteData.sendCurrency === "CAD") {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${authed.customer.id}))`;
          const sumSince = async (ms: number) =>
            (
              await tx.transfer.aggregate({
                _sum: { totalCad: true },
                where: {
                  customerId: authed.customer.id,
                  sendCurrency: "CAD",
                  status: { notIn: ["expired", "cancelled"] },
                  createdAt: { gte: new Date(Date.now() - ms) },
                },
              })
            )._sum.totalCad ?? 0;
          const [day, month] = await Promise.all([sumSince(86_400_000), sumSince(30 * 86_400_000)]);
          const over = day + quoteData.total > limits.dailyCad ? { left: limits.dailyCad - day, period: "24 heures", max: limits.dailyCad } : month + quoteData.total > limits.monthlyCad ? { left: limits.monthlyCad - month, period: "30 jours", max: limits.monthlyCad } : null;
          if (over) throw new CustomerLimitError(over.left, over.period, over.max);
        }
        // Encaissement manuel : au plus 3 fois le plafond par envoi sur 24 h, par client (même verrou).
        if (live && manual && authed && manualMax != null) {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${authed.customer.id}))`;
          const day =
            (
              await tx.transfer.aggregate({
                _sum: { totalCad: true },
                where: {
                  customerId: authed.customer.id,
                  sendCurrency: quoteData.sendCurrency,
                  status: { notIn: ["expired", "cancelled"] },
                  createdAt: { gte: new Date(Date.now() - 86_400_000) },
                },
              })
            )._sum.totalCad ?? 0;
          if (day + quoteData.total > manualMax * 3) {
            throw new CustomerLimitError(Math.max(0, manualMax * 3 - day), "24 heures", manualMax * 3, quoteData.sendCurrency);
          }
        }
        // Référence unique : nouveau tirage dans le cas (rare) où elle existe déjà.
        let reference = createReference();
        for (let i = 0; i < 5 && (await tx.transfer.findUnique({ where: { reference }, select: { id: true } })); i += 1) {
          reference = createReference();
        }
        const beneficiary = await tx.beneficiary.create({
          data: normalized.data,
        });

        const quote = await tx.quote.create({
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

        return tx.transfer.create({
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
            idempotencyKey: idemKey,
            sendAmountCad: quoteData.sendAmount,
            receiveAmountXaf: quoteData.receiveAmount,
            rate: quoteData.rate,
            feeCad: quoteData.fee,
            totalCad: quoteData.total,
            payInProvider: interac ? INTERAC_PROVIDER : manual ? MANUAL_PAYIN_PROVIDER : getPayInMode(),
            // MTN MoMo seulement pour MTN au Cameroun ; le reste est simulé en démo, versé par l'équipe sinon.
            payoutProvider: payoutProviderFor(normalized.data.network, corridor.destination, senderEmail),
            quoteId: quote.id,
            beneficiaryId: beneficiary.id,
            events: {
              create: {
                type: "created",
                message: interac
                  ? `Transfert ${quoteData.corridorId} créé, en attente du virement Interac`
                  : manual
                    ? `Transfert ${quoteData.corridorId} créé, en attente du paiement manuel du client`
                  : `Transfert ${quoteData.corridorId} créé, en attente de paiement`,
              },
            },
          },
          include: { beneficiary: true },
        });
      },
      { timeout: 15_000 },
    );

    // Commande reçue : courriel et notification pour l'équipe (après la réponse au client).
    after(() => alertTeam(transfer.id, "new_order"));

    if (interac) {
      const payInRef = `interac_${transfer.reference}`;
      await prisma.transfer.update({ where: { id: transfer.id }, data: { payInRef } });
      return NextResponse.json({
        transfer: customerTransfer(transfer),
        payIn: { provider: "interac", sessionId: payInRef, interac: interacInstructions(transfer) },
      });
    }

    if (manual) {
      const payInRef = `manual_${transfer.reference}`;
      await prisma.transfer.update({ where: { id: transfer.id }, data: { payInRef } });
      return NextResponse.json({
        transfer: customerTransfer(transfer),
        payIn: { provider: "manual", sessionId: payInRef, manual: manualPayInInstructions(transfer, !live) },
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
      transfer: customerTransfer(transfer),
      payIn: session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error);
    }
    // Deux demandes identiques arrivées en même temps : la seconde rejoue le transfert de la première.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && replayKey) {
      const existing = await findExisting(replayKey.customerId, replayKey.key).catch(() => null);
      if (existing) return replayExisting(existing);
    }
    if (error instanceof CustomerLimitError) {
      const left = Math.max(0, Math.floor(error.left * 100) / 100);
      return NextResponse.json(
        {
          error: `Plafond atteint : ${error.max.toLocaleString("fr-FR")} ${error.currency} par ${error.period}. Vous pouvez encore envoyer ${left.toLocaleString("fr-FR")} ${error.currency} sur cette période.`,
          code: "customer_limit",
        },
        { status: 400 },
      );
    }
    if (error instanceof QuoteLimitError) {
      return NextResponse.json(
        { error: error.messageFr, code: error.code, limit: error.limit, currency: error.currency },
        { status: 400 },
      );
    }
    const message = publicErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
