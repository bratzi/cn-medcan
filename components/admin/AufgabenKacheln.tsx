import Link from "next/link";

import { Card } from "@/components/ui";
import { kachelReihenfolge, type AdminZaehler } from "@/lib/admin-aufgaben";

/** Offene Aufgaben je Bereich; Kacheln mit Zahl vorn, leere gedämpft (Spec Übersicht). */
export function AufgabenKacheln({ zaehler }: { zaehler: AdminZaehler }) {
  return (
    <section aria-labelledby="aufgaben-titel" className="flex flex-col gap-4">
      <h2 id="aufgaben-titel" className="text-h3 text-text">Aufgaben</h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kachelReihenfolge(zaehler).map((b) => {
          const zahl = b.zaehlt ? zaehler[b.id] : undefined;
          const offen = typeof zahl === "number" && zahl > 0;
          return (
            <li key={b.id}>
              <Link prefetch={false} href={b.href} className="block h-full rounded-lg">
                <Card className={`flex h-full min-h-24 flex-col justify-between gap-2 p-4 ${offen ? "" : "opacity-70"}`}>
                  <span className="text-body text-text wrap-break-word">{b.titel}</span>
                  {b.zaehlt ? (
                    <span className={`numeric text-h2 ${offen ? "text-text" : "text-text-muted"}`}>{zahl === null ? "–" : (zahl ?? 0)}</span>
                  ) : (
                    <span className="text-small text-text-muted">Öffnen</span>
                  )}
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
