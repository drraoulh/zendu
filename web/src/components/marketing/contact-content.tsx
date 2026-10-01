"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, PageHero, Section, SectionHeading } from "@/components/ui/layout";
import { contact } from "@/lib/brand";
import { contactPage } from "@/i18n/company";
import { useT } from "@/i18n/define";
import { EMAIL_RE, Field, FormSuccess, buildMailto, fieldAria, formatLines, inputClass, openMailto } from "./form";

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
  { href: "/transfert#faq", icon: "transfer", key: "shortcut1" },
  { href: "/finances#faq", icon: "finance", key: "shortcut2" },
  { href: "/technologies#faq", icon: "code", key: "shortcut3" },
  { href: "/shipping#faq", icon: "ship", key: "shortcut4" },
  { href: "/shipping#devis", icon: "box", key: "shortcut5" },
  { href: "/history", icon: "receipt", key: "shortcut6" },
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

function ContactForm() {
  const t = useT(contactPage);
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [mailto, setMailto] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Pré-sélection du sujet depuis ?sujet=… (liens des pages services).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("sujet");
    if (isSubject(param)) setValues((v) => ({ ...v, subject: param }));
  }, []);

  const set = <F extends keyof Values>(field: F, value: Values[F]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  function validate(v: Values): Errors {
    const e: Errors = {};
    if (!v.name.trim()) e.name = t("errRequired");
    if (!v.email.trim()) e.email = t("errRequired");
    else if (!EMAIL_RE.test(v.email.trim())) e.email = t("errEmail");
    if (!v.message.trim()) e.message = t("errRequired");
    else if (v.message.trim().length < 10) e.message = t("errMessage");
    return e;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#c-${first}`)?.focus();
      return;
    }
    const subjectLabel = t(SUBJECT_LABEL[values.subject]);
    const subject = t("mailSubject", { subject: subjectLabel, name: values.name.trim() });
    const body = [
      values.message.trim(),
      "",
      "—",
      formatLines([
        [t("fName"), values.name],
        [t("fEmail"), values.email],
        [t("fPhone"), values.phone],
        [t("fSubject"), subjectLabel],
      ]),
      "",
      t("mailOutro"),
    ].join("\n");
    const href = buildMailto(contact.email, subject, body);
    setMailto(href);
    openMailto(href);
  }

  function reset() {
    setValues(INITIAL);
    setErrors({});
    setMailto(null);
  }

  if (mailto) {
    return (
      <FormSuccess
        title={t("successTitle")}
        text={t("successText")}
        mailtoHref={mailto}
        retryLabel={t("successRetry")}
        resetLabel={t("successReset")}
        onReset={reset}
      />
    );
  }

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="grid gap-5">
      {hasErrors && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {t("errSummary")}
        </p>
      )}
      <Field id="c-name" label={t("fName")} error={errors.name} required>
        <input
          {...fieldAria("c-name", errors.name)}
          className={inputClass}
          autoComplete="name"
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
          className={`${inputClass} resize-y`}
          placeholder={t("fMessagePh")}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{t("privacyNote")}</p>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <Icon name="mail" className="h-4 w-4" />
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}

export function ContactContent() {
  const t = useT(contactPage);
  const whatsappDigits = contact.whatsapp.replace(/[^\d]/g, "");

  return (
    <>
      <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")} />

      <Section className="bg-surface-soft">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:gap-14">
            <ul className="grid content-start gap-4">
              <ContactCard icon="mail" title={t("cardEmail")}>
                <a href={`mailto:${contact.email}`} className="break-all font-semibold text-brand hover:text-brand-strong">
                  {contact.email}
                </a>
              </ContactCard>
              {contact.phone && (
                <ContactCard icon="phone" title={t("cardPhone")}>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="font-semibold text-brand hover:text-brand-strong"
                  >
                    {contact.phone}
                  </a>
                </ContactCard>
              )}
              {whatsappDigits && (
                <ContactCard icon="phone" title={t("cardWhatsapp")}>
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand hover:text-brand-strong"
                  >
                    {t("cardWhatsappAction")}
                  </a>
                  <span className="block">{contact.whatsapp}</span>
                </ContactCard>
              )}
              <ContactCard icon="pin" title={t("cardCity")}>
                <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                  <Icon name="maple" className="h-4 w-4 text-maple" />
                  {t("cardCityText", { city: contact.city, country: contact.country })}
                </span>
                <span className="mt-1 block">{t("cardCityNote")}</span>
              </ContactCard>
            </ul>

            <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8">
              <SectionHeading eyebrow={t("formEyebrow")} title={t("formTitle")} subtitle={t("formSubtitle")} />
              <div className="mt-8">
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
