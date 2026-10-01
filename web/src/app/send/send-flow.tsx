"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CORRIDORS, COUNTRIES, type PayoutNetwork } from "@/lib/corridors";
import { displayName, useAuth } from "@/components/auth-provider";
import { CountryFlag } from "@/components/country-flag";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { SummaryRow } from "@/components/transfer-app/summary-row";
import { useTransferLabels } from "@/components/transfer-app/use-transfer-labels";
import { useT } from "@/i18n/define";
import { sendMessages } from "@/i18n/send";

type Quote = {
  corridorId: string;
  sendAmount: number;
  receiveAmount: number;
  rate: number;
  fee: number;
  total: number;
  sendCurrency: string;
  receiveCurrency: string;
  deliveryEstimate: string;
};

type SavedBeneficiary = {
  id: string;
  fullName: string;
  phone: string;
  network: string;
  country: string;
};

const DEFAULT_CORRIDOR = "CA-CM";
const NETWORK_ICON: Record<PayoutNetwork["type"], IconName> = {
  mobile_money: "phone",
  bank: "finance",
  cash: "wallet",
};

function parseAmount(raw: string): number {
  const n = Number(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function digits(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function SendFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const t = useT(sendMessages);
  const L = useTransferLabels();

  const initialCorridor = useMemo(() => {
    const requested = params.get("corridor");
    return requested && CORRIDORS.some((c) => c.id === requested && c.active) ? requested : DEFAULT_CORRIDOR;
  }, [params]);
  const initialAmount = useMemo(() => {
    const n = Number(params.get("amount") ?? "100");
    return Number.isFinite(n) && n > 0 ? String(n) : "100";
  }, [params]);

  const [step, setStep] = useState(0);
  const [corridorId, setCorridorId] = useState(initialCorridor);
  const [amountInput, setAmountInput] = useState(initialAmount);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteState, setQuoteState] = useState<"idle" | "loading" | "error">("loading");
  const [network, setNetwork] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [saved, setSaved] = useState<SavedBeneficiary[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const prefilled = useRef(false);

  const corridor = CORRIDORS.find((c) => c.id === corridorId) ?? CORRIDORS.find((c) => c.id === DEFAULT_CORRIDOR)!;
  const source = COUNTRIES[corridor.source];
  const dest = COUNTRIES[corridor.destination];
  const networks = dest.networks;
  const activeNetwork = networks.some((n) => n.id === network) ? network : (networks[0]?.id ?? "");

  const sourceOptions = useMemo(() => [...new Set(CORRIDORS.map((c) => c.source))], []);
  const destOptions = useMemo(
    () => CORRIDORS.filter((c) => c.source === corridor.source && c.active).map((c) => c.destination),
    [corridor.source],
  );

  const amount = parseAmount(amountInput);
  const amountError = !Number.isFinite(amount) || amount < corridor.minSend
    ? t("amountTooLow", { min: L.money(corridor.minSend, source.currency) })
    : amount > corridor.maxSend
      ? t("amountTooHigh", { max: L.money(corridor.maxSend, source.currency) })
      : null;

  // Pré-remplissage avec le compte connecté.
  useEffect(() => {
    if (!user || prefilled.current) return;
    prefilled.current = true;
    const email = "email" in user ? (user.email ?? "") : "";
    const name = displayName(user);
    if (email) setSenderEmail((v) => v || email);
    if (name) setSenderName((v) => v || name);
  }, [user]);

  // Destinataires enregistrés.
  useEffect(() => {
    fetch("/api/beneficiaries")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setSaved(data as SavedBeneficiary[]);
      })
      .catch(() => undefined);
  }, []);

  // Devis en direct.
  useEffect(() => {
    if (amountError) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setQuoteState("loading");
      try {
        const res = await fetch(`/api/quotes?corridor=${encodeURIComponent(corridorId)}&amount=${amount}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "quote");
        setQuote(data as Quote);
        setQuoteState("idle");
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
        setQuoteState("error");
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [corridorId, amount, amountError]);

  const currentQuote =
    quote && !amountError && quote.corridorId === corridorId
      ? quote
      : null;

  // Validation des coordonnées.
  const normalizedPhone = useMemo(() => {
    const d = digits(phone);
    if (!d) return "";
    return d.startsWith(dest.dialCode) ? d : `${dest.dialCode}${d.replace(/^0+/, "")}`;
  }, [phone, dest.dialCode]);
  const errors = {
    fullName: fullName.trim().length < 2 ? t("nameInvalid") : null,
    phone:
      digits(phone).length < 8 || !dest.phoneRegex.test(normalizedPhone)
        ? t("phoneInvalid", { country: L.country(dest.code) })
        : null,
    senderName: senderName.trim().length < 2 ? t("nameInvalid") : null,
    senderEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim()) ? null : t("emailInvalid"),
  };
  const recipientValid = !errors.fullName && !errors.phone && !errors.senderName && !errors.senderEmail && !!activeNetwork;
  const canAmount = !!currentQuote && quoteState !== "loading";

  const savedForDest = saved.filter((b) => b.country === dest.code && networks.some((n) => n.id === b.network));

  function goTo(next: number) {
    if (next === 1 && !canAmount) return;
    if (next === 2) {
      if (!recipientValid) {
        setShowErrors(true);
        return;
      }
    }
    setStep(next);
    setSubmitError(null);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function changeSource(code: string) {
    const next =
      CORRIDORS.find((c) => c.source === code && c.destination === corridor.destination && c.active) ??
      CORRIDORS.find((c) => c.source === code && c.active);
    if (next) setCorridorId(next.id);
  }

  function changeDest(code: string) {
    const next = CORRIDORS.find((c) => c.source === corridor.source && c.destination === code && c.active);
    if (next) setCorridorId(next.id);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step !== 2 || !currentQuote) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corridorId,
          sendAmount: currentQuote.sendAmount,
          senderName: senderName.trim(),
          senderEmail: senderEmail.trim(),
          beneficiary: { fullName: fullName.trim(), phone: phone.trim(), network: activeNetwork },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : t("createError"));
      }
      if (data.payIn?.provider === "stripe" && data.payIn.checkoutUrl) {
        window.location.href = data.payIn.checkoutUrl;
        return;
      }
      router.push(`/transfers/${data.transfer.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("createError"));
      setSubmitting(false);
    }
  }

  const exampleNumber = dest.phoneHint.replace(/^Ex:\s*/, "");
  const phonePlaceholder = exampleNumber.startsWith(dest.dialCode)
    ? exampleNumber.slice(dest.dialCode.length)
    : exampleNumber;
  const steps = [t("stepAmount"), t("stepRecipient"), t("stepReview")];
  const networkLabel = L.network(activeNetwork);

  return (
    <div className="bg-bg pb-16">
      {/* En-tête + stepper */}
      <section className="border-b border-line bg-white">
        <Container className="py-8 sm:py-10">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t("title")}</h1>
              <p className="mt-2 max-w-xl text-muted">{t("subtitle")}</p>
            </div>
            <p className="text-sm font-semibold text-brand">{t("stepOf", { n: step + 1, total: steps.length })}</p>
          </div>

          <nav aria-label={t("stepOf", { n: step + 1, total: steps.length })} className="mt-7">
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-soft">
              <div
                className="bg-brand-gradient h-full rounded-full transition-all duration-500"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
            <ol className="mt-4 grid grid-cols-3 gap-2">
              {steps.map((label, i) => {
                const done = i < step;
                const current = i === step;
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => (i < step ? goTo(i) : i === step + 1 ? goTo(i) : undefined)}
                      aria-current={current ? "step" : undefined}
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                          done
                            ? "bg-brand text-white"
                            : current
                              ? "bg-navy text-white ring-4 ring-brand/15"
                              : "bg-surface-soft text-muted"
                        }`}
                      >
                        {done ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} /> : i + 1}
                      </span>
                      <span
                        className={`truncate text-xs font-semibold sm:text-sm ${current ? "text-ink" : "text-muted"}`}
                      >
                        {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {!user && (
            <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand-strong">
              <Icon name="user" className="h-4 w-4" />
              <span>{t("loginHint")}</span>
              <Link href="/login?next=/send" className="font-semibold underline underline-offset-2">
                {t("loginLink")}
              </Link>
            </p>
          )}
        </Container>
      </section>

      <Container className="mt-6 sm:mt-8">
        <div ref={topRef} className="scroll-mt-24" />
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-start">
          <form onSubmit={onSubmit} noValidate className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
            {step === 0 && (
              <div key="amount" className="animate-rise space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <CountrySelect
                    id="send-from"
                    label={t("from")}
                    value={corridor.source}
                    options={sourceOptions}
                    onChange={changeSource}
                    name={L.country}
                  />
                  <CountrySelect
                    id="send-to"
                    label={t("to")}
                    value={corridor.destination}
                    options={destOptions}
                    onChange={changeDest}
                    name={L.country}
                  />
                </div>

                <div className="rounded-3xl border border-line bg-surface-soft/60 p-1.5">
                  <div className="rounded-[1.25rem] bg-white p-4 ring-1 ring-line focus-within:ring-2 focus-within:ring-brand">
                    <label htmlFor="send-amount" className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                      {t("youSend")}
                    </label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        id="send-amount"
                        inputMode="decimal"
                        autoComplete="off"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value.replace(/[^\d.,\s]/g, ""))}
                        aria-invalid={!!amountError}
                        aria-describedby="send-amount-help"
                        className="w-full min-w-0 bg-transparent font-display text-4xl font-black tracking-tight text-ink outline-none sm:text-5xl"
                      />
                      <CurrencyPill code={source.code} currency={source.currency} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-muted">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-brand ring-1 ring-line">
                        <Icon name="transfer" className="h-3.5 w-3.5 rotate-90" />
                      </span>
                      {currentQuote ? (
                        <span>
                          1 {currentQuote.sendCurrency} ={" "}
                          <strong className="font-semibold text-ink">
                            {currentQuote.rate.toFixed(currentQuote.rate < 10 ? 4 : 2)} {currentQuote.receiveCurrency}
                          </strong>
                        </span>
                      ) : (
                        <span>{amountError ? "—" : quoteState === "error" ? t("quoteError") : t("quoteLoading")}</span>
                      )}
                    </span>
                    {currentQuote && (
                      <span className="text-muted">
                        {t("fee")} :{" "}
                        <strong className="font-semibold text-ink">
                          {currentQuote.fee === 0 ? t("feeFree") : L.money(currentQuote.fee, currentQuote.sendCurrency)}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className="rounded-[1.25rem] bg-white p-4 ring-1 ring-line">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{t("theyReceive")}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <p
                        className={`w-full min-w-0 truncate font-display text-4xl font-black tracking-tight sm:text-5xl ${
                          currentQuote ? "text-brand-strong" : "text-silver"
                        }`}
                        aria-live="polite"
                      >
                        {currentQuote
                          ? new Intl.NumberFormat(L.intlLocale, {
                              maximumFractionDigits: dest.currency === "XAF" || dest.currency === "XOF" ? 0 : 2,
                            }).format(currentQuote.receiveAmount)
                          : "—"}
                      </p>
                      <CurrencyPill code={dest.code} currency={dest.currency} />
                    </div>
                  </div>
                </div>

                <p id="send-amount-help" className={`text-sm ${amountError ? "font-medium text-danger" : "text-muted"}`}>
                  {amountError ??
                    t("limits", {
                      min: L.money(corridor.minSend, source.currency),
                      max: L.money(corridor.maxSend, source.currency),
                    })}
                </p>

                <div className="flex items-center gap-2 rounded-2xl bg-surface-soft px-4 py-3 text-sm text-muted">
                  <Icon name="clock" className="h-4 w-4 text-brand" />
                  {t("delivery")} : <strong className="font-semibold text-ink">{L.eta(corridor.deliveryEstimate)}</strong>
                </div>

                <Button type="button" size="lg" className="w-full" disabled={!canAmount} onClick={() => goTo(1)}>
                  {t("continue")}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 1 && (
              <div key="recipient" className="animate-rise space-y-6">
                <fieldset>
                  <legend className="font-display text-base font-extrabold text-ink">{t("deliveryMethod")}</legend>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {networks.map((n) => {
                      const active = n.id === activeNetwork;
                      return (
                        <label
                          key={n.id}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border px-3 py-3 text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                            active
                              ? "border-brand bg-brand-soft text-brand-strong"
                              : "border-line bg-white text-ink hover:border-brand/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="network"
                            value={n.id}
                            checked={active}
                            onChange={() => setNetwork(n.id)}
                            className="sr-only"
                          />
                          <span
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                              active ? "bg-brand text-white" : "bg-surface-soft text-brand"
                            }`}
                          >
                            <Icon name={NETWORK_ICON[n.type]} className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate">{L.network(n.id)}</span>
                            <span className="block text-[11px] font-medium text-muted">
                              {n.type === "mobile_money" ? t("mobileMoney") : n.type === "bank" ? t("bank") : t("cash")}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {savedForDest.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-ink">{t("savedRecipients")}</p>
                    <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
                      {savedForDest.slice(0, 8).map((b) => {
                        const selected = b.phone === normalizedPhone && b.network === activeNetwork;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setFullName(b.fullName);
                              setPhone(b.phone.startsWith(dest.dialCode) ? b.phone.slice(dest.dialCode.length) : b.phone);
                              setNetwork(b.network);
                            }}
                            className={`flex min-w-[11rem] items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                              selected ? "border-brand bg-brand-soft" : "border-line bg-white hover:border-brand/40"
                            }`}
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy font-display text-sm font-bold text-white">
                              {b.fullName.trim().charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-ink">{b.fullName}</span>
                              <span className="block truncate text-xs text-muted">
                                {L.network(b.network)} · +{b.phone}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <fieldset className="space-y-4">
                  <legend className="font-display text-base font-extrabold text-ink">{t("recipientSection")}</legend>
                  <Field
                    id="recipient-name"
                    label={t("recipientName")}
                    value={fullName}
                    onChange={setFullName}
                    placeholder={t("recipientNamePh")}
                    autoComplete="off"
                    error={showErrors ? errors.fullName : null}
                  />
                  <Field
                    id="recipient-phone"
                    label={t("recipientPhone", { country: L.country(dest.code) })}
                    value={phone}
                    onChange={setPhone}
                    placeholder={phonePlaceholder}
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    prefix={`+${dest.dialCode}`}
                    hint={t("phoneHint", { dial: dest.dialCode, hint: dest.phoneHint })}
                    error={showErrors ? errors.phone : null}
                  />
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="font-display text-base font-extrabold text-ink">{t("senderSection")}</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="sender-name"
                      label={t("yourName")}
                      value={senderName}
                      onChange={setSenderName}
                      placeholder={t("yourNamePh")}
                      autoComplete="name"
                      error={showErrors ? errors.senderName : null}
                    />
                    <Field
                      id="sender-email"
                      label={t("yourEmail")}
                      value={senderEmail}
                      onChange={setSenderEmail}
                      placeholder="marie@email.com"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      error={showErrors ? errors.senderEmail : null}
                    />
                  </div>
                </fieldset>

                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={() => goTo(0)}>
                    {t("back")}
                  </Button>
                  <Button type="button" size="lg" className="flex-[1.6]" onClick={() => goTo(2)}>
                    {t("continue")}
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && !currentQuote && (
              <p role="status" className="py-10 text-center text-sm text-muted">
                {quoteState === "error" ? t("quoteError") : t("quoteLoading")}
              </p>
            )}

            {step === 2 && currentQuote && (
              <div key="review" className="animate-rise space-y-5">
                <div>
                  <h2 className="font-display text-xl font-extrabold text-ink">{t("reviewTitle")}</h2>
                  <p className="mt-1 text-sm text-muted">{t("reviewHint")}</p>
                </div>

                <div className="bg-navy-gradient rounded-3xl p-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky">{t("theyReceive")}</p>
                  <p className="mt-1 font-display text-3xl font-black tracking-tight sm:text-4xl">
                    {L.money(currentQuote.receiveAmount, currentQuote.receiveCurrency)}
                  </p>
                  <p className="mt-2 text-sm text-white/75">
                    {t("total")} : {L.money(currentQuote.total, currentQuote.sendCurrency)}
                  </p>
                </div>

                <ReviewBlock title={t("recipientSection")} onEdit={() => goTo(1)} editLabel={t("edit")}>
                  <p className="font-semibold text-ink">{fullName}</p>
                  <p className="text-sm text-muted">
                    {networkLabel} · +{normalizedPhone}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
                    <CountryFlag code={dest.code} size={16} title={L.country(dest.code)} /> {L.country(dest.code)}
                  </p>
                </ReviewBlock>

                <ReviewBlock title={t("senderSection")} onEdit={() => goTo(1)} editLabel={t("edit")}>
                  <p className="font-semibold text-ink">{senderName}</p>
                  <p className="break-all text-sm text-muted">{senderEmail}</p>
                </ReviewBlock>

                <ReviewBlock title={t("amountsH")} onEdit={() => goTo(0)} editLabel={t("edit")}>
                  <dl>
                    <SummaryRow label={t("youSend")} value={L.money(currentQuote.sendAmount, currentQuote.sendCurrency)} />
                    <SummaryRow
                      label={t("fee")}
                      value={currentQuote.fee === 0 ? t("feeFree") : L.money(currentQuote.fee, currentQuote.sendCurrency)}
                    />
                    <SummaryRow
                      label={t("rate")}
                      value={`1 ${currentQuote.sendCurrency} = ${currentQuote.rate.toFixed(2)} ${currentQuote.receiveCurrency}`}
                    />
                    <SummaryRow
                      label={t("total")}
                      value={L.money(currentQuote.total, currentQuote.sendCurrency)}
                      emphasis="strong"
                    />
                  </dl>
                </ReviewBlock>

                <p className="text-xs leading-relaxed text-muted">
                  {t("termsNote")}{" "}
                  <Link href="/conditions" className="font-semibold text-brand underline underline-offset-2">
                    {t("terms")}
                  </Link>
                  .
                </p>

                {submitError && (
                  <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                    {submitError}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={() => goTo(1)}>
                    {t("back")}
                  </Button>
                  <Button type="submit" size="lg" className="flex-[1.6]" disabled={submitting}>
                    <Icon name="lock" className="h-4 w-4" />
                    {submitting ? t("creating") : t("confirmPay")}
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Récapitulatif (collant sur ordinateur, empilé sur mobile) */}
          <aside className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-extrabold text-ink">{t("summary")}</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                <span className="live-dot" aria-hidden />
                {t("rateLive")}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface-soft px-3 py-2.5 text-sm">
              <CountryFlag code={source.code} size={20} title={L.country(source.code)} />
              <span className="truncate font-semibold">{L.country(source.code)}</span>
              <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-muted" />
              <CountryFlag code={dest.code} size={20} title={L.country(dest.code)} />
              <span className="truncate font-semibold">{L.country(dest.code)}</span>
            </div>
            {currentQuote ? (
              <dl className="mt-3">
                <SummaryRow label={t("youSend")} value={L.money(currentQuote.sendAmount, currentQuote.sendCurrency)} />
                <SummaryRow
                  label={t("fee")}
                  value={currentQuote.fee === 0 ? t("feeFree") : L.money(currentQuote.fee, currentQuote.sendCurrency)}
                />
                <SummaryRow
                  label={t("total")}
                  value={L.money(currentQuote.total, currentQuote.sendCurrency)}
                  emphasis="strong"
                />
                <SummaryRow
                  label={t("rate")}
                  value={`1 ${currentQuote.sendCurrency} = ${currentQuote.rate.toFixed(2)} ${currentQuote.receiveCurrency}`}
                />
                <div className="my-2 border-t border-dashed border-line" />
                <SummaryRow
                  label={t("theyReceive")}
                  value={L.money(currentQuote.receiveAmount, currentQuote.receiveCurrency)}
                  emphasis="highlight"
                />
                <SummaryRow label={t("delivery")} value={L.eta(currentQuote.deliveryEstimate)} />
              </dl>
            ) : (
              <div className="mt-4 space-y-2" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-5 animate-pulse rounded-full bg-surface-soft" />
                ))}
              </div>
            )}
            {step >= 1 && fullName.trim() && (
              <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy font-display text-sm font-bold text-white">
                  {fullName.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{fullName}</p>
                  <p className="truncate text-xs text-muted">
                    {networkLabel}
                    {phone ? ` · +${normalizedPhone}` : ""}
                  </p>
                </div>
              </div>
            )}
            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Icon name="shield" className="h-4 w-4 shrink-0 text-brand" />
              {t("secureNote")}
            </p>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function CountrySelect({
  id,
  label,
  value,
  options,
  onChange,
  name,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (code: string) => void;
  name: (code: string) => string;
}) {
  const sorted = [...options].sort((a, b) => name(a).localeCompare(name(b)));
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted">
        {label}
      </label>
      <div className="relative flex items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5 py-3 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
        <CountryFlag code={value} size={24} title={name(value)} />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 appearance-none bg-transparent pr-6 font-semibold text-ink outline-none"
        >
          {sorted.map((code) => (
            <option key={code} value={code}>
              {name(code)}
            </option>
          ))}
        </select>
        <Icon name="chevronDown" className="pointer-events-none absolute right-3.5 h-4 w-4 text-muted" />
      </div>
    </div>
  );
}

function CurrencyPill({ code, currency }: { code: string; currency: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-soft px-3 py-2 font-display text-sm font-bold text-ink ring-1 ring-line">
      <CountryFlag code={code} size={20} />
      {currency}
    </span>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  prefix,
  hint,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "decimal";
  autoComplete?: string;
  prefix?: string;
  hint?: string;
  error?: string | null;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted">
        {label}
      </label>
      <div
        className={`flex items-center rounded-2xl border bg-white transition focus-within:ring-2 ${
          error
            ? "border-danger focus-within:ring-danger/20"
            : "border-line focus-within:border-brand focus-within:ring-brand/20"
        }`}
      >
        {prefix && (
          <span className="border-r border-line px-3.5 py-3 text-sm font-semibold text-muted">{prefix}</span>
        )}
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="w-full min-w-0 rounded-2xl bg-transparent px-3.5 py-3 text-ink outline-none placeholder:text-muted/60"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function ReviewBlock({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  onEdit: () => void;
  editLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{title}</h3>
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-brand hover:text-brand-strong">
          {editLabel}
        </button>
      </div>
      {children}
    </section>
  );
}
