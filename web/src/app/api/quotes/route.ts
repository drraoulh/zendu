import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/requests";
import { publicErrorMessage } from "@/lib/api-error";
import { NextResponse } from "next/server";
import { buildQuote, QuoteLimitError } from "@/lib/quote";
import { CORRIDORS, getCountry } from "@/lib/corridors";
import { payMethodsFor } from "@/lib/mode";

function quoteError(error: unknown) {
  if (error instanceof QuoteLimitError) {
    return NextResponse.json(
      { error: error.message, code: error.code, limit: error.limit, currency: error.currency },
      { status: 400 },
    );
  }
  const message = publicErrorMessage(error);
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  if (!(await rateLimit(`quotes:${clientIp(request)}`, 600, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans quelques minutes.", code: "rate_limited" }, { status: 429 });
  }
  try {
    const body = (await request.json().catch(() => null)) as {
      corridorId?: string;
      sendAmount?: number;
      receiveAmount?: number;
      sendAmountCad?: number;
      receiveAmountXaf?: number;
      network?: string;
    };
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }
    const quote = await buildQuote({
      corridorId: body.corridorId,
      sendAmount:
        body.sendAmount ??
        (body.sendAmountCad != null ? Number(body.sendAmountCad) : undefined),
      receiveAmount:
        body.receiveAmount ??
        (body.receiveAmountXaf != null
          ? Number(body.receiveAmountXaf)
          : undefined),
      network: typeof body.network === "string" ? body.network.slice(0, 20) : undefined,
    });
    return NextResponse.json(serialize(quote));
  } catch (error) {
    return quoteError(error);
  }
}

export async function GET(request: Request) {
  if (!(await rateLimit(`quotes:${clientIp(request)}`, 600, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans quelques minutes.", code: "rate_limited" }, { status: 429 });
  }
  const { searchParams } = new URL(request.url);
  if (searchParams.get("meta") === "corridors") {
    return NextResponse.json(
      CORRIDORS.map((c) => {
        const from = getCountry(c.source);
        const to = getCountry(c.destination);
        return {
          ...c,
          label: `${from.name} → ${to.name}`,
          sourceCode: from.code,
          destCode: to.code,
          sourceFlag: from.flag,
          destFlag: to.flag,
          sourceName: from.name,
          destName: to.name,
          sendCurrency: from.currency,
          receiveCurrency: to.currency,
          networks: to.networks,
          /** Moyens de paiement disponibles maintenant (vide = envoi impossible depuis ce pays). */
          payMethods: payMethodsFor(c.source),
        };
      }),
    );
  }

  try {
    const quote = await buildQuote({
      corridorId: searchParams.get("corridor") ?? "CA-CM",
      sendAmount:
        searchParams.get("receive") != null && searchParams.get("amount") == null
          ? undefined
          : Number(searchParams.get("amount") ?? "100"),
      receiveAmount:
        searchParams.get("receive") != null
          ? Number(searchParams.get("receive"))
          : undefined,
      network: searchParams.get("network")?.slice(0, 20),
    });
    return NextResponse.json(serialize(quote));
  } catch (error) {
    return quoteError(error);
  }
}

function serialize(quote: Awaited<ReturnType<typeof buildQuote>>) {
  return {
    ...quote,
    // aliases rétrocompat UI
    sendAmountCad: quote.sendAmount,
    receiveAmountXaf: quote.receiveAmount,
    feeCad: quote.fee,
    totalCad: quote.total,
  };
}
