"use client";

import type { MouseEvent, ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { appLinks, applicationHref, detectPlatform } from "@/lib/app-links";
import { appMessages } from "@/i18n/app";
import { useT } from "@/i18n/define";

type Props = {
  label?: string;
  corridor?: string;
  amount?: number;
  variant?: "primary" | "white" | "outline-light" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Contenu personnalisé (remplace libellé + flèche). */
  children?: ReactNode;
};

/**
 * Bouton « Envoyer avec l'app » : iPhone/iPad → App Store, Android → Google Play (si le lien est
 * configuré), sinon → /application (QR code + boutons des stores), en conservant la simulation.
 */
export function AppDownloadButton({
  label,
  corridor,
  amount,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: Props) {
  const t = useT(appMessages);
  const fallback = applicationHref({ corridor, amount });

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const platform = detectPlatform();
    const store = platform === "ios" ? appLinks.ios : platform === "android" ? appLinks.android : null;
    if (store) {
      e.preventDefault();
      window.location.href = store;
    }
  }

  return (
    <a href={fallback} onClick={onClick} className={buttonClass(variant, size, className)}>
      {children ?? (
        <>
          {label ?? t("sendWithApp")}
          <Icon name="arrowRight" className="h-4 w-4" />
        </>
      )}
    </a>
  );
}
