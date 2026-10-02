import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { normalizeShipmentNumber } from "@/lib/requests";
import { getShipment } from "../../../_server/data";
import { DbError } from "../../../_ui/kit";
import { ShipmentDetail } from "../../../_ui/shipment-detail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: decodeURIComponent((await params).number).toUpperCase() };
}

export default async function AdminShipmentPage({ params }: Props) {
  const number = normalizeShipmentNumber(decodeURIComponent((await params).number));
  if (!number) notFound();
  let shipment;
  try {
    shipment = await getShipment(number);
  } catch (err) {
    console.error("[admin] colis indisponible", err);
    return <DbError />;
  }
  if (!shipment) notFound();
  return <ShipmentDetail shipment={shipment} />;
}
