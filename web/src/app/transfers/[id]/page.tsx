import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPayInMode } from "@/lib/providers/payin";
import { getCorridor } from "@/lib/corridors";
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

  let initial: TransferDTO | null = null;
  let dbFailed = false;
  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: { beneficiary: true, events: { orderBy: { createdAt: "asc" } } },
    });
    if (transfer) initial = JSON.parse(JSON.stringify(transfer)) as TransferDTO;
  } catch (error) {
    console.error("Transfer: impossible de charger le transfert", error);
    dbFailed = true;
  }

  if (!dbFailed && !initial) notFound();

  const deliveryEstimate = getCorridor(initial?.corridorId ?? "CA-CM")?.deliveryEstimate ?? "A few minutes";

  return (
    <TransferTracker
      id={id}
      initial={initial}
      demo={getPayInMode() === "mock"}
      deliveryEstimate={deliveryEstimate}
      notice={query.paid === "1" ? "paid" : query.cancelled === "1" ? "cancelled" : null}
    />
  );
}
