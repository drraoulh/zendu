"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PaymentLogo } from "@/components/ui/payment-logo";
import { useT } from "@/i18n/define";
import { adminMessages } from "@/i18n/admin";
import { formatMoney } from "@/lib/money";
import type { AdminTransferRow } from "./admin-dashboard";
import { adminAction, CopyRow, rawAmount } from "./queue-kit";

/**
 * Virements Interac en attente (payInProvider "interac_manual") : l'équipe vérifie la réception sur le
 * compte de dépôt et confirme. Actions : POST /api/transfers/[id]/interac (session admin).
 */
export function InteracQueue({ rows, nl, date }: { rows: AdminTransferRow[]; nl: string; date: (iso: string) => string }) {
  const t = useT(adminMessages);
  // Ceux que le client a déclarés envoyés d'abord : ce sont ceux à vérifier en priorité.
  const sorted = [...rows].sort((a, b) => Number(!!b.interacDeclaredAt) - Number(!!a.interacDeclaredAt));
  return (
    <section aria-labelledby="admin-interac-queue" className="rounded-3xl border border-brand/25 bg-white p-4 shadow-card sm:p-6">
      <h2 id="admin-interac-queue" className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-ink">
        <PaymentLogo id="INTERAC" size={24} title="" />
        {t("interacQueueTitle")}
        <Badge tone="brand">{rows.length}</Badge>
      </h2>
      <p className="mt-1 text-sm text-muted">{t("interacQueueHint")}</p>
      <ul className="mt-4 space-y-3">
        {sorted.map((r) => (
          <InteracItem key={r.id} row={r} nl={nl} date={date} />
        ))}
      </ul>
    </section>
  );
}

function InteracItem({ row, nl, date }: { row: AdminTransferRow; nl: string; date: (iso: string) => string }) {
  const t = useT(adminMessages);
  const router = useRouter();
  const [interacRef, setInteracRef] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  // Action réussie : boutons retirés pour éviter un second envoi pendant le rechargement.
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const late = row.status === "expired";
  const expected = formatMoney(row.totalCad, row.sendCurrency, nl);
  const receive = formatMoney(row.receiveAmountXaf, row.receiveCurrency, nl);

  async function act(action: "received" | "mismatch") {
    const question =
      action === "received"
        ? t("confirmReceived", { amount: expected, sender: row.senderName, ref: row.reference, receive, recipient: row.recipientName })
        : t("confirmMismatch", { ref: row.reference });
    if (busy || !window.confirm(question)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = (await adminAction(
        `/api/transfers/${row.id}/interac`,
        {
          body:
            action === "received"
              ? { action, interacReference: interacRef.trim() || undefined }
              : { action, reason: reason.trim() || undefined },
        },
        t,
      )) as { pendingSecondApproval?: boolean } | null;
      setDone(true);
      setMessage({ ok: true, text: res?.pendingSecondApproval ? t("firstApprovalDone", { ref: row.reference }) : t("actionDone", { ref: row.reference }) });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: t("actionError", { error: err instanceof Error ? err.message : "?" }) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={`rounded-2xl border p-4 ${row.interacDeclaredAt ? "border-brand/40 bg-brand/[0.03]" : "border-line"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/transferts/${row.reference}`} className="font-mono text-xs font-semibold text-brand hover:underline">
            {row.reference}
          </Link>
          <p className="mt-0.5 text-xs text-muted">{date(row.createdAt)}</p>
          <p className="mt-2 font-medium text-ink">{row.senderName}</p>
          <p className="break-all text-sm text-muted">{row.senderEmail}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-muted">{t("interacExpected")}</p>
          <p className="font-display text-lg font-extrabold text-ink">{expected}</p>
        </div>
      </div>

      <dl className="mt-3 divide-y divide-line rounded-xl bg-surface-soft px-3">
        <CopyRow label={t("interacMessage")} value={row.reference} />
        <CopyRow label={t("interacExpected")} value={rawAmount(row.totalCad)} display={expected} />
      </dl>
      <p className="mt-2 text-xs text-muted">
        {t("interacFor")} <span className="font-semibold text-ink">{row.recipientName}</span> · {row.recipientNetwork} ·{" "}
        <span className="whitespace-nowrap">{receive}</span>
      </p>
      {late && (
        <p className="mt-2 rounded-xl bg-warn/10 px-3 py-2 text-xs font-semibold text-[#7a5308]">{t("interacLate")}</p>
      )}
      <p className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${row.interacDeclaredAt ? "text-brand" : "text-muted"}`}>
        {row.interacDeclaredAt ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
        {row.interacDeclaredAt ? t("interacDeclared", { date: date(row.interacDeclaredAt) }) : t("interacNotDeclared")}
      </p>

      {row.dualApproval && (
        <p className="mt-2 rounded-xl bg-brand/[0.06] px-3 py-2 text-xs font-semibold text-brand-strong">
          {row.interacApprovedByName && row.interacApprovedAt
            ? t("interacFirstBy", { name: row.interacApprovedByName, date: date(row.interacApprovedAt) })
            : t("interacDual")}
        </p>
      )}

      {!done && (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`interac-ref-${row.id}`} className="block text-xs font-medium text-muted">
                {t("interacRefLabel")}
              </label>
              <input
                id={`interac-ref-${row.id}`}
                value={interacRef}
                onChange={(e) => setInteracRef(e.target.value)}
                maxLength={80}
                autoComplete="off"
                className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label htmlFor={`interac-reason-${row.id}`} className="block text-xs font-medium text-muted">
                {t("interacReasonLabel")}
              </label>
              <input
                id={`interac-reason-${row.id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
                autoComplete="off"
                className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button size="md" disabled={busy} aria-busy={busy} onClick={() => void act("received")}>
              <Icon name="check" className="h-4 w-4" />
              {row.interacApprovedByName ? t("interacApproveSecond") : t("interacReceived")}
            </Button>
            <Button size="md" variant="danger" disabled={busy} onClick={() => void act("mismatch")}>
              {t("interacMismatch")}
            </Button>
          </div>
        </>
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
