"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import type { AdminCustomer } from "../_server/customers";
import { COUNTRY_LABEL, useCustomersT } from "./customers-kit";
import { adminFetch, Field, inputClass, Message, PageTitle, Panel } from "./kit";

export function CustomerNew() {
  const { t } = useCustomersT();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "CA",
    region: "",
    birthDate: "",
    password: "",
    kycStatus: "verified",
    adminNote: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ customer: AdminCustomer; temporaryPassword: string | null } | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setDone(await adminFetch("/api/admin/customers", "POST", form));
    } catch (err) {
      setError(t("error", { e: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-6">
        <PageTitle title={t("createTitle")} />
        <Panel>
          <Message ok>{t("created_ok", { email: done.customer.email })}</Message>
          {done.temporaryPassword && (
            <div className="mt-4 rounded-2xl border border-brand/30 bg-brand-soft p-4">
              <p className="font-mono text-base font-bold text-navy">{t("tempPassword", { p: done.temporaryPassword })}</p>
              <p className="mt-1 text-xs text-muted">{t("tempPasswordHint")}</p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink href={`/admin/clients/${done.customer.id}`} size="sm">
              {t("openCustomer")}
            </ButtonLink>
            <ButtonLink href="/admin/clients" size="sm" variant="secondary">
              {t("back")}
            </ButtonLink>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        ← {t("back")}
      </Link>
      <PageTitle title={t("createTitle")} subtitle={t("createSubtitle")} />
      <Panel>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field id="n-first" label={t("firstName")}>
            <input id="n-first" required value={form.firstName} onChange={set("firstName")} className={inputClass} autoComplete="off" />
          </Field>
          <Field id="n-last" label={t("lastName")}>
            <input id="n-last" required value={form.lastName} onChange={set("lastName")} className={inputClass} autoComplete="off" />
          </Field>
          <Field id="n-email" label={t("email")}>
            <input id="n-email" required type="email" value={form.email} onChange={set("email")} className={inputClass} autoComplete="off" />
          </Field>
          <Field id="n-phone" label={t("phone")}>
            <input id="n-phone" required value={form.phone} onChange={set("phone")} placeholder="+1 416 555 0142" className={inputClass} />
          </Field>
          <Field id="n-country" label={t("country")}>
            <select id="n-country" value={form.country} onChange={set("country")} className={inputClass}>
              {Object.entries(COUNTRY_LABEL).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="n-region" label={t("region")}>
            <input id="n-region" value={form.region} onChange={set("region")} className={inputClass} />
          </Field>
          <Field id="n-birth" label={t("birthDate")}>
            <input id="n-birth" value={form.birthDate} onChange={set("birthDate")} placeholder="JJ/MM/AAAA" className={inputClass} />
          </Field>
          <Field id="n-kyc" label={t("kycInitial")}>
            <select id="n-kyc" value={form.kycStatus} onChange={set("kycStatus")} className={inputClass}>
              <option value="verified">{t("kycInitialVerified")}</option>
              <option value="none">{t("kycInitialNone")}</option>
            </select>
          </Field>
          <Field id="n-pass" label={t("passwordLabel")} hint={t("passwordHint")} className="sm:col-span-2">
            <input id="n-pass" type="text" value={form.password} onChange={set("password")} className={inputClass} autoComplete="new-password" />
          </Field>
          <Field id="n-note" label={t("notes")} hint={t("notesHint")} className="sm:col-span-2">
            <textarea id="n-note" rows={3} value={form.adminNote} onChange={set("adminNote")} className={inputClass} />
          </Field>
          {error && (
            <div className="sm:col-span-2">
              <Message ok={false}>{error}</Message>
            </div>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {t("create")}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
