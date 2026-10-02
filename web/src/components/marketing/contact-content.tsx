"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CompanyValue, ToComplete } from "@/components/info/shared";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, PageHero, Section, SectionHeading } from "@/components/ui/layout";
import { company, companyLocality, telHref, whatsappHref } from "@/lib/company";
import { contactPage } from "@/i18n/company";
import { useT } from "@/i18n/define";
import { EMAIL_RE, Field, fieldAria, inputClass } from "./form";

type K = keyof typeof contactPage.fr;

const SUBJECTS = ["transfert", "finances", "technologies", "shipping", "autre"] as const;
type Subject = (typeof SUBJECTS)[number];
const SUBJECT_LABEL: Record<Subject, K> = {
  transfert: "subjectTransfer",
  finances: "subjectFinances",
  technologies: "subjectTech",
  shipping: "subjectShipping",
  autre: "subjectOther",
};

const SHORTCUTS: Array<{ href: string; icon: IconName; key: K }> = [
  { href: "/aide", icon: "info", key: "shortcut9" },
  { href: "/frais", icon: "receipt", key: "shortcut7" },
  { href: "/transfert#faq", icon: "transfer", key: "shortcut1" },
  { href: "/shipping/devis", icon: "box", key: "shortcut5" },
  { href: "/shipping/suivi", icon: "ship", key: "shortcut8" },
  { href: "/application", icon: "phone", key: "shortcut6" },
];

type Values = { name: string; email: string; phone: string; subject: Subject; message: string };
type Errors = Partial<Record<keyof Values, string>>;
const INITIAL: Values = { name: "", email: "", phone: "", subject: "transfert", message: "" };

function isSubject(value: string | null): value is Subject {
  return !!value && (SUBJECTS as readonly string[]).includes(value);
}

function ContactCard({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-4 rounded-3xl border border-line bg-white p-5 shadow-card">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold text-ink">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "success"; reference: string; email: string }
  | { state: "error"; key: K };

function ContactForm() {
  const t = useT(contactPage);
  const { locale } = useI18n();
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [website, setWebsite] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Pré-sélection du sujet depuis ?sujet=… (liens des pages services).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("sujet");
    if (isSubject(param)) setValues((v) => ({ ...v, subject: param }));
  }, []);

  useEffect(() => {
    if (status.state === "success" || status.state === "error") statusRef.current?.focus();
  }, [status.state]);

  const set = <F extends keyof Values>(field: F, value: Values[F]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  function validate(v: Values): Errors {
    const e: Errors = {};
    if (v.name.trim().length < 2) e.name = t("errRequired");
    if (!v.email.trim()) e.email = t("errRequired");
    else if (!EMAIL_RE.test(v.email.trim())) e.email = t("errEmail");
    if (!v.message.trim()) e.message = t("errRequired");
    else if (v.message.trim().length < 10) e.message = t("errMessage");
    return e;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.state === "sending") return;
    const found = validate(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#c-${first}`)?.focus();
      return;
    }
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "contact",
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || undefined,
          locale,
          website,
          payload: { subject: values.subject, message: values.message.trim() },
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; reference?: string; code?: string; issues?: Array<{ path: string }> }
        | null;
      if (res.ok && data?.ok && data.reference) {
        setStatus({ state: "success", reference: data.reference, email: values.email.trim() });
        return;
      }
      if (res.status === 503) {
        setStatus({ state: "error", key: company.email ? "errUnavailable" : "errUnavailableNoEmail" });
        return;
      }
      if (res.status === 429) {
        setStatus({ state: "error", key: "errRateLimited" });
        return;
      }
      if (res.status === 400) {
        const map: Errors = {};
        for (const issue of data?.issues ?? []) {
          if (issue.path === "name") map.name = t("errRequired");
          else if (issue.path === "email") map.email = t("errEmail");
          else if (issue.path === "payload.message") map.message = t("errMessage");
        }
        setErrors(map);
        setStatus({ state: "error", key: "errInvalid" });
        return;
      }
      setStatus({ state: "error", key: "errGeneric" });
    } catch {
      setStatus({ state: "error", key: "errGeneric" });
    }
  }

  function reset() {
    setValues(INITIAL);
    setErrors({});
    setStatus({ state: "idle" });
  }

  if (status.state === "success") {
    const merci = `/merci?ref=${encodeURIComponent(status.reference)}&kind=contact`;
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="rounded-3xl border border-success/30 bg-success/5 p-6 text-center focus:outline-none sm:p-8"
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success text-white">
          <Icon name="check" className="h-7 w-7" strokeWidth={2.6} />
        </span>
        <h3 className="mt-5 font-display text-xl font-bold text-ink">{t("successTitle")}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{t("successText", { email: status.email })}</p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t("successRef")}</p>
        <p className="mt-1 font-display text-2xl font-black tracking-wider text-brand-strong">{status.reference}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href={merci}>
            {t("successDetails")}
            <Icon name="arrowRight" className="h-4 w-4" />
          </ButtonLink>
          <Button type="button" variant="ghost" onClick={reset}>
            {t("successReset")}
          </Button>
        </div>
      </div>
    );
  }

  const hasErrors = Object.values(errors).some(Boolean);
  const sending = status.state === "sending";

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="grid gap-5" aria-busy={sending}>
      {status.state === "error" && (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="alert"
          className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger focus:outline-none"
        >
          {t(status.key)}
          {status.key === "errUnavailable" && company.email && (
            <a href={`mailto:${company.email}`} className="ml-1 font-semibold underline">
              {company.email}
            </a>
          )}
        </div>
      )}
      {hasErrors && status.state !== "error" && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {t("errSummary")}
        </p>
      )}
      {/* Pot de miel anti-robots : invisible pour les humains. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="c-website">{t("honeypot")}</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <Field id="c-name" label={t("fName")} error={errors.name} required>
        <input
          {...fieldAria("c-name", errors.name)}
          className={inputClass}
          autoComplete="name"
          maxLength={120}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="c-email" label={t("fEmail")} error={errors.email} required>
          <input
            {...fieldAria("c-email", errors.email)}
            type="email"
            className={inputClass}
            autoComplete="email"
            maxLength={254}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field id="c-phone" label={t("fPhone")} optionalLabel={t("optional")}>
          <input
            {...fieldAria("c-phone")}
            type="tel"
            className={inputClass}
            autoComplete="tel"
            maxLength={40}
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
      </div>
      <Field id="c-subject" label={t("fSubject")} required>
        <div className="relative">
          <select
            {...fieldAria("c-subject")}
            className={`${inputClass} appearance-none pr-10`}
            value={values.subject}
            onChange={(e) => set("subject", e.target.value as Subject)}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {t(SUBJECT_LABEL[s])}
              </option>
            ))}
          </select>
          <Icon
            name="chevronDown"
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
        </div>
      </Field>
      <Field id="c-message" label={t("fMessage")} error={errors.message} required>
        <textarea
          {...fieldAria("c-message", errors.message)}
          rows={6}
          maxLength={5000}
          className={`${inputClass} resize-y`}
          placeholder={t("fMessagePh")}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {t("privacyNote")}{" "}
          <Link href="/confidentialite" className="font-semibold text-brand hover:text-brand-strong">
            {t("privacyLink")}
          </Link>
        </p>
        <Button type="submit" size="lg" className="w-full shrink-0 sm:w-auto" disabled={sending}>
          {sending ? (
            <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Icon name="mail" className="h-4 w-4" />
          )}
          {sending ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}

export function ContactContent() {
  const t = useT(contactPage);
  const wa = whatsappHref(company.whatsapp);
  const locality = companyLocality();

  return (
    <>
      <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")} />

      <Section className="bg-surface-soft">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:gap-14">
            <ul className="grid content-start gap-4">
              <ContactCard icon="mail" title={t("cardEmail")}>
                <CompanyValue
                  value={company.email}
                  href={company.email ? `mailto:${company.email}` : null}
                  className="break-all font-semibold text-brand hover:text-brand-strong"
                />
                <span className="mt-1 block text-xs">{t("responseNote")}</span>
              </ContactCard>
              <ContactCard icon="phone" title={t("cardPhone")}>
                <CompanyValue
                  value={company.phone}
                  href={company.phone ? telHref(company.phone) : null}
                  className="font-semibold text-brand hover:text-brand-strong"
                />
              </ContactCard>
              {wa && company.whatsapp && (
                <ContactCard icon="phone" title={t("cardWhatsapp")}>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:text-brand-strong">
                    {t("cardWhatsappAction")}
                  </a>
                  <span className="block">{company.whatsapp}</span>
                </ContactCard>
              )}
              <ContactCard icon="clock" title={t("cardHours")}>
                <CompanyValue value={company.hours} className="text-ink" />
              </ContactCard>
              <ContactCard icon="pin" title={t("cardAddress")}>
                {company.address || locality ? (
                  <span className="text-ink">
                    {company.address && <span className="block">{company.address}</span>}
                    <span className="block">{[locality, company.country].filter(Boolean).join(", ")}</span>
                  </span>
                ) : (
                  <>
                    <span className="block text-ink">{company.country}</span>
                    <ToComplete />
                  </>
                )}
              </ContactCard>
              <li className="bg-navy-gradient relative overflow-hidden rounded-3xl p-5 text-white shadow-float">
                <div aria-hidden className="bg-grid absolute inset-0 opacity-30" />
                <div className="relative flex gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10">
                    <Icon name="maple" className="h-6 w-6 text-maple" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold">{t("baseTitle")}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/75">{t("baseText")}</p>
                  </div>
                </div>
              </li>
            </ul>

            <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8">
              <SectionHeading eyebrow={t("formEyebrow")} title={t("formTitle")} subtitle={t("formSubtitle")} />
              <div className="relative mt-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow={t("shortcutsEyebrow")} title={t("shortcutsTitle")} />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SHORTCUTS.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-ink">{t(s.key)}</span>
                  <Icon name="arrowRight" className="h-4 w-4 text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
