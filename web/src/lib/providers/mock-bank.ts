import type { PayoutProvider } from "./payout";
import { maskAccount } from "@/lib/bank";

/** Virement bancaire simulé (mode démo) — même comportement que le mock MoMo. */
export const mockBank: PayoutProvider = {
  name: "mock_bank",
  async disburse({ transferId, amountXaf, bank }) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      provider: "mock_bank",
      payoutRef: `BANK-MOCK-${transferId.slice(-6).toUpperCase()}`,
      status: "delivered",
      message: `Virement bancaire simulé de ${amountXaf} vers ${bank?.bankName ?? "banque"} ${
        maskAccount(bank?.accountNumber) ?? ""
      }`.trim(),
    };
  },
};
