import type { Metadata } from "next";
import { listRequests, parseRequestFilters } from "../../_server/data";
import { RequestsList } from "../../_ui/requests-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Demandes" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminRequestsPage({ searchParams }: Props) {
  const filters = parseRequestFilters(await searchParams);
  const data = await listRequests(filters).catch((err: unknown) => {
    console.error("[admin] demandes indisponibles", err);
    return null;
  });
  return <RequestsList data={data} filters={filters} />;
}
