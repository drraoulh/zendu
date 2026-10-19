import { NextResponse } from "next/server";
import { expireStaleTransfers } from "@/lib/transfer-service";

/**
 * Tâche planifiée Vercel (vercel.json → crons) : expire les transferts jamais payés.
 * Vercel envoie `Authorization: Bearer <CRON_SECRET>` ; sans CRON_SECRET la route est fermée.
 * (Les transferts expirent aussi à la lecture : listes, suivi, admin.)
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const expired = await expireStaleTransfers();
  return NextResponse.json({ ok: true, expired });
}
