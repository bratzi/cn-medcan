"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { bewertungSpeichern } from "@/app/[lang]/blueten/[slug]/aktionen";
import { bewertungsbildHochladen } from "@/app/[lang]/blueten/[slug]/bewertungsbild-aktionen";
import { startSpeicherLeeren } from "@/components/layout/konto-zaehler-speicher";
import type { AromaSerie } from "@/components/review/AromaKarte";
import type { BeschaffenheitsWerte } from "@/components/review/BeschaffenheitsLeiste";
import type { Gesamteindruck } from "@/components/review/GesamteindruckLeiste";
import { BewertungsBilder } from "@/components/review/BewertungsBilder";
import { WareWahlFeld, type VertreiberEintrag } from "@/components/sorte/WareWahlFeld";
import { MiniNetz } from "@/components/review/MiniNetz";
import { NoteUndErkundung } from "@/components/review/NoteUndErkundung";
import { Button, Field, Input, Meldung } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import { cn } from "@/lib/cn";
import type { CommunityMedian, KartenTerpen, KatalogEintrag, TerpenZeile, Treue } from "@/lib/aromakarte";
import { MAX_NOTIZ } from "@/lib/bewertung-eingabe";
import type { Vorbelegung } from "@/lib/bewertung-vorbelegung";
import { bilderSenden, type VorgemerktesBild } from "@/lib/bewertungsbilder-senden";
import type { AromaTexte, Woerterbuch } from "@/lib/i18n/typen";
import { t } from "@/lib/i18n/text";
import type { LiveNetzBasis } from "@/lib/live-netz";
import type { Geschmack } from "@/lib/profil-typen";
import type { WareKarte } from "@/lib/query/sorte";

type Props = {
  /** Produkt der angezeigten Ware; Rückfall für die Bilder, falls der Server keins nennt. */
  strainId: string;
  /** Sorte der Seite (Spec 2026-10-15); fehlt sie, lehnt der Server mit Meldung ab. */
  kultivarId: string | null;
  /** Waren der Sorte für Vertreiber und Stärke (WareWahlFeld). */
  waren: readonly WareKarte[];
  /** Alle Vertreiber der Datenbank; jeder ist wählbar, die gelisteten stehen oben (Nutzer 2026-10-22). */
  alleVertreiber: readonly VertreiberEintrag[];
  vorgewaehlt: { vertreiberId: string | null; strainId: string | null };
  wareTexte: Woerterbuch["bluete"]["vertreiber"];
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
  /** budpicMeldungen(w): Fehlertexte für das Verkleinern der Bilder im Browser. */
  bildMeldungen: Record<string, string>;
  /** Grundlage des Live-Netzes neben dem Fazit (lib/live-netz.ts); null, wenn sie fehlt. */
  liveNetz?: LiveNetzBasis | null;
  /** Achsennamen für die Änderungszeile des Mini-Netzes (w.label.geschmack). */
  achsen: Woerterbuch["label"]["geschmack"];
  /** Wofür die Teile zählen (Spec 2026-10-13): Aroma für die Blüte, Qualität für den Vertreiber. */
  zuordnung?: { bluete: string; vertreiber: string | null };
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
  kultivarId,
  waren,
  alleVertreiber,
  vorgewaehlt,
  wareTexte,
  handelsname,
  bild,
  terpene,
  chargen,
  istBetreiber,
  katalog = [],
  vorbelegung,
  aromaTexte,
  texte,
  bildMeldungen,
  achsen,
  ...daten
}: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [vorgemerkt, setVorgemerkt] = useState<VorgemerktesBild[]>([]);
  const [verkleinert, setVerkleinert] = useState(false);
  const [bildLauf, setBildLauf] = useState<{ nr: number; gesamt: number } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const [notizLaenge, setNotizLaenge] = useState(vorbelegung?.notiz?.length ?? 0);
  const [netz, setNetz] = useState<{ vorher: Geschmack | null; nachher: Geschmack; geformt: boolean } | null>(null);
  // Nach dem ersten Speichern gibt es die Bewertung, auch bevor die Seite neu vom Server kommt.
  const [gespeichert, setGespeichert] = useState(false);
  const vorhanden = vorbelegung !== null || gespeichert;
  // Neuer Stand nach dem Speichern: Blätter und Regler beginnen neu mit den gespeicherten
  // Werten, damit „Zurücksetzen“ zu ihnen zurückkehrt.
  const stand = vorbelegung?.stand ?? "neu";

  // Beim Verlassen der Seite alle noch vorgemerkten Vorschauen freigeben.
  const vorgemerktStand = useRef(vorgemerkt);
  useEffect(() => {
    vorgemerktStand.current = vorgemerkt;
  }, [vorgemerkt]);
  useEffect(() => () => vorgemerktStand.current.forEach((b) => URL.revokeObjectURL(b.vorschau)), []);

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const formular = new FormData(ereignis.currentTarget);
    setLaeuft(true);
    setFehler(null);
    setErfolg(null);
    setNetz(null);
    const ergebnis = await bewertungSpeichern(formular);
    if (!ergebnis.ok) {
      setLaeuft(false);
      setFehler(ergebnis.fehler);
      return;
    }
    // Das Kapitel auf der Startseite zählt die neue Bewertung erst nach frischem Abruf.
    startSpeicherLeeren();
    // Die Bewertung steht; erst jetzt die Bilder, eines nach dem anderen (Spec 2026-10-06).
    const mitBildern = vorgemerkt.length > 0;
    let bildFehler: string[] = [];
    let bilderGesendet = 0;
    if (mitBildern) {
      // Die Bilder gehören zur gespeicherten Bewertung; ihr Produkt nennt der Server (Stärke kann offen sein).
      const lauf = await bilderSenden(vorgemerkt, ergebnis.strainId || strainId, bewertungsbildHochladen, {
        fortschritt: (nr, gesamt) => setBildLauf({ nr, gesamt }),
        fehlgeschlagen: bildMeldungen["budpic.fehlgeschlagen"],
        dateiFehler: texte.bildFehler,
      });
      for (const bild of vorgemerkt) if (!lauf.uebrig.includes(bild)) URL.revokeObjectURL(bild.vorschau);
      setVorgemerkt(lauf.uebrig);
      bildFehler = lauf.fehler;
      bilderGesendet = lauf.gesendet;
      setBildLauf(null);
    }
    setLaeuft(false);
    setGespeichert(true);
    const basis = ergebnis.sofortSichtbar ? texte.gespeichert : texte.eingegangen;
    setErfolg(bilderGesendet > 0 && !istBetreiber ? `${basis} ${texte.bilderPruefung}` : basis);
    setNetz(ergebnis.netz);
    if (bildFehler.length > 0) setFehler(bildFehler.join(" "));
    // Community-Werte, Vorbelegung und Bilder neu vom Server; die Maske bleibt stehen.
    router.refresh();
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-16 md:gap-24">
      <input type="hidden" name="kultivarId" value={kultivarId ?? ""} />
      {/* Erst die Ware zuordnen, dann bewerten (Spec Sorte im Fokus, 2): Vertreiber Pflicht, Stärke freiwillig. */}
      <WareWahlFeld
        key={`ware-${stand}-${vorgewaehlt.vertreiberId ?? ""}`}
        waren={waren}
        alleVertreiber={alleVertreiber}
        vorgewaehlt={vorgewaehlt}
        texte={wareTexte}
        sprache={aromaTexte.sprache}
        kultivarId={kultivarId ?? undefined}
      />

      {/* Gleiche Reihenfolge wie die Startseite (Nutzer 2026-10-06): Sortenkopf, Gesamtnote, Overall,
          Terpz. Die Note hält der gemeinsame Baustein selbst und reicht sie ans eigene Sortenfazit
          weiter (lib/fazit.ts, T6, Review-Befund T6-R1: nie den Community-Median unterschieben). */}
      <NoteUndErkundung
        key={`erkundung-${stand}`}
        blattTexte={texte}
        sprache={aromaTexte.sprache}
        noteStart={vorbelegung?.gesamtnote ?? null}
        titel={handelsname}
        bild={bild}
        terpene={terpene}
        katalog={katalog}
        modus="maske"
        vorbelegung={vorbelegung}
        istBetreiber={istBetreiber}
        texte={aromaTexte}
        {...daten}
        // Die Zuordnung steht schon im Vertreiber-Feld; kein zweiter Satz darunter (Nutzer 2026-10-22).
        zuordnung={undefined}
      />

      {/* Notiz und Charge (Nutzer 2026-10-22): als eigene Karteikarte zwischen Linien, Notiz zuerst und breit,
          die Charge schmal daneben und ausdrücklich freiwillig (keine Chargen im Fokus). */}
      <section aria-labelledby="bewertung-notiz-titel" className="flex flex-col gap-8 border-t border-border pt-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <p aria-hidden="true" className="font-hand text-vermerk text-logo">
            {texte.chargeNotizVermerk}
          </p>
          <h3 id="bewertung-notiz-titel" className="font-buch text-h2 font-medium text-balance text-text">
            {texte.chargeNotiz}
          </h3>
          <p className="max-w-[52ch] text-small text-pretty text-text-muted">{texte.chargeNotizSatz}</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:items-start">
          <Field id="bewertung-notiz" label={texte.notiz} pflicht={texte.freiwillig} hinweis={t(texte.notizHinweis, { anzahl: MAX_NOTIZ })}>
            {(attribute) => (
              <div className="flex flex-col gap-2">
                <textarea
                  {...attribute}
                  name="notiz"
                  rows={6}
                  maxLength={MAX_NOTIZ}
                  defaultValue={vorbelegung?.notiz ?? undefined}
                  placeholder={texte.notizPlatzhalter}
                  onInput={(e) => setNotizLaenge(e.currentTarget.value.length)}
                  className="min-h-40 w-full resize-y rounded-md border border-border-strong bg-surface p-4 text-body text-text transition-colors duration-fast ease-standard placeholder:text-text-muted hover:border-accent-hover focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                />
                <p
                  className={cn(
                    "numeric self-end text-caption transition-colors duration-fast",
                    notizLaenge > MAX_NOTIZ * 0.9 ? "text-danger" : "text-text-muted",
                  )}
                >
                  {t(texte.notizZaehler, { n: notizLaenge, max: MAX_NOTIZ })}
                </p>
              </div>
            )}
          </Field>
          <div className="flex flex-col gap-2">
            <Input
              id="bewertung-charge"
              label={texte.charge}
              pflicht={texte.freiwillig}
              hinweis={texte.chargeHinweis}
              name="chargenNr"
              list="bewertung-chargen"
              maxLength={40}
              autoComplete="off"
              spellCheck={false}
              placeholder={texte.chargePlatzhalter}
              className="numeric"
              defaultValue={vorbelegung?.chargenNr ?? undefined}
            />
            <datalist id="bewertung-chargen">
              {chargen.map((nummer) => (
                <option key={nummer} value={nummer} />
              ))}
            </datalist>
          </div>
        </div>
        <BewertungsBilder
          vorhanden={vorbelegung?.bilder ?? []}
          vorgemerkt={vorgemerkt}
          setVorgemerkt={setVorgemerkt}
          onBeschaeftigt={setVerkleinert}
          istBetreiber={istBetreiber}
          gesperrt={laeuft}
          meldungen={bildMeldungen}
          texte={texte}
          onGeaendert={() => router.refresh()}
          sprache={aromaTexte.sprache}
        />
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
        <Button type="submit" disabled={!hydriert || laeuft || verkleinert}>
          {bildLauf
            ? t(texte.bildLaeuft, bildLauf)
            : laeuft
            ? texte.speichert
            : vorhanden
              ? texte.aktualisieren
              : istBetreiber
                ? texte.veroeffentlichen
                : texte.einreichen}
        </Button>
        {/* Nur für Vorleser: der sichtbare Fortschritt steht im Knopftext; absolut gesetzt,
            damit der Bereich keinen Leerraum im gap-Container erzeugt. */}
        <p aria-live="polite" className="sr-only">
          {bildLauf ? t(texte.bildLaeuft, bildLauf) : null}
        </p>
        {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
        {erfolg ? <Meldung art="erfolg">{erfolg}</Meldung> : null}
        {netz ? <MiniNetz vorher={netz.vorher} nachher={netz.nachher} geformt={netz.geformt} texte={texte} achsen={achsen} /> : null}
      </div>
    </form>
  );
}
