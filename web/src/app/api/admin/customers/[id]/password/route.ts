import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { resetCustomerPassword } from "@/app/admin/_server/customers";
import { adminError, notFound } from "../../../_respond";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** POST → { temporaryPassword } : à transmettre au client, changé à sa prochaine connexion. */
export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const temp = await resetCustomerPassword((await params).id);
    return temp ? NextResponse.json({ ok: true, temporaryPassword: temp }) : notFound();
  } catch (error) {
    return adminError(error, "customers");
  }
}
