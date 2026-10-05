"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReceiptData } from "@/lib/receipt";
import { contact } from "@/lib/brand";
import { LogoEmblem } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CorridorPair } from "./corridor-pair";
import { StatusBadge } from "./status-badge";
import { SummaryRow } from "./summary-row";
import { useTransferLabels } from "./use-transfer-labels";

/** CSS d'impression : seul le reçu est imprimé (en-tête, bannière et pied de page masqués). */
const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  .pw-receipt-print, .pw-receipt-print * { visibility: visible !important; }
  .pw-receipt-print {
    position: absolute !important;
    inset: 0 auto auto 0 !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: 0 !important;
  }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

export function ReceiptView({
  receipt,
  transferId,
  deliveryEstimate,
}: {
  receipt: ReceiptData;
  transferId: string;
  /** Code brut du délai du corridor ("A few minutes" / "Under 24h"). */
  deliveryEstimate: string;
}) {
  const { t, money, network, country, dateTime, eta } = useTransferLabels();
  const [copied, setCopied] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    setGeneratedAt(new Date().toISOString());
  }, []);

  const send = receipt.sendCurrency;
  const recv = receipt.receiveCurrency;
  const receiveFormatted = money(receipt.receiveAmount, recv);

  async function share() {
    const url = `${window.location.origin}/transfers/${transferId}/receipt`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("receiptTitle"),
          text: t("shareText", { ref: receipt.confirmationNumber, amount: receiveFormatted, name: receipt.recipient.name }),
          url,
        });
        return;
      } catch {
        /* annulé par l'utilisateur */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-[70vh] bg-bg py-6 sm:py-10 print:bg-white print:py-0">
      <style>{PRINT_CSS}</style>

      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 print:hidden">
        <Link
          href={`/transfers/${transferId}`}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong"
        >
          <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
          {t("backToTransfer")}
        </Link>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => void share()}>
            <Icon name="transfer" className="h-4 w-4" />
            {copied ? t("linkCopied") : t("share")}
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Icon name="receipt" className="h-4 w-4" />
            {t("print")}
          </Button>
        </div>
      </div>

      <article className="pw-receipt-print mx-4 mt-5 overflow-hidden rounded-3xl border border-line bg-white shadow-card sm:mx-auto sm:max-w-2xl">
        <div className="bg-navy-gradient px-6 py-6 text-white sm:px-10 print:px-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-14 place-items-center rounded-xl bg-white p-1">
                <LogoEmblem className="h-full w-full object-contain" />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold tracking-tight">{receipt.brand}</p>
                <p className="text-sm text-white/70">{t("receiptTitle")}</p>
              </div>
            </div>
            <span className="rounded-full bg-white px-0.5 py-0.5">
              <StatusBadge status={receipt.status} />
            </span>
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-sky">{t("received")}</p>
          <p className="mt-1 font-display text-3xl font-black tracking-tight sm:text-4xl">{receiveFormatted}</p>
          <div className="mt-3 text-sm text-white/80">
            <CorridorPair from={receipt.sourceCountry} to={receipt.destCountry} size={18} showNames />
          </div>
        </div>

        <div className="px-6 sm:px-10">
          <dl className="grid gap-4 border-b border-line py-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">{t("confirmation")}</dt>
              <dd className="mt-0.5 font-display font-bold tracking-wider text-ink">{receipt.confirmationNumber}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("date")}</dt>
              <dd className="mt-0.5 font-medium text-ink">{dateTime(receipt.createdAt)}</dd>
            </div>
          </dl>

          <section className="border-b border-line py-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{t("amounts")}</h2>
            <dl className="mt-3">
              <SummaryRow label={t("youSend")} value={money(receipt.sendAmount, send)} />
              <SummaryRow label={t("fee")} value={receipt.fee === 0 ? t("feeFree") : money(receipt.fee, send)} />
              <SummaryRow label={t("totalPaid")} value={money(receipt.total, send)} emphasis="strong" />
              <SummaryRow label={t("rate")} value={`1 ${send} = ${receipt.rate.toFixed(4)} ${recv}`} />
              <SummaryRow label={t("received")} value={receiveFormatted} emphasis="highlight" />
            </dl>
          </section>

          <section className="grid gap-6 border-b border-line py-5 sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{t("sender")}</h2>
              <p className="mt-2 font-semibold text-ink">{receipt.sender.name}</p>
              <p className="break-all text-sm text-muted">{receipt.sender.email}</p>
              <p className="mt-1 text-sm text-muted">
                {t("from")} : {country(receipt.sourceCountry)}
              </p>
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{t("recipient")}</h2>
              <p className="mt-2 font-semibold text-ink">{receipt.recipient.name}</p>
              {receipt.recipient.bankName && (
                <p className="text-sm text-muted">
                  {receipt.recipient.bankName}
                  {receipt.recipient.accountMasked ? ` · ${receipt.recipient.accountMasked}` : ""}
                </p>
              )}
              {receipt.recipient.bankCode && (
                <p className="text-sm text-muted">
                  {t("bankCode")} : {receipt.recipient.bankCode}
                </p>
              )}
              {receipt.recipient.phone && <p className="text-sm text-muted">+{receipt.recipient.phone}</p>}
              <p className="mt-1 text-sm text-muted">
                {network(receipt.recipient.network)} · {country(receipt.destCountry)}
              </p>
            </div>
          </section>

          <section className="py-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{t("deliveryH")}</h2>
            <dl className="mt-3">
              <SummaryRow label={t("deliveryMethod")} value={network(receipt.recipient.network)} />
              <SummaryRow label={t("estimate")} value={eta(deliveryEstimate)} />
              {receipt.deliveredAt && <SummaryRow label={t("deliveredOn")} value={dateTime(receipt.deliveredAt)} />}
              {receipt.payoutRef && <SummaryRow label={t("payoutRef")} value={receipt.payoutRef} />}
            </dl>
            <p className="mt-5 flex gap-2 rounded-2xl bg-surface-soft px-4 py-3 text-xs leading-relaxed text-muted">
              <Icon name="info" className="h-4 w-4 shrink-0 text-brand" />
              <span>
                {t("supportNote")} {contact.email}
              </span>
            </p>
          </section>
        </div>

        <footer className="border-t border-line bg-surface-soft/60 px-6 py-4 text-center text-xs text-muted sm:px-10">
          {receipt.brand} · {generatedAt ? t("generatedOn", { date: dateTime(generatedAt) }) : null} · {t("corridor")}{" "}
          {receipt.corridorId}
        </footer>
      </article>
    </div>
  );
}
