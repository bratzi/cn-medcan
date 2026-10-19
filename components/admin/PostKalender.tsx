import { Badge } from "@/components/ui";
import type { BadgeVariante } from "@/components/ui";
import { ueberfaellig, type Kalender } from "@/lib/admin-kalender";
import type { PostArt, PubloraZeile } from "@/lib/publora-sync";

const ART: Record<PostArt, string> = { karussell: "Karussell", reel: "Reel", story: "Story", bild: "Bild" };
const STATUS: Record<string, [string, BadgeVariante]> = {
  scheduled: ["geplant", "neutral"],
  draft: ["Entwurf", "warning"],
  published: ["veröffentlicht", "success"],
  failed: ["fehlgeschlagen", "danger"],
  unbekannt: ["unbekannt", "neutral"],
};
const UHR = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
const TAG = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long" });
const STAND = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Zeile({ p }: { p: PubloraZeile }) {
  const [text, variante] = STATUS[p.status] ?? STATUS.unbekannt;
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
      {p.geplantAm ? <span className="numeric w-12 text-body text-text">{UHR.format(new Date(p.geplantAm))}</span> : null}
      <span className="text-small text-text-muted">{ART[p.art]}</span>
      <span className="min-w-0 flex-1 text-body text-text wrap-break-word">{p.titel || "Ohne Titel"}</span>
      <Badge variante={variante}>{text}</Badge>
      {ueberfaellig(p) ? <Badge variante="danger">überfällig</Badge> : null}
    </li>
  );
}

/** Nächste 14 Tage nach Tag, Entwürfe ohne Termin, letzte 7 Tage eingeklappt. Zeigt nur, plant nichts. */
export function PostKalender({ kalender: k }: { kalender: Kalender }) {
  return (
    <section aria-labelledby="kalender-titel" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="kalender-titel" className="text-h3 text-text">Instagram-Kalender</h2>
        {k.stand ? <span className="numeric text-small text-text-muted">Stand: {STAND.format(new Date(k.stand))}</span> : null}
      </div>
      {k.veraltet ? (
        <p role="status" className="border border-warning bg-surface-raised p-4 text-body text-text">Kalender veraltet, Routine prüfen.</p>
      ) : (
        <>
          {k.kommend.length === 0 ? <p className="text-body text-text-muted">In den nächsten 14 Tagen ist nichts geplant.</p> : null}
          {k.kommend.map((t) => (
            <div key={t.tag} className="flex flex-col">
              <h3 className="text-body font-medium text-text">{TAG.format(new Date(`${t.tag}T12:00:00Z`))}</h3>
              <ul className="divide-y divide-border">{t.posts.map((p) => <Zeile key={p.id} p={p} />)}</ul>
            </div>
          ))}
          <div className="flex flex-col">
            <h3 className="text-body font-medium text-text">Entwürfe ohne Termin <span className="numeric text-text-muted">({k.entwuerfeGesamt})</span></h3>
            <ul className="divide-y divide-border">{k.entwuerfe.map((p) => <Zeile key={p.id} p={p} />)}</ul>
          </div>
          {k.vergangen.length > 0 ? (
            <details>
              <summary className="flex min-h-11 cursor-pointer items-center text-body text-text">Letzte 7 Tage ({k.vergangen.length})</summary>
              <ul className="divide-y divide-border">{k.vergangen.map((p) => <Zeile key={p.id} p={p} />)}</ul>
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}
