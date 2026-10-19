import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCorridor } from "@/lib/corridors";
import { deliveryEstimateFor, publicTransfer } from "@/lib/bank";
import { isLiveMode } from "@/lib/mode";
import { expireStaleTransfers } from "@/lib/transfer-service";
import { INTERAC_PROVIDER, interacInstructions } from "@/lib/providers/interac";
import { publicTransferView } from "@/app/api/transfers/[id]/_access";
import { adminPageAccess } from "@/app/admin/_server/session";
import type { TransferDTO } from "@/components/transfer-app/types";
import { TransferTracker } from "./transfer-tracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivi du transfert",
  robots: { index: false },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransferPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const admin = (await adminPageAccess()).ok;

  let initial: TransferDTO | null = null;
  let dbFailed = false;
  try {
    await expireStaleTransfers({ id }).catch(() => 0);
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: { beneficiary: true, events: { orderBy: { createdAt: "asc" } } },
    });
    // Mêmes droits que GET /api/transfers/[id] : l'équipe voit tout ; un envoi sans compte, par simple
    // lien, ne montre que la vue masquée ; le transfert d'un client de l'appli n'est pas affiché ici.
    if (transfer && (admin || transfer.customerId === null)) {
      const view = admin ? publicTransfer(transfer) : publicTransferView(transfer);
      const interac = transfer.payInProvider === INTERAC_PROVIDER ? { interac: interacInstructions(transfer) } : {};
      initial = JSON.parse(JSON.stringify({ ...view, ...interac })) as TransferDTO;
    }
  } catch (error) {
    console.error("Transfer: impossible de charger le transfert", error);
    dbFailed = true;
  }

  if (!dbFailed && !initial) notFound();

  const deliveryEstimate = deliveryEstimateFor(
    getCorridor(initial?.corridorId ?? "CA-CM")?.deliveryEstimate ?? "A few minutes",
    initial?.beneficiary.network,
    initial?.beneficiary.country,
  );

  return (
    <TransferTracker
      id={id}
      initial={initial}
      // Simulation (paiement / versement) : mode démo uniquement, jamais en mode réel.
      demo={!isLiveMode()}
      admin={admin}
      deliveryEstimate={deliveryEstimate}
      notice={query.paid === "1" ? "paid" : query.cancelled === "1" ? "cancelled" : null}
    />
  );
}
