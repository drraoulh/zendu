"use client";

import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { shippingPage } from "@/i18n/services";

/**
 * Ancien formulaire de devis (mailto) remplacé par le parcours en ligne `/shipping/devis`,
 * qui enregistre la demande et renvoie une référence. Ce composant reste pour compatibilité
 * et redirige vers le nouveau parcours.
 */
export function ShippingQuoteForm() {
  const t = useT(shippingPage);
  return (
    <div className="grid gap-4 text-center sm:text-left">
      <p className="text-sm leading-relaxed text-muted">{t("quoteSubtitle")}</p>
      <ButtonLink href="/shipping/devis" size="lg" className="w-full sm:w-auto">
        {t("quoteCta")}
        <Icon name="arrowRight" className="h-4 w-4" />
      </ButtonLink>
    </div>
  );
}
