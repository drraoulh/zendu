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

type BankDetails = {
  fullName: string;
  phone: string;
  bankName: string | null;
  accountNumber: string | null;
  bankCode: string | null;
};

/**
 * File des virements bancaires à traiter manuellement (payoutProvider "manual_bank").
 * Les coordonnées complètes et les actions passent par POST/GET /api/transfers/[id]/bank-payout,
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
    <section aria-labelledby="admin-bank-queue" className="rounded-3xl border border-warn/30 bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="admin-bank-queue" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
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
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(method: "GET" | "POST", body?: unknown) {
    const res = await fetch(`/api/transfers/${row.id}/bank-payout`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : String(res.status));
    return data;
  }

  async function loadDetails() {
    setBusy(true);
    setMessage(null);
    try {
      setDetails((await call("GET")) as BankDetails);
    } catch (err) {
      setMessage({ ok: false, text: t("actionError", { error: err instanceof Error ? err.message : "?" }) });
    } finally {
      setBusy(false);
    }
  }

  async function complete(outcome: "delivered" | "failed") {
    setBusy(true);
    setMessage(null);
    try {
      await call("POST", {
        outcome,
        bankReference: bankRef.trim() || undefined,
        reason: outcome === "failed" ? reason.trim() || undefined : undefined,
      });
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
          <Link href={`/transfers/${row.id}`} className="font-mono text-xs font-semibold text-brand hover:underline">
            {row.reference}
          </Link>
          <p className="mt-0.5 text-xs text-muted">{date(row.createdAt)}</p>
          <p className="mt-2 font-medium text-ink">{row.recipientName}</p>
          <p className="text-sm text-muted">
            {[row.recipientBankName, row.recipientAccountMasked].filter(Boolean).join(" ")}
          </p>
        </div>
        <p className="shrink-0 text-right font-display text-lg font-extrabold text-ink">
          {formatMoney(row.receiveAmountXaf, row.receiveCurrency, nl)}
        </p>
      </div>

      {!details && (
        <Button size="sm" variant="secondary" className="mt-3" disabled={busy} onClick={() => void loadDetails()}>
          {t("showDetails")}
        </Button>
      )}

      {details && (
        <div className="mt-3 space-y-3">
          <dl className="grid gap-x-4 gap-y-1 rounded-xl bg-surface-soft p-3 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted">{t("bankName")}</dt>
            <dd className="font-medium text-ink">{details.bankName ?? "—"}</dd>
            <dt className="text-muted">{t("account")}</dt>
            <dd className="break-all font-mono font-semibold text-ink">{details.accountNumber ?? "—"}</dd>
            <dt className="text-muted">{t("bankCode")}</dt>
            <dd className="font-mono text-ink">{details.bankCode || "—"}</dd>
            <dt className="text-muted">{t("phoneLabel")}</dt>
            <dd className="text-ink">{details.phone ? `+${details.phone}` : "—"}</dd>
          </dl>
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
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
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
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => void complete("delivered")}>
              <Icon name="check" className="h-4 w-4" />
              {t("markDelivered")}
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => void complete("failed")}>
              {t("markFailed")}
            </Button>
          </div>
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
