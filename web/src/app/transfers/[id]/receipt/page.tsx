import { notFound } from "next/navigation";
import { getReceiptByTransferId } from "@/lib/receipt";
import { ReceiptView } from "@/components/receipt-view";

type Props = { params: Promise<{ id: string }> };

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params;
  const receipt = await getReceiptByTransferId(id);
  if (!receipt) notFound();

  return <ReceiptView receipt={receipt} transferId={id} />;
}
