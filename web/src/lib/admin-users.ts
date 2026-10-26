import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/customer-auth";
import { ADMIN_PASSWORD_MIN_LENGTH } from "@/lib/admin-auth";

/**
 * Comptes individuels de l'espace équipe (AdminUser).
 * Tant qu'aucun compte actif n'existe, la connexion provisoire ADMIN_USERNAME / ADMIN_PASSWORD
 * sert à créer les premiers comptes ; dès qu'un compte actif existe, elle est refusée.
 */

export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export function normalizeUsername(u: string): string {
  return u.trim().toLowerCase();
}

export async function activeAdminUserCount(): Promise<number> {
  return prisma.adminUser.count({ where: { active: true } });
}

/** Mot de passe temporaire lisible (18 caractères), à changer à la première connexion. */
export function temporaryPassword(): string {
  return randomBytes(14).toString("base64url").slice(0, 18);
}

export function adminPasswordProblem(pw: string): string | null {
  if (pw.length < ADMIN_PASSWORD_MIN_LENGTH) return `Le mot de passe doit faire au moins ${ADMIN_PASSWORD_MIN_LENGTH} caractères.`;
  if (pw.length > 200) return "Mot de passe trop long.";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Utilisez des lettres et des chiffres.";
  return null;
}

let dummy: Promise<string> | null = null;

/** Vérifie identifiant + mot de passe d'un compte actif (temps comparable si l'identifiant n'existe pas). */
export async function checkAdminUserPassword(username: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { username: normalizeUsername(username) } });
  if (!user || !user.active) {
    dummy ??= hashPassword(randomBytes(16).toString("hex"));
    await verifyPassword(password, await dummy);
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}

export { hashPassword, verifyPassword };
