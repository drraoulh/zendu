"use client";

import type { ReactNode } from "react";
import { WstLogo } from "@/components/brand/wst-logo";
import { useI18n } from "@/components/i18n-provider";
import { countryName, localeTag } from "@/components/transfer/transfer-calculator";
import { Icon } from "@/components/ui/icon";
import { PaymentLogo } from "@/components/ui/payment-logo";
import { useT } from "@/i18n/define";
import { appScreens } from "@/i18n/app-screens";

/*
 * Écrans de l'application WorldSoft Transfer, dessinés en CSS d'après l'appli mobile actuelle
 * (mobile/src/app : accueil (tabs)/index.tsx, send/recipient.tsx, send/review.tsx, send/interac.tsx,
 * transfer/[id].tsx ; couleurs de mobile/src/lib/theme.ts). Données d'exemple uniquement : trajet
 * Canada → Cameroun, sans frais, taux moyen 410 moins la marge de 1,5 % (= 403,85), payé par
 * virement Interac. Tout le contenu du téléphone est décoratif (aria-hidden) et décrit par la
 * légende de la figure.
 *
 * Pour les vidéos, les écrans acceptent un état : <HomeScreen amount={…} />,
 * <TrackingScreen step={0..3} /> (en attente de paiement → paiement reçu → versement envoyé → livré).
 */

/** Taux d'exemple CAD → XAF affiché par l'appli (410 × (1 − 1,5 %)). */
const SAMPLE_RATE = 403.85;
const SAMPLE_REF = "PW-7K2Q9M";
const RECIPIENT = { first: "Marie", full: "Marie Ngono", phone: "+237 670 000 000" };

/* -------------------------------------------------------------------------- */
/* Cadre de téléphone                                                          */
/* -------------------------------------------------------------------------- */

export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative mx-auto w-[272px] shrink-0 select-none rounded-[2.9rem] bg-gradient-to-b from-[#1b2c63] to-navy-deep p-[9px] shadow-[0_40px_80px_-30px_rgba(4,15,51,0.65)] ring-1 ring-white/10 ${className}`}
    >
      {/* Boutons latéraux */}
      <span className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-[#1b2c63]" />
      <span className="absolute -left-[3px] top-36 h-14 w-[3px] rounded-l bg-[#1b2c63]" />
      <span className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-r bg-[#1b2c63]" />
      <div className="relative flex h-[584px] flex-col overflow-hidden rounded-[2.35rem] bg-bg text-ink">
        <StatusBar />
        {children}
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="relative flex h-9 shrink-0 items-center justify-between px-6 pt-1 text-[11px] font-bold text-ink">
      <span>9:41</span>
      {/* Îlot caméra */}
      <span className="absolute left-1/2 top-2 h-[20px] w-[76px] -translate-x-1/2 rounded-full bg-navy-deep" />
      <span className="flex items-center gap-1">
        <span className="flex items-end gap-[2px]">
          {[4, 6, 8, 10].map((h) => (
            <span key={h} className="w-[3px] rounded-[1px] bg-ink" style={{ height: h }} />
          ))}
        </span>
        <span className="relative ml-1 h-[10px] w-[20px] rounded-[3px] border border-ink/60 p-[1.5px]">
          <span className="block h-full w-3/4 rounded-[1.5px] bg-ink" />
        </span>
      </span>
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
/* Petites briques (reprises de mobile/src/components/ui.tsx)                  */
/* -------------------------------------------------------------------------- */

function Svg({ d, className = "h-4 w-4", strokeWidth = 2 }: { d: string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

/* Pictogrammes de l'appli (mobile/src/components/icons.tsx). */
const I = {
  bell: "M6 17h12l-1.5-2V10a4.5 4.5 0 00-9 0v5zM10 20h4",
  back: "M15 5l-7 7 7 7",
  home: "M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z",
  swap: "M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3",
  chevDown: "M6 9l6 6 6-6",
  send: "M4 7h13l-3-3M20 17H7l3 3",
  plus: "M12 5v14M5 12h14",
  copy: "M8 8h12v12H8zM4 16V4h12",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
};

type Tone = "brand" | "success" | "warn";
const TONE: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success/10 text-success",
  warn: "bg-[#fff3db] text-warn",
};

function Badge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[10px] font-semibold ${TONE[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function Header({ title, subtitle, close = false }: { title: string; subtitle?: string; close?: boolean }) {
  return (
    <div className="flex items-center px-3.5 pb-2 pt-1">
      {close ? <span className="w-8" /> : <IconBox d={I.back} />}
      <span className="min-w-0 flex-1 text-center">
        <span className="block font-display text-[14px] font-extrabold leading-tight">{title}</span>
        {subtitle && <span className="block text-[10px] text-muted">{subtitle}</span>}
      </span>
      {close ? <IconBox close /> : <span className="w-8" />}
    </div>
  );
}

function IconBox({ d, close = false }: { d?: string; close?: boolean }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-ink">
      {close ? <Icon name="close" className="h-4 w-4" strokeWidth={2} /> : <Svg d={d!} />}
    </span>
  );
}

function Steps({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div className="px-3.5 pb-3">
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-[3px] flex-1 rounded-full ${i < current ? "bg-brand" : "bg-line"}`} />
        ))}
      </div>
      <p className="mt-1.5 text-[10px] font-semibold text-brand">{label}</p>
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[16px] border border-line bg-white shadow-[0_6px_16px_-10px_rgba(6,26,82,0.18)] ${className}`}>{children}</div>;
}

function Button({ children, tone = "primary", icon }: { children: ReactNode; tone?: "primary" | "secondary"; icon?: string }) {
  return (
    <span
      className={`flex h-10 items-center justify-center gap-1 rounded-[12px] border px-2 text-[11px] font-bold ${
        tone === "primary" ? "border-brand bg-brand text-white" : "border-line bg-white text-ink"
      }`}
    >
      {icon && <Svg d={icon} className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{children}</span>
    </span>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-1.5 py-[4px] text-[10.5px]">
      <span className="shrink-0 text-muted">{label}</span>
      <span className={`whitespace-nowrap text-right text-ink ${strong ? "font-extrabold" : "font-semibold"}`}>{value}</span>
    </div>
  );
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-full bg-brand-soft font-display font-extrabold text-brand"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}

/** Drapeaux dessinés comme dans l'appli (mobile/src/components/flag.tsx) : hors ligne, nets à toute taille. */
function Flag({ code, size = 20, className = "" }: { code: string; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      preserveAspectRatio="none"
      width={size}
      height={Math.round(size * 0.7)}
      className={`shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_0.5px_rgba(10,24,56,0.15)] ${className}`}
    >
      {code === "CA" ? (
        <>
          <rect width="30" height="20" fill="#ffffff" />
          <rect width="7.5" height="20" fill="#d52b1e" />
          <rect x="22.5" width="7.5" height="20" fill="#d52b1e" />
          <path d="M15 4l1 2.2 1.4-.6-.6 3 2-1.4.4 1.1 1.9-.4-.9 1.9 1 .5-3 2.3.5 1.1-2.7-.5V16h-1v-2.8l-2.7.5.5-1.1-3-2.3 1-.5-.9-1.9 1.9.4.4-1.1 2 1.4-.6-3 1.4.6z" fill="#d52b1e" />
        </>
      ) : code === "CM" ? (
        <>
          <rect width="10" height="20" fill="#007a5e" />
          <rect x="10" width="10" height="20" fill="#ce1126" />
          <rect x="20" width="10" height="20" fill="#fcd116" />
          <path d="M15 6.6l.9 2.8h2.9l-2.4 1.7.9 2.8-2.3-1.7-2.3 1.7.9-2.8-2.4-1.7h2.9z" fill="#fcd116" />
        </>
      ) : code === "CN" ? (
        <>
          <rect width="30" height="20" fill="#ee1c25" />
          <path d="M5 2.2l.9 2.8h2.9L6.5 6.7l.9 2.8L5 7.8 2.6 9.5l.9-2.8-2.4-1.7H4z" fill="#ffff00" />
          <path d="M10.5 1.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9zM12.5 3.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9zM12.5 6.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9zM10.5 8.4l.3.9h.9l-.7.5.3.9-.8-.6-.8.6.3-.9-.7-.5h.9z" fill="#ffff00" />
        </>
      ) : (
        <rect width="30" height="20" fill="#e6edff" />
      )}
    </svg>
  );
}

function useScreen() {
  const t = useT(appScreens);
  const { locale } = useI18n();
  const tag = localeTag(locale);
  /** Comme money() de l'appli : « 200,00 CAD », « 80 770 FCFA ». */
  const money = (n: number, currency: string) => {
    const digits = currency === "XAF" ? 0 : 2;
    const value = new Intl.NumberFormat(tag, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
    return `${value} ${currency === "XAF" ? "FCFA" : currency}`;
  };
  const num = (n: number, digits = 0) =>
    new Intl.NumberFormat(tag, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
  const country = (code: string) => countryName(code, locale);
  return { t, money, num, country };
}

/* -------------------------------------------------------------------------- */
/* Écran 1 : accueil (convertisseur, renvoi en un geste, activité)             */
/* -------------------------------------------------------------------------- */

export function HomeScreen({ amount = 200 }: { amount?: number }) {
  const { t, money, num } = useScreen();
  const receive = Math.round(amount * SAMPLE_RATE);
  const tabs = [
    { label: t("tabHome"), d: I.home, active: true },
    { label: t("tabHistory"), icon: "receipt" as const },
    { label: t("tabParcels"), icon: "ship" as const },
    { label: t("tabProfile"), icon: "user" as const },
  ];
  return (
    <>
      <div className="flex-1 overflow-hidden px-3.5">
        <div className="flex items-center gap-2 pb-2.5 pt-0.5">
          <WstLogo variant="symbol" className="h-7 w-7" />
          <span className="flex-1 truncate font-display text-[17px] font-black text-navy">{t("hello", { name: "Paul" })}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-line bg-white text-ink">
            <Svg d={I.bell} />
          </span>
        </div>

        {/* Simulateur (mobile/src/components/simulator.tsx) */}
        <Card className="rounded-[20px] p-2">
          <div className="flex items-center gap-2 rounded-[14px] bg-bg px-3 py-1.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold text-muted">{t("youSend")}</span>
              <span className="block font-display text-[20px] font-black leading-tight text-navy">{num(amount)}</span>
            </span>
            <Pill code="CA" unit="CAD" />
          </div>
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Svg d={I.swap} className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-extrabold text-ink">1 CAD = {num(SAMPLE_RATE, 2)} FCFA</span>
              <span className="block whitespace-nowrap text-[10px] text-muted">
                <span className="font-semibold text-success">{t("noFee")}</span> · {t("etaMinutes")}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-[14px] bg-brand-soft px-3 py-1.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold text-muted">{t("theyReceive")}</span>
              <span className="block font-display text-[20px] font-black leading-tight text-brand">{num(receive)}</span>
            </span>
            <Pill code="CM" unit="FCFA" />
          </div>
          <div className="flex items-center justify-between px-1 pb-2 pt-1.5">
            <span className="text-[10px] text-muted">{t("total")}</span>
            <span className="text-[12px] font-extrabold text-ink">{money(amount, "CAD")}</span>
          </div>
          <Button icon={I.send}>{t("send")}</Button>
        </Card>

        <p className="mb-1.5 mt-2.5 font-display text-[13px] font-extrabold">{t("again")}</p>
        <div className="flex gap-3">
          <span className="flex w-10 flex-col items-center gap-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed border-brand bg-white text-brand">
              <Svg d={I.plus} />
            </span>
            <span className="text-[10px] font-semibold">{t("newRecipient")}</span>
          </span>
          {[
            { name: "Marie Ngono", code: "CM" },
            { name: "Jean Fotso", code: "CM" },
            { name: "Li Wei", code: "CN" },
          ].map((p) => (
            <span key={p.name} className="flex w-10 flex-col items-center gap-1">
              <span className="relative">
                <Avatar name={p.name} size={36} />
                <Flag code={p.code} size={15} className="absolute -bottom-0.5 -right-1 ring-2 ring-bg" />
              </span>
              <span className="max-w-full truncate text-[10px] font-semibold">{p.name.split(" ")[0]}</span>
            </span>
          ))}
        </div>

        <div className="mb-1.5 mt-2.5 flex items-center justify-between">
          <p className="font-display text-[13px] font-extrabold">{t("recent")}</p>
          <span className="text-[11px] font-semibold text-brand">{t("seeAll")}</span>
        </div>
        <Card className="px-2 py-1.5">
          <TransferRow name={RECIPIENT.full} time="14:02" amount={money(80770, "XAF")} />
        </Card>
      </div>

      {/* Barre d'onglets ((tabs)/_layout.tsx) */}
      <div className="grid shrink-0 grid-cols-4 border-t border-line bg-white px-1 pb-4 pt-2">
        {tabs.map((tab) => (
          <span
            key={tab.label}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${tab.active ? "text-brand" : "text-muted"}`}
          >
            {tab.d ? <Svg d={tab.d} className="h-[18px] w-[18px]" strokeWidth={2.3} /> : <Icon name={tab.icon!} className="h-[18px] w-[18px]" />}
            {tab.label}
          </span>
        ))}
      </div>
    </>
  );
}

function Pill({ code, unit }: { code: string; unit: string }) {
  return (
    <span className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-line bg-white px-2">
      <Flag code={code} size={18} />
      <span className="text-[11px] font-extrabold text-ink">{unit}</span>
      <Svg d={I.chevDown} className="h-3 w-3 text-muted" />
    </span>
  );
}

function TransferRow({ name, time, amount }: { name: string; time: string; amount: string }) {
  const { t } = useScreen();
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative w-8 shrink-0">
        <PaymentLogo id="MTN" size={18} title="" />
        <Flag code="CM" size={13} className="absolute -bottom-1 right-0 ring-[1.5px] ring-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] font-semibold">{name}</span>
          <span className="shrink-0 text-[10.5px] font-extrabold">{amount}</span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted">{t("today", { time })}</span>
          <Badge label={t("stDelivered")} tone="success" />
        </span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Écran 2 : bénéficiaire (send/recipient.tsx)                                 */
/* -------------------------------------------------------------------------- */

export function RecipientScreen() {
  const { t, country } = useScreen();
  const networks = [
    { id: "MTN", label: t("netMtn"), on: true },
    { id: "ORANGE", label: t("netOrange") },
    { id: "BANK", label: t("netBank") },
  ];
  return (
    <>
      <Header title={t("recipientTitle")} subtitle={t("recipientTo", { country: country("CM") })} />
      <Steps current={2} total={3} label={t("stepOf", { n: 2, total: 3, label: t("stepRecipient") })} />
      <div className="flex-1 space-y-3 overflow-hidden px-3.5">
        <FakeField label={t("fullName")} value={RECIPIENT.full} />
        <div>
          <p className="mb-1.5 text-[11px] font-semibold">{t("receiveBy")}</p>
          <div className="space-y-2">
            {networks.map((n) => (
              <Choice key={n.id} logo={n.id} label={n.label} selected={!!n.on} />
            ))}
          </div>
        </div>
        <FakeField label={t("numberOf", { network: t("netMtn") })} value="6 70 00 00 00" prefix="+237" />
      </div>
      <div className="px-3.5 pb-6 pt-2">
        <Button>{t("continue")}</Button>
      </div>
    </>
  );
}

function FakeField({ label, value, prefix }: { label: string; value: string; prefix?: string }) {
  return (
    <span className="block">
      <span className="block text-[11px] font-semibold">{label}</span>
      <span className="mt-1 flex h-10 items-center gap-2 rounded-[12px] border border-line bg-white px-3 text-[12px]">
        {prefix && <span className="font-semibold">{prefix}</span>}
        {value}
      </span>
    </span>
  );
}

function Choice({ logo, label, hint, selected }: { logo: string; label: string; hint?: string; selected: boolean }) {
  return (
    <span
      className={`flex items-center gap-2.5 rounded-[14px] border-[1.5px] px-3 py-2 ${
        selected ? "border-brand bg-brand-soft" : "border-line bg-white"
      }`}
    >
      <PaymentLogo id={logo} size={20} title="" />
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold leading-tight">{label}</span>
        {hint && <span className="block text-[9.5px] leading-snug text-muted">{hint}</span>}
      </span>
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-brand" : "border-line"}`}>
        {selected && <span className="h-[7px] w-[7px] rounded-full bg-brand" />}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Écran 3 : vérification et paiement par Interac (send/review.tsx)            */
/* -------------------------------------------------------------------------- */

export function ReviewScreen({ amount = 200 }: { amount?: number }) {
  const { t, money, num, country } = useScreen();
  const receive = Math.round(amount * SAMPLE_RATE);
  return (
    <>
      <Header title={t("reviewTitle")} />
      <Steps current={3} total={3} label={t("stepOf", { n: 3, total: 3, label: t("stepPayment") })} />
      <div className="flex-1 space-y-2 overflow-hidden px-3.5">
        <div className="flex flex-col items-center rounded-[16px] bg-navy px-3 py-2.5 text-center text-white">
          <span className="text-[9px] font-extrabold tracking-[0.08em] text-silver">{t("receives", { name: RECIPIENT.full.toUpperCase() })}</span>
          <span className="mt-0.5 font-display text-[21px] font-black leading-tight">{money(receive, "XAF")}</span>
          <PaymentLogo id="MTN" size={18} title="" className="mt-1.5" />
          <span className="mt-1 text-[10px] leading-snug text-white/75">
            {t("netMtn")} · {RECIPIENT.phone} · {country("CM")}
          </span>
        </div>
        <Card className="px-2.5 py-1.5">
          <Row label={t("rowSend")} value={money(amount, "CAD")} />
          <Row label={t("rowRate")} value={`1 CAD = ${num(SAMPLE_RATE, 2)} FCFA`} />
          <Row label={t("rowFee")} value={t("free")} />
          <div className="my-1 h-px bg-line" />
          <Row label={t("total")} value={money(amount, "CAD")} strong />
          <Row label={t("rowEta")} value={t("etaMinutes")} />
        </Card>
        <p className="font-display text-[13px] font-extrabold">{t("payWith")}</p>
        <Choice logo="INTERAC" label={t("interac")} hint={t("interacHint")} selected />
      </div>
      <div className="space-y-1.5 px-3.5 pb-4 pt-2">
        <Button icon="M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 017 0V11">{t("payInterac", { amount: money(amount, "CAD") })}</Button>
        <p className="text-center text-[9.5px] text-muted">{t("secure")}</p>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Écran 4 : instructions du virement Interac (send/interac.tsx)               */
/* -------------------------------------------------------------------------- */

export function InteracScreen({ amount = 200 }: { amount?: number }) {
  const { t, money } = useScreen();
  const receive = Math.round(amount * SAMPLE_RATE);
  const steps: { title: string; value?: string; hint?: string; muted?: boolean }[] = [
    { title: t("iStep1"), hint: t("iStep1Hint") },
    { title: t("iStep2"), value: t("iStep2Value"), muted: true },
    { title: t("iStep3"), value: money(amount, "CAD") },
    { title: t("iStep4"), value: SAMPLE_REF, hint: t("iStep4Hint") },
  ];
  return (
    <>
      <Header title={t("interac")} subtitle={t("interacRef", { ref: SAMPLE_REF })} />
      <div className="flex-1 space-y-2.5 overflow-hidden px-3.5">
        <div className="flex flex-col items-center rounded-[16px] bg-navy px-3 py-3 text-center text-white">
          <PaymentLogo id="INTERAC" size={24} title="" />
          <span className="mt-2 text-[9px] font-extrabold tracking-[0.08em] text-silver">{t("exactAmount")}</span>
          <span className="font-display text-[24px] font-black leading-tight">{money(amount, "CAD")}</span>
          <span className="text-[10px] text-white/75">{t("nameReceives", { name: RECIPIENT.full, amount: money(receive, "XAF") })}</span>
        </div>
        <p className="font-display text-[13px] font-extrabold">{t("inBank")}</p>
        <Card className="px-3 py-1">
          {steps.map((s, i) => (
            <div key={s.title} className={`flex gap-2.5 py-2 ${i < steps.length - 1 ? "border-b border-line" : ""}`}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-extrabold text-brand">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold leading-snug">{s.title}</span>
                {s.value && (
                  <span className={`block text-[12px] font-extrabold leading-snug ${s.muted ? "text-muted" : "text-navy"}`}>{s.value}</span>
                )}
                {s.hint && <span className="block text-[9.5px] leading-snug text-muted">{s.hint}</span>}
              </span>
              {s.value && !s.muted && (
                <span className="self-center text-brand">
                  <Svg d={I.copy} className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          ))}
        </Card>
      </div>
      <div className="px-3.5 pb-6 pt-2">
        <Button icon="M5 12.5l4.5 4.5L19 7.5">{t("iSent")}</Button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Écran 5 : suivi du transfert (transfer/[id].tsx)                            */
/* -------------------------------------------------------------------------- */

/**
 * `step` : 0 en attente du virement Interac, 1 paiement reçu, 2 versement envoyé, 3 livré.
 */
export function TrackingScreen({ step = 3, amount = 200 }: { step?: 0 | 1 | 2 | 3; amount?: number }) {
  const { t, money } = useScreen();
  const receive = money(Math.round(amount * SAMPLE_RATE), "XAF");
  const status: { label: string; tone: Tone }[] = [
    { label: t("stAwaiting"), tone: "warn" },
    { label: t("stPaid"), tone: "brand" },
    { label: t("stSent"), tone: "brand" },
    { label: t("stDelivered"), tone: "success" },
  ];
  const times = ["14:02", "14:09", "14:10", "14:12"];
  const hints = ["", t("hintInterac"), t("hintPreparing"), t("hintEta")];
  const labels = [t("tl1"), t("tl2"), t("tl3"), t("tl4")];
  const name = RECIPIENT.first;
  const next =
    step === 1
      ? { tone: "brand" as Tone, title: t("nextTitle"), text: t("nextPaid", { name }) }
      : step === 2
        ? { tone: "brand" as Tone, title: t("nextTitle"), text: t("nextSent", { name }) }
        : step === 3
          ? { tone: "success" as Tone, title: t("doneTitle"), text: t("doneText", { name, amount: receive }) }
          : null;
  return (
    <>
      <Header title={t("trackTitle")} close />
      <div className="flex-1 space-y-2 overflow-hidden px-3.5">
        <Card className="flex flex-col items-center px-3 py-2.5 text-center">
          <WstLogo variant="horizontal" className="h-4 w-auto" />
          <span className="mt-2 flex items-center gap-1.5 text-muted">
            <Flag code="CA" size={20} />
            <Svg d="M9 6l6 6-6 6" className="h-3 w-3" />
            <Flag code="CM" size={20} />
          </span>
          <span className="mt-1 font-display text-[20px] font-black leading-tight text-navy">{receive}</span>
          <span className="text-[10px] text-muted">{t("forName", { name: RECIPIENT.full })}</span>
          <span className="mt-1.5">
            <Badge label={status[step].label} tone={status[step].tone} />
          </span>
        </Card>

        <Card className="px-3 py-2">
          <ol>
            {labels.map((label, i) => {
              const done = i <= step;
              const pending = i === step + 1;
              return (
                <li key={label} className="flex gap-2.5">
                  <span className="flex flex-col items-center">
                    <span
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500 ${
                        done ? "border-brand bg-brand text-white" : pending ? "border-brand bg-white" : "border-line bg-white"
                      }`}
                    >
                      {done && <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3.2} />}
                    </span>
                    {i < labels.length - 1 && (
                      <span className={`w-0.5 flex-1 transition-colors duration-500 ${i < step ? "bg-brand" : "bg-line"}`} />
                    )}
                  </span>
                  <span className={i < labels.length - 1 ? "pb-1.5" : ""}>
                    <span className={`block text-[12px] font-semibold leading-tight ${done ? "text-ink" : "text-muted"}`}>{label}</span>
                    {done ? (
                      <span className="block text-[10px] text-muted">{t("today", { time: times[i] })}</span>
                    ) : pending ? (
                      <span className="block text-[10px] text-brand">{hints[i]}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>

        {next && (
          <div className={`flex gap-2 rounded-[14px] p-2.5 ${next.tone === "success" ? "bg-success/10" : "bg-brand-soft"}`}>
            <span className={next.tone === "success" ? "text-success" : "text-brand"}>
              <Icon name={next.tone === "success" ? "check" : "clock"} className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className={`block font-display text-[11px] font-extrabold ${next.tone === "success" ? "text-success" : "text-brand"}`}>{next.title}</span>
              <span className="block text-[10px] leading-snug text-ink">{next.text}</span>
            </span>
          </div>
        )}
      </div>
      {step === 0 && (
        <div className="px-3.5 pb-5 pt-2">
          <Button>{t("instructions")}</Button>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-1.5 px-3.5 pb-4 pt-2">
          <Button icon={I.refresh}>{t("resend", { amount: money(amount, "CAD"), name })}</Button>
          <Button tone="secondary" icon={I.send}>
            {t("notify", { name })}
          </Button>
        </div>
      )}
    </>
  );
}
