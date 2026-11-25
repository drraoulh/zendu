import type { Metadata } from "next";
import { parseDay, reconciliation, type ReconDay } from "@/lib/compliance";
import { requireAdminPage } from "../../_server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rapprochement" };

const money = (n: number, cur = "CAD") => new Intl.NumberFormat("fr-CA", { style: "currency", currency: cur, maximumFractionDigits: 2 }).format(n);
const day = (iso: string) => new Date(iso).toLocaleString("fr-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" });
const plain = (n: number) => new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 0 }).format(n);

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ReconciliationPage({ searchParams }: Props) {
  await requireAdminPage("/admin/rapprochement");
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const todayEnd = new Date();
  const toDay = parseDay(one(sp.to));
  const to = new Date((toDay ?? todayEnd).getTime() + (toDay ? 86_400_000 : 0));
  const from = parseDay(one(sp.from)) ?? new Date(to.getTime() - 14 * 86_400_000);
  const valid = from < to && to.getTime() - from.getTime() <= 366 * 86_400_000;
  const data = valid ? await reconciliation(from, to).catch((e: unknown) => (console.error("[admin] rapprochement", e), null)) : null;
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const fromStr = one(sp.from) || iso(from);
  const toStr = one(sp.to) || iso(todayEnd);
  const csvHref = `/api/admin/reports/reconciliation?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}&format=csv`;
  const totals = (data?.days ?? []).reduce(
    (a: { received: number; delivered: number; margin: number; fees: number }, d: ReconDay) => ({ received: a.received + d.receivedCad, delivered: a.delivered + d.deliveredCount, margin: a.margin + d.estimatedMarginCad, fees: a.fees + d.feesCad }),
    { received: 0, delivered: 0, margin: 0, fees: 0 },
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Rapprochement</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            À faire chaque soir : l&apos;argent reçu par Interac doit correspondre aux versements faits. La marge est une <strong>estimation</strong> (frais + marge de change au taux de référence), pas un chiffre comptable.
          </p>
        </div>
        <a href={csvHref} className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Exporter en CSV
        </a>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4" method="get">
        <label className="text-xs font-semibold text-muted">
          Du
          <input type="date" name="from" defaultValue={fromStr} className="mt-1 block rounded-xl border border-line px-3 py-2 text-sm text-ink" />
        </label>
        <label className="text-xs font-semibold text-muted">
          Au (inclus)
          <input type="date" name="to" defaultValue={toStr} className="mt-1 block rounded-xl border border-line px-3 py-2 text-sm text-ink" />
        </label>
        <button className="min-h-10 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-soft">Afficher</button>
      </form>

      {!valid ? (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">Période invalide (366 jours au maximum).</p>
      ) : !data ? (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">Base de données indisponible. Réessayez dans un instant.</p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              ["Argent reçu (CAD)", money(totals.received)],
              ["Transferts livrés", String(totals.delivered)],
              ["Frais encaissés", money(totals.fees)],
              ["Marge estimée", money(totals.margin)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-white p-4">
                <p className="text-xs font-semibold text-muted">{label}</p>
                <p className="mt-1 font-display text-xl font-semibold text-ink">{value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-6" aria-labelledby="recon-issues">
            <h2 id="recon-issues" className="font-display text-lg font-semibold text-ink">
              À vérifier {data.issues.length ? `(${data.issues.length})` : ""}
            </h2>
            {data.issues.length ? (
              <ul className="mt-3 divide-y divide-line text-sm">
                {data.issues.map((i) => (
                  <li key={`${i.reference}-${i.reason}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <a href={`/admin/transferts/${i.reference}`} className="font-mono text-xs font-semibold text-brand hover:underline">{i.reference}</a>
                    <span className="min-w-0 flex-1 px-2 text-ink">{i.reason}</span>
                    <span className="text-xs text-muted">depuis {day(i.since)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Aucun écart détecté sur cette période.</p>
            )}
          </section>

          <section className="overflow-x-auto rounded-3xl border border-line bg-white p-4 shadow-card sm:p-6" aria-labelledby="recon-days">
            <h2 id="recon-days" className="font-display text-lg font-semibold text-ink">Jour par jour (heure de Toronto)</h2>
            <table className="mt-3 w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted">
                  <th className="py-2">Jour</th>
                  <th className="py-2 text-right">Reçus</th>
                  <th className="py-2 text-right">Argent reçu</th>
                  <th className="py-2 text-right">Livrés</th>
                  <th className="py-2 text-right">Versé</th>
                  <th className="py-2 text-right">Frais</th>
                  <th className="py-2 text-right">Marge estimée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.days.map((d) => (
                  <tr key={d.date}>
                    <td className="py-2 font-semibold text-ink">{d.date}</td>
                    <td className="py-2 text-right">{d.receivedCount}</td>
                    <td className="py-2 text-right">{money(d.receivedCad)}</td>
                    <td className="py-2 text-right">{d.deliveredCount}</td>
                    <td className="py-2 text-right">{Object.entries(d.paidOut).map(([cur, amt]) => `${plain(amt)} ${cur}`).join(" · ") || "—"}</td>
                    <td className="py-2 text-right">{money(d.feesCad)}</td>
                    <td className="py-2 text-right">{money(d.estimatedMarginCad)}</td>
                  </tr>
                ))}
                {!data.days.length && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted">Aucun mouvement sur cette période.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
