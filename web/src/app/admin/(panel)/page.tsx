import type { Metadata } from "next";
import { overviewCounts } from "../_server/data";
import { actionCounts, parsePeriod, transferInsights } from "../_server/insights";
import { AdminOverview } from "../_ui/admin-overview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Vue d'ensemble" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminOverviewPage({ searchParams }: Props) {
  const period = parsePeriod((await searchParams).period);
  const [data, insights, counts] = await Promise.all([
    overviewCounts().catch((err: unknown) => {
      console.error("[admin] vue d'ensemble indisponible", err);
      return null;
    }),
    transferInsights(period).catch((err: unknown) => {
      console.error("[admin] statistiques de transferts indisponibles", err);
      return null;
    }),
    actionCounts().catch(() => null),
  ]);
  return <AdminOverview data={data} insights={insights} counts={counts} period={period} />;
}
