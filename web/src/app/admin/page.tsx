import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCad } from "@/lib/money";
import { statusLabel } from "@/lib/transfer-machine";
import { getPayInMode } from "@/lib/providers/payin";
import { getPayoutMode } from "@/lib/providers/payout";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const transfers = await prisma.transfer.findMany({
    include: { beneficiary: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const awaiting = transfers.filter((t) => t.status === "awaiting_payment").length;
  const delivered = transfers.filter((t) => t.status === "delivered").length;
  const failed = transfers.filter((t) => t.status === "payout_failed").length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold">Admin démo</h1>
      <p className="mt-2 text-ink-muted">
        Pay-in : <strong className="text-ink">{getPayInMode()}</strong> · Payout :{" "}
        <strong className="text-ink">{getPayoutMode()}</strong>
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Spec MoMo : <code>docs/momo-disbursement.openapi.json</code> · Balance :{" "}
        <code>/api/momo/balance</code> · Callback :{" "}
        <code>/api/webhooks/momo</code>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="En attente paiement" value={String(awaiting)} />
        <Stat label="Livrés" value={String(delivered)} />
        <Stat label="Échecs payout" value={String(failed)} />
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-bg-soft text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Réf</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Montant</th>
              <th className="px-4 py-3 font-medium">Destinataire</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="px-4 py-3">{t.reference}</td>
                <td className="px-4 py-3">{statusLabel(t.status)}</td>
                <td className="px-4 py-3">{formatCad(t.totalCad)}</td>
                <td className="px-4 py-3">
                  {t.beneficiary.fullName}
                  <div className="text-xs text-ink-muted">{t.beneficiary.phone}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/transfers/${t.id}`} className="text-accent underline">
                    Ouvrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-elevated/70 p-4">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}
