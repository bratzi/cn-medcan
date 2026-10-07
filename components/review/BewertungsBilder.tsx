"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { bewertungsbildEntfernen } from "@/app/[lang]/blueten/[slug]/bewertungsbild-aktionen";
import { BudpicBild } from "@/components/medien/Bild";
import { Button } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import type { VorbelegtesBild } from "@/lib/bewertung-vorbelegung";
import { annehmbareDateien, bilderFrei } from "@/lib/bewertungsbilder";
import type { VorgemerktesBild } from "@/lib/bewertungsbilder-senden";
import { bildVerkleinernFrei } from "@/lib/bild-verkleinern";
import { BEWERTUNGSBILD_MAX, BUDPIC_MAX_BYTES, BUDPIC_MAX_KANTE } from "@/lib/budpics";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  vorhanden: readonly VorbelegtesBild[];
  vorgemerkt: readonly VorgemerktesBild[];
  setVorgemerkt: Dispatch<SetStateAction<VorgemerktesBild[]>>;
  /** Meldet nach oben, solange gewählte Bilder noch verkleinert werden (Absenden bleibt gesperrt). */
  onBeschaeftigt: (beschaeftigt: boolean) => void;
  istBetreiber: boolean;
  /** Während des Speicherns: nichts wählen, nichts entfernen. */
  gesperrt: boolean;
  /** budpicMeldungen(w): Texte für Fehler beim Verkleinern. */
  meldungen: Record<string, string>;
  texte: Woerterbuch["bewerten"];
  /** Nach dem Entfernen eines gespeicherten Bildes: Seite neu vom Server. */
  onGeaendert: () => void;
};

/** 96 px Kante je Kachel (8-px-Raster). */
const KACHEL = "size-24 overflow-hidden border border-border bg-surface-sunken";

/**
 * Bilder zur Bewertung im Formular (Spec 2026-10-06): gespeicherte mit Status,
 * vorgemerkte mit Vorschau. Gewählte Dateien werden sofort im Browser
 * verkleinert; gesendet wird erst nach dem Speichern der Bewertung
 * (BewertungsFormular, lib/bewertungsbilder-senden.ts).
 */
export function BewertungsBilder({ vorhanden, vorgemerkt, setVorgemerkt, onBeschaeftigt, istBetreiber, gesperrt, meldungen, texte, onGeaendert }: Props) {
  const hydriert = useHydriert();
  const eingabe = useRef<HTMLInputElement>(null);
  const zaehler = useRef(0);
  // Wird die Komponente während des Verkleinerns abgebaut, laufen waehlen/gewaehlt noch zu Ende.
  const gemountet = useRef(false);
  useEffect(() => {
    gemountet.current = true;
    return () => {
      gemountet.current = false;
    };
  }, []);
  const [fehler, setFehler] = useState<string[]>([]);
  const [entfernt, setEntfernt] = useState<string | null>(null);
  const [verkleinert, setVerkleinert] = useState(false);
  const frei = bilderFrei(vorhanden.map((b) => b.status)) - vorgemerkt.length;

  async function gewaehlt(ereignis: React.ChangeEvent<HTMLInputElement>) {
    const alle = Array.from(ereignis.target.files ?? []);
    ereignis.target.value = "";
    if (verkleinert) return;
    setVerkleinert(true);
    onBeschaeftigt(true);
    try {
      await waehlen(alle);
    } finally {
      if (gemountet.current) {
        setVerkleinert(false);
        onBeschaeftigt(false);
      }
    }
  }

  async function waehlen(alle: File[]) {
    const anzahl = annehmbareDateien(alle.length, frei);
    const zeilen: string[] = alle.length > anzahl ? [t(texte.bilderVoll, { max: BEWERTUNGSBILD_MAX })] : [];
    const neu: VorgemerktesBild[] = [];
    for (const datei of alle.slice(0, anzahl)) {
      const klein = await bildVerkleinernFrei(datei, { maxKante: BUDPIC_MAX_KANTE, maxBytes: BUDPIC_MAX_BYTES });
      if (!gemountet.current) {
        // Abgebaut: bereits angelegte Vorschauen freigeben, nichts mehr setzen.
        for (const bild of neu) URL.revokeObjectURL(bild.vorschau);
        return;
      }
      if (!klein.ok) {
        const grund = t(meldungen[klein.fehler.schluessel] ?? meldungen["budpic.fehlgeschlagen"], klein.fehler.parameter);
        zeilen.push(t(texte.bildFehler, { name: datei.name, grund }));
        continue;
      }
      neu.push({
        schluessel: `${datei.name}-${datei.lastModified}-${neu.length}-${vorgemerkt.length}-${zaehler.current++}`,
        name: datei.name,
        blob: klein.blob,
        breite: klein.breite,
        hoehe: klein.hoehe,
        vorschau: URL.createObjectURL(klein.blob),
      });
    }
    setFehler(zeilen);
    setVorgemerkt((vorher) => [...vorher, ...neu]);
  }

  function abwaehlen(bild: VorgemerktesBild) {
    URL.revokeObjectURL(bild.vorschau);
    setVorgemerkt((vorher) => vorher.filter((b) => b !== bild));
  }

  async function entfernen(id: string) {
    setEntfernt(id);
    const daten = new FormData();
    daten.set("id", id);
    const ergebnis = await bewertungsbildEntfernen(daten);
    setEntfernt(null);
    setFehler(ergebnis.ok ? [] : [ergebnis.fehler]);
    if (ergebnis.ok) onGeaendert();
  }

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-body font-medium text-text">{texte.bilder}</h4>
      <p className="max-w-[60ch] text-small text-text-muted">
        {t(texte.bilderHinweis, { max: BEWERTUNGSBILD_MAX })}
        {istBetreiber ? null : ` ${texte.bilderPruefung}`}
      </p>
      {vorhanden.length + vorgemerkt.length > 0 ? (
        <ul className="flex flex-wrap gap-4">
          {vorhanden.map((b) => (
            <li key={b.id} className="flex w-24 flex-col gap-2">
              <div className={KACHEL}>
                {b.status === "ABGELEHNT" ? null : (
                  <BudpicBild id={b.id} offen={b.status === "OFFEN"} breite={b.breite} hoehe={b.hoehe} alt={texte.bildAlt} className="size-full object-cover" />
                )}
              </div>
              <span className="text-caption text-text-muted">{texte.bildStatus[b.status]}</span>
              <Button type="button" variante="ghost" groesse="sm" disabled={!hydriert || gesperrt || entfernt !== null} onClick={() => entfernen(b.id)}>
                {texte.bildEntfernen}
              </Button>
            </li>
          ))}
          {vorgemerkt.map((b) => (
            <li key={b.schluessel} className="flex w-24 flex-col gap-2">
              <div className={KACHEL}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Object-URL der lokalen Vorschau */}
                <img src={b.vorschau} width={b.breite} height={b.hoehe} alt={texte.bildAlt} className="size-full object-cover" />
              </div>
              <span className="text-caption text-text-muted">{texte.bildVorgemerkt}</span>
              <Button type="button" variante="ghost" groesse="sm" disabled={gesperrt || verkleinert} onClick={() => abwaehlen(b)}>
                {texte.bildAbwaehlen}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {frei > 0 ? (
        <>
          <input
            ref={eingabe}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={gewaehlt}
            tabIndex={-1}
            aria-hidden="true"
          />
          <div>
            <Button type="button" variante="secondary" groesse="sm" disabled={!hydriert || gesperrt || verkleinert} onClick={() => eingabe.current?.click()}>
              {texte.bilderWaehlen}
            </Button>
          </div>
        </>
      ) : null}
      {fehler.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-1 text-small text-danger">
          {fehler.map((zeile, i) => (
            <li key={i}>{zeile}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
