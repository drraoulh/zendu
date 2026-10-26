"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { accountMessages } from "@/i18n/admin-account";
import { adminFetch, Field, inputClass, Message, PageTitle, Panel } from "./kit";

type Me = { username: string; displayName: string; mfa: boolean; mustChangePassword: boolean } | null;
type Feedback = { ok: boolean; text: string } | null;

function PasswordForm({ me, minLength }: { me: NonNullable<Me>; minLength: number }) {
  const t = useT(accountMessages);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Feedback>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const next = String(f.get("next") ?? "");
    if (next !== String(f.get("confirm") ?? "")) return setMsg({ ok: false, text: t("pwdMismatch") });
    setBusy(true);
    setMsg(null);
    try {
      await adminFetch("/api/admin/me/password", "POST", { current: String(f.get("current") ?? ""), next });
      form.reset();
      if (me.mustChangePassword) {
        window.location.href = "/admin";
        return;
      }
      setMsg({ ok: true, text: t("pwdDone") });
    } catch (err) {
      setMsg({ ok: false, text: t("error", { error: err instanceof Error ? err.message : "?" }) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="text" name="username" value={me.username} autoComplete="username" readOnly hidden />
      <Field id="pw-current" label={t("pwdCurrent")}>
        <input id="pw-current" name="current" type="password" required autoComplete="current-password" className={inputClass} />
      </Field>
      <Field id="pw-next" label={t("pwdNew")}>
        <input id="pw-next" name="next" type="password" required minLength={minLength} autoComplete="new-password" className={inputClass} />
      </Field>
      <Field id="pw-confirm" label={t("pwdConfirm")}>
        <input id="pw-confirm" name="confirm" type="password" required minLength={minLength} autoComplete="new-password" className={inputClass} />
      </Field>
      <p className="text-xs text-muted">{t("pwdHint", { n: minLength })}</p>
      {msg && <Message ok={msg.ok}>{msg.text}</Message>}
      <Button type="submit" disabled={busy}>
        {t("pwdSave")}
      </Button>
    </form>
  );
}

function MfaSection({ me }: { me: NonNullable<Me> }) {
  const t = useT(accountMessages);
  const router = useRouter();
  const [enroll, setEnroll] = useState<{ secret: string; uri: string; qr: string; enroll: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Feedback>(null);

  async function call(body: Record<string, string>, done?: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await adminFetch<{ secret?: string; uri?: string; qr?: string; enroll?: string }>("/api/admin/me/totp", "POST", body);
      if (body.action === "start" && res.secret && res.uri && res.qr && res.enroll) {
        setEnroll({ secret: res.secret, uri: res.uri, qr: res.qr, enroll: res.enroll });
      } else {
        setEnroll(null);
        if (done) setMsg({ ok: true, text: done });
        router.refresh();
      }
    } catch (err) {
      setMsg({ ok: false, text: t("error", { error: err instanceof Error ? err.message : "?" }) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className={`text-sm ${me.mfa ? "text-success" : "font-semibold text-ink"}`}>{me.mfa ? t("mfaOn") : t("mfaOff")}</p>
      {msg && <Message ok={msg.ok}>{msg.text}</Message>}

      {!me.mfa && !enroll && (
        <Button disabled={busy} onClick={() => void call({ action: "start" })}>
          {t("mfaStart")}
        </Button>
      )}

      {!me.mfa && enroll && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void call({ action: "confirm", enroll: enroll.enroll, code: String(new FormData(e.currentTarget).get("code") ?? "") }, t("mfaEnabled"));
          }}
        >
          <p className="text-sm text-muted">{t("mfaScan")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR code généré à la volée (data URL) */}
          <img src={enroll.qr} alt="QR code" width={220} height={220} className="rounded-xl border border-line" />
          <code className="block break-all rounded-xl bg-surface-soft px-3 py-2 font-mono text-sm text-ink">{enroll.secret}</code>
          <Field id="mfa-code" label={t("mfaCode")}>
            <input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required className={`${inputClass} font-mono tracking-[0.3em]`} />
          </Field>
          <Button type="submit" disabled={busy}>
            {t("mfaConfirm")}
          </Button>
        </form>
      )}

      {me.mfa && (
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void call({ action: "disable", password: String(f.get("password") ?? ""), code: String(f.get("code") ?? "") }, t("mfaDisabled"));
          }}
        >
          <Field id="mfa-off-pwd" label={t("mfaDisablePwd")}>
            <input id="mfa-off-pwd" name="password" type="password" autoComplete="current-password" required className={inputClass} />
          </Field>
          <Field id="mfa-off-code" label={t("mfaCode")}>
            <input id="mfa-off-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required className={`${inputClass} font-mono`} />
          </Field>
          <Button type="submit" variant="secondary" disabled={busy}>
            {t("mfaDisable")}
          </Button>
        </form>
      )}
    </div>
  );
}

/** Mon compte : mot de passe et code à 6 chiffres de la personne connectée. */
export function AccountView({ me, minLength }: { me: Me; minLength: number }) {
  const t = useT(accountMessages);
  return (
    <div className="min-h-screen bg-bg py-8">
      <Container>
        <div className="mx-auto max-w-3xl space-y-6">
        {!me?.mustChangePassword && (
          <Link href="/admin" className="text-sm font-semibold text-brand hover:underline">
            ← {t("back")}
          </Link>
        )}
        <PageTitle title={t("title")} subtitle={t("subtitle")} />
        {!me ? (
          <Message ok={false}>{t("provisional")}</Message>
        ) : (
          <>
            <p className="text-sm text-muted">{t("signedAs", { name: me.displayName, username: me.username })}</p>
            {me.mustChangePassword && <Message ok={false}>{t("mustChange")}</Message>}
            <Panel title={t("pwdTitle")} id="acc-pwd">
              <PasswordForm me={me} minLength={minLength} />
            </Panel>
            {!me.mustChangePassword && (
              <Panel title={t("mfaTitle")} id="acc-mfa">
                <MfaSection me={me} />
              </Panel>
            )}
          </>
        )}
        </div>
      </Container>
    </div>
  );
}
