import type { PayoutProvider } from "./payout";

export const mockMomo: PayoutProvider = {
  name: "mock_momo",
  async disburse({ transferId, phone, amountXaf }) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      provider: "mock_momo",
      payoutRef: `MOMO-MOCK-${transferId.slice(-6).toUpperCase()}`,
      status: "delivered",
      message: `Payout simulé de ${amountXaf} XAF vers ${phone}`,
    };
  },
};
