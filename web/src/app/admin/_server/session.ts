import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminMode, type AdminMode, verifySessionToken } from "@/lib/admin-auth";

/** Accès aux pages admin (défense en profondeur, le middleware filtre déjà /admin/**). */
export async function adminPageAccess(): Promise<{ ok: boolean; mode: AdminMode }> {
  const mode = adminMode();
  if (mode === "dev-open") return { ok: true, mode };
  if (mode === "locked") return { ok: false, mode };
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return { ok: await verifySessionToken(token), mode };
}

/** Redirige vers /admin/login si la session n'est pas valide. */
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
