"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Container, PageHero } from "@/components/ui/layout";
import { CompanyValue } from "@/components/info/shared";
import { appFullName } from "@/lib/brand";
import { company } from "@/lib/company";
import { type MessageBundle, useT } from "@/i18n/define";
import { legalCommon, privacyDoc, termsDoc } from "@/i18n/legal";
import { common } from "@/i18n/common";
import { Notice, range } from "./sections";

/** Rend un corps de section : paragraphes séparés par une ligne vide, puces « - ». */
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const nodes: ReactNode[] = [];
        let bullets: string[] = [];
        const flush = (key: string) => {
          if (bullets.length) {
            nodes.push(
              <ul key={key} className="mt-3 grid gap-2">
                {bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>,
            );
            bullets = [];
          }
        };
        lines.forEach((line, li) => {
          if (line.startsWith("- ")) {
            bullets.push(line.slice(2));
          } else {
            flush(`u${li}`);
            nodes.push(<p key={`p${li}`}>{line}</p>);
          }
        });
        flush("end");
        return (
          <div key={bi} className="mt-4 first:mt-0">
            {nodes}
          </div>
        );
      })}
    </>
  );
}

function LegalDocument<K extends string>({
  bundle,
  sections,
  other,
}: {
  bundle: MessageBundle<K>;
  sections: number;
  other: { href: string; label: string };
}) {
  const t = useT(bundle);
  const l = useT(legalCommon);
  const vars = {
    email: company.email ?? l("emailFallback"),
    company: company.legalName ?? appFullName,
    cityPart: company.city ? ` (${company.city})` : "",
  };
  const k = (key: string) => t(key as K, vars);
  const items = range(sections).map((i) => ({ id: `section-${i}`, n: i, title: k(`s${i}t`), body: k(`s${i}b`) }));

  const toc = (
    <ol className="grid gap-1 text-sm">
      {items.map((s) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="flex gap-3 rounded-xl px-3 py-2.5 text-muted transition hover:bg-surface-soft hover:text-brand-strong"
          >
            <span className="w-5 shrink-0 font-display font-bold text-brand">{s.n}.</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <PageHero eyebrow={k("eyebrow")} title={k("title")} subtitle={k("intro")}>
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/85">
          <Icon name="clock" className="h-4 w-4 text-sky" />
          {l("updated", { date: l("date") })}
        </p>
      </PageHero>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-14">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <details className="group rounded-3xl border border-line bg-white p-2 shadow-card lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 font-display text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
                {l("toc")}
                <Icon name="chevronDown" className="h-4 w-4 text-brand transition group-open:rotate-180" />
              </summary>
              <nav aria-label={l("toc")} className="mt-1">
                {toc}
              </nav>
            </details>
            <nav aria-label={l("toc")} className="hidden rounded-3xl border border-line bg-white p-3 shadow-card lg:block">
              <p className="px-3 pb-2 pt-1 font-display text-xs font-bold uppercase tracking-[0.16em] text-ink">
                {l("toc")}
              </p>
              {toc}
            </nav>
          </aside>

          <article className="min-w-0">
            <Notice title={l("reviewTitle")} icon="info" tone="warn">
              {l("reviewText")}
            </Notice>

            <div className="mt-10 grid gap-10">
              {items.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24" aria-labelledby={`${s.id}-title`}>
                    <h2 id={`${s.id}-title`} className="flex items-baseline gap-3 font-display text-xl font-extrabold text-ink sm:text-2xl">
                      <span className="text-brand">{s.n}.</span>
                      {s.title}
                    </h2>
                    <div className="mt-4 max-w-prose text-base leading-relaxed text-muted">
                      <Body text={s.body} />
                    </div>
                </section>
              ))}
            </div>

            <div className="mt-14 flex flex-col gap-4 rounded-3xl border border-line bg-surface-soft p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display font-bold text-ink">{l("questions")}</p>
                <CompanyValue
                  value={company.email}
                  href={company.email ? `mailto:${company.email}` : null}
                  className="mt-1 inline-block break-all text-sm font-semibold text-brand hover:text-brand-strong"
                />
                {!company.email && (
                  <Link href="/contact" className="mt-1 inline-flex min-h-10 items-center text-sm font-semibold text-brand hover:text-brand-strong">
                    {l("contactUs")}
                  </Link>
                )}
                {company.registration && (
                  <p className="mt-2 text-xs text-muted">{l("registration", { n: company.registration })}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                <Link href={other.href} className="inline-flex min-h-10 items-center gap-1.5 text-brand hover:text-brand-strong">
                  <span className="font-normal text-muted">{l("seeAlso")}</span>
                  {other.label}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="min-h-10 text-muted hover:text-ink"
                >
                  {l("backToTop")}
                </button>
              </div>
            </div>
          </article>
        </div>
      </Container>
    </>
  );
}

export function PrivacyContent() {
  const c = useT(common);
  return <LegalDocument bundle={privacyDoc} sections={13} other={{ href: "/conditions", label: c("terms") }} />;
}

export function TermsContent() {
  const c = useT(common);
  return <LegalDocument bundle={termsDoc} sections={13} other={{ href: "/confidentialite", label: c("privacy") }} />;
}
