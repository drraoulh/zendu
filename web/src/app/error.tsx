"use client";

import { useEffect } from "react";
import { SystemScreen } from "@/components/system/system-screen";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { systemMessages } from "@/i18n/system";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT(systemMessages);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <SystemScreen
      code={t("errorCode")}
      title={t("errorTitle")}
      text={t("errorText")}
      actions={
        <>
          <Button size="lg" onClick={() => reset()}>
            <Icon name="sparkle" className="h-4 w-4" />
            {t("retry")}
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            {t("home")}
          </ButtonLink>
        </>
      }
      footnote={
        error.digest ? (
          <>
            {t("errorRef")} : <code className="rounded bg-surface-soft px-1.5 py-0.5">{error.digest}</code>
          </>
        ) : null
      }
    />
  );
}
