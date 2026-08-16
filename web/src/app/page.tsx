import { SandboxBanner } from "@/components/sandbox-banner";
import { HomeContent } from "@/app/home-content";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recent = await prisma.transfer.findMany({
    include: { beneficiary: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div>
      <SandboxBanner />
      <HomeContent
        recent={recent.map((t) => ({
          id: t.id,
          reference: t.reference,
          status: t.status,
          receiveAmountXaf: t.receiveAmountXaf,
          receiveCurrency: t.receiveCurrency,
          beneficiary: { fullName: t.beneficiary.fullName },
        }))}
      />
    </div>
  );
}
