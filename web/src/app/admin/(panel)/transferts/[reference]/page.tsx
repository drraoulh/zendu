import type { Metadata } from "next";
import { getAdminTransfer } from "../../../_server/insights";
import { TransferDetail } from "../../../_ui/transfer-detail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ reference: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Transfert ${decodeURIComponent((await params).reference)}` };
}

export default async function AdminTransferPage({ params }: Props) {
  const reference = decodeURIComponent((await params).reference).trim().toUpperCase();
  const transfer = await getAdminTransfer(reference).catch((err: unknown) => {
    console.error("[admin] fiche transfert indisponible", err);
    return undefined;
  });
  return <TransferDetail transfer={transfer} />;
}
