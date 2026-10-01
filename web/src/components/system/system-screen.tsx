"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LogoEmblem } from "@/components/brand/logo";
import { Icon, type IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { systemMessages } from "@/i18n/system";

type Key = keyof typeof systemMessages.fr;

const LINKS: { href: string; icon: IconName; title: Key; desc: Key }[] = [
  { href: "/", icon: "globe", title: "home", desc: "homeDesc" },
  { href: "/send", icon: "transfer", title: "send", desc: "sendDesc" },
  { href: "/contact", icon: "mail", title: "contact", desc: "contactDesc" },
];

/** Gabarit commun aux pages 404 et erreur. */
export function SystemScreen({
  code,
  title,
  text,
  actions,
  footnote,
}: {
  code: ReactNode;
  title: ReactNode;
  text: ReactNode;
  actions?: ReactNode;
  footnote?: ReactNode;
}) {
  const t = useT(systemMessages);
  return (
    <section className="relative overflow-hidden bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
      />
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
        <span className="animate-rise relative inline-flex rounded-3xl bg-white p-3 shadow-card ring-1 ring-line">
          <LogoEmblem className="h-14 w-auto sm:h-16" priority />
        </span>
        <p className="animate-rise mt-8 font-display text-xs font-bold uppercase tracking-[0.18em] text-brand">
          {code}
        </p>
        <h1 className="animate-rise-1 mt-3 max-w-xl font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="animate-rise-1 mt-4 max-w-lg text-base leading-relaxed text-muted">{text}</p>
        {actions && <div className="animate-rise-2 mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}

        <ul className="animate-rise-2 mt-10 grid w-full gap-3 text-left sm:grid-cols-3">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="group flex h-full items-center gap-3 rounded-3xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                  <Icon name={l.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold text-ink">{t(l.title)}</span>
                  <span className="block text-xs text-muted">{t(l.desc)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {footnote && <div className="mt-8 text-xs text-muted">{footnote}</div>}
      </div>
    </section>
  );
}

export function NotFoundContent() {
  const t = useT(systemMessages);
  return <SystemScreen code={t("notFoundCode")} title={t("notFoundTitle")} text={t("notFoundText")} />;
}
