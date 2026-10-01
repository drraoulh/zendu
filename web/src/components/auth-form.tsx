"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { CountryFlag } from "@/components/country-flag";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const { signIn, signUp, signInWithGoogle, configured } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/send";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") await signIn(email, password);
      else await signUp(email, password, name);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      if (
        msg.toLowerCase().includes("provider is not enabled") ||
        msg.toLowerCase().includes("unsupported provider")
      ) {
        setError(
          "Google n'est pas encore activé dans Supabase → Auth → Providers → Google (Client ID + Secret).",
        );
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  }

  return (
    <div className="bg-bg">
      <div className="mx-auto w-full max-w-md px-5 py-10 lg:py-14">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent font-bold text-white">
            PW
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {mode === "login" ? t("authWelcome") : t("authCreate")}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            {configured ? t("authSupabaseReady") : t("authDemoHint")}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-[1.5rem] border border-line bg-white p-5 shadow-sm sm:p-6"
        >
        {mode === "signup" && (
          <Field
            label={t("authName")}
            value={name}
            onChange={setName}
            autoComplete="name"
          />
        )}
        <Field
          label={t("authEmail")}
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
        />
        <Field
          label={t("authPassword")}
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-accent py-3.5 font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
        >
          {mode === "login" ? t("logIn") : t("signUp")}
        </button>

        <div className="flex items-center gap-3 py-1 text-xs text-ink-muted">
          <span className="h-px flex-1 bg-line" />
          {t("authOr")}
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white py-3 font-semibold hover:bg-bg-soft disabled:opacity-60"
        >
          <GoogleIcon />
          {t("authGoogle")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        {mode === "login" ? t("authNoAccount") : t("authHasAccount")}{" "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="font-semibold text-accent"
        >
          {mode === "login" ? t("signUp") : t("logIn")}
        </Link>
      </p>

      <div className="mt-6 flex justify-center gap-2 opacity-80">
        <CountryFlag code="ca" size={18} />
        <CountryFlag code="cm" size={18} />
        <CountryFlag code="fr" size={18} />
        <CountryFlag code="sn" size={18} />
      </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-ink-muted">{label}</span>
      <input
        required
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-bg px-3.5 py-3 outline-none focus:border-accent"
      />
    </label>
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
