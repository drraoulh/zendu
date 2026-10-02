import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APPOINTMENT_TIMEZONE, availableSlots, checkAppointmentDate } from "@/lib/appointments";
import { isDbUnavailable } from "@/lib/requests";

export const dynamic = "force-dynamic";

/**
 * GET /api/appointments/slots?date=YYYY-MM-DD → 200 { date, slots, timezone }
 * (créneaux de 30 min en heure de l'Est, déjà réservés retirés).
 * 400 { date, slots: [], error: "invalid_date" | "past_date" | "weekend" | "too_far" }.
 */
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date")?.trim() ?? "";
  const check = checkAppointmentDate(date);
  if (check !== "ok") {
    return NextResponse.json({ date, slots: [], timezone: APPOINTMENT_TIMEZONE, error: check }, { status: 400 });
  }

  const slots = availableSlots(date);
  try {
    const taken = await prisma.serviceRequest.findMany({
      where: { kind: "finance_appointment", slotKey: { startsWith: `${date}T` } },
      select: { slotKey: true },
    });
    const takenTimes = new Set(taken.map((t) => t.slotKey?.slice(11)));
    return NextResponse.json(
      { date, slots: slots.filter((s) => !takenTimes.has(s)), timezone: APPOINTMENT_TIMEZONE },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isDbUnavailable(error)) {
      console.error("[appointments] base indisponible ou table absente", error);
      return NextResponse.json({ ok: false, code: "requests_unavailable", date, slots: [] }, { status: 503 });
    }
    console.error("[appointments] erreur inattendue", error);
    return NextResponse.json({ ok: false, error: "Erreur inattendue" }, { status: 500 });
  }
}
