import { NextResponse } from "next/server";
import { z } from "zod";
import { isDbUnavailable, zodIssues } from "@/lib/requests";
import { AdminInputError } from "@/app/admin/_server/data";

/** Traduction commune des erreurs des API admin. */
export function adminError(error: unknown, scope: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ ok: false, error: "Données invalides", issues: zodIssues(error) }, { status: 400 });
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
