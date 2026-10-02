import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdminPage } from "../_server/session";
import { AdminShell } from "../_ui/admin-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const mode = await requireAdminPage();
  return <AdminShell devOpen={mode === "dev-open"}>{children}</AdminShell>;
}
