import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/requests";
import { NextResponse } from "next/server";
import { getFxRate } from "@/lib/fx";

export async function GET(request: Request) {
  if (!(await rateLimit(`fx:${clientIp(request)}`, 300, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans quelques minutes.", code: "rate_limited" }, { status: 429 });
  }
  const { searchParams } = new URL(request.url);
  const from = (searchParams.get("from") ?? "CAD").toUpperCase();
  const to = (searchParams.get("to") ?? "XAF").toUpperCase();
  // Codes devise ISO uniquement (pas d'appel aux sources de taux pour une valeur arbitraire).
  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    return NextResponse.json({ error: "Devise invalide" }, { status: 400 });
  }
  const fx = await getFxRate(from, to);
  return NextResponse.json(fx, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
