import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listRequests, parseRequestFilters } from "@/app/admin/_server/data";
import { adminError } from "../_respond";

export const dynamic = "force-dynamic";

/** GET /api/admin/requests?kind=&status=&q=&page= → { rows, total, page, pageSize } */
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await listRequests(parseRequestFilters(new URL(request.url).searchParams)));
  } catch (error) {
    return adminError(error, "requests");
  }
}
