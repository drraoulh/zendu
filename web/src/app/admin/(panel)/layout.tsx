import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdminPage } from "../_server/session";
import { actionCounts } from "../_server/insights";
import { AdminShell } from "../_ui/admin-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const { mode, identity } = await requireAdminPage();
  const counts = await actionCounts().catch((err: unknown) => {
    console.error("[admin] compteurs indisponibles", err);
    return null;
  });
  return (
    <AdminShell devOpen={mode === "dev-open"} counts={counts} userName={identity?.displayName ?? null}>
      {children}
    </AdminShell>
  );
}
