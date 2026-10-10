"use client";

import type { ReactNode } from "react";
import { WstLogo } from "@/components/brand/wst-logo";
import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";
import { countryName, localeTag } from "@/components/transfer/transfer-calculator";
import { Icon, type IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { transferPage } from "@/i18n/services";
import { formatMoney } from "@/lib/money";

/*
 * Écrans simplifiés de l'application WorldSoft Transfer, dessinés en CSS
 * (reprise de la maquette mobile : accueil, destinataire, suivi). Données
 * d'exemple uniquement ; tout le contenu du téléphone est décoratif
 * (aria-hidden) et décrit par la légende de la figure.
 */

/* -------------------------------------------------------------------------- */
/* Cadre de téléphone                                                          */
/* -------------------------------------------------------------------------- */

export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative mx-auto w-[260px] shrink-0 select-none rounded-[2.75rem] bg-gradient-to-b from-[#1b2c63] to-navy-deep p-[9px] shadow-[0_40px_80px_-30px_rgba(4,15,51,0.65)] ring-1 ring-white/10 ${className}`}
    >
      {/* Boutons latéraux */}
      <span className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-[#1b2c63]" />
      <span className="absolute -left-[3px] top-36 h-14 w-[3px] rounded-l bg-[#1b2c63]" />
      <span className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-r bg-[#1b2c63]" />
      <div className="relative flex h-[530px] flex-col overflow-hidden rounded-[2.2rem] bg-white text-ink">
        {/* Îlot caméra */}
        <span className="absolute left-1/2 top-2 z-10 h-[18px] w-20 -translate-x-1/2 rounded-full bg-navy-deep" />
        {children}
      </div>
    </div>
  );
}

/** Figure : téléphone + titre + texte. */
export function PhoneShot({
  title,
  text,
  children,
  className = "",
}: {
  title: string;
  text: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={`flex flex-col items-center ${className}`}>
      <PhoneFrame>{children}</PhoneFrame>
      <figcaption className="mt-7 max-w-[280px] text-center">
        <span className="block font-display text-lg font-extrabold tracking-tight text-ink">{title}</span>
        <span className="mt-1.5 block text-sm leading-relaxed text-muted">{text}</span>
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* Petites briques                                                             */
/* -------------------------------------------------------------------------- */

function Svg({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

const BELL = "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0";
const BACK = "M15 18l-6-6 6-6";
const HOME = "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z";
const BANK = "M3 10h18M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18M12 3l9 5H3z";

function AppMark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${light ? "bg-white" : "bg-brand-soft"}`}>
        <WstLogo variant="symbol" className="h-5 w-5" />
      </span>
      <span className={`font-display text-[13px] font-black leading-none tracking-tight ${light ? "text-white" : "text-navy"}`}>
        WorldSoft <span className={`font-medium ${light ? "text-sky" : "text-brand"}`}>Transfer</span>
      </span>
    </span>
  );
}

function TopBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2 pt-9">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-line text-ink">
        <Svg d={BACK} />
      </span>
      <span className="flex-1 font-display text-[15px] font-extrabold">{title}</span>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft">
        <WstLogo variant="symbol" className="h-5 w-5" />
      </span>
    </div>
  );
}

function PillButton({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "soft" | "line" }) {
  const cls =
    tone === "primary"
      ? "bg-brand text-white"
      : tone === "soft"
        ? "bg-brand-soft text-brand-strong"
        : "border border-line text-ink";
  return (
    <span className={`flex h-10 items-center justify-center gap-1.5 rounded-full text-[13px] font-bold ${cls}`}>
      {children}
    </span>
  );
}

function useScreen() {
  const t = useT(transferPage);
  const { locale } = useI18n();
  const tag = localeTag(locale);
  const num = (n: number) => new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(n);
  const cad = (n: number) => formatMoney(n, "CAD", tag);
  const country = (code: string) => countryName(code, locale);
  return { t, num, cad, country };
}

/* -------------------------------------------------------------------------- */
/* Écran 1 : accueil avec simulateur                                           */
/* -------------------------------------------------------------------------- */

export function HomeScreen() {
  const { t, num, cad, country } = useScreen();
  const tabs: { label: string; icon?: IconName; d?: string; active?: boolean }[] = [
    { label: t("scrTabHome"), d: HOME, active: true },
    { label: t("scrTabSend"), icon: "transfer" },
    { label: t("scrTabHistory"), icon: "receipt" },
    { label: t("scrTabProfile"), icon: "user" },
  ];
  return (
    <>
      <div className="flex-1 overflow-hidden">
        <div className="bg-navy-gradient px-4 pb-14 pt-9 text-white">
          <div className="flex items-center justify-between">
            <AppMark light />
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
              <Svg d={BELL} />
            </span>
          </div>
          <p className="mt-4 text-[11px] text-white/75">{t("scrHello")}</p>
          <p className="font-display text-[17px] font-extrabold leading-tight">{t("scrWho")}</p>
        </div>
        <div className="mx-3 -mt-10 space-y-2 rounded-2xl bg-white p-3.5 shadow-[0_20px_36px_-20px_rgba(4,15,51,0.5)]">
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted">
            {t("scrYouSend")}
            <span className="flex items-center gap-1 text-[11px] normal-case tracking-normal text-ink">
              <CountryFlag code="CA" size={16} /> CAD
            </span>
          </div>
          <p className="font-display text-2xl font-extrabold">{cad(100)}</p>
          <div className="h-px bg-line" />
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-muted">
            {t("scrTheyReceive")}
            <span className="flex items-center gap-1 text-[11px] normal-case tracking-normal text-ink">
              <CountryFlag code="CM" size={16} /> XAF
            </span>
          </div>
          <p className="font-display text-2xl font-extrabold text-brand">{num(40385)} XAF</p>
          <p className="text-[10px] text-muted">{t("scrQuoteLine", { fee: cad(2.89) })}</p>
          <PillButton>{t("scrSend")}</PillButton>
        </div>
        <div className="px-4 pt-4">
          <p className="font-display text-[13px] font-extrabold">{t("scrRecent")}</p>
          <div className="mt-2 flex items-center gap-2.5 border-b border-line pb-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-extrabold text-brand">
              M
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-bold">Marie N.</span>
              <span className="block text-[10px] text-muted">MTN MoMo · {country("CM")}</span>
            </span>
            <span className="text-right">
              <span className="block text-[11px] font-bold">{num(100963)} XAF</span>
              <span className="inline-block rounded-full bg-success/10 px-1.5 text-[9px] font-bold text-success">
                {t("scrDelivered")}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 border-t border-line bg-white px-2 pb-4 pt-2">
        {tabs.map((tab) => (
          <span
            key={tab.label}
            className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${tab.active ? "text-brand" : "text-muted"}`}
          >
            {tab.d ? <Svg d={tab.d} /> : <Icon name={tab.icon!} className="h-4 w-4" />}
            {tab.label}
          </span>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Écran 2 : destinataire / mode de réception                                  */
/* -------------------------------------------------------------------------- */

export function PayoutScreen() {
  const { t } = useScreen();
  const methods: { label: string; icon?: IconName; d?: string; on?: boolean }[] = [
    { label: "MTN MoMo", icon: "phone", on: true },
    { label: "Orange Money", icon: "phone" },
    { label: t("scrBank"), d: BANK },
  ];
  return (
    <>
      <TopBar title={t("scrRecipient")} />
      <div className="px-4">
        <div className="flex gap-1.5">
          <span className="h-1 flex-1 rounded-full bg-brand" />
          <span className="h-1 flex-1 rounded-full bg-brand" />
          <span className="h-1 flex-1 rounded-full bg-line" />
        </div>
        <p className="mt-1.5 text-[10px] font-semibold text-muted">{t("scrStep")}</p>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden px-4 pt-3">
        <p className="text-[11px] font-bold text-muted">{t("scrMethod")}</p>
        <div className="grid grid-cols-2 gap-2">
          {methods.map((m) => (
            <span
              key={m.label}
              className={`flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-bold ${
                m.on ? "border-2 border-brand bg-brand-soft text-brand-strong" : "border border-line text-ink"
              }`}
            >
              <span className={m.on ? "text-brand" : "text-muted"}>
                {m.d ? <Svg d={m.d} /> : <Icon name={m.icon!} className="h-4 w-4" />}
              </span>
              <span className="min-w-0 leading-tight">{m.label}</span>
            </span>
          ))}
        </div>
        <FakeField label={t("scrName")} value="Marie N." />
        <FakeField label={t("scrPhone")} value="+237 6XX XX XX XX" />
        <p className="flex gap-1.5 text-[10px] leading-snug text-muted">
          <Icon name="shield" className="h-3.5 w-3.5 shrink-0" />
          {t("scrNameHint")}
        </p>
      </div>
      <div className="px-4 pb-6 pt-2">
        <PillButton>{t("scrCheck")}</PillButton>
      </div>
    </>
  );
}

function FakeField({ label, value }: { label: string; value: string }) {
  return (
    <span className="block">
      <span className="block text-[11px] font-semibold">{label}</span>
      <span className="mt-1 flex h-10 items-center rounded-xl border border-line bg-bg px-3 text-[12px]">{value}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Écran 3 : suivi du transfert                                                */
/* -------------------------------------------------------------------------- */

export function TrackingScreen() {
  const { t, num } = useScreen();
  const steps = [
    { title: t("scrTl1"), sub: t("scrToday", { time: "14:02" }), done: true },
    { title: t("scrTl2"), sub: t("scrToday", { time: "14:03" }), done: true },
    { title: t("scrTl3"), sub: t("scrToday", { time: "14:05" }), done: true },
    { title: t("scrTl4"), sub: t("scrConfirm"), done: false },
  ];
  return (
    <>
      <TopBar title={t("scrTracking")} />
      <div className="flex-1 space-y-3.5 overflow-hidden px-4 pt-2">
        <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-success/10 px-3 py-4 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success text-white">
            <Icon name="check" className="h-6 w-6" strokeWidth={2.6} />
          </span>
          <span className="font-display text-base font-black text-success">{t("scrMoneyDelivered")}</span>
          <span className="text-[11px] text-ink">{t("scrReceived", { amount: `${num(100963)} XAF` })}</span>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-success">{t("scrRef")}</span>
        </div>
        <ol>
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-2.5">
              <span className="flex flex-col items-center">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                    s.done ? "bg-success" : "bg-brand"
                  }`}
                >
                  <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                </span>
                {i < steps.length - 1 && <span className="min-h-5 w-0.5 flex-1 bg-success" />}
              </span>
              <span className="pb-3">
                <span className="block text-[12px] font-bold leading-tight">{s.title}</span>
                <span className="block text-[10px] text-muted">{s.sub}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-6 pt-1">
        <PillButton tone="line">
          <Icon name="receipt" className="h-3.5 w-3.5" />
          {t("scrReceipt")}
        </PillButton>
        <PillButton tone="soft">
          <Icon name="transfer" className="h-3.5 w-3.5" />
          {t("scrResend")}
        </PillButton>
      </div>
    </>
  );
}
