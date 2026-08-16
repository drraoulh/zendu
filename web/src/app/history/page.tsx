import { prisma } from "@/lib/prisma";
import { SandboxBanner } from "@/components/sandbox-banner";
import { HistoryContent } from "@/app/history/history-content";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const transfers = await prisma.transfer.findMany({
    include: { beneficiary: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <SandboxBanner />
      <HistoryContent
        transfers={transfers.map((t) => ({
          id: t.id,
          reference: t.reference,
          corridorId: t.corridorId ?? "CA-CM",
          status: t.status,
          createdAt: t.createdAt.toISOString(),
          receiveAmountXaf: t.receiveAmountXaf,
          receiveCurrency: t.receiveCurrency,
          sendAmountCad: t.sendAmountCad,
          sendCurrency: t.sendCurrency,
          beneficiary: { fullName: t.beneficiary.fullName },
        }))}
      />
    </div>
  );
}
