"use client";

import Link from "next/link";
import type { ReceiptData } from "@/lib/receipt";

export function ReceiptView({
  receipt,
  transferId,
}: {
  receipt: ReceiptData;
  transferId: string;
}) {
  function printReceipt() {
    window.print();
  }

  async function shareReceipt() {
    const url = `${window.location.origin}/transfers/${transferId}/receipt`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: receipt.title,
          text: `Reçu ${receipt.confirmationNumber} — ${receipt.receiveAmountFormatted} à ${receipt.recipient.name}`,
          url,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    alert("Lien du reçu copié");
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="no-print mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-4">
        <Link href={`/transfers/${transferId}`} className="text-sm text-accent">
          ← Retour au transfert
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={shareReceipt}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-accent"
          >
            Partager
          </button>
          <button
            type="button"
            onClick={printReceipt}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Imprimer / PDF
          </button>
        </div>
      </div>

      <article className="receipt-sheet mx-auto mb-10 max-w-2xl rounded-2xl border border-line bg-white px-6 py-8 shadow-sm sm:px-10">
        <header className="border-b border-line pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-2xl font-bold text-ink">
                {receipt.brand}
              </p>
              <p className="mt-1 text-sm text-ink-muted">Reçu de transfert</p>
            </div>
            <div className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-strong">
              {receipt.statusLabel}
            </div>
          </div>
          <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-ink-muted">N° de confirmation</p>
              <p className="font-semibold tracking-wide text-ink">
                {receipt.confirmationNumber}
              </p>
            </div>
            <div>
              <p className="text-ink-muted">Date</p>
              <p className="font-medium text-ink">
                {new Date(receipt.createdAt).toLocaleString("fr-CA")}
              </p>
            </div>
          </div>
        </header>

        <section className="border-b border-line py-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Montants
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <Line label="Vous avez envoyé" value={receipt.sendAmountFormatted} />
            <Line label="Frais de transfert" value={receipt.feeFormatted} />
            <Line label="Total payé" value={receipt.totalFormatted} strong />
            <Line label="Taux de change" value={receipt.rateFormatted} />
            <Line
              label="Montant reçu"
              value={receipt.receiveAmountFormatted}
              highlight
            />
          </div>
        </section>

        <section className="grid gap-6 border-b border-line py-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Expéditeur
            </h2>
            <p className="mt-3 font-medium text-ink">{receipt.sender.name}</p>
            <p className="text-sm text-ink-muted">{receipt.sender.email}</p>
            <p className="mt-2 text-sm text-ink-muted">
              De : {receipt.sourceCountryName}
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
              Destinataire
            </h2>
            <p className="mt-3 font-medium text-ink">{receipt.recipient.name}</p>
            <p className="text-sm text-ink-muted">{receipt.recipient.phone}</p>
            <p className="mt-2 text-sm text-ink-muted">
              {receipt.deliveryMethod} · {receipt.destCountryName}
            </p>
          </div>
        </section>

        <section className="py-6 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Livraison
          </h2>
          <div className="mt-4 space-y-2">
            <Line label="Méthode" value={receipt.deliveryMethod} />
            <Line label="Délai estimé" value={receipt.deliveryEstimate} />
            {receipt.deliveredAt && (
              <Line
                label="Livré le"
                value={new Date(receipt.deliveredAt).toLocaleString("fr-CA")}
              />
            )}
            {receipt.payoutRef && (
              <Line label="Réf. payout" value={receipt.payoutRef} />
            )}
          </div>
          <p className="mt-6 rounded-xl bg-bg-soft px-4 py-3 text-xs leading-relaxed text-ink-muted">
            {receipt.supportNote}
          </p>
        </section>

        <footer className="border-t border-line pt-4 text-center text-xs text-ink-muted">
          {receipt.brand} · Reçu généré le{" "}
          {new Date().toLocaleString("fr-CA")} · Corridor {receipt.corridorId}
        </footer>
      </article>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

function Line({
  label,
  value,
  strong,
  highlight,
}: {
  label: string;
  value: string;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-ink-muted">{label}</span>
      <span
        className={`text-right ${
          highlight
            ? "font-display text-lg font-bold text-accent-strong"
            : strong
              ? "font-semibold text-ink"
              : "font-medium text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
