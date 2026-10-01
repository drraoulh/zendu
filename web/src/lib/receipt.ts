import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { statusLabel } from "@/lib/transfer-machine";
import { getCountry } from "@/lib/corridors";
import { appName } from "@/lib/brand";

export type ReceiptData = {
  brand: string;
  title: string;
  reference: string;
  confirmationNumber: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  corridorId: string;
  sourceCountry: string;
  destCountry: string;
  sourceCountryName: string;
  destCountryName: string;
  sendCurrency: string;
  receiveCurrency: string;
  sendAmount: number;
  receiveAmount: number;
  rate: number;
  fee: number;
  total: number;
  sendAmountFormatted: string;
  receiveAmountFormatted: string;
  feeFormatted: string;
  totalFormatted: string;
  rateFormatted: string;
  sender: { name: string; email: string };
  recipient: {
    name: string;
    phone: string;
    network: string;
    country: string;
  };
  payoutRef: string | null;
  deliveryMethod: string;
  deliveryEstimate: string;
  supportNote: string;
};

export async function getReceiptByTransferId(
  id: string,
): Promise<ReceiptData | null> {
  const transfer = await prisma.transfer.findUnique({
    where: { id },
    include: { beneficiary: true },
  });
  if (!transfer) return null;

  const sendCur = transfer.sendCurrency || "CAD";
  const recvCur = transfer.receiveCurrency || "XAF";
  const source = transfer.sourceCountry || "CA";
  const dest = transfer.destCountry || "CM";

  let sourceName = source;
  let destName = dest;
  try {
    sourceName = getCountry(source).name;
    destName = getCountry(dest).name;
  } catch {
    /* ignore */
  }

  const brand = appName;

  return {
    brand,
    title: `Reçu de transfert ${brand}`,
    reference: transfer.reference,
    confirmationNumber: transfer.reference,
    status: transfer.status,
    statusLabel: statusLabel(transfer.status),
    createdAt: transfer.createdAt.toISOString(),
    paidAt: transfer.paidAt?.toISOString() ?? null,
    deliveredAt: transfer.deliveredAt?.toISOString() ?? null,
    corridorId: transfer.corridorId || "CA-CM",
    sourceCountry: source,
    destCountry: dest,
    sourceCountryName: sourceName,
    destCountryName: destName,
    sendCurrency: sendCur,
    receiveCurrency: recvCur,
    sendAmount: transfer.sendAmountCad,
    receiveAmount: transfer.receiveAmountXaf,
    rate: transfer.rate,
    fee: transfer.feeCad,
    total: transfer.totalCad,
    sendAmountFormatted: formatMoney(transfer.sendAmountCad, sendCur),
    receiveAmountFormatted: formatMoney(transfer.receiveAmountXaf, recvCur),
    feeFormatted:
      transfer.feeCad === 0 ? "0,00" : formatMoney(transfer.feeCad, sendCur),
    totalFormatted: formatMoney(transfer.totalCad, sendCur),
    rateFormatted: `1 ${sendCur} = ${transfer.rate.toFixed(4)} ${recvCur}`,
    sender: {
      name: transfer.senderName,
      email: transfer.senderEmail,
    },
    recipient: {
      name: transfer.beneficiary.fullName,
      phone: transfer.beneficiary.phone,
      network: transfer.beneficiary.network,
      country: transfer.beneficiary.country,
    },
    payoutRef: transfer.payoutRef,
    deliveryMethod:
      transfer.beneficiary.network === "ORANGE"
        ? "Orange Money"
        : transfer.beneficiary.network === "MTN"
          ? "MTN Mobile Money"
          : transfer.beneficiary.network,
    deliveryEstimate: "Quelques minutes",
    supportNote:
      "Conservez ce reçu pour vos dossiers. En cas de question, citez le numéro de confirmation.",
  };
}
