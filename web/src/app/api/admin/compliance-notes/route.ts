import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminIdentity } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { adminError } from "../_respond";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  reference: z.string().trim().min(3).max(40),
  decision: z.enum(["note", "released", "blocked", "reported"]).default("note"),
  note: z.string().trim().min(3, "Écrivez au moins quelques mots.").max(1000),
});

/** POST /api/admin/compliance-notes { reference, decision, note } : décision de conformité inscrite au dossier du transfert. */
export async function POST(request: Request) {
  const me = await requireAdminIdentity(request);
  if (me instanceof NextResponse) return me;
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
    const transfer = await prisma.transfer.findUnique({ where: { reference: parsed.data.reference.toUpperCase() }, select: { id: true } });
    if (!transfer) return NextResponse.json({ error: "Transfert introuvable" }, { status: 404 });
    const note = await prisma.complianceNote.create({
      data: { transferId: transfer.id, author: `${me.displayName} (${me.username})`, decision: parsed.data.decision, note: parsed.data.note },
    });
    return NextResponse.json({ ok: true, id: note.id });
  } catch (error) {
    return adminError(error, "compliance-notes");
  }
}
