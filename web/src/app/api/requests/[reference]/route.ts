import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, isDbUnavailable, normalizeReference, rateLimit, safeEmail } from "@/lib/requests";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ reference: string }> };

/**
 * Statut public d'une demande : GET /api/requests/CT-XXXXXX?email=… →
 * { reference, kind, status, createdAt } si le courriel correspond, 404 sinon (sans dire pourquoi).
 */
export async function GET(request: Request, { params }: Params) {
  const { reference: raw } = await params;
  const email = safeEmail(new URL(request.url).searchParams.get("email"));
  const reference = normalizeReference(decodeURIComponent(raw));

  if (!email) {
    return NextResponse.json({ ok: false, error: "Courriel requis" }, { status: 400 });
  }
  if (!rateLimit(`requests-status:${clientIp(request)}`, 30)) {
    return NextResponse.json({ ok: false, code: "rate_limited", error: "Trop de requêtes" }, { status: 429 });
  }
  const notFound = NextResponse.json({ ok: false, error: "Introuvable" }, { status: 404 });
  if (!reference) return notFound;

  try {
    const found = await prisma.serviceRequest.findUnique({
      where: { reference },
      select: { reference: true, kind: true, status: true, createdAt: true, email: true },
    });
    if (!found || found.email !== email) return notFound;
    return NextResponse.json(
      { reference: found.reference, kind: found.kind, status: found.status, createdAt: found.createdAt.toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isDbUnavailable(error)) {
      return NextResponse.json({ ok: false, code: "requests_unavailable" }, { status: 503 });
    }
    console.error("[requests] erreur inattendue", error);
    return NextResponse.json({ ok: false, error: "Erreur inattendue" }, { status: 500 });
  }
}
