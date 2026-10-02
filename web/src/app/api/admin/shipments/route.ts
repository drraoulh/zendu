import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createShipment, listShipments, parseShipmentFilters, shipmentCreateSchema } from "@/app/admin/_server/data";
import { adminError, readJson } from "../_respond";

export const dynamic = "force-dynamic";

/** GET /api/admin/shipments?status=&q= → { rows } */
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ rows: await listShipments(parseShipmentFilters(new URL(request.url).searchParams)) });
  } catch (error) {
    return adminError(error, "shipments");
  }
}

/**
 * POST { requestReference?, origin?, destination?, mode?, status?, weightKg?, estimatedDelivery?,
 * recipientName?, initialLabel?, initialLocation? } → 201 { shipment }.
 * Avec requestReference (demande shipping_quote), les champs absents sont repris de la demande.
 */
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const input = shipmentCreateSchema.parse(await readJson(request));
    return NextResponse.json({ ok: true, shipment: await createShipment(input) }, { status: 201 });
  } catch (error) {
    return adminError(error, "shipments");
  }
}
