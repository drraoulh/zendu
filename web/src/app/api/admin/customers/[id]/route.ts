import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { customerPatchSchema, deleteCustomer, getCustomerDetail, patchCustomer } from "@/app/admin/_server/customers";
import { adminError, notFound, readJson } from "../../_respond";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET → { customer, transfers, sessions, totals } */
export async function GET(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const found = await getCustomerDetail((await params).id);
    return found ? NextResponse.json(found) : notFound();
  } catch (error) {
    return adminError(error, "customers");
  }
}

/** PATCH { kycStatus?, kycNote?, status?, adminNote?, coordonnées… } → { customer } */
export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const customer = await patchCustomer((await params).id, customerPatchSchema.parse(await readJson(request)));
    return customer ? NextResponse.json({ ok: true, customer }) : notFound();
  } catch (error) {
    return adminError(error, "customers");
  }
}

/** DELETE → supprime le compte (les transferts restent, sans lien client). */
export async function DELETE(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    return (await deleteCustomer((await params).id)) ? NextResponse.json({ ok: true }) : notFound();
  } catch (error) {
    return adminError(error, "customers");
  }
}
