import { NextResponse } from "next/server";
import { z } from "zod";
import { publicCustomer, requireCustomer, verifyPassword } from "@/lib/customer-auth";
import { profilePatchSchema } from "@/lib/customer-input";
import { prisma } from "@/lib/prisma";
import { isUniqueViolation, zodIssues } from "@/lib/requests";

export const dynamic = "force-dynamic";

/** GET /api/me → { customer } */
export async function GET(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  return NextResponse.json({ customer: publicCustomer(authed.customer) });
}

/** PATCH /api/me — coordonnées, adresse, occupation. Nom légal et naissance : figés une fois l'identité vérifiée. */
export async function PATCH(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  try {
    const patch = profilePatchSchema.parse(await request.json());
    if (authed.customer.kycStatus === "verified" || authed.customer.kycStatus === "pending") {
      delete patch.firstName;
      delete patch.lastName;
      delete patch.birthDate;
    }
    const customer = await prisma.customer.update({ where: { id: authed.customer.id }, data: patch });
    return NextResponse.json({ customer: publicCustomer(customer) });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, error: "Données invalides", issues: zodIssues(error) }, { status: 400 });
    if (isUniqueViolation(error, "email")) return NextResponse.json({ ok: false, error: "Ce courriel est déjà utilisé par un autre compte." }, { status: 409 });
    console.error("[me:patch]", error);
    return NextResponse.json({ ok: false, error: "Mise à jour impossible." }, { status: 500 });
  }
}

/** DELETE /api/me { password } — supprime le compte ; les transferts passés restent (lien client retiré). */
export async function DELETE(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== "string" || !(await verifyPassword(body.password, authed.customer.passwordHash))) {
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect." }, { status: 403 });
  }
  await prisma.customer.delete({ where: { id: authed.customer.id } });
  return NextResponse.json({ ok: true });
}
