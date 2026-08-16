import { NextResponse } from "next/server";
import { getFxRate } from "@/lib/fx";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = (searchParams.get("from") ?? "CAD").toUpperCase();
  const to = (searchParams.get("to") ?? "XAF").toUpperCase();
  const fx = await getFxRate(from, to);
  return NextResponse.json(fx, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
