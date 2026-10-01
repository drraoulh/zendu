"use client";

import { useCallback, useMemo } from "react";
import { useI18n } from "@/components/i18n-provider";
import { useT } from "@/i18n/define";
import { transfersMessages, type TransfersKey } from "@/i18n/transfers";
import { COUNTRIES } from "@/lib/corridors";
import { formatMoney } from "@/lib/money";
import { isKnownStatus } from "./status";

const INTL_LOCALES = { fr: "fr-CA", en: "en-CA", es: "es", zh: "zh-CN" } as const;

const NETWORK_LABELS: Record<string, string> = {
  MTN: "MTN MoMo",
  ORANGE: "Orange Money",
  WAVE: "Wave",
  MPESA: "M-Pesa",
  VODAFONE: "Vodafone Cash",
  AIRTEL: "Airtel Money",
};

/** Libellés traduits partagés par le parcours d'envoi, le suivi, l'historique et le reçu. */
export function useTransferLabels() {
  const { locale } = useI18n();
  const t = useT(transfersMessages);
  const intlLocale = INTL_LOCALES[locale as keyof typeof INTL_LOCALES] ?? "fr-CA";

  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([intlLocale], { type: "region" });
    } catch {
      return null;
    }
  }, [intlLocale]);

  const status = useCallback(
    (s: string) => (isKnownStatus(s) ? t(`status_${s}` as TransfersKey) : s),
    [t],
  );

  const eta = useCallback(
    (estimate: string) => {
      if (estimate === "A few minutes") return t("etaMinutes");
      if (estimate === "Under 24h") return t("etaDay");
      return estimate;
    },
    [t],
  );

  const network = useCallback(
    (id: string) => {
      if (id === "BANK") return t("netBank");
      if (id === "CASH") return t("netCash");
      return NETWORK_LABELS[id] ?? id;
    },
    [t],
  );

  const country = useCallback(
    (code: string) => {
      try {
        const name = regionNames?.of(code === "UK" ? "GB" : code);
        if (name && name !== code) return name;
      } catch {
        /* ignore */
      }
      return COUNTRIES[code]?.name ?? code;
    },
    [regionNames],
  );

  const money = useCallback(
    (amount: number, currency: string) => formatMoney(amount, currency, intlLocale),
    [intlLocale],
  );

  const dateTime = useCallback(
    (iso: string | Date) => {
      try {
        return new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium", timeStyle: "short" }).format(
          new Date(iso),
        );
      } catch {
        return new Date(iso).toLocaleString();
      }
    },
    [intlLocale],
  );

  const eventTitle = useCallback(
    (type: string) => {
      const key = `ev_${type}` as TransfersKey;
      return key in transfersMessages.fr ? t(key) : t("ev_other");
    },
    [t],
  );

  return { t, locale, intlLocale, status, eta, network, country, money, dateTime, eventTitle };
}
