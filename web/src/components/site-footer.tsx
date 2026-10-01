"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { AppStoreBadges } from "@/components/app-store-badges";
import { LanguageFlagButtons } from "@/components/language-switcher";
import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";
import { getDestinationCountries } from "@/lib/corridors";

import { appFullName, appName } from "@/lib/brand";

export function SiteFooter() {
  const { t } = useI18n();
  const destinations = getDestinationCountries().slice(0, 8);

  return (
    <footer className="bg-night text-white">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <span className="font-display text-xl font-bold">{appName}</span>
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-white/50">
              {appFullName}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
              {t("heroSubtitle")}
            </p>
            <div className="mt-5">
              <AppStoreBadges variant="dark" />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide text-white">
              {t("sendMoney")}
            </p>
            <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/65">
              <Link href="/send" className="hover:text-white">
                {t("heroCta")}
              </Link>
              <Link href="/history" className="hover:text-white">
                {t("transferHistory")}
              </Link>
              <Link href="/refer" className="hover:text-white">
                {t("referFriends")}
              </Link>
              <Link href="/#countries" className="hover:text-white">
                {t("whereSend")}
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {destinations.slice(0, 5).map((d) => (
                <Link
                  key={d.code}
                  href={`/send?corridor=CA-${d.code}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                >
                  <CountryFlag code={d.code} size={14} title={d.name} />
                  {d.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide text-white">
              {t("company")}
            </p>
            <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/65">
              <Link href="/#how" className="hover:text-white">
                {t("howItWorks")}
              </Link>
              <Link href="/#faq" className="hover:text-white">
                {t("help")}
              </Link>
              <Link href="/login" className="hover:text-white">
                {t("logIn")}
              </Link>
              <Link href="/signup" className="hover:text-white">
                {t("signUp")}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide text-white">
              {t("language")}
            </p>
            <div className="mt-4">
              <LanguageFlagButtons variant="dark" />
            </div>
            <p className="mt-6 text-sm font-semibold text-white">{t("legal")}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-white/65">
              <span>{t("privacy")}</span>
              <span>{t("terms")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {appName} — {appFullName}. {t("licensedNote")}
          </p>
          <p>{t("trustSecure")}</p>
        </div>
      </div>
    </footer>
  );
}
