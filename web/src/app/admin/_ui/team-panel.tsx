"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/define";
import { accountMessages } from "@/i18n/admin-account";
import { adminFetch, Field, inputClass, Message, Panel, useAdminT } from "./kit";

export type TeamUser = {
  id: string;
  username: string;
  displayName: string;
  active: boolean;
  mfa: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
};

type Feedback = { ok: boolean; text: string; hint?: boolean } | null;

/** Équipe : un compte par personne (création, mot de passe temporaire, désactivation, retrait du code). */
export function TeamPanel({ users, meId }: { users: TeamUser[]; meId: string | null }) {
  const t = useT(accountMessages);
  const { dateTime } = useAdminT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Feedback>(null);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setMsg(null);
    try {
      const res = await adminFetch<{ user: { username: string }; temporaryPassword: string }>("/api/admin/users", "POST", {
        username: String(f.get("username") ?? ""),
        displayName: String(f.get("displayName") ?? ""),
      });
      form.reset();
      setMsg({ ok: true, text: t("tempShown", { username: res.user.username, password: res.temporaryPassword }), hint: true });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: t("error", { error: err instanceof Error ? err.message : "?" }) });
    } finally {
      setBusy(false);
    }
  }

  async function act(u: TeamUser, action: "deactivate" | "activate" | "reset-password" | "reset-2fa") {
    const q =
      action === "deactivate"
        ? t("confirmDeactivate", { username: u.username })
        : action === "reset-password"
          ? t("confirmReset", { username: u.username })
          : action === "reset-2fa"
            ? t("confirmReset2fa", { username: u.username })
            : null;
    if (q && !window.confirm(q)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await adminFetch<{ temporaryPassword?: string }>(`/api/admin/users/${u.id}`, "PATCH", { action });
      setMsg(
        res.temporaryPassword
          ? { ok: true, text: t("tempReset", { username: u.username, password: res.temporaryPassword }), hint: true }
          : { ok: true, text: t("done") },
      );
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: t("error", { error: err instanceof Error ? err.message : "?" }) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title={t("teamTitle")} id="sec-team">
      <p className="mb-4 text-sm text-muted">{t("teamHint")}</p>
      {msg && (
        <div className="mb-4 space-y-1">
          <Message ok={msg.ok}>{msg.text}</Message>
          {msg.hint && <p className="text-xs font-semibold text-ink">{t("tempHint")}</p>}
        </div>
      )}
      {users.length === 0 ? (
        <p className="mb-4 text-sm font-semibold text-ink">{t("teamEmpty")}</p>
      ) : (
        <ul className="mb-5 divide-y divide-line">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-ink">
                  {u.displayName} <span className="font-mono text-xs text-muted">@{u.username}</span>
                  {u.id === meId && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">{t("you")}</span>}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {t("colMfa")} : {u.mfa ? t("mfaYes") : t("mfaNo")} · {t("colLast")} : {u.lastLoginAt ? dateTime(u.lastLoginAt) : t("never")} ·{" "}
                  {!u.active ? t("stateInactive") : u.mustChangePassword ? t("stateTemp") : t("stateActive")}
                </p>
              </div>
              {u.id !== meId && (
                <div className="flex flex-wrap gap-2">
                  {u.active ? (
                    <>
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => void act(u, "reset-password")}>
                        {t("actReset")}
                      </Button>
                      {u.mfa && (
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => void act(u, "reset-2fa")}>
                          {t("actReset2fa")}
                        </Button>
                      )}
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => void act(u, "deactivate")}>
                        {t("actDeactivate")}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => void act(u, "activate")}>
                      {t("actActivate")}
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={create} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field id="team-username" label={t("fUsername")}>
          <input id="team-username" name="username" required minLength={3} maxLength={32} autoCapitalize="none" autoComplete="off" placeholder="hyacinthe" className={inputClass} />
        </Field>
        <Field id="team-display" label={t("fDisplayName")}>
          <input id="team-display" name="displayName" required minLength={2} maxLength={80} autoComplete="off" className={inputClass} />
        </Field>
        <Button type="submit" disabled={busy}>
          {t("create")}
        </Button>
      </form>
    </Panel>
  );
}
