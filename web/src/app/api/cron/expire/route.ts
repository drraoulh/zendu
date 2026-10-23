import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expireStaleTransfers } from "@/lib/transfer-service";

/**
 * Tâche planifiée Vercel (vercel.json → crons) : expire les transferts jamais payés.
 * Vercel envoie `Authorization: Bearer <CRON_SECRET>` ; sans CRON_SECRET la route est fermée.
 * (Les transferts expirent aussi à la lecture : listes, suivi, admin.)
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  // Comparaison en temps constant : la durée de la réponse ne révèle rien du secret.
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const expired = await expireStaleTransfers();
  return NextResponse.json({ ok: true, expired });
}
