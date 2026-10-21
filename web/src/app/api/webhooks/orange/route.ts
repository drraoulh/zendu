import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncOrangePayout } from "@/lib/orange-sync";

/**
 * Notification Orange Money (notifUrl), envoyée en production seulement.
 *
 * Le contenu n'est jamais cru tel quel : on n'en retient que le payToken, puis on redemande le statut
 * à Orange avec nos identifiants (syncOrangePayout). Une notification en double ne change rien.
 * Réponse rapide et identique dans tous les cas : elle ne révèle pas quels transferts existent.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { payToken?: unknown; data?: { payToken?: unknown } } | null;
  const raw = body?.data?.payToken ?? body?.payToken;
  const payToken = typeof raw === "string" ? raw.trim().slice(0, 64) : "";
  if (!payToken) return NextResponse.json({ error: "payToken manquant" }, { status: 400 });

  const transfer = await prisma.transfer.findFirst({ where: { payoutProvider: "orange", payoutRef: payToken } });
  if (transfer) {
    try {
      await syncOrangePayout(transfer.id, "notification");
    } catch (error) {
      console.error("[orange] statut introuvable après notification", transfer.reference, error instanceof Error ? error.message : error);
    }
  }
  return NextResponse.json({ received: true });
}
