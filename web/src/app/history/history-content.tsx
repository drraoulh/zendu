"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { CountryFlag } from "@/components/country-flag";
import { formatMoney } from "@/lib/money";
import { statusLabel } from "@/lib/transfer-machine";

type Item = {
  id: string;
  reference: string;
  corridorId?: string | null;
  status: string;
  createdAt: string;
  receiveAmountXaf: number;
  receiveCurrency: string | null;
  sendAmountCad: number;
  sendCurrency: string | null;
  beneficiary: { fullName: string };
};

function statusTone(status: string) {
  if (status === "delivered") return "bg-accent-soft text-accent-strong";
  if (["payout_failed", "payment_mismatch", "cancelled", "expired"].includes(status))
    return "bg-red-50 text-danger";
  if (status === "awaiting_payment") return "bg-amber-50 text-amber-800";
  return "bg-bg-soft text-ink";
}

export function HistoryContent({ transfers }: { transfers: Item[] }) {
  const { t } = useI18n();

  return (
    <div className="bg-bg">
      <div className="mx-auto max-w-3xl px-5 py-8 lg:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("transferHistoryTitle")}
            </h1>
            <p className="mt-1 text-ink-muted">{t("trackTransfer")}</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/history/export"
              className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg-soft"
            >
              {t("exportCsv")}
            </a>
            <Link
              href="/send"
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong"
            >
              {t("sendMoneyCta")}
            </Link>
          </div>
        </div>

        {transfers.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-line bg-white px-6 py-14 text-center">
            <p className="font-display text-xl font-semibold">
              {t("emptyHistory")}
            </p>
            <Link
              href="/send"
              className="mt-5 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t("emptyHistoryCta")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((item) => {
              const [from, to] = (item.corridorId || "CA-CM").split("-");
              return (
                <div
                  key={item.id}
                  className="rounded-[1.25rem] border border-line bg-white px-4 py-4 shadow-sm transition hover:border-accent/40"
                >
                  <Link href={`/transfers/${item.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {from && <CountryFlag code={from} size={18} />}
                          <span className="text-ink-muted">→</span>
                          {to && <CountryFlag code={to} size={18} />}
                          <span
                            className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(item.status)}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <p className="mt-2 truncate font-semibold">
                          {item.beneficiary.fullName}
                        </p>
                        <p className="text-sm text-ink-muted">
                          {item.reference}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-semibold text-accent-strong">
                          {formatMoney(
                            item.receiveAmountXaf,
                            item.receiveCurrency || "XAF",
                          )}
                        </p>
                        <p className="text-sm text-ink-muted">
                          {formatMoney(
                            item.sendAmountCad,
                            item.sendCurrency || "CAD",
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="mt-3 flex gap-3 border-t border-line pt-3">
                    <Link
                      href={`/transfers/${item.id}`}
                      className="text-xs font-semibold text-accent"
                    >
                      {t("trackTransfer")}
                    </Link>
                    <Link
                      href={`/transfers/${item.id}/receipt`}
                      className="text-xs font-semibold text-accent"
                    >
                      {t("receipt")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
