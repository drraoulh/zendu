import { publicErrorMessage } from "@/lib/api-error";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { publicBeneficiary } from "@/lib/bank";
import { COUNTRIES } from "@/lib/corridors";
import { beneficiaryInputSchema, normalizeBeneficiary } from "@/lib/beneficiary-input";
import { isAdminRequest, requireAdmin } from "@/lib/admin-guard";
import { getCustomer } from "@/lib/customer-auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/requests";

/** Liste de tous les bénéficiaires : réservée à l'admin. */
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const beneficiaries = await prisma.beneficiary.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // unique par compte bancaire (virement) ou téléphone (mobile money / retrait) + réseau
  const seen = new Set<string>();
  const unique = beneficiaries.filter((b) => {
    const key = `${b.accountNumber || b.phone}:${b.network}:${b.country}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Le numéro de compte complet n'est jamais renvoyé : seulement « •••• 1234 ».
  return NextResponse.json(unique.map(publicBeneficiary));
}

const createSchema = beneficiaryInputSchema.extend({
  country: z.string().length(2).default("CM"),
});

export async function POST(request: Request) {
  // Réservé aux clients connectés et à l'équipe : sans cela, n'importe qui pouvait remplir la base.
  const authed = await getCustomer(request);
  if (!authed && !(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, code: "unauthorized", error: "Connexion requise." }, { status: 401 });
  }
  if (!(await rateLimit(`beneficiary:${authed?.customer.id ?? clientIp(request)}`, 60))) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  }
  try {
    const input = createSchema.parse(await request.json());
    const country = COUNTRIES[input.country];
    if (!country) {
      return NextResponse.json({ error: "Pays de réception invalide" }, { status: 400 });
    }
    const result = await normalizeBeneficiary(input, input.country);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const beneficiary = await prisma.beneficiary.create({ data: result.data });
    return NextResponse.json(publicBeneficiary(beneficiary), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Coordonnées du bénéficiaire invalides." }, { status: 400 });
    }
    const message = publicErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
