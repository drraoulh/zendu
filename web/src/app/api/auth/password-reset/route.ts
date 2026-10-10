import { NextResponse } from "next/server";
import { emailSchema } from "@/lib/customer-input";
import { prisma } from "@/lib/prisma";
import { clientIp, generateReference, rateLimit } from "@/lib/requests";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/password-reset { email } → toujours { ok: true } (ne révèle pas si le compte existe).
 * Sans service d'envoi de courriels, la demande arrive dans /admin/demandes : l'équipe attribue un
 * mot de passe temporaire depuis la fiche client (/admin/clients/…), changé à la connexion suivante.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  const email = emailSchema.safeParse(body.email);
  if (!email.success) return NextResponse.json({ ok: false, error: "Adresse courriel invalide" }, { status: 400 });
  if (!rateLimit(`reset:${clientIp(request)}`, 5) || !rateLimit(`reset:${email.data}`, 3)) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  }
  try {
    const customer = await prisma.customer.findUnique({ where: { email: email.data } });
    if (customer) {
      await prisma.serviceRequest.create({
        data: {
          reference: generateReference("contact"),
          kind: "contact",
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          locale: "fr",
          payload: { subject: "autre", message: `Réinitialisation du mot de passe demandée depuis l'application (client ${customer.id}).` },
        },
      });
    }
  } catch (error) {
    console.error("[auth:password-reset]", error);
  }
  return NextResponse.json({ ok: true });
}
