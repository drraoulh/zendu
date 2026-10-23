import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminMode, type AdminMode, type SessionClaims } from "@/lib/admin-auth";
import { activeSessionFromCookie } from "@/lib/admin-guard";

/** Accès aux pages admin (défense en profondeur : le middleware vérifie déjà la signature du cookie). */
export async function adminPageAccess(): Promise<{ ok: boolean; mode: AdminMode; session: SessionClaims | null }> {
  const mode = adminMode();
  if (mode === "dev-open") return { ok: true, mode, session: null };
  if (mode === "locked") return { ok: false, mode, session: null };
  const session = await activeSessionFromCookie((await cookies()).get(ADMIN_COOKIE)?.value);
  return { ok: session !== null, mode, session };
}

/** Redirige vers /admin/login si la session n'est pas valide (signature, expiration, révocation). */
export async function requireAdminPage(next = "/admin"): Promise<AdminMode> {
  const { ok, mode } = await adminPageAccess();
  if (!ok) redirect(mode === "configured" ? `/admin/login?next=${encodeURIComponent(next)}` : "/admin/login");
  return mode;
}

/** Cible de redirection sûre après connexion (chemin interne /admin uniquement). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.startsWith("/admin/login")) return "/admin";
  return next;
}
