import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { csvCell, parseDay, reconciliation } from "@/lib/compliance";
import { adminError } from "../../_respond";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports/reconciliation?from=AAAA-MM-JJ&to=AAAA-MM-JJ[&format=csv]
 * Rapprochement de l'argent reçu, des versements faits et de la marge estimée. `to` est inclus.
 * Sans dates : les 14 derniers jours.
 */
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const url = new URL(request.url);
    const end = parseDay(url.searchParams.get("to"));
    const to = new Date((end ?? new Date()).getTime() + (end ? 86_400_000 : 0));
    const from = parseDay(url.searchParams.get("from")) ?? new Date(to.getTime() - 14 * 86_400_000);
    if (from >= to || to.getTime() - from.getTime() > 366 * 86_400_000) {
      return NextResponse.json({ error: "Période invalide (366 jours au maximum)." }, { status: 400 });
    }
    const data = await reconciliation(from, to);
    if (url.searchParams.get("format") !== "csv") return NextResponse.json(data);

    const head = ["Créé le", "Référence", "Statut", "Expéditeur", "Bénéficiaire", "Trajet", "Devise envoi", "Montant envoyé", "Frais", "Total payé", "Taux", "Devise reçue", "Montant reçu", "Argent reçu le", "Livré le", "Encaissement", "Versement", "Réf. versement", "Marge estimée (CAD)"];
    const lines = [head.map(csvCell).join(",")].concat(
      data.rows.map((r) =>
        [r.createdAt, r.reference, r.status, r.sender, r.recipient, r.corridor, r.sendCurrency, r.sendAmount, r.fee, r.total, r.rate, r.receiveCurrency, r.receiveAmount, r.paidAt, r.deliveredAt, r.payInProvider, r.payoutProvider, r.payoutRef, r.estimatedMarginCad]
          .map(csvCell)
          .join(","),
      ),
    );
    return new NextResponse("﻿" + lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rapprochement-${from.toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return adminError(error, "reconciliation");
  }
}
