import type { Customer, Prisma } from "@prisma/client";
import { z } from "zod";
import { hashPassword, passwordProblem, temporaryPassword } from "@/lib/customer-auth";
import { addressSchema, emailSchema, profileFields } from "@/lib/customer-input";
import { maskAccount } from "@/lib/bank";
import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/requests";
import { AdminInputError } from "./data";

import { CUSTOMER_STATUSES, KYC_STATUSES } from "./customers-constants";

export { CUSTOMER_STATUSES, KYC_STATUSES };

export type AdminCustomer = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  country: string;
  region: string | null;
  birthDate: string | null;
  occupation: string | null;
  jobTitle: string | null;
  address: { line1: string; line2?: string; city: string; region: string; postalCode?: string } | null;
  kycStatus: string;
  kycDocument: string | null;
  kycSubmittedAt: string | null;
  kycReviewedAt: string | null;
  kycNote: string | null;
  status: string;
  marketing: boolean;
  adminNote: string | null;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  transferCount: number;
};

export type AdminCustomerTransfer = {
  id: string;
  reference: string;
  status: string;
  corridorId: string;
  totalCad: number;
  sendCurrency: string;
  receiveAmountXaf: number;
  receiveCurrency: string;
  recipient: string;
  network: string;
  account: string | null;
  createdAt: string;
};

export type AdminCustomerSession = { id: string; device: string | null; createdAt: string; lastUsedAt: string; expiresAt: string };

const iso = (d: Date | null) => (d ? d.toISOString() : null);

function serialize(c: Customer & { _count?: { transfers: number } }): AdminCustomer {
  return {
    id: c.id,
    email: c.email,
    phone: c.phone,
    firstName: c.firstName,
    lastName: c.lastName,
    country: c.country,
    region: c.region,
    birthDate: c.birthDate,
    occupation: c.occupation,
    jobTitle: c.jobTitle,
    address: (c.address as AdminCustomer["address"]) ?? null,
    kycStatus: c.kycStatus,
    kycDocument: c.kycDocument,
    kycSubmittedAt: iso(c.kycSubmittedAt),
    kycReviewedAt: iso(c.kycReviewedAt),
    kycNote: c.kycNote,
    status: c.status,
    marketing: c.marketing,
    adminNote: c.adminNote,
    mustChangePassword: c.mustChangePassword,
    lastLoginAt: iso(c.lastLoginAt),
    createdAt: c.createdAt.toISOString(),
    transferCount: c._count?.transfers ?? 0,
  };
}

export const CUSTOMERS_PAGE_SIZE = 50;
export type CustomerFilters = { kyc?: string; status?: string; q?: string; page?: number };

export function parseCustomerFilters(sp: URLSearchParams | Record<string, string | string[] | undefined>): CustomerFilters {
  const get = (k: string) => {
    const v = sp instanceof URLSearchParams ? sp.get(k) : sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const kyc = get("kyc");
  const status = get("status");
  const page = Number(get("page") ?? "1");
  return {
    kyc: kyc && (KYC_STATUSES as readonly string[]).includes(kyc) ? kyc : undefined,
    status: status && (CUSTOMER_STATUSES as readonly string[]).includes(status) ? status : undefined,
    q: get("q")?.slice(0, 100),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export async function listCustomers(f: CustomerFilters) {
  const where: Prisma.CustomerWhereInput = {
    ...(f.kyc ? { kycStatus: f.kyc } : {}),
    ...(f.status ? { status: f.status } : {}),
    ...(f.q
      ? {
          OR: [
            { email: { contains: f.q, mode: "insensitive" } },
            { firstName: { contains: f.q, mode: "insensitive" } },
            { lastName: { contains: f.q, mode: "insensitive" } },
            { phone: { contains: f.q } },
          ],
        }
      : {}),
  };
  const page = f.page ?? 1;
  const [rows, total, counts] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { transfers: true } } },
      // Dossiers KYC à traiter en premier, puis les plus récents.
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * CUSTOMERS_PAGE_SIZE,
      take: CUSTOMERS_PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
    prisma.customer.groupBy({ by: ["kycStatus"], _count: { _all: true } }),
  ]);
  return {
    rows: rows.map(serialize),
    total,
    page,
    pageSize: CUSTOMERS_PAGE_SIZE,
    kycCounts: Object.fromEntries(counts.map((c) => [c.kycStatus, c._count._all])) as Record<string, number>,
  };
}

export async function getCustomerDetail(id: string) {
  const c = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { transfers: true } },
      transfers: { include: { beneficiary: true }, orderBy: { createdAt: "desc" }, take: 30 },
      sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { lastUsedAt: "desc" } },
    },
  });
  if (!c) return null;
  const transfers: AdminCustomerTransfer[] = c.transfers.map((t) => ({
    id: t.id,
    reference: t.reference,
    status: t.status,
    corridorId: t.corridorId,
    totalCad: t.totalCad,
    sendCurrency: t.sendCurrency,
    receiveAmountXaf: t.receiveAmountXaf,
    receiveCurrency: t.receiveCurrency,
    recipient: t.beneficiary.fullName,
    network: t.beneficiary.network,
    account: t.beneficiary.accountNumber ? maskAccount(t.beneficiary.accountNumber) : null,
    createdAt: t.createdAt.toISOString(),
  }));
  const sessions: AdminCustomerSession[] = c.sessions.map((s) => ({
    id: s.id,
    device: s.device,
    createdAt: s.createdAt.toISOString(),
    lastUsedAt: s.lastUsedAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
  }));
  const totals = c.transfers.reduce<Record<string, number>>((acc, t) => {
    acc[t.sendCurrency] = (acc[t.sendCurrency] ?? 0) + t.totalCad;
    return acc;
  }, {});
  return { customer: serialize(c), transfers, sessions, totals };
}

export const customerCreateSchema = z.object({
  email: emailSchema,
  ...profileFields,
  /** Vide → mot de passe temporaire généré, à changer à la première connexion. */
  password: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(8).max(200).optional()),
  kycStatus: z.enum(KYC_STATUSES).default("none"),
  adminNote: z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().max(2000).optional()),
});

export async function createCustomer(input: z.infer<typeof customerCreateSchema>) {
  const { password, kycStatus, ...rest } = input;
  const temp = password ? null : temporaryPassword();
  const chosen = password ?? temp!;
  const weak = password ? passwordProblem(password) : null;
  if (weak) throw new AdminInputError(weak, 400);
  const now = new Date();
  try {
    const c = await prisma.customer.create({
      data: {
        ...rest,
        passwordHash: await hashPassword(chosen),
        passwordChangedAt: now,
        mustChangePassword: Boolean(temp),
        kycStatus,
        ...(kycStatus === "verified" ? { kycReviewedAt: now, kycSubmittedAt: now, kycNote: "Validé à la création par l'équipe" } : {}),
      },
      include: { _count: { select: { transfers: true } } },
    });
    return { customer: serialize(c), temporaryPassword: temp };
  } catch (error) {
    if (isUniqueViolation(error, "email")) throw new AdminInputError("Un compte existe déjà avec ce courriel.", 409);
    throw error;
  }
}

export const customerPatchSchema = z
  .object({
    kycStatus: z.enum(KYC_STATUSES).optional(),
    kycNote: z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(500).nullable().optional()),
    status: z.enum(CUSTOMER_STATUSES).optional(),
    adminNote: z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(2000).nullable().optional()),
    email: emailSchema.optional(),
    phone: profileFields.phone.optional(),
    firstName: profileFields.firstName.optional(),
    lastName: profileFields.lastName.optional(),
    birthDate: profileFields.birthDate,
    address: addressSchema.optional(),
  })
  .strict();

export async function patchCustomer(id: string, patch: z.infer<typeof customerPatchSchema>) {
  const data: Prisma.CustomerUpdateInput = { ...patch };
  if (patch.kycStatus) data.kycReviewedAt = patch.kycStatus === "verified" || patch.kycStatus === "rejected" ? new Date() : null;
  try {
    const c = await prisma.customer.update({ where: { id }, data, include: { _count: { select: { transfers: true } } } });
    // Compte suspendu : toutes ses sessions sont coupées immédiatement.
    if (patch.status === "suspended") {
      await prisma.customerSession.updateMany({ where: { customerId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    return serialize(c);
  } catch (error) {
    if (isUniqueViolation(error, "email")) throw new AdminInputError("Ce courriel est déjà utilisé.", 409);
    if ((error as { code?: string }).code === "P2025") return null;
    throw error;
  }
}

/** Mot de passe temporaire (changement imposé à la connexion) + déconnexion de tous les appareils. */
export async function resetCustomerPassword(id: string) {
  const temp = temporaryPassword();
  const found = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
  if (!found) return null;
  await prisma.$transaction([
    prisma.customer.update({
      where: { id },
      data: { passwordHash: await hashPassword(temp), mustChangePassword: true, passwordChangedAt: new Date() },
    }),
    prisma.customerSession.updateMany({ where: { customerId: id, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  return temp;
}

export async function revokeCustomerSessions(id: string, sessionId?: string) {
  const { count } = await prisma.customerSession.updateMany({
    where: { customerId: id, revokedAt: null, ...(sessionId ? { id: sessionId } : {}) },
    data: { revokedAt: new Date() },
  });
  return count;
}

export async function deleteCustomer(id: string) {
  const { count } = await prisma.customer.deleteMany({ where: { id } });
  return count > 0;
}

export async function customerCounts() {
  const [byKyc, total, active30] = await Promise.all([
    prisma.customer.groupBy({ by: ["kycStatus"], _count: { _all: true } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { lastLoginAt: { gt: new Date(Date.now() - 30 * 86_400_000) } } }),
  ]);
  return { total, active30, byKyc: Object.fromEntries(byKyc.map((r) => [r.kycStatus, r._count._all])) as Record<string, number> };
}
