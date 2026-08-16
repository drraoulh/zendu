import { NextResponse } from "next/server";
import { buildQuote } from "@/lib/quote";
import { CORRIDORS, getCountry } from "@/lib/corridors";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      corridorId?: string;
      sendAmount?: number;
      receiveAmount?: number;
      sendAmountCad?: number;
      receiveAmountXaf?: number;
    };
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
    const message = error instanceof Error ? error.message : "Erreur devis";
    return NextResponse.json({ error: message }, { status: 400 });
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
    const message = error instanceof Error ? error.message : "Erreur devis";
    return NextResponse.json({ error: message }, { status: 400 });
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
