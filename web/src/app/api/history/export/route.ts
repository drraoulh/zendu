import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { statusLabel } from "@/lib/transfer-machine";

export const dynamic = "force-dynamic";

/** Export activité CSV (style Remitly transfer history download). */
export async function GET() {
  const transfers = await prisma.transfer.findMany({
    include: { beneficiary: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const header = [
    "date",
    "confirmation",
    "statut",
    "corridor",
    "expediteur",
    "email",
    "destinataire",
    "telephone",
    "reseau",
    "devise_envoi",
    "montant_envoye",
    "frais",
    "total_paye",
    "devise_reception",
    "montant_recu",
    "taux",
  ];

  const rows = transfers.map((t) =>
    [
      t.createdAt.toISOString(),
      t.reference,
      statusLabel(t.status),
      t.corridorId,
      csv(t.senderName),
      csv(t.senderEmail),
      csv(t.beneficiary.fullName),
      t.beneficiary.phone,
      t.beneficiary.network,
      t.sendCurrency,
      t.sendAmountCad,
      t.feeCad,
      t.totalCad,
      t.receiveCurrency,
      t.receiveAmountXaf,
      t.rate,
    ].join(","),
  );

  const csvBody = [header.join(","), ...rows].join("\n");

  return new NextResponse(csvBody, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zendu-historique-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
