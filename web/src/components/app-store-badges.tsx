"use client";

import { useI18n } from "@/components/i18n-provider";

const appStoreUrl =
  process.env.NEXT_PUBLIC_APP_STORE_URL ||
  "https://apps.apple.com/app/zendu";
const playStoreUrl =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ||
  "https://play.google.com/store/apps/details?id=com.zendu.app";

export function AppStoreBadges({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { t, locale } = useI18n();
  const onDark = variant === "dark";

  const appleSrc = onDark
    ? "/badges/app-store-white.svg"
    : locale === "fr"
      ? "/badges/app-store-fr.svg"
      : "/badges/app-store.svg";

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <a
        href={appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t("downloadOn")} App Store`}
        className="inline-block transition hover:scale-[1.02] hover:opacity-90"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={appleSrc}
          alt="Download on the App Store"
          className="h-10 w-auto sm:h-11"
          height={44}
        />
      </a>
      <a
        href={playStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t("getItOn")} Google Play`}
        className="inline-block transition hover:scale-[1.02] hover:opacity-90"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/badges/google-play.png"
          alt="Get it on Google Play"
          className="-my-2 h-[58px] w-auto sm:h-[62px]"
          height={62}
        />
      </a>
    </div>
  );
}
