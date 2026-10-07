import type { InteracInstructions } from "./interac";

export type PayInSession = {
  provider: "stripe" | "mock" | "interac";
  /** Virement Interac : où et comment envoyer l'argent. */
  interac?: InteracInstructions;
  checkoutUrl?: string;
  clientSecret?: string;
  sessionId: string;
};

export type PayInProvider = {
  name: "stripe" | "mock";
  createSession: (input: {
    transferId: string;
    reference: string;
    /** Montant total à payer, dans la devise d'envoi (`currency`). */
    amountCad: number;
    /** Devise d'envoi (CAD, XAF, CNY…). Défaut : CAD. */
    currency?: string;
    /** Libellé du trajet, ex. « Canada → Cameroun ». */
    routeLabel?: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
  }) => Promise<PayInSession>;
};

export function getPayInMode(): "stripe" | "mock" {
  return process.env.STRIPE_SECRET_KEY ? "stripe" : "mock";
}
