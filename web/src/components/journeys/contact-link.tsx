"use client";

import Link from "next/link";
import { useSiteEmails } from "@/components/site-provider";
import { useT } from "@/i18n/define";
import { wizardMessages } from "@/i18n/journeys";

/** Lien de contact : courriel de l'entreprise s'il est configuré, sinon la page /contact. */
export function ContactLink({ className = "", subject }: { className?: string; subject?: string }) {
  const t = useT(wizardMessages);
  const cls = `break-all font-semibold text-brand hover:text-brand-strong ${className}`;
  const { contact: email } = useSiteEmails();
  if (email) {
    return (
      <a href={`mailto:${email}`} className={cls}>
        {email}
      </a>
    );
  }
  return (
    <Link href={subject ? `/contact?sujet=${subject}` : "/contact"} className={cls}>
      {t("contactPage")}
    </Link>
  );
}
