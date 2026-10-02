"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui/layout";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { AdminMode } from "@/lib/admin-auth";
import { inputClass, Message, useAdminT } from "../_ui/kit";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = { error: null };

export function LoginView({ mode, next, loggedOut }: { mode: AdminMode; next: string; loggedOut: boolean }) {
  const { t } = useAdminT();
  const [state, formAction, pending] = useActionState(loginAction, initial);

  const errorText =
    state.error === "invalid"
      ? t("errInvalid")
      : state.error === "rate_limited"
        ? t("errRate")
        : state.error === "locked"
          ? t("errLocked")
          : null;

  return (
    <div className="bg-navy-gradient relative overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative flex min-h-[70vh] items-center justify-center py-14">
        <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-float sm:p-8">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="lock" />
          </span>
          <div className="mt-4">
            <Eyebrow>{t("shellEyebrow")}</Eyebrow>
          </div>

          {mode === "locked" ? (
            <>
              <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">{t("lockedTitle")}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("lockedText")}</p>
              <code className="mt-4 block break-all rounded-xl bg-surface-soft px-3 py-2 font-mono text-xs text-ink">
                ADMIN_PASSWORD=… · ADMIN_SESSION_SECRET=…
              </code>
            </>
          ) : mode === "dev-open" ? (
            <>
              <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">{t("devOpenTitle")}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("devOpenText")}</p>
              <ButtonLink href="/admin" className="mt-5 w-full">
                {t("goToAdmin")}
                <Icon name="arrowRight" className="h-4 w-4" />
              </ButtonLink>
            </>
          ) : (
            <>
              <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">{t("loginTitle")}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("loginSubtitle")}</p>
              {loggedOut && !state.error && (
                <div className="mt-4">
                  <Message ok>{t("loggedOut")}</Message>
                </div>
              )}
              <form action={formAction} className="mt-5 space-y-4">
                <input type="hidden" name="next" value={next} />
                <div>
                  <label htmlFor="admin-password" className="block text-sm font-semibold text-ink">
                    {t("passwordLabel")}
                  </label>
                  <input
                    id="admin-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    autoFocus
                    aria-invalid={state.error === "invalid" || undefined}
                    aria-describedby={errorText ? "admin-login-error" : undefined}
                    className={`${inputClass} mt-1.5`}
                  />
                </div>
                {errorText && (
                  <div id="admin-login-error">
                    <Message ok={false}>{errorText}</Message>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? t("loggingIn") : t("loginSubmit")}
                </Button>
              </form>
            </>
          )}

          <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
            {t("backToSite")}
          </Link>
        </div>
      </Container>
    </div>
  );
}
