import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { markPaymentDetected } from "@/lib/transfer-service";

const ZERO_DECIMAL = new Set(["XAF", "XOF", "JPY", "KRW"]);

/**
 * Webhook Stripe (paiement par carte). Échoue fermé :
 * - sans STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET, ou sans en-tête `stripe-signature` valide → refusé ;
 * - le transfert n'est marqué payé que s'il a bien été créé pour Stripe avec CETTE session, que la session
 *   est payée, et que le montant et la devise correspondent exactement au transfert.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

  const stripe = new Stripe(secret);
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  const transferId = session.metadata?.transferId;
  if (!transferId || session.payment_status !== "paid") return NextResponse.json({ received: true });

  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });
  if (!transfer || transfer.payInProvider !== "stripe" || transfer.payInRef !== session.id) {
    console.error("[stripe] session sans transfert correspondant", session.id);
    return NextResponse.json({ received: true });
  }
  const currency = transfer.sendCurrency.toUpperCase();
  const expected = ZERO_DECIMAL.has(currency) ? Math.round(transfer.totalCad) : Math.round(transfer.totalCad * 100);
  if (session.amount_total !== expected || session.currency?.toUpperCase() !== currency) {
    console.error("[stripe] montant ou devise différents du transfert", transfer.reference, session.id);
    return NextResponse.json({ received: true });
  }
  if (transfer.status !== "awaiting_payment") return NextResponse.json({ received: true });

  await markPaymentDetected(transferId, session.id);
  return NextResponse.json({ received: true });
}
