"use client";

import Link from "next/link";
import { type FormEvent, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LogoEmblem, LogoFull } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { authMessages } from "@/i18n/auth";
import { appFullName, appName } from "@/lib/brand";

type Mode = "login" | "signup";
type Key = keyof typeof authMessages.fr;

/** Destination après connexion : paramètre `next` (chemin interne uniquement), sinon /send. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/send";
  return raw;
}

const POLES: { icon: IconName; title: Key; desc: Key }[] = [
  { icon: "transfer", title: "poleTransfer", desc: "poleTransferDesc" },
  { icon: "finance", title: "poleFinances", desc: "poleFinancesDesc" },
  { icon: "tech", title: "poleTech", desc: "poleTechDesc" },
  { icon: "ship", title: "poleShipping", desc: "poleShippingDesc" },
];

export function AuthScreen({ mode }: { mode: Mode }) {
  const t = useT(authMessages);
  const { signIn, signUp, signInWithGoogle, configured } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const nextParam = search.get("next");
  const next = safeNext(nextParam);
  const callbackFailed = search.get("error") === "auth";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setError] = useState<string | null>(null);
  const [callbackDismissed, setCallbackDismissed] = useState(false);
  const [loading, setLoading] = useState<"form" | "google" | null>(null);

  const ids = { name: useId(), email: useId(), password: useId(), hint: useId(), error: useId() };
  const isLogin = mode === "login";
  const otherHref = `${isLogin ? "/signup" : "/login"}${nextParam ? `?next=${encodeURIComponent(next)}` : ""}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading("form");
    setError(null);
    setCallbackDismissed(true);
    try {
      if (isLogin) await signIn(email, password);
      else await signUp(email, password, name);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("genericError"));
    } finally {
      setLoading(null);
    }
  }

  async function onGoogle() {
    setError(null);
    setCallbackDismissed(true);
    setLoading("google");
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const lower = msg.toLowerCase();
      if (lower.includes("provider is not enabled") || lower.includes("unsupported provider")) {
        setError(t("googleNotEnabled"));
      } else {
        setError(msg || t("genericError"));
      }
      setLoading(null);
    }
  }

  const busy = loading !== null;
  const error = formError ?? (callbackFailed && !callbackDismissed ? t("callbackError") : null);

  return (
    <div className="bg-bg lg:grid lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Panneau de marque (desktop) */}
      <aside className="bg-navy-gradient relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-14 xl:px-16">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_75%)]" />
        <div
          aria-hidden
          className="animate-orbit absolute -right-40 -bottom-40 h-[28rem] w-[28rem] rounded-full border border-white/10"
        >
          <span className="absolute top-8 left-1/2 h-2.5 w-2.5 rounded-full bg-sky shadow-[0_0_18px_4px_rgba(63,160,255,0.6)]" />
        </div>

        <div className="relative animate-rise">
          <div className="w-36 overflow-hidden rounded-3xl bg-white p-2 shadow-float xl:w-40">
            <LogoFull priority className="h-auto w-full rounded-2xl" />
          </div>
          <p className="mt-10 font-display text-xs font-bold uppercase tracking-[0.18em] text-sky">
            {t("brandEyebrow")}
          </p>
          <h2 className="mt-3 max-w-md font-display text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
            {t("tagline")}
          </h2>
          <p className="mt-4 max-w-md text-white/70">{t("brandIntro")}</p>
        </div>

        <ul className="relative mt-10 grid grid-cols-2 gap-3 animate-rise-1">
          {POLES.map((p) => (
            <li key={p.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/30 text-sky ring-1 ring-white/15">
                <Icon name={p.icon} />
              </span>
              <p className="mt-3 font-display text-sm font-bold">{t(p.title)}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/60">{t(p.desc)}</p>
            </li>
          ))}
        </ul>

        <p className="relative mt-10 text-xs text-white/50">
          {appName} — {appFullName}
        </p>
      </aside>

      {/* Formulaire */}
      <div className="flex items-start justify-center px-4 py-8 sm:px-6 sm:py-12 lg:items-center lg:py-14">
        <div className="w-full max-w-md">
          {/* En-tête de marque compact (mobile) */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="inline-flex rounded-2xl bg-white p-1.5 shadow-card">
              <LogoEmblem className="h-9 w-auto" priority />
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-black tracking-tight text-gradient-brand">{appName}</p>
              <p className="truncate text-xs text-muted">{t("tagline")}</p>
            </div>
          </div>

          <div className="animate-rise rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {isLogin ? t("loginTitle") : t("signupTitle")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {isLogin ? t("loginSubtitle") : t("signupSubtitle")}
            </p>

            <p
              className={`mt-4 flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                configured ? "bg-success/10 text-success" : "bg-warn/10 text-warn"
              }`}
            >
              <Icon name={configured ? "shield" : "info"} className="mt-px h-4 w-4 shrink-0" />
              <span>{configured ? t("supabaseReady") : t("demoHint")}</span>
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {!isLogin && (
                <Field id={ids.name} label={t("name")}>
                  <input
                    id={ids.name}
                    name="name"
                    required
                    autoComplete="name"
                    placeholder={t("namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}

              <Field id={ids.email} label={t("email")}>
                <input
                  id={ids.email}
                  name="email"
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  aria-describedby={error ? ids.error : undefined}
                />
              </Field>

              <Field id={ids.password} label={t("password")}>
                <div className="relative">
                  <input
                    id={ids.password}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={isLogin ? undefined : 6}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    aria-describedby={
                      [!isLogin ? ids.hint : "", error ? ids.error : ""].filter(Boolean).join(" ") || undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-1.5 my-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-ink"
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
                {!isLogin && (
                  <p id={ids.hint} className="mt-1.5 text-xs text-muted">
                    {t("passwordHintSignup")}
                  </p>
                )}
              </Field>

              {error && (
                <div
                  id={ids.error}
                  role="alert"
                  className="flex items-start gap-2 rounded-2xl border border-danger/20 bg-danger/5 px-3.5 py-3 text-sm text-danger"
                >
                  <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" size="lg" disabled={busy} className="w-full" aria-busy={loading === "form"}>
                {loading === "form" ? (
                  <>
                    <Spinner />
                    {t("loading")}
                  </>
                ) : (
                  <>
                    {isLogin ? t("submitLogin") : t("submitSignup")}
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted">
              <span className="h-px flex-1 bg-line" />
              {t("or")}
              <span className="h-px flex-1 bg-line" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onGoogle}
              disabled={busy}
              className="w-full"
              aria-busy={loading === "google"}
            >
              {loading === "google" ? <Spinner /> : <GoogleIcon />}
              {t("google")}
            </Button>

            {!isLogin && (
              <p className="mt-5 text-center text-xs leading-relaxed text-muted">
                {t("termsPrefix")}{" "}
                <Link href="/conditions" className="font-semibold text-brand underline-offset-2 hover:underline">
                  {t("terms")}
                </Link>{" "}
                {t("and")}{" "}
                <Link href="/confidentialite" className="font-semibold text-brand underline-offset-2 hover:underline">
                  {t("privacy")}
                </Link>
                .
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            {isLogin ? t("noAccount") : t("hasAccount")}{" "}
            <Link href={otherHref} className="font-semibold text-brand hover:text-brand-strong">
              {isLogin ? t("toSignup") : t("toLogin")}
            </Link>
          </p>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <Icon name="lock" className="h-3.5 w-3.5" />
            {t("secure")}
          </p>

          {/* Pôles (mobile) */}
          <ul className="mt-8 grid grid-cols-2 gap-2 lg:hidden">
            {POLES.map((p) => (
              <li
                key={p.title}
                className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2.5 text-xs font-semibold text-ink"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon name={p.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 leading-tight">{t(p.title)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-line bg-surface-soft/60 px-4 py-3 text-base text-ink placeholder:text-muted/60 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15 sm:text-sm";

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.1 39.5 16 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l.1.1 6.2 5.2C39.2 37.2 44 31.5 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
