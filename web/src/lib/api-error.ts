import { Prisma } from "@prisma/client";

/**
 * Message d'erreur montrable au client. Les erreurs métier (montant, statut, plafond…) gardent leur
 * texte ; une erreur technique (base de données, réseau, bug) est remplacée par un message neutre et
 * le détail ne part que dans les journaux du serveur.
 */
export function publicErrorMessage(error: unknown, fallback = "Opération impossible pour le moment. Réessayez."): string {
  if (error instanceof Error && error.name === "ZodError") return "Données invalides";
  const technical =
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    !(error instanceof Error) ||
    error instanceof TypeError ||
    error instanceof RangeError ||
    error instanceof ReferenceError ||
    error instanceof SyntaxError ||
    /prisma|invalid `|database|ECONN|ETIMEDOUT|fetch failed|socket|stack/i.test(error.message);
  if (technical) {
    console.error("[api] erreur technique", error);
    return fallback;
  }
  return error.message.slice(0, 300);
}
