import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const transfer = await prisma.transfer.findUnique({
    where: { id },
    include: {
      beneficiary: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!transfer) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(transfer);
}
