import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { revokeCustomerSessions } from "@/app/admin/_server/customers";
import { adminError } from "../../../_respond";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** DELETE ?session=<id> → déconnecte un appareil, ou tous sans paramètre. */
export async function DELETE(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const sessionId = new URL(request.url).searchParams.get("session") ?? undefined;
    return NextResponse.json({ ok: true, revoked: await revokeCustomerSessions((await params).id, sessionId) });
  } catch (error) {
    return adminError(error, "customers");
  }
}
