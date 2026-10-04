import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout → révoque la session courante. */
export async function POST(request: Request) {
  const authed = await getCustomer(request).catch(() => null);
  if (authed) await prisma.customerSession.update({ where: { id: authed.session.id }, data: { revokedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
