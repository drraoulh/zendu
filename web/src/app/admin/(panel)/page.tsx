import type { Metadata } from "next";
import { overviewCounts } from "../_server/data";
import { AdminOverview } from "../_ui/admin-overview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Vue d'ensemble" };

export default async function AdminOverviewPage() {
  const data = await overviewCounts().catch((err: unknown) => {
    console.error("[admin] vue d'ensemble indisponible", err);
    return null;
  });
  return <AdminOverview data={data} />;
}
