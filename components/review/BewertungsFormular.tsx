"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { bewertungSpeichern } from "@/app/[lang]/blueten/[slug]/aktionen";
import { AromaErkundung } from "@/components/review/AromaErkundung";
import type { AromaSerie } from "@/components/review/AromaKarte";
import type { BeschaffenheitsWerte } from "@/components/review/BeschaffenheitsLeiste";
import { BlattNote } from "@/components/review/BlattNote";
import type { Gesamteindruck } from "@/components/review/GesamteindruckLeiste";
import { Button, Field, Input, Meldung } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import type { CommunityMedian, KartenTerpen, KatalogEintrag, TerpenZeile, Treue } from "@/lib/aromakarte";
import { MAX_NOTIZ } from "@/lib/bewertung-eingabe";
import type { Vorbelegung } from "@/lib/bewertung-vorbelegung";
import type { AromaTexte, Woerterbuch } from "@/lib/i18n/typen";
import { t } from "@/lib/i18n/text";

type Props = {
  strainId: string;
  handelsname: string;
  /** Sortenkopf samt Angaben zur Blüte über der Karte, als Server-Teil hereingereicht. */
  bild?: React.ReactNode;
  terpene: readonly KartenTerpen[];
  chargen: readonly string[];
  istBetreiber: boolean;
  /** Alle bekannten Terpene, zum Ergänzen. */
  katalog?: readonly KatalogEintrag[];
  /** Die eigene gespeicherte Bewertung dieser Sorte, sonst null. */
  vorbelegung: Vorbelegung | null;
  /** Daten der Erkundung aus den bisherigen Bewertungen (erkundungsDaten). */
  serien: readonly AromaSerie[];
  treue: Treue | null;
  zeilen: readonly TerpenZeile[];
  /** Community-Median aus sorten_kennwerte (T5): grüner Regler und „Deine Nase vs. Community“. */
  median: CommunityMedian | null;
  gesamteindruck: Gesamteindruck;
  beschaffenheit: BeschaffenheitsWerte;
  /** Median der Gesamtnote aus sorten_kennwerte (T3): Teil des Sortenfazits (T6). */
  gesamtnoteMedian: number | null;
  /** Texte der Aroma-Bausteine (lib/i18n/typen.ts, aromaTexte). */
  aromaTexte: AromaTexte;
  texte: Woerterbuch["bewerten"];
};

/**
 * Bewertungsmaske in der Blütenseite (Masterplan Bewertung v2, T4, Nutzer
 * 2026-09-29; zuvor eigene Seite /bewerten). Ganz oben die Gesamtnote in
 * Blättern, darunter exakt die Aroma-Erkundung der Startseite mit ihren
 * Reglern als Eingabe (Modus `eingabe`), zuletzt Charge, Notiz, Reel. Wer die
 * Sorte schon bewertet hat, sieht seine Werte vorbelegt; Speichern
 * überschreibt sie (upsert je Mitglied und Sorte in der Server Action). Nach
 * dem Speichern bleibt man auf der Seite und kann weiter ändern. Geprüft wird
 * in der Server Action (lib/bewertung-eingabe.ts).
 */
export function BewertungsFormular({
  strainId,
  handelsname,
  bild,
  terpene,
  chargen,
  istBetreiber,
  katalog = [],
  vorbelegung,
  aromaTexte,
  texte,
  ...daten
}: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  // Nach dem ersten Speichern gibt es die Bewertung, auch bevor die Seite neu vom Server kommt.
  const [gespeichert, setGespeichert] = useState(false);
  const vorhanden = vorbelegung !== null || gespeichert;
  // Neuer Stand nach dem Speichern: Blätter und Regler beginnen neu mit den gespeicherten
  // Werten, damit „Zurücksetzen“ zu ihnen zurückkehrt.
  const stand = vorbelegung?.stand ?? "neu";
  // Eigene Gesamtnote aus BlattNote, für das eigene Sortenfazit in der Erkundung (lib/fazit.ts, T6,
  // Review-Befund T6-R1): Startwert die vorbelegte eigene Bewertung, danach jede Änderung über den
  // Rückruf von BlattNote. Nie den Community-Median unterschieben, wenn keine eigene Note gesetzt ist.
  const [eigeneGesamtnote, setEigeneGesamtnote] = useState<number | null>(vorbelegung?.gesamtnote ?? null);

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const formular = new FormData(ereignis.currentTarget);
    setLaeuft(true);
    setFehler(null);
    setErfolg(null);
    const ergebnis = await bewertungSpeichern(formular);
    setLaeuft(false);
    if (!ergebnis.ok) {
      setFehler(ergebnis.fehler);
      return;
    }
    setGespeichert(true);
    setErfolg(ergebnis.sofortSichtbar ? texte.gespeichert : texte.eingegangen);
    // Community-Werte und Vorbelegung neu vom Server; die Maske bleibt stehen.
    router.refresh();
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-16 md:gap-24">
      <input type="hidden" name="strainId" value={strainId} />

      <BlattNote
        key={`note-${stand}`}
        start={vorbelegung?.gesamtnote ?? null}
        texte={texte}
        sprache={aromaTexte.sprache}
        onChange={setEigeneGesamtnote}
      />

      <AromaErkundung
        key={`erkundung-${stand}`}
        titel={handelsname}
        bild={bild}
        terpene={terpene}
        katalog={katalog}
        modus="maske"
        vorbelegung={vorbelegung}
        eigeneGesamtnote={eigeneGesamtnote}
        istBetreiber={istBetreiber}
        texte={aromaTexte}
        {...daten}
      />

      <section className="flex flex-col gap-6 border-t border-border pt-8">
        <h3 className="font-buch text-h2 font-medium text-text">{texte.chargeNotiz}</h3>
        <Input
          id="bewertung-charge"
          label={texte.charge}
          hinweis={texte.chargeHinweis}
          name="chargenNr"
          list="bewertung-chargen"
          maxLength={40}
          autoComplete="off"
          defaultValue={vorbelegung?.chargenNr ?? undefined}
        />
        <datalist id="bewertung-chargen">
          {chargen.map((nummer) => (
            <option key={nummer} value={nummer} />
          ))}
        </datalist>
        <Field id="bewertung-notiz" label={texte.notiz} hinweis={t(texte.notizHinweis, { anzahl: MAX_NOTIZ })}>
          {(attribute) => (
            <textarea
              {...attribute}
              name="notiz"
              rows={6}
              maxLength={MAX_NOTIZ}
              defaultValue={vorbelegung?.notiz ?? undefined}
              className="w-full rounded-md border border-border-strong bg-surface p-4 text-body text-text"
            />
          )}
        </Field>
        {istBetreiber ? (
          <Input
            id="bewertung-reel"
            label={texte.reel}
            hinweis={texte.optional}
            name="instagramReelUrl"
            type="url"
            inputMode="url"
            defaultValue={vorbelegung?.instagramReelUrl ?? undefined}
          />
        ) : null}
      </section>

      {/* Rückmeldung direkt unter dem Knopf, an dem man gerade ist; darunter, damit der
          Knopf nach dem Klick nicht wegrutscht. */}
      <div className="flex flex-col items-start gap-4">
        <Button type="submit" disabled={!hydriert || laeuft}>
          {laeuft
            ? texte.speichert
            : vorhanden
              ? texte.aktualisieren
              : istBetreiber
                ? texte.veroeffentlichen
                : texte.einreichen}
        </Button>
        {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
        {erfolg ? <Meldung art="erfolg">{erfolg}</Meldung> : null}
      </div>
    </form>
  );
}
