"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { adminFetch, Field, inputClass, Message, Panel } from "./kit";

type Result = { ok: boolean; status: number | null; detail: string; sender: string | null };

/** Diagnostic de l'envoi des codes par courriel (Brevo) : affiche la réponse exacte de Brevo. */
export function EmailTestPanel() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await adminFetch<Result>("/api/admin/email-test", "POST", { to: String(new FormData(e.currentTarget).get("to") ?? "") }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Test d'envoi des courriels (codes de connexion)" id="sec-email">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field id="email-test-to" label="Envoyer un courriel de test à">
          <input id="email-test-to" name="to" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Button type="submit" disabled={busy}>
          Envoyer le test
        </Button>
      </form>
      {error && (
        <div className="mt-3">
          <Message ok={false}>{error}</Message>
        </div>
      )}
      {result && (
        <div className="mt-3 space-y-2">
          <Message ok={result.ok}>
            {result.ok
              ? "Brevo a accepté l'envoi : vérifiez la boîte de réception (et les indésirables)."
              : `Brevo a refusé l'envoi${result.status ? ` (code ${result.status})` : ""}.`}
          </Message>
          {result.sender && <p className="text-xs text-muted">Expéditeur utilisé : {result.sender}</p>}
          {!result.ok && result.detail && (
            <pre className="whitespace-pre-wrap break-all rounded-xl bg-surface-soft p-3 font-mono text-xs text-ink">{result.detail}</pre>
          )}
        </div>
      )}
    </Panel>
  );
}
