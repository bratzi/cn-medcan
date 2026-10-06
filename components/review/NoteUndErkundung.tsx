"use client";

import { useState, type ComponentProps } from "react";

import { AromaErkundung } from "@/components/review/AromaErkundung";
import { BlattNote, type BlattNoteTexte } from "@/components/review/BlattNote";
import type { Sprache } from "@/lib/i18n/sprache-kern";

/**
 * Blatt-Note über der Aroma-Erkundung als Vorführung der Startseite (Nutzer 2026-09-30: die
 * Blätter wie in der Blütenbewertung auch auf der Startseite). Start leer, nichts wird
 * gespeichert; die gewählte Note fließt wie im Formular ins „Dein Fazit“ (`eigeneGesamtnote`).
 * Client-Hülle, weil `AromaSektion` Server-Komponente ist: sie hält den Zustand selbst, vom
 * Server kommen nur Daten und fertige Elemente, keine Funktionen (Crash Session 35).
 */
export function NoteUndErkundung({
  blattTexte,
  sprache,
  bild,
  noteStart = null,
  ...erkundung
}: Omit<ComponentProps<typeof AromaErkundung>, "eigeneGesamtnote"> & {
  blattTexte: BlattNoteTexte;
  sprache: Sprache;
  /** Vorbelegte eigene Note (Bewertungsformular); die Startseite beginnt leer. */
  noteStart?: number | null;
}) {
  const [note, setNote] = useState<number | null>(noteStart);
  return (
    // Abstand wie im Bewertungsformular zwischen Blatt-Note und Erkundung.
    <div className="flex flex-col gap-16 md:gap-24">
      {/* Reihenfolge der Startseite (Nutzer 2026-10-06): Strainname im Sortenkopf, darunter die
          Gesamtnote, dann Overall. Der Sortenkopf steht deshalb hier und nicht in der Erkundung. */}
      {bild ? <div>{bild}</div> : null}
      <BlattNote start={noteStart} texte={blattTexte} sprache={sprache} onChange={setNote} />
      <AromaErkundung {...erkundung} eigeneGesamtnote={note} />
    </div>
  );
}
