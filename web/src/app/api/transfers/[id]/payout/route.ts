import { NextResponse } from "next/server";
import { queueAndRunPayout } from "@/lib/transfer-service";
import { prisma } from "@/lib/prisma";
import { publicTransfer } from "@/lib/bank";
import { requireAdmin } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

/**
 * Déclenchement manuel du versement : réservé à l'administration (session admin ou ADMIN_API_TOKEN).
 * Le parcours démo n'en dépend pas : simulate-pay enchaîne le versement tant que AUTO_PAYOUT ≠ "false".
 */
export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const transfer = await prisma.transfer.findUnique({ where: { id } });
  if (!transfer) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  try {
    const updated = await queueAndRunPayout(id);
    return NextResponse.json(updated ? publicTransfer(updated) : updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur payout";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
