"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatMoney } from "@/lib/money";
import type { AdminCustomer, AdminCustomerSession, AdminCustomerTransfer } from "../_server/customers";
import { AccountBadge, COUNTRY_LABEL, KycBadge, TRANSFER_STATUS_LABEL, useCustomersT } from "./customers-kit";
import { adminFetch, Field, inputClass, Message, PageTitle, Panel, useAdminT } from "./kit";

type Detail = { customer: AdminCustomer; transfers: AdminCustomerTransfer[]; sessions: AdminCustomerSession[]; totals: Record<string, number> };

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export function CustomerDetail({ initial }: { initial: Detail }) {
  const router = useRouter();
  const { t } = useCustomersT();
  const { dateTime, label, nl } = useAdminT();
  const [c, setC] = useState(initial.customer);
  const [sessions, setSessions] = useState(initial.sessions);
  const [kycNote, setKycNote] = useState(c.kycNote ?? "");
  const [adminNote, setAdminNote] = useState(c.adminNote ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [temp, setTemp] = useState<string | null>(null);
  const base = `/api/admin/customers/${c.id}`;

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ ok: false, text: t("error", { e: e instanceof Error ? e.message : String(e) }) });
    } finally {
      setBusy(null);
    }
  }

  const patch = (key: string, body: Record<string, unknown>) =>
    run(key, async () => {
      const r = await adminFetch<{ customer: AdminCustomer }>(base, "PATCH", body);
      setC(r.customer);
      setMsg({ ok: true, text: t("saved") });
      router.refresh();
    });

  const a = c.address;
  const name = `${c.firstName} ${c.lastName}`;

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        ← {t("back")}
      </Link>
      <PageTitle
        title={name}
        subtitle={`${c.email} · ${COUNTRY_LABEL[c.country] ?? c.country}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <KycBadge status={c.kycStatus} />
            <AccountBadge status={c.status} />
          </div>
        }
      />
      {msg && <Message ok={msg.ok}>{msg.text}</Message>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("kycTitle")} id="kyc">
          <dl className="divide-y divide-line">
            <Row label={t("kycDocument")}>{c.kycDocument ?? "—"}</Row>
            <Row label={t("kycSubmitted")}>{c.kycSubmittedAt ? dateTime(c.kycSubmittedAt) : "—"}</Row>
            <Row label={t("kycReviewed")}>{c.kycReviewedAt ? dateTime(c.kycReviewedAt) : "—"}</Row>
          </dl>
          <Field id="kyc-note" label={t("kycNoteLabel")} className="mt-3">
            <input id="kyc-note" value={kycNote} onChange={(e) => setKycNote(e.target.value)} className={inputClass} maxLength={500} />
          </Field>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" disabled={busy !== null || c.kycStatus === "verified"} onClick={() => patch("approve", { kycStatus: "verified", kycNote: kycNote || null })}>
              <Icon name="check" className="h-4 w-4" />
              {t("approve")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={busy !== null || c.kycStatus === "rejected"}
              onClick={() => patch("reject", { kycStatus: "rejected", kycNote: kycNote || null })}
            >
              {t("reject")}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy !== null || c.kycStatus === "none"} onClick={() => patch("resetkyc", { kycStatus: "none" })}>
              {t("resetKyc")}
            </Button>
          </div>
          <p className="mt-4 rounded-xl bg-surface-soft px-3 py-2 text-xs leading-relaxed text-muted">{t("kycDemoNote")}</p>
        </Panel>

        <Panel title={t("identity")} id="identity">
          <dl className="divide-y divide-line">
            <Row label={t("legalName")}>{name}</Row>
            <Row label={t("birthDate")}>{c.birthDate ?? "—"}</Row>
            <Row label={t("occupation")}>{[c.occupation, c.jobTitle].filter(Boolean).join(" · ") || "—"}</Row>
            <Row label={t("email")}>{c.email}</Row>
            <Row label={t("phone")}>{c.phone}</Row>
            <Row label={t("address")}>
              {a ? [a.line1, a.line2, `${a.city} (${a.region})`, a.postalCode].filter(Boolean).join(", ") : "—"}
            </Row>
            <Row label={t("country")}>{COUNTRY_LABEL[c.country] ?? c.country}</Row>
            <Row label={t("created")}>{dateTime(c.createdAt)}</Row>
            <Row label={t("lastLogin")}>{c.lastLoginAt ? dateTime(c.lastLoginAt) : t("never")}</Row>
          </dl>
        </Panel>

        <Panel title={t("accessTitle")} id="access">
          {c.status === "suspended" && <p className="mb-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{t("suspendedHint")}</p>}
          {c.mustChangePassword && <p className="mb-3 rounded-xl bg-warn/10 px-3 py-2 text-sm text-[#7a5308]">{t("mustChange")}</p>}
          <div className="flex flex-wrap gap-2">
            {c.status === "active" ? (
              <Button size="sm" variant="danger" disabled={busy !== null} onClick={() => patch("suspend", { status: "suspended" }).then(() => setSessions([]))}>
                <Icon name="lock" className="h-4 w-4" />
                {t("suspend")}
              </Button>
            ) : (
              <Button size="sm" disabled={busy !== null} onClick={() => patch("reactivate", { status: "active" })}>
                {t("reactivate")}
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={busy !== null}
              onClick={() =>
                run("password", async () => {
                  const r = await adminFetch<{ temporaryPassword: string }>(`${base}/password`, "POST");
                  setTemp(r.temporaryPassword);
                  setSessions([]);
                  setC({ ...c, mustChangePassword: true });
                })
              }
            >
              <Icon name="lock" className="h-4 w-4" />
              {t("resetPassword")}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted">{t("resetPasswordHint")}</p>
          {temp && (
            <div role="status" className="mt-3 rounded-2xl border border-brand/30 bg-brand-soft p-4">
              <p className="font-mono text-base font-bold text-navy">{t("tempPassword", { p: temp })}</p>
              <p className="mt-1 text-xs text-muted">{t("tempPasswordHint")}</p>
            </div>
          )}

          <h3 className="mt-6 font-display text-sm font-bold text-ink">{t("devices")}</h3>
          {sessions.length ? (
            <ul className="mt-2 divide-y divide-line">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{s.device ?? t("unknownDevice")}</p>
                    <p className="text-xs text-muted">{t("lastActive", { d: dateTime(s.lastUsedAt) })}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy !== null}
                    onClick={() =>
                      run(`s-${s.id}`, async () => {
                        await adminFetch(`${base}/sessions?session=${s.id}`, "DELETE");
                        setSessions(sessions.filter((x) => x.id !== s.id));
                      })
                    }
                  >
                    {t("revoke")}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">{t("noDevices")}</p>
          )}
          {sessions.length > 1 && (
            <Button
              className="mt-2"
              size="sm"
              variant="secondary"
              disabled={busy !== null}
              onClick={() =>
                run("revoke-all", async () => {
                  await adminFetch(`${base}/sessions`, "DELETE");
                  setSessions([]);
                })
              }
            >
              {t("revokeAll")}
            </Button>
          )}
        </Panel>

        <Panel title={t("notes")} id="notes">
          <Field id="admin-note" label={t("notesHint")}>
            <textarea id="admin-note" rows={5} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className={inputClass} maxLength={2000} />
          </Field>
          <Button className="mt-3" size="sm" disabled={busy !== null} onClick={() => patch("note", { adminNote: adminNote || null })}>
            {t("save")}
          </Button>
        </Panel>
      </div>

      <Panel
        title={t("transfers")}
        id="transfers"
        actions={
          Object.keys(initial.totals).length ? (
            <p className="text-sm text-muted">
              {t("totalSent")} :{" "}
              <span className="font-semibold text-ink">
                {Object.entries(initial.totals)
                  .map(([cur, v]) => formatMoney(v, cur, nl))
                  .join(" · ")}
              </span>
            </p>
          ) : undefined
        }
      >
        {initial.transfers.length ? (
          <ul className="divide-y divide-line">
            {initial.transfers.map((tr) => (
              <li key={tr.id} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1.4fr)_1fr_1fr_auto] sm:items-center sm:gap-3">
                <div className="min-w-0">
                  <a href={`/transfers/${tr.id}`} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">
                    {tr.reference}
                  </a>
                  <p className="truncate text-sm text-muted">
                    {tr.recipient} · {label("net_", tr.network)}
                    {tr.account ? ` · ${tr.account}` : ""}
                  </p>
                </div>
                <p className="text-sm text-ink">{formatMoney(tr.totalCad, tr.sendCurrency, nl)}</p>
                <p className="text-sm text-ink">{formatMoney(tr.receiveAmountXaf, tr.receiveCurrency, nl)}</p>
                <p className="text-xs text-muted sm:text-right">
                  {TRANSFER_STATUS_LABEL[tr.status] ?? tr.status}
                  <span className="block">{dateTime(tr.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("noTransfers")}</p>
        )}
      </Panel>

      <div className="flex justify-end">
        <Button
          variant="danger"
          size="sm"
          disabled={busy !== null}
          onClick={() => {
            if (!window.confirm(t("deleteConfirm"))) return;
            void run("delete", async () => {
              await adminFetch(base, "DELETE");
              router.push("/admin/clients");
              router.refresh();
            });
          }}
        >
          {t("deleteCustomer")}
        </Button>
      </div>
    </div>
  );
}
