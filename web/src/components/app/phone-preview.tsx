"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { appMessages } from "@/i18n/app";
import { useT } from "@/i18n/define";

/** Aperçu simplifié de l'application dans un cadre de téléphone en CSS (aucune image externe, aucun chiffre inventé). */
export function PhonePreview({ amountLabel, destLabel }: { amountLabel?: string; destLabel?: string }) {
  const t = useT(appMessages);
  const bar = "h-2.5 rounded-full bg-silver/70";

  return (
    <div className="relative mx-auto w-[15.5rem] sm:w-[17rem]" role="img" aria-label={t("mockPreview")}>
      <div className="absolute -inset-10 rounded-full bg-brand/30 blur-3xl" aria-hidden />
      <div className="relative rounded-[2.75rem] border border-white/15 bg-navy-deep p-2.5 shadow-float">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-surface-soft" aria-hidden>
          <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-navy-deep" />

          <div className="bg-brand-gradient px-4 pb-10 pt-10 text-white">
            <div className="flex items-center gap-2.5">
              <Image src="/brand/wst/app-icon-rounded.svg" width={36} height={36} alt="" className="h-9 w-9" unoptimized />
              <div className="leading-tight">
                <p className="font-display text-sm font-black tracking-tight">WorldSoft</p>
                <p className="text-xs font-medium text-white/80">Transfer</p>
              </div>
            </div>
          </div>

          <div className="-mt-6 space-y-3 px-3 pb-5">
            <div className="rounded-2xl bg-white p-3.5 shadow-card">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted">{t("mockSend")}</p>
              {amountLabel ? (
                <p className="mt-1 font-display text-lg font-extrabold text-ink">{amountLabel}</p>
              ) : (
                <div className={`mt-2 w-24 ${bar}`} />
              )}
              <div className="my-3 h-px bg-line" />
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted">{t("mockReceive")}</p>
              {destLabel ? (
                <p className="mt-1 text-sm font-bold text-ink">{destLabel}</p>
              ) : (
                <div className={`mt-2 w-20 ${bar}`} />
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[0.65rem] font-semibold text-muted">{t("mockFee")}</span>
                <span className={`w-10 ${bar}`} />
              </div>
              <div className="mt-3.5 rounded-full bg-brand py-2 text-center text-xs font-bold text-white">{t("mockButton")}</div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success">
                <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
              </span>
              <div className="flex-1">
                <div className={`w-20 ${bar}`} />
                <div className="mt-1.5 flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="h-1.5 flex-1 rounded-full bg-success" />
                  ))}
                </div>
              </div>
              <span className="text-[0.65rem] font-bold text-success">{t("mockDelivered")}</span>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon name="clock" className="h-4 w-4" />
              </span>
              <div className="flex-1 space-y-1.5">
                <div className={`w-24 ${bar}`} />
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-full ${i < 2 ? "bg-brand" : "bg-silver/60"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
