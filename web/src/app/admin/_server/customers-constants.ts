/** Partagé client/serveur (le module customers.ts importe Prisma et ne doit pas aller dans le navigateur). */
export const KYC_STATUSES = ["none", "pending", "verified", "rejected"] as const;
export const CUSTOMER_STATUSES = ["active", "suspended"] as const;
