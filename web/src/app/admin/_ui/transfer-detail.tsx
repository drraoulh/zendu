"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CountryFlag } from "@/components/country-flag";
import { Badge } from "@/components/ui/layout";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useTransferLabels } from "@/components/transfer-app/use-transfer-labels";
import { useT } from "@/i18n/define";
import { adminInsightsMessages } from "@/i18n/admin-insights";
import type { AdminTransferDetail } from "../_server/insights";
import { CopyButton } from "../(panel)/transferts/queue-kit";
import { KycBadge } from "./customers-kit";
import { DbError, Panel } from "./kit";

type Tone = "brand" | "success" | "warn" | "danger" | "neutral";

function statusTone(status: string): Tone {
  if (status === "delivered") return "success";
  if (status === "payment_mismatch" || status === "payout_failed") return "danger";
  if (status === "awaiting_payment") return "warn";
  if (status === "expired" || status === "cancelled" || status === "draft" || status === "quoted") return "neutral";
  return "brand";
}

function Row({ label, children, copy }: { label: string; children: ReactNode; copy?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-right text-sm font-semibold text-ink">
        <span className="min-w-0 break-words">{children}</span>
        {copy ? <CopyButton value={copy} label={label} /> : null}
      </dd>
    </div>
  );
}

/** Fiche d'un transfert pour l'équipe : montants, parties, traitement et historique. */
export function TransferDetail({ transfer }: { transfer: AdminTransferDetail | null | undefined }) {
  const t = useT(adminInsightsMessages);
  const { status, network, country, money, dateTime, eventTitle } = useTransferLabels();

  const back = (
    <Link href="/admin/transferts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
      <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
      {t("detailBack")}
    </Link>
  );

  if (transfer === undefined) {
    return (
      <div className="space-y-4">
        {back}
        <DbError />
      </div>
    );
  }

  if (transfer === null) {
    return (
      <div className="space-y-4">
        {back}
        <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="receipt" />
          </span>
          <h1 className="mt-3 font-display text-xl font-bold text-ink">{t("detailNotFound")}</h1>
          <p className="mt-1 text-sm text-muted">{t("detailNotFoundText")}</p>
        </div>
      </div>
    );
  }

  const r = transfer.recipient;
  const isBank = Boolean(r.bankName || r.accountMasked);

  return (
    <div className="space-y-6">
      {back}

      <header className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-xl font-bold tracking-tight text-ink sm:text-2xl">{transfer.reference}</h1>
              <CopyButton value={transfer.reference} label={transfer.reference} />
              <Badge tone={statusTone(transfer.status)}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                {status(transfer.status)}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted">{t("detailCreated", { date: dateTime(transfer.createdAt) })}</p>
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink">
              <CountryFlag code={transfer.sourceCountry} size={20} title={country(transfer.sourceCountry)} />
              {country(transfer.sourceCountry)}
              <Icon name="arrowRight" className="h-3.5 w-3.5 text-muted" />
              <CountryFlag code={transfer.destCountry} size={20} title={country(transfer.destCountry)} />
              {country(transfer.destCountry)}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium text-muted">{t("detailReceive")}</p>
            <p className="font-display text-3xl font-extrabold tracking-tight text-ink">{money(transfer.receiveAmount, transfer.receiveCurrency)}</p>
            <p className="mt-0.5 text-sm text-muted">
              {t("detailTotal")} : <span className="font-semibold text-ink">{money(transfer.total, transfer.sendCurrency)}</span>
            </p>
          </div>
        </div>

        {transfer.inQueue && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <Icon name="clock" className="h-4 w-4 text-warn" />
              {t("detailInQueue")}
            </p>
            <ButtonLink href="/admin/transferts" size="sm">
              {t("detailOpenQueue")}
            </ButtonLink>
          </div>
        )}
        {transfer.failureReason && (
          <p role="status" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
            <span className="font-semibold">{t("detailFailure")} :</span> {transfer.failureReason}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href={`/transfers/${transfer.id}`} variant="secondary" size="sm" target="_blank" rel="noreferrer">
            <Icon name="globe" className="h-4 w-4" />
            {t("detailTracking")}
          </ButtonLink>
          <ButtonLink href={`/transfers/${transfer.id}/receipt`} variant="secondary" size="sm" target="_blank" rel="noreferrer">
            <Icon name="receipt" className="h-4 w-4" />
            {t("detailReceipt")}
          </ButtonLink>
          <ButtonLink href={`mailto:${transfer.senderEmail}?subject=${encodeURIComponent(transfer.reference)}`} variant="ghost" size="sm">
            <Icon name="mail" className="h-4 w-4" />
            {t("detailEmail")}
          </ButtonLink>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel id="td-amounts" title={t("detailAmounts")}>
          <dl className="divide-y divide-line">
            <Row label={t("detailSend")}>{money(transfer.sendAmount, transfer.sendCurrency)}</Row>
            <Row label={t("detailFee")}>{money(transfer.fee, transfer.sendCurrency)}</Row>
            <Row label={t("detailTotal")}>{money(transfer.total, transfer.sendCurrency)}</Row>
            <Row label={t("detailRate")}>
              1 {transfer.sendCurrency} = {transfer.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {transfer.receiveCurrency}
            </Row>
            <Row label={t("detailReceive")}>{money(transfer.receiveAmount, transfer.receiveCurrency)}</Row>
          </dl>
        </Panel>

        <Panel id="td-processing" title={t("detailProcessing")}>
          <dl className="divide-y divide-line">
            <Row label={t("detailCorridor")}>{transfer.corridorId}</Row>
            <Row label={t("detailPayIn")}>
              <code className="font-mono text-xs">{transfer.payInProvider}</code>
            </Row>
            {transfer.payInRef && (
              <Row label={t("detailPayInRef")} copy={transfer.payInRef}>
                <code className="font-mono text-xs">{transfer.payInRef}</code>
              </Row>
            )}
            <Row label={t("detailPayout")}>
              <code className="font-mono text-xs">{transfer.payoutProvider}</code>
            </Row>
            {transfer.payoutRef && (
              <Row label={t("detailPayoutRef")} copy={transfer.payoutRef}>
                <code className="font-mono text-xs">{transfer.payoutRef}</code>
              </Row>
            )}
            {transfer.paidAt && <Row label={t("detailPaidAt")}>{dateTime(transfer.paidAt)}</Row>}
            {transfer.deliveredAt && <Row label={t("detailDeliveredAt")}>{dateTime(transfer.deliveredAt)}</Row>}
          </dl>
        </Panel>

        <Panel
          id="td-sender"
          title={t("detailSender")}
          actions={
            transfer.customer ? (
              <Link href={`/admin/clients/${transfer.customer.id}`} className="text-sm font-semibold text-brand hover:underline">
                {t("detailCustomer")}
              </Link>
            ) : undefined
          }
        >
          <dl className="divide-y divide-line">
            <Row label={t("detailSender")}>{transfer.senderName}</Row>
            <Row label={t("detailEmailLabel")} copy={transfer.senderEmail}>
              {transfer.senderEmail}
            </Row>
            <Row label={t("detailKyc")}>
              {transfer.customer ? (
                <KycBadge status={transfer.customer.kycStatus} />
              ) : (
                <span className="font-normal text-muted">{t("detailNoAccount")}</span>
              )}
            </Row>
          </dl>
        </Panel>

        <Panel id="td-recipient" title={t("detailRecipient")}>
          <dl className="divide-y divide-line">
            <Row label={t("detailRecipient")}>{r.fullName}</Row>
            <Row label={t("detailCountry")}>{country(r.country)}</Row>
            <Row label={t("detailNetwork")}>{network(r.network)}</Row>
            {isBank ? (
              <>
                {r.bankName && <Row label={t("detailBank")}>{r.bankName}</Row>}
                {r.accountMasked && <Row label={t("detailAccount")}>{r.accountMasked}</Row>}
                {r.bankCode && <Row label={t("detailBankCode")}>{r.bankCode}</Row>}
              </>
            ) : (
              <Row label={t("detailPhone")} copy={r.phone}>
                {r.phone}
              </Row>
            )}
          </dl>
        </Panel>
      </div>

      <Panel id="td-timeline" title={t("detailTimeline")}>
        {transfer.events.length === 0 ? (
          <p className="text-sm text-muted">{t("detailTimelineEmpty")}</p>
        ) : (
          <ol className="relative space-y-5 border-l-2 border-line pl-6">
            {[...transfer.events].reverse().map((e, i) => (
              <li key={e.id} className="relative">
                <span
                  className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${i === 0 ? "bg-brand" : "bg-line"}`}
                  aria-hidden
                />
                <p className="text-sm font-semibold text-ink">{eventTitle(e.type)}</p>
                <p className="mt-0.5 text-sm text-muted">{e.message}</p>
                <p className="mt-1 text-xs text-muted">
                  {dateTime(e.createdAt)} · <code className="font-mono">{e.type}</code>
                </p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
