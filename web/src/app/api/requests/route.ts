import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { availableSlots, checkAppointmentDate } from "@/lib/appointments";
import {
  appointmentSlotKey,
  clientIp,
  generateReference,
  isDbUnavailable,
  isUniqueViolation,
  rateLimit,
  requestBodySchema,
  zodIssues,
} from "@/lib/requests";

export const dynamic = "force-dynamic";

/** Nombre de demandes acceptées par adresse IP et par heure (limite simple, en mémoire). */
const MAX_PER_HOUR = 8;

function unavailable(error: unknown) {
  console.error("[requests] base indisponible ou table absente", error);
  return NextResponse.json(
    {
      ok: false,
      code: "requests_unavailable",
      error: "Service momentanément indisponible. Réessayez plus tard. / Service temporarily unavailable.",
    },
    { status: 503 },
  );
}

function slotTaken() {
  return NextResponse.json(
    {
      ok: false,
      code: "slot_taken",
      error: "Ce créneau vient d'être réservé. Choisissez-en un autre.",
      issues: [{ path: "payload.time", message: "slot_taken" }],
    },
    { status: 409 },
  );
}

/**
 * Dépôt d'une demande de service (contact, devis shipping, rendez-vous finances, projet tech).
 * Voir le contrat dans src/lib/requests.ts.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide", issues: [] }, { status: 400 });
  }

  // Robot (honeypot rempli) : réponse indiscernable d'un succès, rien n'est enregistré.
  const honeypot = (json as { website?: unknown } | null)?.website;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    const kind = (json as { kind?: unknown }).kind;
    const fake = generateReference(
      kind === "shipping_quote" || kind === "finance_appointment" || kind === "tech_project" ? kind : "contact",
    );
    return NextResponse.json({ ok: true, reference: fake }, { status: 201 });
  }

  const parsed = requestBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Données invalides", issues: zodIssues(parsed.error) },
      { status: 400 },
    );
  }

  if (!rateLimit(`requests:${clientIp(request)}`, MAX_PER_HOUR)) {
    return NextResponse.json(
      { ok: false, code: "rate_limited", error: "Trop de demandes. Réessayez dans une heure." },
      { status: 429 },
    );
  }

  const body = parsed.data;
  let slotKey: string | null = null;

  if (body.kind === "finance_appointment") {
    const { date, time } = body.payload;
    const check = checkAppointmentDate(date);
    if (check !== "ok" || !availableSlots(date).includes(time)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Créneau indisponible",
          issues: [{ path: check === "ok" ? "payload.time" : "payload.date", message: check === "ok" ? "slot_unavailable" : check }],
        },
        { status: 400 },
      );
    }
    slotKey = appointmentSlotKey(date, time);
    try {
      const taken = await prisma.serviceRequest.findUnique({ where: { slotKey }, select: { id: true } });
      if (taken) return slotTaken();
    } catch (error) {
      if (isDbUnavailable(error)) return unavailable(error);
      throw error;
    }
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = generateReference(body.kind);
    try {
      await prisma.serviceRequest.create({
        data: {
          reference,
          kind: body.kind,
          name: body.name,
          email: body.email,
          phone: body.phone ?? null,
          locale: body.locale ?? null,
          payload: body.payload,
          slotKey,
        },
      });
      return NextResponse.json({ ok: true, reference }, { status: 201 });
    } catch (error) {
      // Course entre deux réservations simultanées : l'index unique tranche.
      if (isUniqueViolation(error, "slotKey")) return slotTaken();
      if (isUniqueViolation(error, "reference")) continue;
      if (isDbUnavailable(error)) return unavailable(error);
      console.error("[requests] erreur inattendue", error);
      return NextResponse.json({ ok: false, error: "Erreur inattendue" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: false, error: "Erreur inattendue" }, { status: 500 });
}
