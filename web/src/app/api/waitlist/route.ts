import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { COUNTRIES } from "@/lib/corridors";
import { isLocale } from "@/lib/i18n";

/** Liste d'attente de l'application WorldSoft Transfer (formulaire de la page /application). */
const schema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email().max(254)),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || v in COUNTRIES, "Pays inconnu"),
  locale: z
    .string()
    .optional()
    .transform((v) => (isLocale(v) ? v : undefined)),
  source: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined)),
  consent: z.literal(true),
  /** Champ piège (honeypot) : invisible pour les humains, rempli par les robots. */
  website: z.string().optional(),
});

/** Table absente ou base injoignable → 503, sans faire planter le reste du site. */
function isUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientRustPanicError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" || error.code === "P2022" || error.code.startsWith("P1");
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return /relation .* does not exist|connect|timeout/i.test(error.message);
  }
  return false;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Courriel invalide ou consentement manquant", issues: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }

  const { email, country, locale, source, website } = parsed.data;

  // Robot : on répond comme si tout allait bien, sans rien enregistrer.
  if (website && website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.waitlistSignup.upsert({
      where: { email },
      create: { email, country: country ?? null, locale: locale ?? null, source: source ?? "application" },
      update: {
        ...(country ? { country } : {}),
        ...(locale ? { locale } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isUnavailable(error)) {
      console.error("[waitlist] base indisponible ou table absente", error);
      return NextResponse.json(
        {
          error:
            "La liste d'attente est momentanément indisponible. Réessayez plus tard. / The waitlist is temporarily unavailable.",
          code: "waitlist_unavailable",
        },
        { status: 503 },
      );
    }
    console.error("[waitlist] erreur inattendue", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}
