import type { Metadata } from "next";
import { listShipments, parseShipmentFilters } from "../../_server/data";
import { ShipmentsList } from "../../_ui/shipments-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Colis" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminShipmentsPage({ searchParams }: Props) {
  const filters = parseShipmentFilters(await searchParams);
  const rows = await listShipments(filters).catch((err: unknown) => {
    console.error("[admin] colis indisponibles", err);
    return null;
  });
  return <ShipmentsList rows={rows} filters={filters} />;
}
