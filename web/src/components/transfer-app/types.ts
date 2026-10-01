/** Forme JSON d'un transfert telle que renvoyée par GET /api/transfers/[id]. */
export type TransferEventDTO = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

export type TransferDTO = {
  id: string;
  reference: string;
  status: string;
  corridorId?: string | null;
  sourceCountry?: string | null;
  destCountry?: string | null;
  sendCurrency?: string | null;
  receiveCurrency?: string | null;
  senderName?: string;
  senderEmail?: string;
  sendAmountCad: number;
  receiveAmountXaf: number;
  rate: number;
  feeCad: number;
  totalCad: number;
  payInProvider?: string;
  payoutRef: string | null;
  failureReason: string | null;
  createdAt: string;
  paidAt?: string | null;
  deliveredAt?: string | null;
  beneficiary: {
    fullName: string;
    phone: string;
    network: string;
    country?: string;
  };
  events?: TransferEventDTO[];
};

export function corridorCodes(corridorId?: string | null): [string, string] {
  const [from = "CA", to = "CM"] = (corridorId || "CA-CM").split("-");
  return [from, to];
}
