import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Compteur en mémoire : repli si la base est injoignable (limite alors par instance serveur). */
function memoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/**
 * Limite anti-abus partagée entre toutes les instances serveur (table "RateLimit" dans la base) :
 * `limit` appels par fenêtre de `windowMs`. Renvoie true si l'appel est autorisé.
 * La clé est stockée sous forme d'empreinte SHA-256 (aucune adresse IP ni courriel en clair).
 * Mise à jour atomique (un seul INSERT … ON CONFLICT), donc sans course entre requêtes simultanées.
 */
export async function rateLimit(key: string, limit: number, windowMs = 60 * 60 * 1000): Promise<boolean> {
  const id = createHash("sha256").update(key).digest("hex");
  const resetAt = new Date(Date.now() + windowMs);
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${id}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= NOW() THEN EXCLUDED."resetAt" ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;
    // Ménage occasionnel des compteurs expirés (environ 1 appel sur 100).
    if (Math.random() < 0.01) {
      await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < NOW() - INTERVAL '1 day'`.catch(() => 0);
    }
    return Number(rows[0]?.count ?? 1) <= limit;
  } catch {
    return memoryRateLimit(key, limit, windowMs);
  }
}
