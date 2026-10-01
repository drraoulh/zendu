"use client";

import { useState } from "react";
import { appName } from "@/lib/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { referMessages } from "@/i18n/refer";

const CODE = "PWFINTECH-FRIEND";

export function ReferContent() {
  const t = useT(referMessages);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function share() {
    const text = t("shareText", { app: appName, code: CODE });
    if (navigator.share) {
      try {
        await navigator.share({ title: appName, text, url: `${window.location.origin}/signup` });
        return;
      } catch {
        /* annulé */
      }
    }
    await copy();
  }

  const steps: { icon: IconName; title: string; body: string }[] = [
    { icon: "gift", title: t("step1"), body: t("step1Body") },
    { icon: "user", title: t("step2"), body: t("step2Body") },
    { icon: "transfer", title: t("step3"), body: t("step3Body") },
  ];

  return (
    <div className="bg-bg pb-20">
      <section className="bg-navy-gradient relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative pb-28 pt-14 text-center sm:pb-32 sm:pt-20">
          <div className="flex justify-center">
            <Eyebrow light>{t("eyebrow")}</Eyebrow>
          </div>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/75">{t("subtitle")}</p>
        </Container>
      </section>

      <Container className="relative -mt-20">
        <div className="animate-rise mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 text-center shadow-float sm:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white">
            <Icon name="gift" className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm font-semibold text-muted">{t("yourCode")}</p>
          <p className="mt-2 break-all rounded-2xl border-2 border-dashed border-brand/30 bg-brand-soft/60 px-4 py-4 font-display text-2xl font-black tracking-[0.12em] text-navy sm:text-3xl">
            {CODE}
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button size="lg" onClick={() => void copy()} aria-live="polite">
              <Icon name={copied ? "check" : "receipt"} className="h-4 w-4" />
              {copied ? t("copied") : t("copy")}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => void share()}>
              <Icon name="transfer" className="h-4 w-4" />
              {t("share")}
            </Button>
          </div>
        </div>

        <section className="mx-auto mt-14 max-w-4xl">
          <h2 className="text-center font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {t("howTitle")}
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-3xl border border-line bg-white p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <span className="font-display text-3xl font-black text-silver">{i + 1}</span>
                </div>
                <h3 className="mt-4 font-display text-base font-extrabold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-6 flex max-w-2xl items-start gap-2 rounded-2xl bg-surface-soft px-4 py-3 text-sm text-muted">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            {t("note")}
          </p>
        </section>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/send" size="lg">
            {t("sendCta")}
            <Icon name="arrowRight" className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/contact" size="lg" variant="secondary">
            {t("contact")}
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
