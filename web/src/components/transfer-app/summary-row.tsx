import type { ReactNode } from "react";

/** Ligne libellé / valeur des récapitulatifs. */
export function SummaryRow({
  label,
  value,
  emphasis = "normal",
}: {
  label: ReactNode;
  value: ReactNode;
  emphasis?: "normal" | "strong" | "highlight";
}) {
  const valueClass =
    emphasis === "highlight"
      ? "font-display text-base font-extrabold text-brand-strong"
      : emphasis === "strong"
        ? "font-semibold text-ink"
        : "font-medium text-ink";
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right tabular-nums ${valueClass}`}>{value}</dd>
    </div>
  );
}
