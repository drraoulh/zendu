import Stripe from "stripe";
import type { PayInProvider } from "./payin";

export function createStripePayIn(): PayInProvider {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquant");
  }

  const stripe = new Stripe(key);

  return {
    name: "stripe",
    async createSession({
      transferId,
      reference,
      amountCad,
      customerEmail,
      successUrl,
      cancelUrl,
    }) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: customerEmail,
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "cad",
              unit_amount: Math.round(amountCad * 100),
              product_data: {
                name: `Transfert PWFINTECH ${reference}`,
                description: "Envoi d'argent Canada → Cameroun",
              },
            },
          },
        ],
        metadata: {
          transferId,
          reference,
        },
      });

      return {
        provider: "stripe",
        sessionId: session.id,
        checkoutUrl: session.url ?? undefined,
        clientSecret: session.client_secret ?? undefined,
      };
    },
  };
}
