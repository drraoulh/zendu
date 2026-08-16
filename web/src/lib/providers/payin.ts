export type PayInSession = {
  provider: "stripe" | "mock";
  checkoutUrl?: string;
  clientSecret?: string;
  sessionId: string;
};

export type PayInProvider = {
  name: "stripe" | "mock";
  createSession: (input: {
    transferId: string;
    reference: string;
    amountCad: number;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
  }) => Promise<PayInSession>;
};

export function getPayInMode(): "stripe" | "mock" {
  return process.env.STRIPE_SECRET_KEY ? "stripe" : "mock";
}
