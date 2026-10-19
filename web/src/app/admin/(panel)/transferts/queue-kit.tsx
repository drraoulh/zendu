"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { adminMessages } from "@/i18n/admin";

/** Montant brut à saisir dans une appli de versement : « 60578 », « 12.50 » (sans espace ni devise). */
export function rawAmount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Bouton « Copier » (presse-papiers), avec retour visuel. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useT(adminMessages);
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Presse-papiers indisponible (http, ancien navigateur) : la valeur reste sélectionnable.
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={t("copyWhat", { label })}
      className={`inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
        copied ? "border-success/40 bg-success/10 text-success" : "border-line bg-white text-brand hover:border-brand/40"
      }`}
    >
      <Icon name={copied ? "check" : "receipt"} className="h-3.5 w-3.5" />
      {copied ? t("copied") : t("copy")}
    </button>
  );
}

/** Ligne « libellé / valeur » copiable d'une fiche de versement. */
export function CopyRow({ label, value, display, strong }: { label: string; value: string; display?: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className={`break-all select-all ${strong ? "font-display text-lg font-extrabold text-ink" : "font-mono text-sm font-semibold text-ink"}`}>
          {display ?? value}
        </dd>
      </div>
      {value ? <CopyButton value={value} label={label} /> : null}
    </div>
  );
}

/**
 * Appel d'une action opérateur : renvoie la réponse JSON, ou lève une Error au message lisible
 * (session expirée, réseau, message du serveur).
 */
export async function adminAction(
  url: string,
  init: { method?: "GET" | "POST"; body?: unknown },
  t: (key: "errNetwork" | "errSession") => string,
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? "POST",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new Error(t("errNetwork"));
  }
  const data = (await res.json().catch(() => ({}))) as { error?: unknown };
  if (res.status === 401) throw new Error(t("errSession"));
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
  return data;
}
