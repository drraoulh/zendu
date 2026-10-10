import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicTransfer } from "@/lib/bank";
import { INTERAC_PROVIDER, interacInstructions } from "@/lib/providers/interac";
import { notFound, publicTransferView, transferAccess } from "./_access";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/transfers/[id]
 * Client propriétaire (Bearer) ou équipe : transfert complet. Envoi sans compte : vue minimale masquée
 * (`limited: true`). Transfert d'un autre client : 404.
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const transfer = await prisma.transfer.findUnique({
    where: { id },
    include: {
      beneficiary: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!transfer) return notFound();

  const access = await transferAccess(request, transfer);
  if (access instanceof NextResponse) return access;

  // Virement Interac : instructions de paiement pour pouvoir les réafficher (l'expéditeur en a besoin).
  const interac = transfer.payInProvider === INTERAC_PROVIDER ? { interac: interacInstructions(transfer) } : {};
  if (access === "public") return NextResponse.json({ ...publicTransferView(transfer), ...interac });
  return NextResponse.json({ ...publicTransfer(transfer), ...interac });
}
