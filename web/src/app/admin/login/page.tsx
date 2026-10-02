import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminPageAccess, safeNext } from "../_server/session";
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
  return <LoginView mode={mode} next={next} loggedOut={sp.logout === "1"} />;
}
