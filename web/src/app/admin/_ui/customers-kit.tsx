"use client";

import { Badge } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { customersMessages, type CustomersKey } from "@/i18n/admin-customers";

type Tone = "brand" | "success" | "warn" | "danger" | "neutral";

export const KYC_TONE: Record<string, Tone> = { none: "neutral", pending: "warn", verified: "success", rejected: "danger" };

export function useCustomersT() {
  const t = useT(customersMessages);
  const label = (prefix: string, v: string) => {
    const key = `${prefix}${v}` as CustomersKey;
    return key in customersMessages.fr ? t(key) : v;
  };
  return { t, label };
}

export function KycBadge({ status }: { status: string }) {
  const { label } = useCustomersT();
  return (
    <Badge tone={KYC_TONE[status] ?? "neutral"}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label("kyc_", status)}
    </Badge>
  );
}

export function AccountBadge({ status }: { status: string }) {
  const { label } = useCustomersT();
  return <Badge tone={status === "active" ? "brand" : "danger"}>{label("st_", status)}</Badge>;
}

export const COUNTRY_LABEL: Record<string, string> = { CA: "Canada", CM: "Cameroun", CN: "Chine" };
