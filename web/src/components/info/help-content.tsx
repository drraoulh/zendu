"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge, Container, PageHero, Section } from "@/components/ui/layout";
import { company, showPlaceholders } from "@/lib/company";
import { useT } from "@/i18n/define";
import { helpPage, infoCommon } from "@/i18n/info";
import type { Locale } from "@/lib/i18n";
import type { HelpNumbers } from "./destinations";
import {
  CATEGORY_SUBJECT,
  HELP_ARTICLES,
  HELP_CATEGORIES,
  HELP_LINKS,
  type HelpArticle,
  type HelpCategory,
  getHelpArticle,
} from "./help-articles";
import { RichText, SearchField, normalize, useInfoLabels } from "./shared";

const CAT_ICON: Record<HelpCategory, IconName> = {
  transfer: "transfer",
  payments: "card",
  account: "lock",
  shipping: "ship",
  finances: "finance",
  tech: "code",
  company: "info",
};

const CAT_KEY = {
  transfer: "catTransfer",
  payments: "catPayments",
  account: "catAccount",
  shipping: "catShipping",
  finances: "catFinances",
  tech: "catTech",
  company: "catCompany",
} as const satisfies Record<HelpCategory, keyof typeof helpPage.fr>;

/** Question / réponse de l'article dans la langue courante (repli : anglais). */
function articleText(article: HelpArticle, locale: Locale) {
  const loc = article[locale] as Partial<{ q: string; a: string }> | undefined;
  return { q: loc?.q ?? article.en.q, a: loc?.a ?? article.en.a };
}

/** Variables des articles, calculées depuis les vraies sources (frais, corridors, fiche entreprise). */
function useHelpVars(numbers: HelpNumbers) {
  const t = useT(helpPage);
  const tc = useT(infoCommon);
  const L = useInfoLabels();
  return useMemo(() => {
    const placeholder = tc("toComplete").toLowerCase();
    return {
      min: L.money(numbers.min, numbers.sendCurrency),
      max: L.money(numbers.max, numbers.sendCurrency),
      flat: numbers.flat != null ? L.money(numbers.flat, numbers.sendCurrency) : "—",
      percent: numbers.percent != null ? L.number(numbers.percent) : "—",
      margin: numbers.margin != null ? L.number(numbers.margin) : "—",
      ttl: numbers.ttl,
      countries: numbers.countries,
      hours: company.hours ?? (showPlaceholders ? placeholder : t("hoursHidden")),
      registration: company.registration ?? (showPlaceholders ? placeholder : t("registrationHidden")),
    };
  }, [numbers, L, t, tc]);
}

function fill(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

function excerpt(text: string, max = 140) {
  const plain = text.replace(/\n+/g, " ").replace(/(^|\s)- /g, " ").replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain;
}

/* -------------------------------------------------------------------------- */
/* /aide                                                                       */
/* -------------------------------------------------------------------------- */

export function HelpCenter({ numbers }: { numbers: HelpNumbers }) {
  const t = useT(helpPage);
  const { locale } = useInfoLabels();
  const vars = useHelpVars(numbers);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<HelpCategory | "all">("all");

  const entries = useMemo(
    () =>
      HELP_ARTICLES.map((a) => {
        const txt = articleText(a, locale);
        const q2 = fill(txt.q, vars);
        const a2 = fill(txt.a, vars);
        return {
          article: a,
          q: q2,
          a: a2,
          hay: normalize(`${q2} ${a2} ${a.fr.q} ${a.en.q} ${t(CAT_KEY[a.category])}`),
        };
      }),
    [locale, vars, t],
  );

  const needle = normalize(q);
  const terms = needle.split(/\s+/).filter(Boolean);
  const results = entries.filter(
    (e) => (cat === "all" || e.article.category === cat) && terms.every((term) => e.hay.includes(term)),
  );
  const counts = HELP_CATEGORIES.reduce(
    (acc, c) => ({ ...acc, [c]: HELP_ARTICLES.filter((a) => a.category === c).length }),
    {} as Record<HelpCategory, number>,
  );

  const grouped = HELP_CATEGORIES.map((c) => ({ c, items: results.filter((r) => r.article.category === c) })).filter(
    (g) => g.items.length > 0,
  );

  const chip = (value: HelpCategory | "all", label: string, count: number, icon?: IconName) => {
    const active = cat === value;
    return (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        onClick={() => setCat(value)}
        className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${
          active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand/40"
        }`}
      >
        {icon && <Icon name={icon} className="h-4 w-4" />}
        {label}
        <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-surface-soft text-muted"}`}>{count}</span>
      </button>
    );
  };

  return (
    <>
      <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")}>
        <SearchField id="help-search" label={t("searchLabel")} placeholder={t("searchPh")} value={q} onChange={setQ} large className="max-w-2xl" />
      </PageHero>

      <Section className="pt-10 sm:pt-12">
        <Container>
          <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0" role="group" aria-label={t("searchLabel")}>
            <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              {chip("all", t("all"), HELP_ARTICLES.length)}
              {HELP_CATEGORIES.map((c) => chip(c, t(CAT_KEY[c]), counts[c], CAT_ICON[c]))}
            </div>
          </div>

          <p className="mt-6 text-sm text-muted" aria-live="polite">
            {needle ? t("resultsFor", { n: results.length, q }) : t("articlesCount", { n: results.length })}
          </p>

          {results.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-line bg-surface-soft p-8 text-center">
              <p className="font-display text-lg font-bold text-ink">{t("noResultsTitle")}</p>
              <p className="mt-2 text-sm text-muted">{t("noResultsText")}</p>
              <ButtonLink href="/contact" className="mt-5">
                {t("contactCta")}
              </ButtonLink>
            </div>
          ) : (
            <div className="mt-6 grid gap-10">
              {grouped.map((g) => (
                <section key={g.c} aria-labelledby={`help-cat-${g.c}`}>
                  <h2 id={`help-cat-${g.c}`} className="flex items-center gap-3 font-display text-xl font-extrabold text-ink">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                      <Icon name={CAT_ICON[g.c]} className="h-5 w-5" />
                    </span>
                    {t(CAT_KEY[g.c])}
                  </h2>
                  <ul className="mt-4 grid gap-3 md:grid-cols-2">
                    {g.items.map((r) => (
                      <li key={r.article.slug}>
                        <Link
                          href={`/aide/${r.article.slug}`}
                          className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                        >
                          <span className="font-display text-base font-bold text-ink group-hover:text-brand-strong">{r.q}</span>
                          <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">{excerpt(r.a)}</span>
                          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                            {t("read")}
                            <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <ContactBox title={t("contactTitle")} text={t("contactText")} href="/contact" />
        </Container>
      </Section>
    </>
  );
}

function ContactBox({ title, text, href }: { title: string; text: string; href: string }) {
  const t = useT(helpPage);
  return (
    <div className="bg-navy-gradient relative mt-14 overflow-hidden rounded-3xl p-6 text-white shadow-float sm:p-8">
      <div aria-hidden className="bg-grid absolute inset-0 opacity-30" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-xl font-extrabold">{title}</p>
          <p className="mt-1 text-sm text-white/75">{text}</p>
        </div>
        <ButtonLink href={href} variant="white" className="shrink-0">
          <Icon name="mail" className="h-4 w-4" />
          {t("contactCta")}
        </ButtonLink>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* /aide/[slug]                                                                */
/* -------------------------------------------------------------------------- */

const FEEDBACK_KEY = "pw-help-feedback:";

function Feedback({ slug }: { slug: string }) {
  const t = useT(helpPage);
  const [vote, setVote] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(FEEDBACK_KEY + slug);
      setVote(v === "yes" || v === "no" ? v : null);
    } catch {
      /* stockage indisponible */
    }
  }, [slug]);

  function answer(v: "yes" | "no") {
    setVote(v);
    try {
      window.localStorage.setItem(FEEDBACK_KEY + slug, v);
    } catch {
      /* stockage indisponible */
    }
  }

  return (
    <div className="mt-10 rounded-3xl border border-line bg-surface-soft p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p id={`fb-${slug}`} className="font-display font-bold text-ink">
          {t("helpfulQ")}
        </p>
        <div className="flex gap-2" role="group" aria-labelledby={`fb-${slug}`}>
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={vote === v}
              onClick={() => answer(v)}
              className={`min-h-10 rounded-full border px-5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${
                vote === v ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand/40"
              }`}
            >
              {t(v)}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {vote === "yes" ? t("thanksYes") : vote === "no" ? t("thanksNo") : t("feedbackNote")}
      </p>
    </div>
  );
}

export function HelpArticleView({ slug, numbers }: { slug: string; numbers: HelpNumbers }) {
  const t = useT(helpPage);
  const { locale } = useInfoLabels();
  const vars = useHelpVars(numbers);
  const article = getHelpArticle(slug);
  if (!article) return null;

  const txt = articleText(article, locale);
  const related = [
    ...HELP_ARTICLES.filter((a) => a.category === article.category && a.slug !== article.slug),
    ...HELP_ARTICLES.filter((a) => a.category !== article.category && a.links.some((l) => article.links.includes(l))),
  ]
    .filter((a, i, arr) => arr.findIndex((b) => b.slug === a.slug) === i)
    .slice(0, 4);
  const contactHref = `/contact?sujet=${CATEGORY_SUBJECT[article.category]}`;

  return (
    <>
      <section className="bg-navy-gradient relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-white/65">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/aide" className="hover:text-white">
                  {t("back")}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>{t(CAT_KEY[article.category])}</li>
            </ol>
          </nav>
          <h1 className="mt-6 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {fill(txt.q, vars)}
          </h1>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
          <article className="min-w-0">
            <Badge>
              <Icon name={CAT_ICON[article.category]} className="h-3.5 w-3.5" />
              {t(CAT_KEY[article.category])}
            </Badge>
            <RichText text={fill(txt.a, vars)} className="mt-6 max-w-prose text-base leading-relaxed text-muted" />

            {article.links.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {article.links.map((l, i) => (
                  <ButtonLink key={l} href={HELP_LINKS[l]} variant={i === 0 ? "primary" : "secondary"} size="sm">
                    {t(l)}
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </ButtonLink>
                ))}
              </div>
            )}

            <Feedback slug={article.slug} />
          </article>

          <aside className="grid content-start gap-6 lg:sticky lg:top-24">
            {related.length > 0 && (
              <nav aria-labelledby="related-title" className="rounded-3xl border border-line bg-white p-5 shadow-card">
                <p id="related-title" className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink">
                  {t("related")}
                </p>
                <ul className="mt-3 grid gap-1">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/aide/${r.slug}`}
                        className="flex gap-2 rounded-xl px-2 py-2.5 text-sm text-muted transition hover:bg-surface-soft hover:text-brand-strong"
                      >
                        <Icon name="arrowRight" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        {fill(articleText(r, locale).q, vars)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <div className="rounded-3xl border border-line bg-surface-soft p-5">
              <p className="font-display font-bold text-ink">{t("stillNeed")}</p>
              <p className="mt-1 text-sm text-muted">{t("stillNeedText")}</p>
              <ButtonLink href={contactHref} size="sm" className="mt-4">
                <Icon name="mail" className="h-4 w-4" />
                {t("linkContact")}
              </ButtonLink>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
