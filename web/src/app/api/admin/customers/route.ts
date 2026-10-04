import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createCustomer, customerCreateSchema, listCustomers, parseCustomerFilters } from "@/app/admin/_server/customers";
import { adminError, readJson } from "../_respond";

export const dynamic = "force-dynamic";

/** GET /api/admin/customers?kyc=&status=&q=&page= → { rows, total, page, pageSize, kycCounts } */
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await listCustomers(parseCustomerFilters(new URL(request.url).searchParams)));
  } catch (error) {
    return adminError(error, "customers");
  }
}

/** POST → 201 { customer, temporaryPassword } (mot de passe temporaire si aucun n'est fourni). */
export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const input = customerCreateSchema.parse(await readJson(request));
    return NextResponse.json({ ok: true, ...(await createCustomer(input)) }, { status: 201 });
  } catch (error) {
    return adminError(error, "customers");
  }
}
