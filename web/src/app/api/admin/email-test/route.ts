import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminIdentity } from "@/lib/admin-guard";
import { brevoTestEmail } from "@/lib/otp-delivery";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ to: z.string().trim().email().max(200) });

/** Espace équipe : envoie un courriel de test et renvoie la réponse exacte de Brevo (diagnostic des codes). */
export async function POST(request: Request) {
  const me = await requireAdminIdentity(request);
  if (me instanceof NextResponse) return me;
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Adresse courriel invalide" }, { status: 400 });
  if (!(await rateLimit(`admin-email-test:${me.key}`, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop de tests. Réessayez dans une heure." }, { status: 429 });
  }
  const result = await brevoTestEmail(body.data.to);
  return NextResponse.json(result);
}
