"use client";

import { Container, PageHero } from "@/components/ui/layout";
import { useSiteEmails } from "@/components/site-provider";
import { company } from "@/lib/company";
import { defineMessages, useT } from "@/i18n/define";

const m = defineMessages({
  fr: {
    eyebrow: "WorldSoft Transfer",
    title: "Supprimer votre compte",
    subtitle: "Vous pouvez supprimer votre compte WorldSoft Transfer et vos données personnelles à tout moment.",
    inAppTitle: "Dans l'application",
    inApp1: "Ouvrez WorldSoft Transfer et connectez-vous.",
    inApp2: "Allez dans Profil › Sécurité.",
    inApp3: "Touchez « Supprimer mon compte », puis confirmez avec votre mot de passe.",
    inAppNote: "La suppression est immédiate : vous êtes déconnecté de tous vos appareils.",
    mailTitle: "Sans l'application",
    mailText: "Écrivez-nous depuis l'adresse e-mail de votre compte, avec l'objet « Suppression de compte ». Nous confirmons votre identité, puis supprimons le compte sous 30 jours au plus.",
    whatTitle: "Ce qui est supprimé, ce qui est conservé",
    deleted: "Supprimé : votre compte et votre accès, vos coordonnées, les informations d'identité de votre profil, vos sessions et vos notifications.",
    kept: "Conservé : les transferts déjà effectués (montants, expéditeur, bénéficiaire), détachés de votre compte, pendant la durée exigée par la loi sur la lutte contre le blanchiment d'argent (au moins 5 ans). Notre prestataire de vérification d'identité conserve aussi son dossier selon les mêmes obligations.",
    contact: "Une question ? Écrivez à {email}.",
  },
  en: {
    eyebrow: "WorldSoft Transfer",
    title: "Delete your account",
    subtitle: "You can delete your WorldSoft Transfer account and your personal data at any time.",
    inAppTitle: "In the app",
    inApp1: "Open WorldSoft Transfer and sign in.",
    inApp2: "Go to Profile › Security.",
    inApp3: "Tap “Delete my account”, then confirm with your password.",
    inAppNote: "Deletion is immediate: you are signed out of all your devices.",
    mailTitle: "Without the app",
    mailText: "Email us from your account's email address with the subject “Account deletion”. We confirm your identity, then delete the account within 30 days at most.",
    whatTitle: "What is deleted, what is kept",
    deleted: "Deleted: your account and access, your contact details, the identity information in your profile, your sessions and notifications.",
    kept: "Kept: transfers already made (amounts, sender, recipient), detached from your account, for the period required by anti-money laundering law (at least 5 years). Our identity verification provider also keeps its record under the same obligations.",
    contact: "Questions? Email {email}.",
  },
});

/** Page publique exigée par Google Play : comment supprimer son compte et ses données. */
export function AccountDeletionContent() {
  const t = useT(m);
  const emails = useSiteEmails();
  const email = emails.support ?? company.email ?? "support@worldsofttransfer.com";
  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl space-y-10 text-ink">
          <section>
            <h2 className="font-display text-2xl font-semibold">{t("inAppTitle")}</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-muted">
              <li>{t("inApp1")}</li>
              <li>{t("inApp2")}</li>
              <li>{t("inApp3")}</li>
            </ol>
            <p className="mt-3 text-sm text-muted">{t("inAppNote")}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold">{t("mailTitle")}</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">{t("mailText")}</p>
            <p className="mt-3">
              <a href={`mailto:${email}?subject=Suppression%20de%20compte`} className="font-semibold text-brand hover:underline">
                {email}
              </a>
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold">{t("whatTitle")}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-muted">
              <li>{t("deleted")}</li>
              <li>{t("kept")}</li>
            </ul>
          </section>
          <p className="text-sm text-muted">{t("contact", { email })}</p>
        </div>
      </Container>
    </>
  );
}
