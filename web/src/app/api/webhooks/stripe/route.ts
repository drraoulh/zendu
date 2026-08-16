import { NextResponse } from "next/server";
import Stripe from "stripe";
import { markPaymentDetected } from "@/lib/transfer-service";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Stripe non configuré (mode mock actif)" },
      { status: 400 },
    );
  }

  const stripe = new Stripe(secret);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook invalide";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const transferId = session.metadata?.transferId;
    if (transferId) {
      await markPaymentDetected(transferId, session.id);
    }
  }

  return NextResponse.json({ received: true });
}
