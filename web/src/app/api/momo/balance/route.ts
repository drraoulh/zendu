import { NextResponse } from "next/server";
import { getPayoutMode } from "@/lib/providers/payout";
import { momoGetBalance } from "@/lib/providers/momo";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** Solde du compte de décaissement MoMo : donnée d'exploitation, réservée à l'administration. */
export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (getPayoutMode() !== "momo") {
    return NextResponse.json({
      mode: "mock_momo",
      availableBalance: "∞",
      currency: "XAF",
      note: "Configure MTN_* pour le solde réel",
    });
  }

  try {
    const balance = await momoGetBalance();
    return NextResponse.json({ mode: "momo", ...balance });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur balance";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
