"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { SandboxBanner } from "@/components/sandbox-banner";
import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";
import { etaLabel } from "@/lib/i18n";
import { displayName, useAuth } from "@/components/auth-provider";

type CorridorMeta = {
  id: string;
  active: boolean;
  label: string;
  sourceCode: string;
  destCode: string;
  sourceFlag: string;
  destFlag: string;
  sourceName: string;
  destName: string;
  sendCurrency: string;
  receiveCurrency: string;
  deliveryEstimate: string;
  networks: { id: string; label: string }[];
};

type Quote = {
  sendAmount: number;
  receiveAmount: number;
  rate: number;
  fee: number;
  feeFlat?: number;
  feeVariable?: number;
  feePercent?: number;
  total: number;
  sendCurrency: string;
  receiveCurrency: string;
  deliveryEstimate: string;
};

type Beneficiary = {
  id: string;
  fullName: string;
  phone: string;
  network: string;
  country: string;
};

export default function SendPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialAmount = Number(searchParams.get("amount") ?? "100");
  const initialCorridor = searchParams.get("corridor") ?? "CA-CM";

  const steps = [t("stepAmount"), t("stepRecipient"), t("stepReview")];

  const [step, setStep] = useState(0);
  const [corridors, setCorridors] = useState<CorridorMeta[]>([]);
  const [corridorId, setCorridorId] = useState(initialCorridor);
  const [sendAmount, setSendAmount] = useState(initialAmount);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("MTN");
  const [saved, setSaved] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevCorridorRef = useRef(initialCorridor);
  const prefilled = useRef(false);

  const selected = useMemo(
    () => corridors.find((c) => c.id === corridorId),
    [corridors, corridorId],
  );

  useEffect(() => {
    if (!user || prefilled.current) return;
    prefilled.current = true;
    const email = "email" in user ? user.email || "" : "";
    if (email && !senderEmail) setSenderEmail(email);
    const name = displayName(user);
    if (name && !senderName) setSenderName(name);
  }, [user, senderEmail, senderName]);

  useEffect(() => {
    fetch("/api/quotes?meta=corridors")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCorridors(data);
          const current = data.find((c: CorridorMeta) => c.id === corridorId);
          if (current?.networks?.[0]) setNetwork(current.networks[0].id);
        }
      })
      .catch(() => undefined);
    fetch("/api/beneficiaries")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSaved(data);
      })
      .catch(() => undefined);
  }, [corridorId]);

  useEffect(() => {
    if (!selected?.active) return;

    const corridorChanged = prevCorridorRef.current !== corridorId;
    prevCorridorRef.current = corridorId;
    if (corridorChanged) setQuote(null);

    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        try {
          const res = await fetch(
            `/api/quotes?corridor=${corridorId}&amount=${sendAmount}`,
            { signal: controller.signal, cache: "no-store" },
          );
          const data = await res.json();
          if (res.ok) setQuote(data);
        } catch {
          /* ignore */
        }
      },
      corridorChanged ? 0 : 120,
    );
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [sendAmount, corridorId, selected?.active]);

  useEffect(() => {
    if (selected?.networks?.[0]) setNetwork(selected.networks[0].id);
  }, [selected?.id]);

  const canGoRecipient = !!quote && !!selected?.active;
  const canGoReview =
    fullName.trim().length > 1 &&
    phone.trim().length >= 8 &&
    senderName.trim().length > 1 &&
    senderEmail.includes("@");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corridorId,
          sendAmount,
          senderName,
          senderEmail,
          beneficiary: { fullName, phone, network },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Création impossible",
        );
      }
      if (data.payIn?.provider === "stripe" && data.payIn.checkoutUrl) {
        window.location.href = data.payIn.checkoutUrl;
        return;
      }
      router.push(`/transfers/${data.transfer.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setLoading(false);
    }
  }

  const summary = (
    <aside className="rounded-[1.5rem] border border-line bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">
        {t("summary")}
      </p>
      {selected && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <CountryFlag code={selected.sourceCode} size={20} />
          <span className="font-medium">{selected.sourceName}</span>
          <span className="text-ink-muted">→</span>
          <CountryFlag code={selected.destCode} size={20} />
          <span className="font-medium">{selected.destName}</span>
        </div>
      )}
      {quote ? (
        <div className="mt-4 space-y-2 text-sm">
          <Row
            label={t("youSend")}
            value={formatMoney(quote.sendAmount, quote.sendCurrency)}
          />
          <Row
            label={t("theyReceive")}
            value={formatMoney(quote.receiveAmount, quote.receiveCurrency)}
            strong
          />
          <Row
            label={t("fee")}
            value={formatMoney(quote.fee, quote.sendCurrency)}
          />
          <Row
            label={t("total")}
            value={formatMoney(quote.total, quote.sendCurrency)}
          />
          <Row label={t("delivery")} value={etaLabel(quote.deliveryEstimate, t)} />
          {step >= 1 && fullName && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="font-medium">{fullName}</p>
              <p className="text-xs text-ink-muted">
                {network} · {phone || "—"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">…</p>
      )}
      <p className="mt-5 text-xs leading-relaxed text-ink-muted">
        {t("secureCheckout")}
      </p>
    </aside>
  );

  return (
    <div className="bg-bg">
      <SandboxBanner />
      <div className="mx-auto max-w-6xl px-5 py-8 lg:py-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-accent">
            {t("stepOf")} {step + 1}/3
            {step === 2 ? ` · ${t("almostDone")}` : ""}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("sendMoney")}
          </h1>
          {!user && (
            <p className="mt-3 rounded-xl border border-accent/20 bg-accent-soft px-3 py-2 text-sm text-accent-strong">
              <Link href="/login?next=/send" className="font-semibold underline">
                {t("logIn")}
              </Link>{" "}
              · {t("authDemoHint")}
            </p>
          )}
          <div className="mt-6 flex gap-2">
            {steps.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (i < step) setStep(i);
                  if (i === 1 && canGoRecipient) setStep(1);
                  if (i === 2 && canGoReview) setStep(2);
                }}
                className="flex-1 text-left"
              >
                <div
                  className={`h-1.5 rounded-full transition ${
                    i <= step ? "bg-accent" : "bg-line"
                  }`}
                />
                <p
                  className={`mt-2 text-xs ${
                    i === step ? "font-semibold text-ink" : "text-ink-muted"
                  }`}
                >
                  {i + 1}. {label}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <form
            onSubmit={onSubmit}
            className="animate-rise space-y-4 rounded-[1.5rem] border border-line bg-white p-5 shadow-sm sm:p-6"
          >
            {step === 0 && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CountrySelect
                    label={t("from")}
                    code={selected?.sourceCode ?? "CA"}
                    name={selected?.sourceName}
                    onChange={(code) => {
                      const next = corridors.find(
                        (c) =>
                          c.sourceCode === code &&
                          (c.destCode === selected?.destCode || c.active),
                      );
                      if (next) setCorridorId(next.id);
                      else {
                        const any = corridors.find((c) => c.sourceCode === code);
                        if (any) setCorridorId(any.id);
                      }
                    }}
                    options={[
                      ...new Map(
                        corridors.map((c) => [
                          c.sourceCode,
                          { code: c.sourceCode, name: c.sourceName },
                        ]),
                      ).values(),
                    ]}
                  />
                  <CountrySelect
                    label={t("to")}
                    code={selected?.destCode ?? "CM"}
                    name={selected?.destName}
                    onChange={(code) => {
                      const src = selected?.sourceCode ?? "CA";
                      const next = corridors.find(
                        (c) => c.sourceCode === src && c.destCode === code,
                      );
                      if (next) setCorridorId(next.id);
                    }}
                    options={corridors
                      .filter(
                        (c) => c.sourceCode === (selected?.sourceCode ?? "CA"),
                      )
                      .map((c) => ({
                        code: c.destCode,
                        name: `${c.destName}${!c.active ? ` (${t("comingSoon")})` : ""}`,
                      }))}
                  />
                </div>

                <label className="block text-sm">
                  <span className="mb-1.5 block text-ink-muted">
                    {t("amount")} ({selected?.sendCurrency ?? "CAD"})
                  </span>
                  <input
                    type="number"
                    min={10}
                    value={sendAmount}
                    disabled={!selected?.active}
                    onChange={(e) => setSendAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-bg px-3.5 py-3.5 font-display text-3xl font-bold outline-none focus:border-accent disabled:opacity-50"
                  />
                </label>

                {quote && (
                  <div className="space-y-2 rounded-2xl bg-accent-soft/80 p-4 text-sm lg:hidden">
                    <Row
                      label={t("theyReceive")}
                      value={formatMoney(
                        quote.receiveAmount,
                        quote.receiveCurrency,
                      )}
                      strong
                    />
                    <Row
                      label={t("rate")}
                      value={`1 ${quote.sendCurrency} = ${quote.rate.toFixed(2)} ${quote.receiveCurrency}`}
                    />
                    <Row
                      label={t("fee")}
                      value={formatMoney(quote.fee, quote.sendCurrency)}
                    />
                    <Row
                      label={t("total")}
                      value={formatMoney(quote.total, quote.sendCurrency)}
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={!canGoRecipient}
                  onClick={() => setStep(1)}
                  className="w-full rounded-full bg-accent py-3.5 font-semibold text-white hover:bg-accent-strong disabled:opacity-45"
                >
                  {t("continue")}
                </button>
              </>
            )}

            {step === 1 && (
              <>
                <p className="text-sm font-semibold text-ink">
                  {t("deliveryMethod")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(selected?.networks ?? []).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setNetwork(n.id)}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        network === n.id
                          ? "border-accent bg-accent-soft text-accent-strong"
                          : "border-line bg-bg text-ink-muted hover:border-accent/40"
                      }`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>

                {saved.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm text-ink-muted">{t("recent")}</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {saved.slice(0, 6).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setFullName(b.fullName);
                            setPhone(b.phone);
                            setNetwork(b.network);
                          }}
                          className="min-w-[140px] rounded-xl border border-line bg-bg px-3 py-2 text-left text-sm hover:border-accent"
                        >
                          <p className="truncate font-medium">{b.fullName}</p>
                          <p className="truncate text-xs text-ink-muted">
                            {b.network} · {b.phone}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Field
                  label={t("recipientName")}
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Jean Mbarga"
                />
                <Field
                  label={`${t("phone")} (${selected?.destName ?? ""})`}
                  value={phone}
                  onChange={setPhone}
                  placeholder="2376XXXXXXXX"
                />
                <Field
                  label={t("yourName")}
                  value={senderName}
                  onChange={setSenderName}
                  placeholder="Marie Dupont"
                />
                <Field
                  label={t("yourEmail")}
                  value={senderEmail}
                  onChange={setSenderEmail}
                  placeholder="marie@email.com"
                  type="email"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="flex-1 rounded-full border border-line py-3 font-semibold"
                  >
                    {t("back")}
                  </button>
                  <button
                    type="button"
                    disabled={!canGoReview}
                    onClick={() => setStep(2)}
                    className="flex-[1.4] rounded-full bg-accent py-3 font-semibold text-white disabled:opacity-45"
                  >
                    {t("continue")}
                  </button>
                </div>
              </>
            )}

            {step === 2 && quote && (
              <>
                <div className="rounded-2xl bg-bg p-4 text-sm lg:hidden">
                  <Row
                    label={t("youSend")}
                    value={formatMoney(quote.sendAmount, quote.sendCurrency)}
                  />
                  <Row
                    label={t("theyReceive")}
                    value={formatMoney(
                      quote.receiveAmount,
                      quote.receiveCurrency,
                    )}
                    strong
                  />
                  <Row
                    label={t("total")}
                    value={formatMoney(quote.total, quote.sendCurrency)}
                  />
                </div>
                <div className="rounded-2xl border border-line p-4 text-sm">
                  <p className="font-medium">{fullName}</p>
                  <p className="text-ink-muted">
                    {network} · {phone}
                  </p>
                  <p className="mt-2 text-ink-muted">
                    {senderName} · {senderEmail}
                  </p>
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-full border border-line py-3 font-semibold"
                  >
                    {t("back")}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[1.4] rounded-full bg-accent py-3 font-semibold text-white disabled:opacity-60"
                  >
                    {loading ? t("sending") : t("confirmPay")}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="hidden lg:block">{summary}</div>
        </div>
      </div>
    </div>
  );
}

function CountrySelect({
  label,
  code,
  name,
  onChange,
  options,
}: {
  label: string;
  code: string;
  name?: string;
  onChange: (code: string) => void;
  options: { code: string; name: string }[];
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-ink-muted">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-3">
        <CountryFlag code={code} size={22} title={name} />
        <select
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-semibold outline-none"
        >
          {options.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-ink-muted">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 outline-none focus:border-accent"
      />
    </label>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className="text-ink-muted">{label}</span>
      <span
        className={
          strong
            ? "font-display font-semibold text-accent-strong"
            : "font-medium text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}
