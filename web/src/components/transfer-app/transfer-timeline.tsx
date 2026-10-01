"use client";

import { Icon } from "@/components/ui/icon";
import { isFailure, progressIndex } from "./status";
import type { TransferDTO } from "./types";
import { useTransferLabels } from "./use-transfer-labels";

type StepState = "done" | "current" | "upcoming" | "failed";

/** Frise verticale : créé → payé → versement envoyé → livré. */
export function TransferTimeline({ transfer }: { transfer: TransferDTO }) {
  const { t, dateTime, status: statusLabel } = useTransferLabels();
  const events = transfer.events ?? [];
  const at = (type: string) => events.find((e) => e.type === type)?.createdAt;

  const reached = progressIndex(transfer.status);
  const failed = isFailure(transfer.status);
  const delivered = transfer.status === "delivered";

  const steps = [
    { title: t("stepCreated"), hint: t("stepCreatedHint"), time: transfer.createdAt },
    { title: t("stepPaid"), hint: t("stepPaidHint"), time: transfer.paidAt ?? at("payment_detected") },
    { title: t("stepPayout"), hint: t("stepPayoutHint"), time: at("payout_sent") },
    { title: t("stepDelivered"), hint: t("stepDeliveredHint"), time: transfer.deliveredAt ?? at("delivered") },
  ];

  function stateOf(i: number): StepState {
    if (delivered || i <= reached) return "done";
    if (i === reached + 1) return failed ? "failed" : "current";
    return "upcoming";
  }

  return (
    <ol className="relative space-y-0" aria-label={t("progress")}>
      {steps.map((step, i) => {
        const state = stateOf(i);
        const last = i === steps.length - 1;
        return (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 rounded-full ${
                  state === "done" ? "bg-brand" : "bg-line"
                }`}
              />
            )}
            <span
              className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition ${
                state === "done"
                  ? "border-brand bg-brand text-white"
                  : state === "current"
                    ? "border-brand bg-white text-brand"
                    : state === "failed"
                      ? "border-danger bg-danger text-white"
                      : "border-line bg-white text-muted"
              }`}
            >
              {state === "done" ? (
                <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
              ) : state === "failed" ? (
                <Icon name="close" className="h-4 w-4" strokeWidth={2.4} />
              ) : state === "current" ? (
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" aria-hidden />
              ) : (
                <span className="text-xs font-bold">{i + 1}</span>
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={`font-display text-sm font-bold ${
                  state === "upcoming" ? "text-muted" : state === "failed" ? "text-danger" : "text-ink"
                }`}
              >
                {state === "failed" ? `${t("stepFailed")} · ${statusLabel(transfer.status)}` : step.title}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {state === "failed" && transfer.failureReason ? transfer.failureReason : step.hint}
              </p>
              {state === "done" && step.time && (
                <p className="mt-1 text-xs font-medium text-muted/80">{dateTime(step.time)}</p>
              )}
              {state === "current" && (
                <p className="mt-1 text-xs font-semibold text-brand">{t("inProgress")}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
