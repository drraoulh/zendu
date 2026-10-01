"use client";

import { Icon } from "@/components/ui/icon";
import { common } from "@/i18n/common";
import { useT } from "@/i18n/define";

export function DemoBanner() {
  const t = useT(common);
  return (
    <div className="border-b border-warn/20 bg-[#fff7e6] px-4 py-2 text-center text-xs font-medium text-[#7a5308] sm:text-sm">
      <span className="inline-flex items-center gap-2">
        <Icon name="info" className="h-4 w-4" />
        {t("demoBanner")}
      </span>
    </div>
  );
}
