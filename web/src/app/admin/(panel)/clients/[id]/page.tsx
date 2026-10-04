import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "../../../_server/customers";
import { CustomerDetail } from "../../../_ui/customer-detail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Fiche client" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminCustomerPage({ params }: Props) {
  const detail = await getCustomerDetail((await params).id);
  if (!detail) notFound();
  return <CustomerDetail key={detail.customer.id} initial={detail} />;
}
