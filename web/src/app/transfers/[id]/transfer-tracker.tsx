"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { contact } from "@/lib/brand";
import { isBankNetwork, isManualPayoutProvider } from "@/lib/bank";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Icon } from "@/components/ui/icon";
import { CorridorPair } from "@/components/transfer-app/corridor-pair";
import { StatusBadge } from "@/components/transfer-app/status-badge";
import { SummaryRow } from "@/components/transfer-app/summary-row";
import { TransferTimeline } from "@/components/transfer-app/transfer-timeline";
import { isFailure } from "@/components/transfer-app/status";
import { corridorCodes, type TransferDTO } from "@/components/transfer-app/types";
import { useTransferLabels } from "@/components/transfer-app/use-transfer-labels";
import { useT } from "@/i18n/define";
import { INTERAC_PROVIDER } from "@/lib/providers/interac";
import { trackerMessages } from "./tracker-messages";

const TERMINAL = ["delivered", "cancelled", "expired"];
const POLL_MS = 2500;

export function TransferTracker({
  id,
  initial,
  demo,
  admin = false,
  deliveryEstimate,
  notice,
}: {
  id: string;
  initial: TransferDTO | null;
  /** Mode démo : simulation du paiement possible. Jamais en mode réel. */
  demo: boolean;
  /** Équipe connectée : peut lancer le versement (route réservée à l'admin). */
  admin?: boolean;
  deliveryEstimate: string;
  notice: "paid" | "cancelled" | null;
}) {
  const { t, money, network, country, dateTime, eta, eventTitle } = useTransferLabels();
  const tt = useT(trackerMessages);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<TransferDTO | null>(initial);
  const [loadFailed, setLoadFailed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const statusRef = useRef(initial?.status);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/transfers/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as TransferDTO;
      statusRef.current = data.status;
      // La réponse de suivi peut omettre les instructions Interac : on garde celles déjà connues.
      setTransfer((prev) => ({ ...data, interac: data.interac ?? prev?.interac }));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, [id]);

  useEffect(() => {
    if (!initial) void load();
    const timer = setInterval(() => {
      if (statusRef.current && TERMINAL.includes(statusRef.current)) return;
      if (document.visibilityState === "hidden") return;
      void load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [initial, load]);

  async function runAction(path: "simulate-pay" | "payout") {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/transfers/${id}/${path}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : t("errorGeneric"));
      if (data?.id) {
        statusRef.current = data.status;
        setTransfer((prev) => ({ ...prev, ...data, events: data.events ?? prev?.events }));
      }
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function copyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      /* la valeur reste sélectionnable */
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/transfers/${id}/receipt`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  if (!transfer) {
    return (
      <div className="bg-bg px-4 py-20">
        <div className="mx-auto max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
          {loadFailed ? (
            <>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-warn/10 text-warn">
                <Icon name="info" className="h-6 w-6" />
              </span>
              <p className="mt-4 font-display text-lg font-bold text-ink">{t("loadError")}</p>
              <div className="mt-6 flex justify-center gap-2">
                <Button size="sm" onClick={() => void load()}>
                  {t("retry")}
                </Button>
                <ButtonLink href="/history" variant="secondary" size="sm">
                  {t("myTransfers")}
                </ButtonLink>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted" role="status">
              {t("loading")}
            </p>
          )}
        </div>
      </div>
    );
  }

  const [from, to] = corridorCodes(transfer.corridorId);
  const sendCur = transfer.sendCurrency || "CAD";
  const recvCur = transfer.receiveCurrency || "XAF";
  const status = transfer.status;
  const awaiting = status === "awaiting_payment";
  const payoutReady = status === "payment_detected" || status === "payout_queued";
  const delivered = status === "delivered";
  const failed = isFailure(status);
  const live = !TERMINAL.includes(status);
  const events = [...(transfer.events ?? [])].reverse();
  const ben = transfer.beneficiary;
  const bank = isBankNetwork(ben.network, ben.country ?? to);
  // Versement fait par un opérateur (banque ou portefeuille non intégré) : pas de bouton « Lancer le versement ».
  const manualBank = isManualPayoutProvider(transfer.payoutProvider ?? "");
  const interac = transfer.payInProvider === INTERAC_PROVIDER ? transfer.interac : undefined;
  // Simulation seulement en démo, et seulement pour un paiement simulable (mock ou Interac sans dépôt réel).
  const canSimulate = demo && (transfer.payInProvider === "mock" || transfer.payInProvider === INTERAC_PROVIDER);
  const expired = status === "expired";

  return (
    <div className="bg-bg pb-16">
      {/* En-tête du transfert */}
      <section className="bg-navy-gradient relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative py-8 sm:py-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/history"
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-white/75 hover:text-white"
            >
              <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
              {t("myTransfers")}
            </Link>
            {live && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
                <span className="live-dot" aria-hidden />
                {t("liveUpdates")}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-white px-0.5 py-0.5">
                  <StatusBadge status={status} size="md" />
                </span>
                <span className="text-sm text-white/70">
                  {t("reference")} <span className="font-display font-bold tracking-wider text-white">{transfer.reference}</span>
                </span>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-sky">{t("theyReceive")}</p>
              <h1 className="mt-1 break-words font-display text-[2.1rem] font-black leading-tight tracking-tight sm:text-5xl">
                {money(transfer.receiveAmountXaf, recvCur)}
              </h1>
              <p className="mt-2 truncate text-sm text-white/75">
                {ben.fullName} · {network(ben.network)}
                {bank && ben.accountMasked ? ` · ${ben.accountMasked}` : ""}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm ring-1 ring-white/15 backdrop-blur">
              <CorridorPair from={from} to={to} size={18} showNames />
              <p className="mt-1 text-xs text-white/60">{t("createdOn", { date: dateTime(transfer.createdAt) })}</p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="mt-6 sm:mt-8">
        {notice && (
          <p
            role="status"
            className={`mb-5 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${
              notice === "paid" ? "bg-success/10 text-success" : "bg-warn/10 text-[#8a5d06]"
            }`}
          >
            <Icon name={notice === "paid" ? "check" : "info"} className="mt-0.5 h-4 w-4 shrink-0" />
            {notice === "paid" ? t("paidBanner") : t("cancelledBanner")}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="space-y-6">
            {/* Action principale selon le statut */}
            {awaiting && interac && (
              <ActionCard tone="brand" icon="card" title={tt("interacTitle")} body={tt("interacBody")}>
                {interac.email ? (
                  <>
                  <dl className="divide-y divide-line rounded-2xl border border-line bg-white px-4">
                    {(
                      [
                        ["email", tt("interacEmail"), interac.email, interac.email],
                        ["amount", tt("interacAmount"), interac.amount.toFixed(2), money(interac.amount, interac.currency)],
                        ["message", tt("interacMessage"), interac.message, interac.message],
                      ] as const
                    ).map(([key, label, value, display]) => (
                      <div key={key} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <dt className="text-xs text-muted">{label}</dt>
                          <dd className="select-all break-all font-display text-base font-bold text-ink">{display}</dd>
                        </div>
                        <button
                          type="button"
                          onClick={() => void copyValue(key, value)}
                          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-semibold text-brand hover:border-brand/40"
                        >
                          <Icon name="check" className={`h-3.5 w-3.5 ${copiedField === key ? "" : "hidden"}`} />
                          {copiedField === key ? tt("copied") : tt("copy")}
                        </button>
                      </div>
                    ))}
                  </dl>
                  {interac.name ? <p className="mt-2 text-xs text-muted">{tt("interacName", { name: interac.name })}</p> : null}
                  </>
                ) : (
                  <p className="rounded-xl bg-warn/10 px-3 py-2 text-sm font-medium text-[#8a5d06]">{tt("interacNoAddress")}</p>
                )}
                <p className="mt-3 text-xs text-muted">{tt("interacDeadline", { date: dateTime(interac.expiresAt) })}</p>
                {canSimulate && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs text-muted">{t("payDemo")}</p>
                    <Button size="lg" className="w-full sm:w-auto" disabled={busy} onClick={() => void runAction("simulate-pay")}>
                      {busy ? t("processing") : t("simulatePay")}
                      {!busy && <Icon name="arrowRight" className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </ActionCard>
            )}

            {awaiting && !interac && (
              <ActionCard tone="brand" icon="card" title={t("payTitle")} body={canSimulate ? t("payDemo") : t("payLive")}>
                {canSimulate && (
                  <Button size="lg" className="w-full sm:w-auto" disabled={busy} onClick={() => void runAction("simulate-pay")}>
                    {busy ? t("processing") : t("simulatePay")}
                    {!busy && <Icon name="arrowRight" className="h-4 w-4" />}
                  </Button>
                )}
              </ActionCard>
            )}

            {payoutReady && manualBank && (
              <ActionCard
                tone="brand"
                icon="info"
                title={bank ? t("bankManualTitle") : tt("manualTitle")}
                body={bank ? t("bankManualBody") : tt("manualBody", { network: network(ben.network) })}
              />
            )}

            {payoutReady && !manualBank && admin && (
              <ActionCard tone="brand" icon="transfer" title={t("payoutTitle")} body={t("payoutHint")}>
                <Button size="lg" className="w-full sm:w-auto" disabled={busy} onClick={() => void runAction("payout")}>
                  {busy ? t("processing") : t("triggerPayout")}
                </Button>
              </ActionCard>
            )}

            {payoutReady && !manualBank && !admin && (
              <ActionCard tone="brand" icon="transfer" title={tt("payoutWaitTitle")} body={tt("payoutWaitBody")} />
            )}

            {delivered && (
              <ActionCard tone="success" icon="check" title={t("deliveredTitle")} body={t("deliveredMsg")}>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href={`/transfers/${transfer.id}/receipt`}>
                    <Icon name="receipt" className="h-4 w-4" />
                    {t("viewReceipt")}
                  </ButtonLink>
                  <ButtonLink href="/send" variant="secondary">
                    {t("newTransfer")}
                  </ButtonLink>
                </div>
              </ActionCard>
            )}

            {expired && (
              <ActionCard
                tone="danger"
                icon="info"
                title={tt("expiredTitle")}
                body={tt("expiredBody", { email: contact.email, ref: transfer.reference })}
              />
            )}

            {failed && !expired && (
              <ActionCard
                tone="danger"
                icon="info"
                title={t("incidentTitle")}
                body={t("incidentHelp", { email: contact.email, ref: transfer.reference })}
              >
                {transfer.failureReason && (
                  <p className="rounded-xl bg-danger/5 px-3 py-2 text-sm text-danger">{transfer.failureReason}</p>
                )}
              </ActionCard>
            )}

            {actionError && (
              <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                {actionError}
              </p>
            )}

            <section className="rounded-3xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-extrabold text-ink">{t("progress")}</h2>
              <div className="mt-5">
                <TransferTimeline transfer={transfer} />
              </div>
            </section>

            {events.length > 0 && (
              <section className="rounded-3xl border border-line bg-white p-6 shadow-card">
                <h2 className="font-display text-lg font-extrabold text-ink">{t("activity")}</h2>
                <ol className="mt-4 divide-y divide-line">
                  {events.map((event) => (
                    <li key={event.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand/60" aria-hidden />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{eventTitle(event.type)}</p>
                        <p className="break-words text-xs text-muted">{event.message}</p>
                        <p className="mt-0.5 text-xs text-muted/80">{dateTime(event.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          <aside className="rounded-3xl border border-line bg-white p-6 shadow-card lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-extrabold text-ink">{t("details")}</h2>
            <dl className="mt-3 border-b border-line pb-3">
              <SummaryRow label={t("youSend")} value={money(transfer.sendAmountCad, sendCur)} />
              <SummaryRow
                label={t("fee")}
                value={transfer.feeCad === 0 ? t("feeFree") : money(transfer.feeCad, sendCur)}
              />
              <SummaryRow label={t("total")} value={money(transfer.totalCad, sendCur)} emphasis="strong" />
              <SummaryRow label={t("rate")} value={`1 ${sendCur} = ${transfer.rate.toFixed(2)} ${recvCur}`} />
              <SummaryRow label={t("theyReceive")} value={money(transfer.receiveAmountXaf, recvCur)} emphasis="highlight" />
            </dl>
            <dl className="mt-3">
              <SummaryRow label={t("recipient")} value={transfer.beneficiary.fullName} />
              <SummaryRow label={t("deliveryMethod")} value={network(transfer.beneficiary.network)} />
              {bank && ben.bankName && <SummaryRow label={t("bankName")} value={ben.bankName} />}
              {bank && ben.accountMasked && <SummaryRow label={t("bankAccount")} value={ben.accountMasked} />}
              {bank && ben.bankCode && <SummaryRow label={t("bankCode")} value={ben.bankCode} />}
              {ben.phone && <SummaryRow label={t("phone")} value={/^\d/.test(ben.phone) ? `+${ben.phone}` : ben.phone} />}
              <SummaryRow label={t("estimate")} value={eta(deliveryEstimate)} />
              <SummaryRow label={t("sourceCountry")} value={country(from)} />
            </dl>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col">
              <ButtonLink href={`/transfers/${transfer.id}/receipt`} variant="secondary" className="flex-1">
                <Icon name="receipt" className="h-4 w-4" />
                {t("viewReceipt")}
              </ButtonLink>
              <Button variant="ghost" className="flex-1" onClick={() => void copyLink()}>
                <Icon name={copied ? "check" : "transfer"} className="h-4 w-4" />
                {copied ? t("linkCopied") : t("copyLink")}
              </Button>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function ActionCard({
  tone,
  icon,
  title,
  body,
  children,
}: {
  tone: "brand" | "success" | "danger";
  icon: "card" | "transfer" | "check" | "info";
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const ring = {
    brand: "border-brand/25 bg-gradient-to-br from-white to-brand-soft/70",
    success: "border-success/25 bg-gradient-to-br from-white to-success/10",
    danger: "border-danger/25 bg-gradient-to-br from-white to-danger/5",
  }[tone];
  const iconBg = { brand: "bg-brand text-white", success: "bg-success text-white", danger: "bg-danger text-white" }[tone];
  return (
    <section className={`animate-rise rounded-3xl border p-6 shadow-card ${ring}`}>
      <div className="flex items-start gap-4">
        <span className={`hidden h-11 w-11 shrink-0 place-items-center rounded-2xl sm:grid ${iconBg}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-extrabold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </section>
  );
}
