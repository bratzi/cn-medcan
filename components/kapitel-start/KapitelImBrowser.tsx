"use client";

import { useDeferredValue, useEffect, useRef, ViewTransition } from "react";
import Link from "next/link";

import { KapitelAufschlag, type KapitelTexte } from "@/components/kapitel-start/KapitelAufschlag";
import { useStartSitzung } from "@/components/story/StartSitzung";
import { buttonKlassen } from "@/components/ui";
import type { KapitelDaten } from "@/lib/kapitel-start";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { istMitglied, kapitelAnzeige } from "@/lib/startseite-sitzung";

/**
 * Schaufenster oder eigenes Kapitel (Spec Dein Kapitel 4.3). Das statische HTML trägt das
 * Schaufenster; kommt die Sitzung mit einem Kapitel zurück, schlägt das Buch das eigene auf
 * (ViewTransition, bei reduzierter Bewegung sofort). Laden und Fehler lassen das Schaufenster stehen;
 * ein Mitglied, dessen Kapitel nicht kam, sieht dort aber kein „Konto anlegen“.
 */
export function KapitelImBrowser({
  schaufenster,
  texte,
  sprache,
}: {
  schaufenster: KapitelDaten | null;
  texte: KapitelTexte;
  sprache: Sprache;
}) {
  const sitzung = useStartSitzung();
  // useDeferredValue statt setState: nur Transitions, Suspense und useDeferredValue lösen die
  // ViewTransition aus (Next-Doku view-transitions), ein einfaches setState in StartSitzung nicht.
  const eigenes = useDeferredValue(sitzung ? kapitelAnzeige(sitzung.stand) : null);
  const mitglied = sitzung ? istMitglied(sitzung.stand) : false;

  // Beim Umblättern verschwindet der Knoten mit dem Fokus; lag er im Kapitel, kommt der Fokus auf
  // das neue Kapitel statt auf <body> (Minor Dein Kapitel). Ohne Scrollen, der Leser bleibt, wo er ist.
  const huelle = useRef<HTMLDivElement>(null);
  const fokusDrin = useRef(false);
  const erstes = useRef(true);
  useEffect(() => {
    if (erstes.current) {
      erstes.current = false;
      return;
    }
    const el = huelle.current;
    if (!el || !fokusDrin.current) return;
    const aktiv = document.activeElement;
    if (!aktiv || aktiv === document.body || !el.contains(aktiv)) el.focus({ preventScroll: true });
  }, [eigenes]);

  const k = texte.kapitel;
  const inhalt = eigenes ? (
    <KapitelAufschlag daten={eigenes} art="eigen" texte={texte} sprache={sprache} />
  ) : schaufenster ? (
    <KapitelAufschlag daten={schaufenster} art="schaufenster" texte={texte} sprache={sprache} mitglied={mitglied} />
  ) : (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="max-w-[48ch] text-body text-text-muted text-pretty">{k.satzGast}</p>
      <Link prefetch={false} href={mitglied ? "/profil" : "/registrieren"} className={buttonKlassen("primary")}>
        {mitglied ? k.zumKapitel : k.kontoAnlegen}
      </Link>
    </div>
  );

  return (
    <div
      ref={huelle}
      tabIndex={-1}
      onFocus={() => {
        fokusDrin.current = true;
      }}
      onBlur={(e) => {
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) fokusDrin.current = false;
      }}
      className="outline-none"
    >
      <ViewTransition key={eigenes ? "eigen" : "schaufenster"} enter="auto" exit="auto" default="none">
        <div>{inhalt}</div>
      </ViewTransition>
      <p aria-live="polite" className="sr-only">
        {eigenes ? k.geladen : ""}
      </p>
    </div>
  );
}
