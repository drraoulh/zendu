import { NextResponse } from "next/server";
import { z } from "zod";
import { isDbUnavailable, zodIssues } from "@/lib/requests";
import { AdminInputError } from "@/app/admin/_server/data";

/** Libellés des champs des formulaires admin (clients, demandes, colis). */
const ADMIN_FIELD_LABELS: Record<string, string> = {
  email: "courriel",
  password: "mot de passe",
  firstName: "prénom",
  lastName: "nom",
  phone: "téléphone",
  country: "pays",
  region: "province / région",
  birthDate: "date de naissance (JJ/MM/AAAA)",
  address: "adresse",
  kycStatus: "statut d'identité",
  kycNote: "motif",
  status: "statut",
  adminNote: "note interne",
  requestReference: "demande liée",
  origin: "origine",
  destination: "destination",
  mode: "mode",
  weightKg: "poids",
  recipientName: "destinataire",
  estimatedDelivery: "livraison estimée",
  label: "libellé",
  location: "lieu",
  at: "date et heure",
  initialLabel: "libellé",
  initialLocation: "lieu",
};

function adminErrorMessage(error: z.ZodError): string {
  const unknown = error.issues.flatMap((i) => (i.code === "unrecognized_keys" ? i.keys : []));
  if (unknown.length) return `Champ non modifiable : ${unknown.join(", ")}.`;
  const labels = [...new Set(error.issues.map((i) => ADMIN_FIELD_LABELS[String(i.path[0] ?? "")] ?? String(i.path[0] ?? "")))].filter(Boolean);
  return labels.length ? `Champs invalides ou manquants : ${labels.join(", ")}.` : "Données invalides";
}

/** Traduction commune des erreurs des API admin. */
export function adminError(error: unknown, scope: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ ok: false, error: adminErrorMessage(error), issues: zodIssues(error) }, { status: 400 });
  }
  if (error instanceof AdminInputError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }
  if (isDbUnavailable(error)) {
    console.error(`[admin:${scope}] base indisponible ou table absente`, error);
    return NextResponse.json({ ok: false, code: "db_unavailable", error: "Base de données indisponible" }, { status: 503 });
  }
  console.error(`[admin:${scope}] erreur inattendue`, error);
  return NextResponse.json({ ok: false, error: "Erreur inattendue" }, { status: 500 });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export const notFound = () => NextResponse.json({ ok: false, error: "Introuvable" }, { status: 404 });
