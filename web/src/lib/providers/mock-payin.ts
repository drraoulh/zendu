import type { PayInProvider } from "./payin";

export const mockPayIn: PayInProvider = {
  name: "mock",
  async createSession({ transferId, reference }) {
    return {
      provider: "mock",
      sessionId: `mock_${transferId}`,
      checkoutUrl: `/transfers/${transferId}?pay=mock&ref=${reference}`,
    };
  },
};
