import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeShipmentNumber } from "@/lib/requests";
import { getShipment, patchShipment, shipmentPatchSchema } from "@/app/admin/_server/data";
import { adminError, notFound, readJson } from "../../_respond";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ number: string }> };

/** GET /api/admin/shipments/[number] → { shipment } (avec destinataire et demande liée). */
export async function GET(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const number = normalizeShipmentNumber(decodeURIComponent((await params).number));
  if (!number) return notFound();
  try {
    const s = await getShipment(number);
    return s ? NextResponse.json({ shipment: s }) : notFound();
  } catch (error) {
    return adminError(error, "shipments");
  }
}

/** PATCH { status?, estimatedDelivery? (YYYY-MM-DD | null), origin?, destination?, mode?, weightKg?, recipientName? } */
export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const number = normalizeShipmentNumber(decodeURIComponent((await params).number));
  if (!number) return notFound();
  try {
    const s = await patchShipment(number, shipmentPatchSchema.parse(await readJson(request)));
    return s ? NextResponse.json({ ok: true, shipment: s }) : notFound();
  } catch (error) {
    return adminError(error, "shipments");
  }
}
