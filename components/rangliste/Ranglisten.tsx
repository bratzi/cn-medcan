"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";

import { RanglistenKarte } from "@/components/rangliste/RanglistenKarte";
import { buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { RanglistenAntwort } from "@/lib/query/rangliste";
import { parameter, RANGLISTEN, type Rangliste } from "@/lib/rangliste";

type Props = { texte: Woerterbuch["rangliste"]; sprache: Sprache };

type Ladung =
  | { art: "gast"; schluessel: string }
  | { art: "laedt"; schluessel: string }
  | { art: "fehler"; schluessel: string }
  | { art: "daten"; antwort: RanglistenAntwort; schluessel: string };

const HASH = /^#ranglisten-([a-z]+)-(\d+)$/;

function ausHash(hash: string): { nach: Rangliste; seite: number } {
  const treffer = HASH.exec(hash);
  return parameter(treffer?.[1] ?? null, treffer?.[2] ?? null);
}

// Der Hash ist der Zustand von Reiter und Seite. Er ist eine externe Quelle
// (Adressleiste); replaceState löst kein hashchange aus, also melden wir selbst.
const hoerer = new Set<() => void>();
function abonniere(rueck: () => void) {
  hoerer.add(rueck);
  // Zurück und Vor lösen popstate (und bei Hashwechsel hashchange) aus.
  window.addEventListener("hashchange", rueck);
  window.addEventListener("popstate", rueck);
  return () => {
    hoerer.delete(rueck);
    window.removeEventListener("hashchange", rueck);
    window.removeEventListener("popstate", rueck);
  };
}
const hashJetzt = () => window.location.hash;
const hashServer = () => "";
const nichts = () => () => {};

/**
 * Ranglisten je Sorte für Mitglieder (Spec Bewertungsbuch 5). /reviews ist
 * statisch; die Insel steht zuerst als Gast da (Anmelde-Hinweis, auch ohne
 * JavaScript) und lädt nach dem Einhängen von /api/ranglisten. Reiter und
 * Seite stehen im Hash, damit Zurück funktioniert.
 */
export function Ranglisten({ texte, sprache }: Props) {
  // Server und erste Client-Ausgabe: Gast. Erst danach (bereit) wird geladen.
  const bereit = useSyncExternalStore(nichts, () => true, () => false);
  const hash = useSyncExternalStore(abonniere, hashJetzt, hashServer);
  const { nach, seite } = ausHash(hash);
  const [versuch, setzeVersuch] = useState(0);
  const schluessel = `${nach}-${seite}-${versuch}`;
  const [ladung, setzeLadung] = useState<Ladung>({ art: "gast", schluessel: "" });
  const reiterRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!bereit) return;
    const abbruch = new AbortController();
    fetch(`/api/ranglisten?nach=${nach}&seite=${seite}`, { credentials: "same-origin", signal: abbruch.signal })
      .then(async (antwort) => {
        if (antwort.status === 401) return setzeLadung({ art: "gast", schluessel });
        if (!antwort.ok) return setzeLadung({ art: "fehler", schluessel });
        const daten = (await antwort.json()) as RanglistenAntwort;
        if (daten.seite !== seite) {
          // Seite jenseits der letzten: der Server hat begrenzt; den Hash angleichen (ersetzen, nicht stapeln).
          window.history.replaceState(null, "", `#ranglisten-${nach}-${daten.seite}`);
          hoerer.forEach((rueck) => rueck());
          return;
        }
        setzeLadung({ art: "daten", antwort: daten, schluessel });
      })
      .catch((fehler: unknown) => {
        if (fehler instanceof DOMException && fehler.name === "AbortError") return;
        setzeLadung({ art: "fehler", schluessel });
      });
    return () => abbruch.abort();
  }, [bereit, nach, seite, schluessel]);

  // Gilt die Ladung nicht für die gewählte Rangliste, wird gerade geladen.
  const zeige: Ladung = !bereit ? { art: "gast", schluessel } : ladung.schluessel === schluessel ? ladung : { art: "laedt", schluessel };

  const waehle = useCallback((neuNach: Rangliste, neuSeite: number) => {
    // pushState: jede Eingabe des Mitglieds ist ein Schritt für Zurück.
    window.history.pushState(null, "", `#ranglisten-${neuNach}-${neuSeite}`);
    hoerer.forEach((rueck) => rueck());
  }, []);
  function taste(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const letzter = RANGLISTEN.length - 1;
    let ziel: number;
    if (e.key === "ArrowRight") ziel = (index + 1) % RANGLISTEN.length;
    else if (e.key === "ArrowLeft") ziel = (index + letzter) % RANGLISTEN.length;
    else if (e.key === "Home") ziel = 0;
    else if (e.key === "End") ziel = letzter;
    else return;
    e.preventDefault();
    waehle(RANGLISTEN[ziel], 1);
    reiterRefs.current[ziel]?.focus();
  }

  // Bis die erste Antwort da ist, steht der Gast-Hinweis: keine Reiter und kein Skelett für Gäste.
  if (zeige.art === "gast" || ladung.schluessel === "") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="max-w-[68ch] text-pretty text-body">{texte.gast}</p>
        <Link prefetch={false} href="/anmelden?weiter=%2Freviews%23ranglisten" className={buttonKlassen("primary")}>
          {texte.anmelden}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div
        role="tablist"
        aria-label={texte.reiterLeiste}
        className="flex flex-wrap justify-center gap-x-8 gap-y-2"
      >
        {RANGLISTEN.map((id, index) => (
          <button
            key={id}
            ref={(el) => {
              reiterRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`rangliste-reiter-${id}`}
            aria-selected={nach === id}
            aria-controls="rangliste-tafel"
            tabIndex={nach === id ? 0 : -1}
            onClick={() => waehle(id, 1)}
            onKeyDown={(e) => taste(e, index)}
            className={cn(
              "inline-flex min-h-11 items-center text-h3 transition-colors duration-fast ease-standard hover:text-text",
              // cn mischt nicht: die Textfarbe steht je Zustand genau einmal.
              nach === id
                ? "text-text underline decoration-accent decoration-2 underline-offset-8"
                : "text-text-muted",
            )}
          >
            {texte.reiter[id]}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="rangliste-tafel" aria-labelledby={`rangliste-reiter-${nach}`} className="flex flex-col gap-8">
        {zeige.art === "laedt" ? (
          <div role="status" aria-label={texte.laedt} className="grid grid-cols-2 gap-x-4 gap-y-8 min-[640px]:gap-x-8 min-[1080px]:grid-cols-4">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} aria-hidden="true" className="aspect-square bg-surface-sunken" />
            ))}
          </div>
        ) : null}
        {zeige.art === "fehler" ? (
          <div role="alert" className="flex flex-col items-center gap-6 text-center">
            <p className="text-body">{texte.fehler}</p>
            <button type="button" className={buttonKlassen("secondary")} onClick={() => setzeVersuch((v) => v + 1)}>
              {texte.nochmal}
            </button>
          </div>
        ) : null}
        {zeige.art === "daten" ? (
          zeige.antwort.karten.length === 0 ? (
            <p className="text-center text-body text-text-muted">{nach === "uneins" ? texte.leerUneins : texte.leer}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 min-[640px]:gap-x-8 transition-opacity duration-fast starting:opacity-0 motion-reduce:transition-none min-[1080px]:grid-cols-4">
                {zeige.antwort.karten.map((karte) => (
                  <RanglistenKarte key={karte.slug} karte={karte} nach={nach} texte={texte} sprache={sprache} />
                ))}
              </div>
              {zeige.antwort.seiten > 1 ? (
                <nav aria-label={texte.seiten} className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: zeige.antwort.seiten }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={t(texte.seite, { seite: n })}
                      aria-current={n === seite ? "page" : undefined}
                      onClick={() => waehle(nach, n)}
                      className={cn(
                        "numeric inline-flex size-11 items-center justify-center rounded-full border text-small transition-colors duration-fast ease-standard",
                        n === seite
                          ? "border-accent bg-accent text-accent-fg"
                          : "border-border-strong text-text hover:border-text",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </nav>
              ) : null}
            </>
          )
        ) : null}
      </div>
    </div>
  );
}
