import { NextResponse } from "next/server";
import { getReceiptByTransferId } from "@/lib/receipt";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const receipt = await getReceiptByTransferId(id);
  if (!receipt) {
    return NextResponse.json({ error: "Reçu introuvable" }, { status: 404 });
  }
  return NextResponse.json(receipt);
}
