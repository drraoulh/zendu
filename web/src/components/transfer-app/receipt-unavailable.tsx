"use client";

import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useTransferLabels } from "./use-transfer-labels";

/** État affiché quand la base de données est momentanément injoignable. */
export function ReceiptUnavailable({ transferId }: { transferId: string }) {
  const { t } = useTransferLabels();
  return (
    <div className="bg-bg px-4 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-warn/10 text-warn">
          <Icon name="receipt" className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-xl font-extrabold text-ink">{t("receiptUnavailable")}</h1>
        <p className="mt-2 text-sm text-muted">{t("receiptUnavailableBody")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href={`/transfers/${transferId}/receipt`} size="sm">
            {t("retry")}
          </ButtonLink>
          <ButtonLink href="/history" variant="secondary" size="sm">
            {t("myTransfers")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
