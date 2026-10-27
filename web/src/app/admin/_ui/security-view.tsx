"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { securityMessages } from "@/i18n/admin-security";
import { adminFetch, Message, PageTitle, Panel, useAdminT } from "./kit";
import { TeamPanel, type TeamUser } from "./team-panel";
import { EmailTestPanel } from "./email-test-panel";

export type SecurityData = {
  mfa: boolean;
  passwordShort: boolean;
  minLength: number;
  meId: string | null;
  db: {
    users: TeamUser[];
    sessions: {
      id: string;
      current: boolean;
      createdAt: string;
      lastSeenAt: string;
      expiresAt: string;
      ip: string | null;
      userAgent: string | null;
      who: string;
    }[];
    audit: { id: string; createdAt: string; action: string; actor: string; ip: string | null; ok: boolean }[];
  } | null;
};

function Check({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ok ? "bg-success/10 text-success" : "bg-warn/15 text-warn"}`}>
        <Icon name={ok ? "check" : "info"} className="h-3.5 w-3.5" />
      </span>
      <span className={ok ? "text-ink" : "font-semibold text-ink"}>{children}</span>
    </li>
  );
}

/** Page Sécurité : vérifications, sessions actives (révocables) et journal d'audit. */
export function SecurityView({ data }: { data: SecurityData }) {
  const t = useT(securityMessages);
  const { dateTime } = useAdminT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function revoke(scope: "others" | "all") {
    if (!window.confirm(scope === "all" ? t("confirmAll") : t("confirmOthers"))) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await adminFetch<{ revoked: number }>("/api/admin/sessions", "POST", { scope });
      if (scope === "all") {
        window.location.href = "/admin/login";
        return;
      }
      setMsg({ ok: true, text: t("revoked", { n: res.revoked }) });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: t("error", { error: err instanceof Error ? err.message : "?" }) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle title={t("title")} subtitle={t("subtitle")} />

      <Panel title={t("checks")} id="sec-checks">
        <ul className="space-y-2">
          <Check ok={data.mfa}>{data.mfa ? t("mfaOn") : t("mfaOff")}</Check>
          <Check ok={!data.passwordShort}>{data.passwordShort ? t("pwdShort", { n: data.minLength }) : t("pwdOk", { n: data.minLength })}</Check>
        </ul>
      </Panel>

      {!data.db ? (
        <Message ok={false}>{t("dbError")}</Message>
      ) : (
        <>
          <TeamPanel users={data.db.users} meId={data.meId} />

          <EmailTestPanel />

          <Panel
            title={t("sessions")}
            id="sec-sessions"
            actions={
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => revoke("others")}>
                  {t("revokeOthers")}
                </Button>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => revoke("all")}>
                  {t("revokeAll")}
                </Button>
              </div>
            }
          >
            {msg && (
              <div className="mb-3">
                <Message ok={msg.ok}>{msg.text}</Message>
              </div>
            )}
            {data.db.sessions.length === 0 ? (
              <p className="text-sm text-muted">{t("noSessions")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.db.sessions.map((s) => (
                  <li key={s.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted">#{s.id}</span>
                      <span className="font-semibold text-ink">{s.who}</span>
                      <span className="text-muted">{s.ip ?? "?"}</span>
                      {s.current && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">{t("current")}</span>}
                    </div>
                    <p className="mt-1 break-words text-xs text-muted">{s.userAgent ?? ""}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t("started", { date: dateTime(s.createdAt) })} · {t("lastSeen", { date: dateTime(s.lastSeenAt) })} ·{" "}
                      {t("expires", { date: dateTime(s.expiresAt) })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={t("audit")} id="sec-audit">
            {data.db.audit.length === 0 ? (
              <p className="text-sm text-muted">{t("noAudit")}</p>
            ) : (
              <div className="-mx-2 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="px-2 py-2 font-semibold">{t("colDate")}</th>
                      <th className="px-2 py-2 font-semibold">{t("colAction")}</th>
                      <th className="px-2 py-2 font-semibold">{t("colActor")}</th>
                      <th className="px-2 py-2 font-semibold">{t("colIp")}</th>
                      <th className="px-2 py-2 font-semibold">{t("colResult")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.db.audit.map((a) => (
                      <tr key={a.id}>
                        <td className="whitespace-nowrap px-2 py-2 text-muted">{dateTime(a.createdAt)}</td>
                        <td className="px-2 py-2 font-mono text-xs text-ink">{a.action}</td>
                        <td className="px-2 py-2 text-muted">{a.actor}</td>
                        <td className="whitespace-nowrap px-2 py-2 text-muted">{a.ip ?? ""}</td>
                        <td className={`px-2 py-2 font-semibold ${a.ok ? "text-success" : "text-danger"}`}>{a.ok ? t("ok") : t("refused")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
