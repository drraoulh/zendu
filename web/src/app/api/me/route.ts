import { NextResponse } from "next/server";
import { diditConfigured, syncDiditDecision } from "@/lib/didit";
import { z } from "zod";
import { publicCustomer, requireCustomer, verifyPassword } from "@/lib/customer-auth";
import { profileErrorMessage, profilePatchSchema } from "@/lib/customer-input";
import { prisma } from "@/lib/prisma";
import { isUniqueViolation, zodIssues } from "@/lib/requests";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** GET /api/me → { customer } */
export async function GET(request: Request) {
  const authed = await requireCustomer(request, { allowTemporaryPassword: true });
  if (authed instanceof NextResponse) return authed;
  let customer = authed.customer;
  // Vérification Didit en cours : l'appli interroge /api/me toutes les 15 s, on relit la décision.
  if (customer.kycStatus === "pending" && customer.kycProvider === "didit" && diditConfigured()) {
    customer = await syncDiditDecision(customer).catch(() => customer);
  }
  return NextResponse.json({ customer: publicCustomer(customer) });
}

/**
 * PATCH /api/me — coordonnées, adresse, occupation. Nom légal et naissance : figés une fois l'identité vérifiée.
 * Changer le courriel ou le téléphone exige le mot de passe actuel (`currentPassword`) : une session volée
 * ne suffit pas pour détourner le compte (le courriel reçoit les codes et la réinitialisation). Après un
 * tel changement, les autres appareils sont déconnectés.
 */
export async function PATCH(request: Request) {
  const authed = await requireCustomer(request);
  if (authed instanceof NextResponse) return authed;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "Données invalides" }, { status: 400 });
    const { currentPassword, ...patch } = profilePatchSchema.parse(body);
    const emailChanged = patch.email !== undefined && patch.email.toLowerCase() !== authed.customer.email.toLowerCase();
    const phoneChanged = patch.phone !== undefined && patch.phone.replace(/\D/g, "") !== (authed.customer.phone ?? "").replace(/\D/g, "");
    const sensitive = emailChanged || phoneChanged;
    if (sensitive) {
      if (!currentPassword) {
        return NextResponse.json(
          { ok: false, code: "password_required", error: "Saisissez votre mot de passe pour changer votre courriel ou votre téléphone." },
          { status: 403 },
        );
      }
      if (!(await rateLimit(`me-sensitive:${authed.customer.id}`, 5, 15 * 60 * 1000))) {
        return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
      }
      // 403 et non 401 : l'appli déconnecte sur un 401 de /api/me.
      if (!(await verifyPassword(currentPassword, authed.customer.passwordHash))) {
        return NextResponse.json({ ok: false, code: "password_invalid", error: "Mot de passe incorrect." }, { status: 403 });
      }
    }
    if (authed.customer.kycStatus === "verified" || authed.customer.kycStatus === "pending") {
      delete patch.firstName;
      delete patch.lastName;
      delete patch.birthDate;
    }
    const customer = await prisma.customer.update({ where: { id: authed.customer.id }, data: patch });
    if (sensitive) {
      await prisma.customerSession.updateMany({
        where: { customerId: customer.id, revokedAt: null, id: { not: authed.session.id } },
        data: { revokedAt: new Date() },
      });
    }
    return NextResponse.json({ customer: publicCustomer(customer) });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ ok: false, error: profileErrorMessage(error), issues: zodIssues(error) }, { status: 400 });
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
  if (!(await rateLimit(`me-delete:${authed.customer.id}`, 5))) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de tentatives. Réessayez dans une heure." }, { status: 429 });
  }
  if (typeof body.password !== "string" || !(await verifyPassword(body.password, authed.customer.passwordHash))) {
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect." }, { status: 403 });
  }
  await prisma.customer.delete({ where: { id: authed.customer.id } });
  return NextResponse.json({ ok: true });
}
