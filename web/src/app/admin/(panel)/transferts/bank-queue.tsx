"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { adminMessages } from "@/i18n/admin";
import { formatMoney } from "@/lib/money";
import type { AdminTransferRow } from "./admin-dashboard";
import { adminAction, CopyRow, rawAmount } from "./queue-kit";

type BankDetails = {
  fullName: string;
  phone: string;
  bankName: string | null;
  accountNumber: string | null;
  bankCode: string | null;
};

/**
 * File des versements à faire par l'équipe (payoutProvider "manual_bank" ou "manual_payout") :
 * virements bancaires et portefeuilles sans intégration réelle (Orange Money, MTN sans clés de production…).
 * Les coordonnées bancaires complètes et les actions passent par GET/POST /api/transfers/[id]/bank-payout,
 * protégés par la session admin (cookie) ou ADMIN_API_TOKEN.
 */
export function BankQueue({
  rows,
  nl,
  date,
}: {
  rows: AdminTransferRow[];
  nl: string;
  date: (iso: string) => string;
}) {
  const t = useT(adminMessages);
  return (
    <section aria-labelledby="admin-bank-queue" className="rounded-3xl border border-warn/30 bg-white p-4 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="admin-bank-queue" className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-ink">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-warn/10 text-warn">
              <Icon name="finance" className="h-4 w-4" />
            </span>
            {t("bankQueueTitle")}
            <Badge tone={rows.length > 0 ? "warn" : "neutral"}>{rows.length}</Badge>
          </h2>
          <p className="mt-1 text-sm text-muted">{t("bankQueueHint")}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("bankQueueEmpty")}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <BankQueueItem key={r.id} row={r} nl={nl} date={date} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BankQueueItem({
  row,
  nl,
  date,
}: {
  row: AdminTransferRow;
  nl: string;
  date: (iso: string) => string;
}) {
  const t = useT(adminMessages);
  const router = useRouter();
  const [details, setDetails] = useState<BankDetails | null>(null);
  const [bankRef, setBankRef] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  // Clôture réussie : boutons retirés pour éviter un second envoi pendant le rechargement.
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const amount = formatMoney(row.receiveAmountXaf, row.receiveCurrency, nl);
  const phoneDisplay = row.recipientPhone ? `+${row.recipientPhone}` : "-";
  // Portefeuille mobile : tout est déjà connu, pas besoin de « Afficher les coordonnées ».
  const ready = !row.isBank || details !== null;
  const dest = row.isBank
    ? [details?.bankName ?? row.recipientBankName, details?.accountNumber ?? row.recipientAccountMasked].filter(Boolean).join(" ")
    : `${row.recipientNetwork} ${phoneDisplay}`;

  async function loadDetails() {
    setBusy(true);
    setMessage(null);
    try {
      setDetails((await adminAction(`/api/transfers/${row.id}/bank-payout`, { method: "GET" }, t)) as BankDetails);
    } catch (err) {
      setMessage({ ok: false, text: t("actionError", { error: err instanceof Error ? err.message : "?" }) });
    } finally {
      setBusy(false);
    }
  }

  async function complete(outcome: "delivered" | "failed") {
    if (busy) return;
    const why = reason.trim();
    if (outcome === "failed" && !why) {
      setMessage({ ok: false, text: t("failReasonRequired") });
      document.getElementById(`bank-reason-${row.id}`)?.focus();
      return;
    }
    const question =
      outcome === "delivered"
        ? t("confirmDelivered", { amount, recipient: row.recipientName, dest })
        : t("confirmFailed", { ref: row.reference, reason: why });
    if (!window.confirm(question)) return;
    setBusy(true);
    setMessage(null);
    try {
      await adminAction(
        `/api/transfers/${row.id}/bank-payout`,
        { body: { outcome, bankReference: bankRef.trim() || undefined, reason: outcome === "failed" ? why : undefined } },
        t,
      );
      setDone(true);
      setMessage({ ok: true, text: t("actionDone", { ref: row.reference }) });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: t("actionError", { error: err instanceof Error ? err.message : "?" }) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/transferts/${row.reference}`} className="font-mono text-xs font-semibold text-brand hover:underline">
            {row.reference}
          </Link>
          <p className="mt-0.5 text-xs text-muted">
            {date(row.createdAt)} · {t("payoutSender")} : {row.senderName}
          </p>
          <p className="mt-2 font-medium text-ink">{row.recipientName}</p>
          <p className="text-sm text-muted">{dest}</p>
        </div>
        <p className="shrink-0 text-right font-display text-lg font-extrabold text-ink">{amount}</p>
      </div>

      {!ready && (
        <Button size="md" variant="secondary" className="mt-3 w-full sm:w-auto" disabled={busy} onClick={() => void loadDetails()}>
          {t("showDetails")}
        </Button>
      )}

      {ready && (
        <div className="mt-3 space-y-3">
          {/* Fiche de versement : chaque valeur se copie d'un geste (téléphone de l'équipe). */}
          <dl className="divide-y divide-line rounded-xl bg-surface-soft px-3">
            <CopyRow label={t("payoutAmount")} value={rawAmount(row.receiveAmountXaf)} display={amount} strong />
            <CopyRow label={t("payoutRecipient")} value={details?.fullName ?? row.recipientName} />
            {row.isBank ? (
              <>
                <CopyRow label={t("bankName")} value={details?.bankName ?? ""} display={details?.bankName ?? "-"} />
                <CopyRow label={t("account")} value={details?.accountNumber ?? ""} display={details?.accountNumber ?? "-"} />
                <CopyRow label={t("bankCode")} value={details?.bankCode ?? ""} display={details?.bankCode || "-"} />
                {row.recipientPhone && <CopyRow label={t("phoneLabel")} value={row.recipientNational} display={phoneDisplay} />}
              </>
            ) : (
              <CopyRow
                label={t("payoutNumber", { network: row.recipientNetwork })}
                value={row.recipientNational}
                display={phoneDisplay}
              />
            )}
            <CopyRow label={t("payoutReference")} value={row.reference} />
          </dl>

          {!done && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`bank-ref-${row.id}`} className="block text-xs font-medium text-muted">
                    {t("bankRefLabel")}
                  </label>
                  <input
                    id={`bank-ref-${row.id}`}
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    maxLength={80}
                    autoComplete="off"
                    className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label htmlFor={`bank-reason-${row.id}`} className="block text-xs font-medium text-muted">
                    {t("failReasonLabel")}
                  </label>
                  <input
                    id={`bank-reason-${row.id}`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={300}
                    autoComplete="off"
                    className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button size="md" disabled={busy} aria-busy={busy} onClick={() => void complete("delivered")}>
                  <Icon name="check" className="h-4 w-4" />
                  {t("markDelivered")}
                </Button>
                <Button size="md" variant="danger" disabled={busy} onClick={() => void complete("failed")}>
                  {t("markFailed")}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${
            message.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          }`}
        >
          {message.text}
        </p>
      )}
    </li>
  );
}
