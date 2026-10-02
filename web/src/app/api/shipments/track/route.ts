import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, isDbUnavailable, normalizeShipmentNumber, rateLimit } from "@/lib/requests";

export const dynamic = "force-dynamic";

/**
 * Suivi public d'un colis : GET /api/shipments/track?number=PWS-12345
 * → 200 { shipment: { number, origin, destination, mode, status, weightKg, estimatedDelivery, events } } ou 404.
 * Aucune donnée nominative (destinataire, demande liée) n'est renvoyée.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("number");
  if (!raw || !raw.trim()) {
    return NextResponse.json({ ok: false, error: "Numéro de suivi requis" }, { status: 400 });
  }
  if (!rateLimit(`track:${clientIp(request)}`, 60)) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de requêtes" }, { status: 429 });
  }
  const notFound = NextResponse.json({ ok: false, error: "Colis introuvable" }, { status: 404 });
  const number = normalizeShipmentNumber(raw);
  if (!number) return notFound;

  try {
    const s = await prisma.shipment.findUnique({
      where: { number },
      select: {
        number: true,
        origin: true,
        destination: true,
        mode: true,
        status: true,
        weightKg: true,
        estimatedDelivery: true,
        events: {
          orderBy: { at: "asc" },
          select: { status: true, label: true, location: true, at: true },
        },
      },
    });
    if (!s) return notFound;
    return NextResponse.json(
      {
        shipment: {
          number: s.number,
          origin: s.origin,
          destination: s.destination,
          mode: s.mode,
          status: s.status,
          weightKg: s.weightKg,
          estimatedDelivery: s.estimatedDelivery ? s.estimatedDelivery.toISOString().slice(0, 10) : null,
          events: s.events.map((e) => ({
            status: e.status,
            label: e.label,
            location: e.location,
            at: e.at.toISOString(),
          })),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.error("[shipments] base indisponible ou table absente", error);
      return NextResponse.json({ ok: false, code: "shipments_unavailable" }, { status: 503 });
    }
    console.error("[shipments] erreur inattendue", error);
    return NextResponse.json({ ok: false, error: "Erreur inattendue" }, { status: 500 });
  }
}
