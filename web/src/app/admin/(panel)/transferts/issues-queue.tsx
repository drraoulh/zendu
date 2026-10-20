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
import { INTERAC_PROVIDER } from "@/lib/providers/interac";
import type { AdminTransferRow } from "./admin-dashboard";
import { adminAction, CopyButton } from "./queue-kit";

/**
 * À régulariser : paiement Interac non conforme (→ « paiement maintenant complet ») et versement en
 * échec (→ « relancer le versement », POST /api/transfers/[id]/payout). Session admin requise.
 */
export function IssuesQueue({ rows, nl, date }: { rows: AdminTransferRow[]; nl: string; date: (iso: string) => string }) {
  const t = useT(adminMessages);
  return (
    <section aria-labelledby="admin-issues-queue" className="rounded-3xl border border-danger/25 bg-white p-4 shadow-card sm:p-6">
      <h2 id="admin-issues-queue" className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-ink">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-danger/10 text-danger">
          <Icon name="info" className="h-4 w-4" />
        </span>
        {t("issuesTitle")}
        <Badge tone="danger">{rows.length}</Badge>
      </h2>
      <p className="mt-1 text-sm text-muted">{t("issuesHint")}</p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <IssueItem key={r.id} row={r} nl={nl} date={date} />
        ))}
      </ul>
    </section>
  );
}

function IssueItem({ row, nl, date }: { row: AdminTransferRow; nl: string; date: (iso: string) => string }) {
  const t = useT(adminMessages);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const mismatch = row.status === "payment_mismatch";
  const canConfirm = mismatch && row.payInProvider === INTERAC_PROVIDER;
  const paid = formatMoney(row.totalCad, row.sendCurrency, nl);
  const receive = formatMoney(row.receiveAmountXaf, row.receiveCurrency, nl);

  async function act() {
    const question = mismatch
      ? t("confirmIssueReceived", { ref: row.reference, amount: paid })
      : t("confirmRetry", { receive, recipient: row.recipientName });
    if (busy || !window.confirm(question)) return;
    setBusy(true);
    setMessage(null);
    try {
      await adminAction(
        mismatch ? `/api/transfers/${row.id}/interac` : `/api/transfers/${row.id}/payout`,
        mismatch ? { body: { action: "received" } } : {},
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

  async function cancel() {
    if (busy) return;
    const note = window.prompt(t("promptCancel", { ref: row.reference, amount: paid }));
    if (note === null) return;
    setBusy(true);
    setMessage(null);
    try {
      await adminAction(`/api/transfers/${row.id}/cancel`, { body: { note } }, t);
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
          <p className="mt-0.5 text-xs text-muted">{date(row.createdAt)}</p>
          <p className="mt-2 font-medium text-ink">
            {row.senderName} → {row.recipientName}
          </p>
          <p className="text-sm text-muted">
            {row.recipientNetwork} · {row.recipientPhone ? `+${row.recipientPhone}` : "—"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <Badge tone="danger">{mismatch ? t("statusMismatch") : t("statusPayoutFailed")}</Badge>
          <p className="mt-1 text-sm font-bold text-ink">{paid}</p>
          <p className="text-xs text-muted">{receive}</p>
        </div>
      </div>
      {row.failureReason && (
        <p className="mt-3 rounded-xl bg-danger/5 px-3 py-2 text-sm text-danger">
          <span className="font-semibold">{t("issueReason")} :</span> {row.failureReason}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface-soft px-3 py-2">
        <p className="min-w-0 text-sm">
          <span className="block text-xs text-muted">{t("issueContact")}</span>
          <a href={`mailto:${row.senderEmail}?subject=${encodeURIComponent(row.reference)}`} className="break-all font-semibold text-brand hover:underline">
            {row.senderEmail}
          </a>
        </p>
        <CopyButton value={row.senderEmail} label={t("issueContact")} />
      </div>
      {!done && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(mismatch ? canConfirm : true) && (
            <Button size="md" variant="secondary" className="w-full sm:w-auto" disabled={busy} aria-busy={busy} onClick={() => void act()}>
              {mismatch ? t("issueReceived") : t("issueRetry")}
            </Button>
          )}
          <Button size="md" variant="danger" className="w-full sm:w-auto" disabled={busy} onClick={() => void cancel()}>
            {t("issueCancel")}
          </Button>
        </div>
      )}
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${message.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
        >
          {message.text}
        </p>
      )}
    </li>
  );
}
