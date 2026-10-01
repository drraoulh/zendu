import { NextResponse } from "next/server";
import { queueAndRunPayout } from "@/lib/transfer-service";
import { prisma } from "@/lib/prisma";
import { publicTransfer } from "@/lib/bank";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
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
