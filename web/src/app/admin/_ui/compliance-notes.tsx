"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ComplianceNoteRow = { id: string; createdAt: string; author: string; decision: string; note: string };

const DECISIONS: Record<string, { label: string; tone: string }> = {
  note: { label: "Note", tone: "bg-surface-soft text-ink" },
  released: { label: "Libéré", tone: "bg-success/10 text-success" },
  blocked: { label: "Bloqué", tone: "bg-danger/10 text-danger" },
  reported: { label: "Signalé à CANAFE", tone: "bg-warn/15 text-[#7a5308]" },
};

/** Signes d'alerte automatiques et journal des décisions de conformité d'un transfert (jamais visible du client). */
export function ComplianceSection({ reference, flags, notes }: { reference: string; flags: string[]; notes: ComplianceNoteRow[] }) {
  const router = useRouter();
  const [decision, setDecision] = useState("note");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/compliance-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, decision, note }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setNote("");
      setDecision("note");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="compliance-title" className="mt-6 rounded-3xl border border-line bg-white p-4 shadow-card sm:p-6">
      <h2 id="compliance-title" className="font-display text-lg font-semibold text-ink">Conformité</h2>
      <p className="mt-1 text-sm text-muted">Visible de l&apos;équipe seulement. Notez pourquoi vous libérez, bloquez ou signalez un transfert : ces notes sont conservées avec le dossier.</p>

      {flags.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {flags.map((f) => (
            <span key={f} className="rounded-full bg-warn/15 px-3 py-1 text-xs font-semibold text-[#7a5308]">À examiner : {f}</span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">Aucun signe d&apos;alerte automatique.</p>
      )}

      {notes.length ? (
        <ul className="mt-4 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-2xl border border-line p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${(DECISIONS[n.decision] ?? DECISIONS.note).tone}`}>{(DECISIONS[n.decision] ?? DECISIONS.note).label}</span>
                <span className="text-xs text-muted">
                  {n.author} · {new Date(n.createdAt).toLocaleString("fr-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-ink">{n.note}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 space-y-2">
        <label className="block text-xs font-semibold text-muted">
          Décision
          <select value={decision} onChange={(e) => setDecision(e.target.value)} className="mt-1 block w-full rounded-xl border border-line px-3 py-2 text-sm text-ink">
            {Object.entries(DECISIONS).map(([value, d]) => (
              <option key={value} value={value}>{d.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-muted">
          Note
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} className="mt-1 block w-full rounded-xl border border-line px-3 py-2 text-sm text-ink" placeholder="Ex. Payeur vérifié par courriel, montant cohérent avec l'occupation déclarée." />
        </label>
        {error ? <p role="alert" className="text-sm font-semibold text-danger">{error}</p> : null}
        <button type="button" onClick={() => void save()} disabled={busy || note.trim().length < 3} className="min-h-10 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Enregistrement…" : "Enregistrer la décision"}
        </button>
      </div>
    </section>
  );
}
