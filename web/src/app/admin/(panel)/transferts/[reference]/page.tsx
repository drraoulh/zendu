import type { Metadata } from "next";
import { transferFlags } from "@/lib/compliance";
import { prisma } from "@/lib/prisma";
import { getAdminTransfer } from "../../../_server/insights";
import { ComplianceSection, type ComplianceNoteRow } from "../../../_ui/compliance-notes";
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

  // Conformité : signes d'alerte et journal des décisions (best effort : la fiche s'affiche même si cette partie échoue).
  let flags: string[] = [];
  let notes: ComplianceNoteRow[] = [];
  if (transfer) {
    try {
      const row = await prisma.transfer.findUnique({
        where: { reference },
        select: { id: true, customerId: true, totalCad: true, beneficiary: { select: { phone: true } } },
      });
      if (row) {
        flags = (await transferFlags([row])).get(row.id) ?? [];
        notes = (await prisma.complianceNote.findMany({ where: { transferId: row.id }, orderBy: { createdAt: "desc" }, take: 50 })).map((n) => ({
          id: n.id,
          createdAt: n.createdAt.toISOString(),
          author: n.author,
          decision: n.decision,
          note: n.note,
        }));
      }
    } catch (err) {
      console.error("[admin] conformité indisponible", err);
    }
  }
  return (
    <>
      <TransferDetail transfer={transfer} />
      {transfer ? <ComplianceSection reference={reference} flags={flags} notes={notes} /> : null}
    </>
  );
}
