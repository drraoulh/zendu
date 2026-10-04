import { NextResponse } from "next/server";
import { buildQuote, QuoteLimitError } from "@/lib/quote";
import { CORRIDORS, getCountry } from "@/lib/corridors";

function quoteError(error: unknown) {
  if (error instanceof QuoteLimitError) {
    return NextResponse.json(
      { error: error.message, code: error.code, limit: error.limit, currency: error.currency },
      { status: 400 },
    );
  }
  const message = error instanceof Error ? error.message : "Erreur devis";
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      corridorId?: string;
      sendAmount?: number;
      receiveAmount?: number;
      sendAmountCad?: number;
      receiveAmountXaf?: number;
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
    });
    return NextResponse.json(serialize(quote));
  } catch (error) {
    return quoteError(error);
  }
}

export async function GET(request: Request) {
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
