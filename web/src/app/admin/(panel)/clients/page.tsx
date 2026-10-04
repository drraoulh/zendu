import type { Metadata } from "next";
import { listCustomers, parseCustomerFilters } from "../../_server/customers";
import { CustomersList } from "../../_ui/customers-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Clients" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminCustomersPage({ searchParams }: Props) {
  const filters = parseCustomerFilters(await searchParams);
  const data = await listCustomers(filters).catch((err: unknown) => {
    console.error("[admin] clients indisponibles", err);
    return null;
  });
  return <CustomersList data={data} filters={filters} />;
}
