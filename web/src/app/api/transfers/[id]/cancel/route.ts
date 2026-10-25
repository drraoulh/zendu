import { publicErrorMessage } from "@/lib/api-error";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { publicTransfer } from "@/lib/bank";
import { cancelTransfer } from "@/lib/transfer-service";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({ note: z.string().trim().min(3).max(300) });

/** Équipe : annule un transfert non payé, mal payé ou impossible à verser (après remboursement Interac). */
export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Indiquez la référence du remboursement ou le motif (3 caractères minimum)." }, { status: 400 });
  }
  try {
    const updated = await cancelTransfer(id, parsed.data.note);
    return NextResponse.json(updated ? publicTransfer(updated) : updated);
  } catch (error) {
    return NextResponse.json({ error: publicErrorMessage(error) }, { status: 400 });
  }
}
