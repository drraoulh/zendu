import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminPageAccess, safeNext } from "../_server/session";
import { adminUsernameRequired } from "@/lib/admin-auth";
import { adminTotpEnabled } from "@/lib/admin-totp";
import { activeAdminUserCount } from "@/lib/admin-users";
import { LoginView } from "./login-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion administration",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const nextRaw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = safeNext(nextRaw);
  const { ok, mode } = await adminPageAccess();
  if (ok && mode === "configured") redirect(next);
  // Comptes individuels : identifiant toujours demandé ; le code à 6 chiffres vient en 2e étape.
  const users = mode === "configured" ? await activeAdminUserCount().catch(() => 0) : 0;
  return (
    <LoginView
      mode={mode}
      next={next}
      loggedOut={sp.logout === "1"}
      withUsername={users > 0 || adminUsernameRequired()}
      withCode={users === 0 && adminTotpEnabled()}
    />
  );
}
