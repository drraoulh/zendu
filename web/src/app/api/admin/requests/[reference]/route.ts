import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { normalizeReference } from "@/lib/requests";
import { getRequest, patchRequest, requestPatchSchema } from "@/app/admin/_server/data";
import { adminError, notFound, readJson } from "../../_respond";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ reference: string }> };

/** GET /api/admin/requests/[reference] → { request } */
export async function GET(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const reference = normalizeReference(decodeURIComponent((await params).reference));
  if (!reference) return notFound();
  try {
    const found = await getRequest(reference);
    return found ? NextResponse.json({ request: found }) : notFound();
  } catch (error) {
    return adminError(error, "requests");
  }
}

/** PATCH { status?, adminNote? } → { request, warning? } */
export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const reference = normalizeReference(decodeURIComponent((await params).reference));
  if (!reference) return notFound();
  try {
    const patch = requestPatchSchema.parse(await readJson(request));
    const result = await patchRequest(reference, patch);
    return result ? NextResponse.json({ ok: true, ...result }) : notFound();
  } catch (error) {
    return adminError(error, "requests");
  }
}
