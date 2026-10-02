import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeShipmentNumber } from "@/lib/requests";
import { addShipmentEvent, deleteShipmentEvent, shipmentEventSchema } from "@/app/admin/_server/data";
import { adminError, notFound, readJson } from "../../../_respond";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ number: string }> };

/** POST { status, label, location?, at? (ISO), updateShipment? = true } → 201 { shipment } */
export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const number = normalizeShipmentNumber(decodeURIComponent((await params).number));
  if (!number) return notFound();
  try {
    const s = await addShipmentEvent(number, shipmentEventSchema.parse(await readJson(request)));
    return s ? NextResponse.json({ ok: true, shipment: s }, { status: 201 }) : notFound();
  } catch (error) {
    return adminError(error, "shipment-events");
  }
}

/** DELETE { id } → { shipment } (corriger un événement saisi par erreur). */
export async function DELETE(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const number = normalizeShipmentNumber(decodeURIComponent((await params).number));
  if (!number) return notFound();
  try {
    const { id } = z.object({ id: z.string().min(1).max(64) }).parse(await readJson(request));
    const s = await deleteShipmentEvent(number, id);
    return s ? NextResponse.json({ ok: true, shipment: s }) : notFound();
  } catch (error) {
    return adminError(error, "shipment-events");
  }
}
