import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, PageHero, Section, SectionHeading } from "@/components/ui/layout";

/* -------------------------------------------------------------------------- */
/* Types partagés                                                              */
/* -------------------------------------------------------------------------- */

export type CtaLink = { href: string; label: string };
export type Feature = { icon: IconName; title: string; text: string };
export type StepItem = { title: string; text: string };
export type FaqItem = { q: string; a: string };

/** Construit une liste [1..n] — pratique pour itérer sur des clés numérotées. */
export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

/* -------------------------------------------------------------------------- */
/* Hero de page service                                                        */
/* -------------------------------------------------------------------------- */

export function ServiceHero({
  eyebrow,
  title,
  subtitle,
  primary,
  secondary,
  icon,
  highlights,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  primary?: CtaLink;
  secondary?: CtaLink;
  icon?: IconName;
  highlights?: string[];
}) {
  return (
    <div className="relative">
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle}>
        <div className="flex flex-col gap-6">
          {(primary || secondary) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {primary && (
                <ButtonLink href={primary.href} variant="white" size="lg">
                  {primary.label}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </ButtonLink>
              )}
              {secondary && (
                <ButtonLink href={secondary.href} variant="outline-light" size="lg">
                  {secondary.label}
                </ButtonLink>
              )}
            </div>
          )}
          {highlights && highlights.length > 0 && (
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              {highlights.map((h) => (
                <li key={h} className="inline-flex items-center gap-2">
                  <Icon name="check" className="h-4 w-4 text-sky" strokeWidth={2.4} />
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageHero>
      {icon && (
        <div
          aria-hidden
          className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 lg:block xl:right-[max(1.5rem,calc((100vw-72rem)/2))]"
        >
          <div className="relative grid h-56 w-56 place-items-center">
            <div className="animate-orbit absolute inset-0 rounded-full border border-dashed border-white/20" />
            <div className="absolute inset-6 rounded-full border border-white/10 bg-white/5 backdrop-blur" />
            <div className="bg-brand-gradient relative grid h-24 w-24 place-items-center rounded-3xl shadow-float ring-1 ring-white/30">
              <Icon name={icon} className="h-11 w-11 text-white" strokeWidth={1.6} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Grille de cartes avec icônes                                                */
/* -------------------------------------------------------------------------- */

export function FeatureGrid({
  id,
  eyebrow,
  title,
  subtitle,
  items,
  columns = 3,
  tone = "light",
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: Feature[];
  columns?: 2 | 3 | 4;
  tone?: "light" | "soft" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  const cols =
    columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  const bg = dark ? "bg-navy-gradient text-white" : tone === "soft" ? "bg-surface-soft" : "";
  return (
    <Section id={id} className={`scroll-mt-20 ${bg} ${className}`}>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} light={dark} />
        <ul className={`mt-10 grid gap-5 ${cols}`}>
          {items.map((item) => (
            <li
              key={item.title}
              className={
                dark
                  ? "rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                  : "group rounded-3xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-brand/30"
              }
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl ${
                  dark ? "bg-white/10 text-sky" : "bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white"
                }`}
              >
                <Icon name={item.icon} className="h-6 w-6" />
              </span>
              <h3 className={`mt-5 font-display text-lg font-bold ${dark ? "text-white" : "text-ink"}`}>{item.title}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-white/70" : "text-muted"}`}>{item.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Étapes numérotées                                                           */
/* -------------------------------------------------------------------------- */

export function Steps({
  id,
  eyebrow,
  title,
  subtitle,
  steps,
  tone = "soft",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  steps: StepItem[];
  tone?: "light" | "soft";
}) {
  const cols = steps.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <Section id={id} className={`scroll-mt-20 ${tone === "soft" ? "bg-surface-soft" : ""}`}>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <ol className={`relative mt-10 grid gap-5 sm:grid-cols-2 ${cols}`}>
          {steps.map((step, i) => (
            <li key={step.title} className="relative rounded-3xl border border-line bg-white p-6 shadow-card">
              <span className="bg-brand-gradient inline-grid h-11 w-11 place-items-center rounded-2xl font-display text-base font-black text-white shadow-[0_8px_20px_-8px_rgba(11,77,255,0.7)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Bloc « Pour qui » : texte + liste à puces                                   */
/* -------------------------------------------------------------------------- */

export function Audience({
  eyebrow,
  title,
  subtitle,
  items,
  aside,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: string[];
  aside?: ReactNode;
}) {
  return (
    <Section>
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
            {aside && <div className="mt-8">{aside}</div>}
          </div>
          <ul className="grid gap-3">
            {items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5"
              >
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white">
                  <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
                </span>
                <span className="text-sm leading-relaxed text-ink sm:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Encadré d'information / avertissement doux                                  */
/* -------------------------------------------------------------------------- */

export function Notice({
  title,
  children,
  icon = "info",
  tone = "brand",
}: {
  title?: string;
  children: ReactNode;
  icon?: IconName;
  tone?: "brand" | "warn";
}) {
  const styles =
    tone === "warn" ? "border-warn/30 bg-warn/5 text-ink [&_.notice-icon]:text-warn" : "border-brand/20 bg-brand-soft/60 text-ink [&_.notice-icon]:text-brand";
  return (
    <div className={`flex gap-4 rounded-3xl border p-5 sm:p-6 ${styles}`}>
      <Icon name={icon} className="notice-icon mt-0.5 h-6 w-6 shrink-0" />
      <div className="text-sm leading-relaxed">
        {title && <p className="font-display font-bold text-ink">{title}</p>}
        <div className={title ? "mt-1 text-muted" : "text-muted"}>{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                         */
/* -------------------------------------------------------------------------- */

export function Faq({
  id,
  eyebrow,
  title,
  subtitle,
  items,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: FaqItem[];
}) {
  return (
    <Section id={id} className="scroll-mt-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
          <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            {items.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-display text-base font-bold text-ink transition hover:text-brand-strong sm:px-6 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-soft text-brand transition group-open:rotate-180 group-open:bg-brand group-open:text-white">
                    <Icon name="chevronDown" className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                </summary>
                <p className="px-5 pb-6 text-sm leading-relaxed text-muted sm:px-6">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Bandeau d'appel à l'action final                                            */
/* -------------------------------------------------------------------------- */

export function CtaBand({
  title,
  text,
  primary,
  secondary,
}: {
  title: string;
  text?: string;
  primary: CtaLink;
  secondary?: CtaLink;
}) {
  return (
    <Section className="pt-4 sm:pt-6">
      <Container>
        <div className="bg-brand-gradient relative overflow-hidden rounded-[2rem] px-6 py-12 text-white shadow-float sm:px-12 sm:py-16">
          <div className="bg-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(circle_at_80%_20%,black,transparent_70%)]" />
          <div
            aria-hidden
            className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky/30 blur-3xl"
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
              {text && <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">{text}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <ButtonLink href={primary.href} variant="white" size="lg">
                {primary.label}
                <Icon name="arrowRight" className="h-4 w-4" />
              </ButtonLink>
              {secondary && (
                <ButtonLink href={secondary.href} variant="outline-light" size="lg">
                  {secondary.label}
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Lien texte avec flèche                                                      */
/* -------------------------------------------------------------------------- */

export function ArrowLink({ href, children, light = false }: { href: string; children: ReactNode; light?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold transition ${
        light ? "text-sky hover:text-white" : "text-brand hover:text-brand-strong"
      }`}
    >
      {children}
      <Icon name="arrowRight" className="h-4 w-4" />
    </Link>
  );
}
