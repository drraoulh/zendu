export type PayoutRequest = {
  transferId: string;
  reference: string;
  amountXaf: number;
  phone: string;
  fullName: string;
  /** Virement bancaire uniquement. */
  bank?: { bankName: string; accountNumber: string; bankCode?: string | null };
};

export type PayoutResult = {
  provider: "momo" | "mock_momo" | "mock_bank";
  payoutRef: string;
  status: "sent" | "delivered" | "failed";
  message?: string;
};

export type PayoutProvider = {
  name: "momo" | "mock_momo" | "mock_bank";
  disburse: (input: PayoutRequest) => Promise<PayoutResult>;
};

export function getPayoutMode(): "momo" | "mock_momo" {
  return process.env.MTN_SUBSCRIPTION_KEY &&
    process.env.MTN_API_USER &&
    process.env.MTN_API_KEY
    ? "momo"
    : "mock_momo";
}
