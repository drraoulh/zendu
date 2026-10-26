import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminMode, type AdminMode } from "@/lib/admin-auth";
import { identityFromCookie, type AdminIdentity } from "@/lib/admin-guard";

/** Accès aux pages admin (défense en profondeur : le middleware vérifie déjà la signature du cookie). */
export async function adminPageAccess(): Promise<{ ok: boolean; mode: AdminMode; identity: AdminIdentity | null; session: { sid: string } | null }> {
  const mode = adminMode();
  if (mode === "dev-open") return { ok: true, mode, identity: null, session: null };
  if (mode === "locked") return { ok: false, mode, identity: null, session: null };
  const identity = await identityFromCookie((await cookies()).get(ADMIN_COOKIE)?.value);
  return { ok: identity !== null, mode, identity, session: identity?.sid ? { sid: identity.sid } : null };
}

/**
 * Redirige vers /admin/login si la session n'est pas valide (signature, expiration, révocation),
 * et vers /admin/compte tant que le mot de passe temporaire n'est pas remplacé.
 */
export async function requireAdminPage(next = "/admin"): Promise<{ mode: AdminMode; identity: AdminIdentity | null }> {
  const { ok, mode, identity } = await adminPageAccess();
  if (!ok) redirect(mode === "configured" ? `/admin/login?next=${encodeURIComponent(next)}` : "/admin/login");
  if (identity?.mustChangePassword) redirect("/admin/compte");
  return { mode, identity };
}

/** Cible de redirection sûre après connexion (chemin interne /admin uniquement). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.startsWith("/admin/login")) return "/admin";
  return next;
}
