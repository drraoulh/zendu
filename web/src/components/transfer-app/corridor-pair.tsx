"use client";

import { CountryFlag } from "@/components/country-flag";
import { Icon } from "@/components/ui/icon";
import { useTransferLabels } from "./use-transfer-labels";

/** Drapeaux source → destination, avec noms optionnels. */
export function CorridorPair({
  from,
  to,
  size = 20,
  showNames = false,
  className = "",
}: {
  from: string;
  to: string;
  size?: number;
  showNames?: boolean;
  className?: string;
}) {
  const { country } = useTransferLabels();
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      <CountryFlag code={from} size={size} title={country(from)} />
      {showNames && <span className="truncate font-medium">{country(from)}</span>}
      <Icon name="arrowRight" className="h-3.5 w-3.5 shrink-0 text-muted" />
      <CountryFlag code={to} size={size} title={country(to)} />
      {showNames && <span className="truncate font-medium">{country(to)}</span>}
    </span>
  );
}
