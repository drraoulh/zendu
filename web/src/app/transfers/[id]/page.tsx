"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { statusLabel } from "@/lib/transfer-machine";
import { SandboxBanner } from "@/components/sandbox-banner";
import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";

type Transfer = {
  id: string;
  reference: string;
  status: string;
  corridorId?: string;
  sendCurrency?: string;
  receiveCurrency?: string;
  sendAmountCad: number;
  receiveAmountXaf: number;
  rate: number;
  feeCad: number;
  totalCad: number;
  payoutRef: string | null;
  failureReason: string | null;
  beneficiary: {
    fullName: string;
    phone: string;
    network: string;
  };
  events: { id: string; type: string; message: string; createdAt: string }[];
};

function trackIndex(status: string): number {
  if (status === "delivered") return 3;
  if (["payout_queued", "payout_sent"].includes(status)) return 2;
  if (status === "payment_detected") return 1;
  if (
    ["payout_failed", "payment_mismatch", "cancelled", "expired"].includes(
      status,
    )
  )
    return -1;
  return 0;
}

export default function TransferDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const track = [
    { key: "awaiting_payment", label: t("trackPayment") },
    { key: "payment_detected", label: t("trackReceived") },
    { key: "payout_sent", label: t("trackPayout") },
    { key: "delivered", label: t("trackDelivered") },
  ];

  const load = useCallback(async () => {
    const res = await fetch(`/api/transfers/${params.id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    setTransfer(data);
  }, [params.id]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 2500);
    return () => clearInterval(timer);
  }, [load]);

  async function simulatePay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/transfers/${params.id}/simulate-pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec");
      setTransfer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const idx = useMemo(
    () => (transfer ? trackIndex(transfer.status) : 0),
    [transfer],
  );

  if (!transfer && !error) {
    return (
      <div className="mx-auto max-w-lg px-5 py-12 text-ink-muted">
        {t("loading")}
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="mx-auto max-w-lg px-5 py-12 text-danger">{error}</div>
    );
  }

  const sendCur = transfer.sendCurrency ?? "CAD";
  const recvCur = transfer.receiveCurrency ?? "XAF";
  const awaiting = transfer.status === "awaiting_payment";
  const delivered = transfer.status === "delivered";
  const failed = ["payout_failed", "payment_mismatch", "cancelled"].includes(
    transfer.status,
  );
  const [from, to] = (transfer.corridorId ?? "CA-CM").split("-");

  return (
    <div className="bg-bg">
      <SandboxBanner />
      <div className="mx-auto max-w-lg px-5 py-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              {from && <CountryFlag code={from} size={16} />}
              <span>→</span>
              {to && <CountryFlag code={to} size={16} />}
              <span>· {transfer.reference}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
              {statusLabel(transfer.status)}
            </h1>
          </div>
          <Link
            href="/history"
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-accent"
          >
            {t("activity")}
          </Link>
        </div>

        <div className="mb-5 rounded-[1.5rem] border border-line bg-white p-5 shadow-sm">
          <div className="mb-5 flex justify-between gap-2">
            {track.map((step, i) => {
              const done = idx >= i && idx >= 0;
              const current = idx === i;
              return (
                <div key={step.key} className="flex-1 text-center">
                  <div
                    className={`mx-auto mb-2 h-2 rounded-full transition ${
                      done ? "bg-accent" : "bg-line"
                    } ${current ? "ring-2 ring-accent/30" : ""}`}
                  />
                  <p
                    className={`text-[11px] ${
                      done ? "font-semibold text-ink" : "text-ink-muted"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-accent-soft px-4 py-4">
            <p className="text-sm text-ink-muted">{t("theyReceive")}</p>
            <p className="font-display text-3xl font-bold text-accent-strong">
              {formatMoney(transfer.receiveAmountXaf, recvCur)}
            </p>
            <p className="mt-2 text-sm text-ink">
              {transfer.beneficiary.fullName} · {transfer.beneficiary.network} ·{" "}
              {transfer.beneficiary.phone}
            </p>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <Row
              label={t("youSend")}
              value={formatMoney(transfer.sendAmountCad, sendCur)}
            />
            <Row
              label={t("fee")}
              value={
                transfer.feeCad === 0
                  ? "0"
                  : formatMoney(transfer.feeCad, sendCur)
              }
            />
            <Row
              label={t("total")}
              value={formatMoney(transfer.totalCad, sendCur)}
            />
            <Row
              label={t("rate")}
              value={`1 ${sendCur} = ${transfer.rate.toFixed(2)} ${recvCur}`}
            />
          </div>
        </div>

        {awaiting && (
          <div className="mb-5 rounded-[1.5rem] border border-line bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold">{t("payNow")}</h2>
            <p className="mt-2 text-sm text-ink-muted">{t("payHint")}</p>
            <button
              type="button"
              disabled={busy}
              onClick={simulatePay}
              className="mt-4 w-full rounded-full bg-accent py-3.5 font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
            >
              {busy ? t("processing") : t("simulatePay")}
            </button>
          </div>
        )}

        {delivered && (
          <div className="mb-5 rounded-[1.5rem] border border-accent/30 bg-accent-soft p-5 text-accent-strong">
            <p className="font-semibold">{t("trackDelivered")}</p>
            <p className="mt-1 text-sm opacity-80">
              {t("deliveredMsg")}
              {transfer.payoutRef ? ` · ${transfer.payoutRef}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/transfers/${transfer.id}/receipt`}
                className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
              >
                {t("viewReceipt")}
              </Link>
              <Link
                href="/send"
                className="inline-flex rounded-full border border-accent/30 bg-white px-4 py-2 text-sm font-semibold text-accent"
              >
                {t("newTransfer")}
              </Link>
            </div>
          </div>
        )}

        {failed && (
          <div className="mb-5 rounded-[1.5rem] border border-danger/30 bg-white p-5 text-danger">
            <p className="font-semibold">{t("incident")}</p>
            <p className="mt-1 text-sm">
              {transfer.failureReason ?? statusLabel(transfer.status)}
            </p>
          </div>
        )}

        <div className="mb-5 rounded-[1.5rem] border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            <Link
              href={`/transfers/${transfer.id}/receipt`}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              {t("receipt")}
            </Link>
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/transfers/${transfer.id}/receipt`;
                void navigator.clipboard?.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-accent"
            >
              {copied ? t("linkCopied") : t("copyLink")}
            </button>
          </div>
          <h2 className="mb-3 font-display text-lg font-semibold">
            {t("activity")}
          </h2>
          <ol className="space-y-3">
            {[...transfer.events].reverse().map((event) => (
              <li key={event.id} className="border-l-2 border-accent/30 pl-3 text-sm">
                <p className="text-xs text-ink-muted">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
                <p>{event.message}</p>
              </li>
            ))}
          </ol>
        </div>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
