import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { customerCounts } from "./customers";
import { prisma } from "@/lib/prisma";
import {
  appointmentSlotKey,
  generateShipmentNumber,
  isRequestKind,
  isRequestStatus,
  isUniqueViolation,
  REQUEST_STATUSES,
  SHIPMENT_STATUSES,
  SHIPPING_MODES,
} from "@/lib/requests";

/* Types sérialisables partagés entre pages serveur, composants client et API admin. */

export type AdminRequest = {
  id: string;
  reference: string;
  kind: string;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  locale: string | null;
  payload: Record<string, unknown>;
  adminNote: string | null;
  slotKey: string | null;
  createdAt: string;
  updatedAt: string;
  shipments: { number: string; status: string }[];
};

export type AdminShipmentEvent = {
  id: string;
  status: string;
  label: string;
  location: string | null;
  at: string;
};

export type AdminShipment = {
  id: string;
  number: string;
  requestId: string | null;
  requestReference: string | null;
  origin: string;
  destination: string;
  mode: string;
  status: string;
  weightKg: number | null;
  estimatedDelivery: string | null;
  recipientName: string | null;
  createdAt: string;
  updatedAt: string;
  events: AdminShipmentEvent[];
};

const requestInclude = { shipments: { select: { number: true, status: true }, orderBy: { createdAt: "asc" } } } as const;
const shipmentInclude = {
  request: { select: { reference: true } },
  events: { orderBy: { at: "asc" } },
} as const;

type RequestRow = Prisma.ServiceRequestGetPayload<{ include: typeof requestInclude }>;
type ShipmentRow = Prisma.ShipmentGetPayload<{ include: typeof shipmentInclude }>;

export function serializeRequest(r: RequestRow): AdminRequest {
  return {
    id: r.id,
    reference: r.reference,
    kind: r.kind,
    status: r.status,
    name: r.name,
    email: r.email,
    phone: r.phone,
    locale: r.locale,
    payload: r.payload && typeof r.payload === "object" && !Array.isArray(r.payload) ? (r.payload as Record<string, unknown>) : {},
    adminNote: r.adminNote,
    slotKey: r.slotKey,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    shipments: r.shipments,
  };
}

export function serializeShipment(s: ShipmentRow): AdminShipment {
  return {
    id: s.id,
    number: s.number,
    requestId: s.requestId,
    requestReference: s.request?.reference ?? null,
    origin: s.origin,
    destination: s.destination,
    mode: s.mode,
    status: s.status,
    weightKg: s.weightKg,
    estimatedDelivery: s.estimatedDelivery ? s.estimatedDelivery.toISOString().slice(0, 10) : null,
    recipientName: s.recipientName,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    events: s.events.map((e) => ({
      id: e.id,
      status: e.status,
      label: e.label,
      location: e.location,
      at: e.at.toISOString(),
    })),
  };
}

/* ------------------------------------------------------------------ Demandes */

export const REQUESTS_PAGE_SIZE = 50;

export type RequestFilters = { kind?: string; status?: string; q?: string; page?: number };

export function parseRequestFilters(sp: URLSearchParams | Record<string, string | string[] | undefined>): RequestFilters {
  const get = (k: string) => {
    const v = sp instanceof URLSearchParams ? sp.get(k) : sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const page = Number(get("page") ?? "1");
  return {
    kind: isRequestKind(get("kind")) ? get("kind") : undefined,
    status: isRequestStatus(get("status")) ? get("status") : undefined,
    q: get("q")?.slice(0, 120),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export async function listRequests(filters: RequestFilters) {
  const where: Prisma.ServiceRequestWhereInput = {
    ...(filters.kind ? { kind: filters.kind } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
            { reference: { contains: filters.q.replace(/\s+/g, ""), mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const page = filters.page ?? 1;
  const [rows, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * REQUESTS_PAGE_SIZE,
      take: REQUESTS_PAGE_SIZE,
    }),
    prisma.serviceRequest.count({ where }),
  ]);
  return { rows: rows.map(serializeRequest), total, page, pageSize: REQUESTS_PAGE_SIZE };
}

export async function getRequest(reference: string): Promise<AdminRequest | null> {
  const r = await prisma.serviceRequest.findUnique({ where: { reference }, include: requestInclude });
  return r ? serializeRequest(r) : null;
}

export const requestPatchSchema = z
  .object({
    status: z.enum(REQUEST_STATUSES).optional(),
    adminNote: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().max(5000).nullable().optional()),
  })
  .refine((v) => v.status !== undefined || v.adminNote !== undefined, "Rien à modifier");

/**
 * Met à jour statut / note. Rendez-vous : « closed » libère le créneau (slotKey → null) ;
 * rouvrir tente de le reprendre (warning "slot_taken" si quelqu'un l'a réservé entre-temps).
 */
export async function patchRequest(
  reference: string,
  patch: z.infer<typeof requestPatchSchema>,
): Promise<{ request: AdminRequest; warning?: string } | null> {
  const current = await prisma.serviceRequest.findUnique({ where: { reference } });
  if (!current) return null;

  const data: Prisma.ServiceRequestUpdateInput = {};
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.adminNote !== undefined) data.adminNote = patch.adminNote;

  let warning: string | undefined;
  if (current.kind === "finance_appointment" && patch.status !== undefined) {
    if (patch.status === "closed") data.slotKey = null;
    else if (!current.slotKey) {
      const p = current.payload as { date?: unknown; time?: unknown } | null;
      if (p && typeof p.date === "string" && typeof p.time === "string") data.slotKey = appointmentSlotKey(p.date, p.time);
    }
  }

  try {
    const r = await prisma.serviceRequest.update({ where: { reference }, data, include: requestInclude });
    return { request: serializeRequest(r) };
  } catch (error) {
    if (isUniqueViolation(error, "slotKey")) {
      delete data.slotKey;
      warning = "slot_taken";
      const r = await prisma.serviceRequest.update({ where: { reference }, data, include: requestInclude });
      return { request: serializeRequest(r), warning };
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ Colis */

export type ShipmentFilters = { status?: string; q?: string };

export function parseShipmentFilters(sp: URLSearchParams | Record<string, string | string[] | undefined>): ShipmentFilters {
  const get = (k: string) => {
    const v = sp instanceof URLSearchParams ? sp.get(k) : sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const status = get("status");
  return {
    status: status === "active" || (SHIPMENT_STATUSES as readonly string[]).includes(status ?? "") ? status : undefined,
    q: get("q")?.slice(0, 120),
  };
}

export async function listShipments(filters: ShipmentFilters) {
  const where: Prisma.ShipmentWhereInput = {
    ...(filters.status === "active"
      ? { status: { notIn: ["delivered"] } }
      : filters.status
        ? { status: filters.status }
        : {}),
    ...(filters.q
      ? {
          OR: [
            { number: { contains: filters.q.replace(/\s+/g, ""), mode: "insensitive" } },
            { origin: { contains: filters.q, mode: "insensitive" } },
            { destination: { contains: filters.q, mode: "insensitive" } },
            { recipientName: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const rows = await prisma.shipment.findMany({ where, include: shipmentInclude, orderBy: { createdAt: "desc" }, take: 200 });
  return rows.map(serializeShipment);
}

export async function getShipment(number: string): Promise<AdminShipment | null> {
  const s = await prisma.shipment.findUnique({ where: { number }, include: shipmentInclude });
  return s ? serializeShipment(s) : null;
}

const blank = (v: unknown) => (v === null || (typeof v === "string" && v.trim() === "") ? null : v);
const dateOnly = z.preprocess(blank, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional());

export const shipmentCreateSchema = z.object({
  /** Référence ou id d'une demande shipping_quote : pré-remplit les champs manquants. */
  requestReference: z.string().trim().max(40).optional(),
  origin: z.preprocess(blank, z.string().trim().min(2).max(120).nullable().optional()),
  destination: z.preprocess(blank, z.string().trim().min(2).max(120).nullable().optional()),
  mode: z.preprocess(blank, z.enum(SHIPPING_MODES).nullable().optional()),
  status: z.enum(SHIPMENT_STATUSES).default("received"),
  weightKg: z.preprocess(blank, z.coerce.number().finite().positive().max(100000).nullable().optional()),
  estimatedDelivery: dateOnly,
  recipientName: z.preprocess(blank, z.string().trim().max(160).nullable().optional()),
  /** Libellé du premier événement de suivi (dans la langue de l'équipe). */
  initialLabel: z.preprocess(blank, z.string().trim().max(200).nullable().optional()),
  initialLocation: z.preprocess(blank, z.string().trim().max(160).nullable().optional()),
});

export class AdminInputError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

const toDate = (d: string | null | undefined) => (d ? new Date(`${d}T00:00:00.000Z`) : d === null ? null : undefined);

export async function createShipment(input: z.infer<typeof shipmentCreateSchema>): Promise<AdminShipment> {
  let fromRequest: { id: string; name: string; payload: Record<string, unknown> } | null = null;
  if (input.requestReference) {
    const r = await prisma.serviceRequest.findUnique({ where: { reference: input.requestReference.toUpperCase() } });
    if (!r) throw new AdminInputError("Demande introuvable", 404);
    if (r.kind !== "shipping_quote") throw new AdminInputError("La demande n'est pas un devis shipping");
    fromRequest = { id: r.id, name: r.name, payload: (r.payload ?? {}) as Record<string, unknown> };
  }
  const p = fromRequest?.payload ?? {};
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const origin = input.origin ?? str(p.origin);
  const destination = input.destination ?? str(p.destination);
  const modeRaw = input.mode ?? str(p.mode);
  const mode = modeRaw === "air" || modeRaw === "sea" ? modeRaw : null;
  const weight = input.weightKg ?? (typeof p.weightKg === "number" ? p.weightKg : null);
  if (!origin || !destination || !mode) throw new AdminInputError("Origine, destination et mode requis");

  for (let attempt = 0; attempt < 8; attempt++) {
    const number = generateShipmentNumber();
    try {
      const s = await prisma.shipment.create({
        data: {
          number,
          requestId: fromRequest?.id ?? null,
          origin,
          destination,
          mode,
          status: input.status,
          weightKg: weight,
          estimatedDelivery: toDate(input.estimatedDelivery) ?? null,
          recipientName: input.recipientName ?? fromRequest?.name ?? null,
          events: {
            create: {
              status: input.status,
              label: input.initialLabel ?? "Colis enregistré",
              location: input.initialLocation ?? null,
            },
          },
        },
        include: shipmentInclude,
      });
      return serializeShipment(s);
    } catch (error) {
      if (isUniqueViolation(error, "number")) continue;
      throw error;
    }
  }
  throw new AdminInputError("Impossible de générer un numéro de colis", 500);
}

export const shipmentPatchSchema = z.object({
  status: z.enum(SHIPMENT_STATUSES).optional(),
  estimatedDelivery: dateOnly,
  origin: z.string().trim().min(2).max(120).optional(),
  destination: z.string().trim().min(2).max(120).optional(),
  mode: z.enum(SHIPPING_MODES).optional(),
  weightKg: z.preprocess(blank, z.coerce.number().finite().positive().max(100000).nullable().optional()),
  recipientName: z.preprocess(blank, z.string().trim().max(160).nullable().optional()),
});

export async function patchShipment(number: string, patch: z.infer<typeof shipmentPatchSchema>) {
  const exists = await prisma.shipment.findUnique({ where: { number }, select: { id: true } });
  if (!exists) return null;
  const s = await prisma.shipment.update({
    where: { number },
    data: {
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.estimatedDelivery !== undefined ? { estimatedDelivery: toDate(patch.estimatedDelivery) } : {}),
      ...(patch.origin !== undefined ? { origin: patch.origin } : {}),
      ...(patch.destination !== undefined ? { destination: patch.destination } : {}),
      ...(patch.mode !== undefined ? { mode: patch.mode } : {}),
      ...(patch.weightKg !== undefined ? { weightKg: patch.weightKg } : {}),
      ...(patch.recipientName !== undefined ? { recipientName: patch.recipientName } : {}),
    },
    include: shipmentInclude,
  });
  return serializeShipment(s);
}

export const shipmentEventSchema = z.object({
  status: z.enum(SHIPMENT_STATUSES),
  label: z.string().trim().min(2).max(200),
  location: z.preprocess(blank, z.string().trim().max(160).nullable().optional()),
  /** ISO 8601 ; défaut : maintenant. */
  at: z.preprocess(blank, z.iso.datetime({ offset: true }).nullable().optional()),
  /** Met aussi à jour le statut du colis (défaut : oui). */
  updateShipment: z.boolean().default(true),
});

export async function addShipmentEvent(number: string, input: z.infer<typeof shipmentEventSchema>) {
  const s = await prisma.shipment.findUnique({ where: { number }, select: { id: true } });
  if (!s) return null;
  await prisma.$transaction([
    prisma.shipmentEvent.create({
      data: {
        shipmentId: s.id,
        status: input.status,
        label: input.label,
        location: input.location ?? null,
        at: input.at ? new Date(input.at) : new Date(),
      },
    }),
    ...(input.updateShipment ? [prisma.shipment.update({ where: { id: s.id }, data: { status: input.status } })] : []),
  ]);
  return getShipment(number);
}

export async function deleteShipmentEvent(number: string, eventId: string) {
  const s = await prisma.shipment.findUnique({ where: { number }, select: { id: true } });
  if (!s) return null;
  await prisma.shipmentEvent.deleteMany({ where: { id: eventId, shipmentId: s.id } });
  return getShipment(number);
}

/* ------------------------------------------------------------------ Vue d'ensemble */

export async function overviewCounts() {
  const [byKindStatus, shipmentsByStatus, transfersByStatus, recentRequests, customers] = await Promise.all([
    prisma.serviceRequest.groupBy({ by: ["kind", "status"], _count: { _all: true } }),
    prisma.shipment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.transfer.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => null),
    prisma.serviceRequest.findMany({ include: requestInclude, orderBy: { createdAt: "desc" }, take: 6 }),
    // Table Customer absente (migration non exécutée) : la vue d'ensemble reste disponible.
    customerCounts().catch(() => null),
  ]);
  return {
    requests: byKindStatus.map((r) => ({ kind: r.kind, status: r.status, count: r._count._all })),
    shipments: shipmentsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
    transfers: transfersByStatus?.map((r) => ({ status: r.status, count: r._count._all })) ?? null,
    recentRequests: recentRequests.map(serializeRequest),
    customers,
  };
}
