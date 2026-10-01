"use client";

import { statusTone, type StatusTone } from "./status";
import { useTransferLabels } from "./use-transfer-labels";

const TONE_CLASSES: Record<StatusTone, { pill: string; dot: string }> = {
  brand: { pill: "bg-brand-soft text-brand-strong ring-brand/15", dot: "bg-brand" },
  success: { pill: "bg-success/10 text-success ring-success/20", dot: "bg-success" },
  warn: { pill: "bg-warn/10 text-[#8a5d06] ring-warn/25", dot: "bg-warn" },
  danger: { pill: "bg-danger/10 text-danger ring-danger/20", dot: "bg-danger" },
  neutral: { pill: "bg-surface-soft text-muted ring-line", dot: "bg-muted" },
};

export function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const { status: label } = useTransferLabels();
  const tone = TONE_CLASSES[statusTone(status)];
  const pad = size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${pad} ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden />
      {label(status)}
    </span>
  );
}
