import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ADMIN_PASSWORD_MIN_LENGTH } from "@/lib/admin-auth";
import { adminPageAccess } from "../_server/session";
import { AccountView } from "../_ui/account-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };

/** Hors du cadre (panel) : accessible même avec un mot de passe temporaire à changer. */
export default async function AdminAccountPage() {
  const { ok, mode, identity } = await adminPageAccess();
  if (!ok) redirect(mode === "configured" ? "/admin/login?next=%2Fadmin%2Fcompte" : "/admin/login");
  const user = identity?.userId ? await prisma.adminUser.findUnique({ where: { id: identity.userId } }) : null;
  return (
    <AccountView
      me={
        user
          ? { username: user.username, displayName: user.displayName, mfa: Boolean(user.totpSecretEnc), mustChangePassword: user.mustChangePassword }
          : null
      }
      minLength={ADMIN_PASSWORD_MIN_LENGTH}
    />
  );
}
