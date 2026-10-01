"use client";

import { useState } from "react";
import Link from "next/link";
import { SandboxBanner } from "@/components/sandbox-banner";
import { AppStoreBadges } from "@/components/app-store-badges";
import { useI18n } from "@/components/i18n-provider";

import { appName } from "@/lib/brand";
const CODE = "PWFINTECH-FRIEND";

export default function ReferPage() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="bg-bg">
      <SandboxBanner />
      <div className="mx-auto max-w-2xl px-5 py-12 lg:py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            {t("referFriends")}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
            {t("referTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-ink-muted">{t("referSub")}</p>
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-line bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm text-ink-muted">{appName}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-[0.2em]">
            {CODE}
          </p>
          <button
            type="button"
            onClick={() => void copy()}
            className="mt-6 w-full rounded-full bg-accent py-3.5 font-semibold text-white hover:bg-accent-strong"
          >
            {copied ? t("codeCopied") : t("copyCode")}
          </button>
        </div>

        <div className="mt-10 rounded-[1.75rem] bg-[#0c1f18] px-6 py-8 text-white">
          <h2 className="font-display text-2xl font-bold">{t("getTheApp")}</h2>
          <p className="mt-2 text-sm text-white/70">{t("getTheAppSub")}</p>
          <div className="mt-5">
            <AppStoreBadges variant="dark" />
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/send"
            className="inline-flex rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-accent"
          >
            {t("sendMoney")}
          </Link>
        </div>
      </div>
    </div>
  );
}
