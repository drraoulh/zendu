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

/**
 * Virements Interac en attente (payInProvider "interac_manual") : l'équipe vérifie la réception sur le
 * compte de dépôt et confirme. Actions : POST /api/transfers/[id]/interac (session admin).
 */
export function InteracQueue({ rows, nl, date }: { rows: AdminTransferRow[]; nl: string; date: (iso: string) => string }) {
  const t = useT(adminMessages);
  // Ceux que le client a déclarés envoyés d'abord : ce sont ceux à vérifier en priorité.
  const sorted = [...rows].sort((a, b) => Number(!!b.interacDeclaredAt) - Number(!!a.interacDeclaredAt));
  return (
    <section aria-labelledby="admin-interac-queue" className="rounded-3xl border border-brand/25 bg-white p-5 shadow-card sm:p-6">
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function act(action: "received" | "mismatch") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/transfers/${row.id}/interac`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "received" ? { action, interacReference: interacRef.trim() || undefined } : { action }),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : String(res.status));
      setMessage({ ok: true, text: t("actionDone", { ref: row.reference }) });
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
          <Link href={`/transfers/${row.id}`} className="font-mono text-xs font-semibold text-brand hover:underline">
            {row.reference}
          </Link>
          <p className="mt-0.5 text-xs text-muted">{date(row.createdAt)}</p>
          <p className="mt-2 font-medium text-ink">{row.senderName}</p>
          <p className="break-all text-sm text-muted">{row.senderEmail}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-muted">{t("interacExpected")}</p>
          <p className="font-display text-lg font-extrabold text-ink">{formatMoney(row.totalCad, row.sendCurrency, nl)}</p>
        </div>
      </div>

      <dl className="mt-3 grid gap-x-4 gap-y-1 rounded-xl bg-surface-soft p-3 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted">{t("interacMessage")}</dt>
        <dd className="font-mono font-semibold text-ink">{row.reference}</dd>
      </dl>
      <p className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${row.interacDeclaredAt ? "text-brand" : "text-muted"}`}>
        {row.interacDeclaredAt ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
        {row.interacDeclaredAt ? t("interacDeclared", { date: date(row.interacDeclaredAt) }) : t("interacNotDeclared")}
      </p>

      <div className="mt-3">
        <label htmlFor={`interac-ref-${row.id}`} className="block text-xs font-medium text-muted">
          {t("interacRefLabel")}
        </label>
        <input
          id={`interac-ref-${row.id}`}
          value={interacRef}
          onChange={(e) => setInteracRef(e.target.value)}
          maxLength={80}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 sm:max-w-sm"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => void act("received")}>
          <Icon name="check" className="h-4 w-4" />
          {t("interacReceived")}
        </Button>
        <Button size="sm" variant="danger" disabled={busy} onClick={() => void act("mismatch")}>
          {t("interacMismatch")}
        </Button>
      </div>

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
