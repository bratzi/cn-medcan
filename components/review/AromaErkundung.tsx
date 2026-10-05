"use client";

import { useId, useRef, useState } from "react";

import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import { FazitLauf } from "@/components/review/FazitLauf";
import {
  BeschaffenheitsLeiste,
  type BeschaffenheitsSchluessel,
  type BeschaffenheitsWerte,
} from "@/components/review/BeschaffenheitsLeiste";
import { GesamteindruckLeiste, type Gesamteindruck, type NotenKey } from "@/components/review/GesamteindruckLeiste";
import {
  ebenenStaerken,
  ergaenztesTerpen,
  gezaehlteTerpene,
  herstellerProfil,
  herstellerTreue,
  nasenAbweichung,
  terpenEbenen,
  terpenKandidaten,
  type CommunityMedian,
  type KartenTerpen,
  type KatalogEintrag,
  type TerpenZeile,
  type Treue,
} from "@/lib/aromakarte";
import {
  BEWERTUNGS_ACHSEN,
  GESCHMACKS_ACHSEN,
  leereGeschmacksMatrix,
  terpenAnAus,
  type GeschmacksMatrix,
} from "@/lib/query/bewertung";
import type { Vorbelegung } from "@/lib/bewertung-vorbelegung";
import { chargenFazit, sortenFazit } from "@/lib/fazit";
import { fazitDelta } from "@/lib/fazit-delta";
import { formatiereAnteil, formatiereZahl } from "@/lib/format";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { AromaTexte } from "@/lib/i18n/typen";

const prozent = (anteil: number, sprache: AromaTexte["sprache"]) => formatiereAnteil(anteil, 0, sprache);

/**
 * Aroma-Erkundung in drei Schritten: Gesamteindruck, Terpene, Beschaffenheit,
 * jeder in voller Breite; das Fazit aus allen drei läuft beim Regeln mit (T16, Nutzer 2026-09-30:
 * ab xl sticky rechts, darunter Leiste unten mit Sheet, components/review/FazitLauf.tsx). Im Terpen-Schritt geschieht alles in der Karte: die Geschmacksbalken links
 * sind Regler; man zieht, wie stark man jede Geschmacksrichtung schmeckt,
 * und sieht als lila Serie das eigene Profil gegen die Herstellerangabe. In der
 * Maske stehen rechts in der Karte zudem die Terpen-Regler (Nutzer 2026-09-30).
 * Lerneffekt: zur gezogenen Richtung leuchten die Terpene dieser Sorte auf,
 * die sie tragen; alle übrigen Terpene des Katalogs stehen als blasse Geister
 * daneben (Masterplan Bewertung v2, T5: ein Geschmack zündet kein Terpen, das
 * nicht in der Sorte steckt). Ohne Anmeldung, speichert nichts.
 */
export function AromaErkundung({
  titel,
  bild,
  terpene,
  serien,
  zeilen,
  median = null,
  katalog = [],
  treue = null,
  beschaffenheit,
  gesamteindruck,
  gesamtnoteMedian = null,
  eigeneGesamtnote = null,
  /**
   * Wie die Erkundung bedient wird (Nutzer 2026-10-03, vorher das boolesche `eingabe`):
   * - "maske": die Bewertungsmaske. Regler sind die Eingabe, versteckte Felder gehen ins Formular.
   * - "example": dieselbe Maske und dieselbe Optik auf der Startseite, aber ohne Formularfelder
   *   und ohne Speichern. Regler starten bei 0 wie in der echten Maske; nichts wird gespeichert.
   * - "anzeige": nur lesen, wie auf der Buchseite (Doppelseite.tsx).
   * Es gibt bewusst nur einen Komponentenbaum: derselbe Code, eine Abweichung.
   */
  modus = "anzeige",
  vorbelegung = null,
  istBetreiber = false,
  zwischenruf,
  children,
  texte,
}: {
  titel: string;
  /** Sortenkopf (Symbolbild groß, Herstellerangaben) über der Karte, als Server-Teil hereingereicht. */
  bild?: React.ReactNode;
  terpene: readonly KartenTerpen[];
  serien: readonly AromaSerie[];
  /** Community-Wert je Terpen (Median, sonst Mittel): der grüne Ring an den Terpen-Reglern. */
  zeilen: readonly TerpenZeile[];
  /**
   * Community-Median aus `sorten_kennwerte` (T5): der grüne Regler der Karte und
   * die Abweichung „Deine Nase vs. Community“. Ohne Median fehlt beides.
   */
  median?: CommunityMedian | null;
  /** Alle bekannten Terpene: für Terpene, die der Hersteller nicht angibt. */
  katalog?: readonly KatalogEintrag[];
  /** Herstellertreue aus allen Bewertungen der Sorte. */
  treue?: Treue | null;
  /** Restfeuchte und Beschaffenheit, gemittelt über die Bewertungen. */
  beschaffenheit?: BeschaffenheitsWerte;
  /** Allgemeine Noten 1 bis 5, gemittelt über die Bewertungen. */
  gesamteindruck?: Gesamteindruck;
  /**
   * Median der Gesamtnote aus `sorten_kennwerte` (T3): eine Stufe des
   * Sortenfazits (lib/fazit.ts, T6), falls schon jemand eine Gesamtnote
   * vergeben hat, sonst null (fällt dann aus dem Fazit heraus).
   */
  gesamtnoteMedian?: number | null;
  /**
   * Eigene Gesamtnote aus `BlattNote` (Sterne, kein Teil von `vorbelegung` hier: `BlattNote` ist ein
   * Geschwister-Baustein in `BewertungsFormular`, nicht in dieser Komponente). Stufe des eigenen
   * Sortenfazits (Review-Befund T6-R1); ohne eigene Note fällt die Stufe heraus, nie die
   * Community-Gesamtnote (`gesamtnoteMedian`) unterschieben.
   */
  eigeneGesamtnote?: number | null;
  /**
   * Bedienmodus (Nutzer 2026-09-25: die Maske sieht exakt aus wie die Startseite). In "maske"
   * gehen die Reglerwerte als versteckte Felder ins umschließende Formular (Feldnamen wie
   * lib/bewertung-eingabe.ts); in "example" sind die Regler bedienbar, speichern aber nichts.
   */
  modus?: "anzeige" | "example" | "maske";
  /**
   * Eigene gespeicherte Bewertung als Start der Regler (Masterplan Bewertung
   * v2, T4): „Dein Fazit“ steht sofort, „Zurücksetzen“ kehrt zu ihr zurück.
   */
  vorbelegung?: Pick<Vorbelegung, "geschmack" | "noten" | "intensitaet" | "beschaffenheit"> | null;
  /**
   * Betreiber sehen die eigenen Fazit-Blöcke unter eigenem Namen (Review-Befund T6-R1, Brief-Hinweis
   * „Deine Bewertung im Vergleich“ bzw. „Betreiber-Bewertung im Vergleich“).
   */
  istBetreiber?: boolean;
  texte: AromaTexte;
  /** Hintergrundsatz (Schlagwort) mittig zwischen Qualität und Fazit, nur auf der Startseite. */
  zwischenruf?: React.ReactNode;
  children?: React.ReactNode;
}) {
  // Regler bedienbar in Maske und Example, nur lesend in der Anzeige.
  const eingabe = modus !== "anzeige";
  // Start der eigenen Regler: leer oder die gespeicherte Bewertung. Die Startobjekte
  // bleiben als Referenz stehen: jede Änderung ersetzt sie, „Zurücksetzen“ setzt genau
  // sie wieder ein. So heißt „geändert“ einfach: nicht mehr dasselbe Objekt.
  const wurzel = useRef<HTMLDivElement>(null);
  const fazitId = useId();
  const [anfang] = useState(() => ({
    geschmack: vorbelegung?.geschmack ?? null,
    beschaffenheit: (vorbelegung?.beschaffenheit ?? {}) as Partial<Record<BeschaffenheitsSchluessel, number>>,
    noten: (vorbelegung?.noten ?? {}) as Partial<Record<NotenKey, number>>,
    intensitaet: vorbelegung?.intensitaet ?? {},
  }));
  const [eigen, setEigen] = useState<GeschmacksMatrix | null>(anfang.geschmack);
  const [eigeneBeschaffenheit, setEigeneBeschaffenheit] = useState(anfang.beschaffenheit);
  const [eigeneNoten, setEigeneNoten] = useState(anfang.noten);
  // Terpene sind seit 2026-10-03 an oder aus (Nutzer: die Stärkeregler waren zu komplex). Der
  // Startwert kommt aus der eigenen gespeicherten Bewertung; alles über 0 gilt dort als an.
  const [eigeneIntensitaet, setEigeneIntensitaet] = useState<Record<string, number>>(anfang.intensitaet);
  const aktiveTerpene = new Set(Object.entries(eigeneIntensitaet).flatMap(([name, wert]) => (wert > 0 ? [name] : [])));
  // Kandidaten, unter denen der Nutzer gerade wählen soll: gesetzt, wenn ein Geschmack über Null
  // steht und mehrere Terpene ihn tragen. Sie pulsieren in der Karte, bis eines an ist.
  const [pulsierend, setPulsierend] = useState<ReadonlySet<string>>(new Set());
  const geaendert =
    eigen !== anfang.geschmack ||
    eigeneBeschaffenheit !== anfang.beschaffenheit ||
    eigeneNoten !== anfang.noten ||
    eigeneIntensitaet !== anfang.intensitaet;

  // Karte: alle bekannten Terpene in drei Ebenen (T5). Laut Hersteller enthalten,
  // vom Nutzer über den Terpen-Regler in der Karte ergänzt (Stufe > 0, T5d), sonst ein blasser Geist:
  // ein Geschmack allein zündet kein Terpen, das nicht in der Sorte steckt.
  const herstellerNamen = terpene.map((terpen) => terpen.name);
  const angegeben = new Set(herstellerNamen);
  const ausKatalog: KartenTerpen[] = katalog
    .filter((terpen) => !angegeben.has(terpen.name))
    .map((terpen) => ergaenztesTerpen(terpen.name, terpen.geschmack));
  const kartenTerpene = [...terpene, ...ausKatalog];
  const ebenen = terpenEbenen(
    kartenTerpene.map((terpen) => terpen.name),
    herstellerNamen,
    eigeneIntensitaet,
  );
  const stufen = {
    ...Object.fromEntries(zeilen.map((zeile) => [zeile.terpen, zeile.wert])),
    ...eigeneIntensitaet,
  };
  // Community-Median je Terpen für den grünen Ring an den Terpen-Reglern der Karte: nur Terpene,
  // die schon jemand bewertet hat (ohne Anzahl kein Ring).
  const terpenMedian = Object.fromEntries(zeilen.filter((zeile) => zeile.anzahl).map((zeile) => [zeile.terpen, zeile.wert]));
  // Deine Nase vs. Community (T5): nur mit eigenen Terpenstufen und Median.
  const nase = nasenAbweichung(eigeneIntensitaet, median?.terpene ?? null, herstellerNamen);

  const hersteller = herstellerProfil(terpene);
  const community = serien.find((serie) => serie.ton === "lila")?.matrix;
  // Start der Regler. In der Maske (T5b, Nutzer 2026-09-29: „die Userwerte immer initial
  // nullen, die Regler setzt der User“) bei 0; wer die Sorte schon bewertet hat, bei den
  // eigenen gespeicherten Werten, sonst überschriebe Speichern sie mit 0. Unberührte Regler
  // gehen als 0 ins Formular, „Zurücksetzen“ kehrt hierher zurück. In der Anzeige ohne
  // Maske wie bisher: was die Community geschmeckt hat, sonst die Herstellerangabe.
  const start = eingabe
    ? (anfang.geschmack ?? leereGeschmacksMatrix())
    : (community ?? hersteller ?? leereGeschmacksMatrix());
  const werte = eigen ?? start;
  // Stärke je Terpen nach Ebene: Herstellerterpene nach ihrer Angabe, ergänzte nach
  // der eigenen Stufe, Geister 0 (lib/aromakarte.ts, ebenenStaerken).
  const staerken = ebenenStaerken(kartenTerpene, ebenen, stufen);
  const eigeneTreue =
    eigen && hersteller ? herstellerTreue(hersteller, eigen) : null;
  // In der Maske ist die eigene Bewertung immer die lila Reihe, auch bei 0 (dann zeigt die
  // Karte nur Streifen); die Community steht dort als Ring am Regler (T5b). In der Anzeige
  // ersetzt der eigene Eindruck die Community erst, wenn man etwas bewegt.
  // Grüne Serien gehen seit 2026-10-03 nicht mehr in die Karte (Nutzer): die Herstellerangabe
  // sagt nichts über die Geschmacksintensität, also stünde dort eine erfundene Zahl. Was der
  // Hersteller nennt, bleibt in den Ebenen und im Streifen hinter den Bögen sichtbar.
  const lilaSerien = serien.filter((serie) => serie.ton === "lila");
  const alleSerien: AromaSerie[] = eingabe
    ? [{ name: texte.aroma.serien.bewertung, ton: "lila", matrix: werte }]
    : eigen
      ? [{ name: texte.aroma.serien.eigen, ton: "lila", matrix: eigen }]
      : lilaSerien;

  // Sortenfazit aus Overall, Terpen-Abgleich und Gesamtnote-Median (T6); "Dein Fazit" setzt
  // die eigenen Regler über die Community-Werte, sobald etwas bewegt wurde. Das Chargenfazit
  // (Qualitäts-Balance der Beschaffenheit) ist ein eigener Wert und fließt hier nie ein.
  const sortenFazitWert = sortenFazit({
    eindruck: gesamteindruck?.werte ?? {},
    treue: treue?.wert ?? null,
    gesamtnote: gesamtnoteMedian,
  });
  const chargenFazitWert = chargenFazit(beschaffenheit?.werte ?? {});
  const { feuchte: eigeneFeuchte, ...eigeneAchsen } = eigeneBeschaffenheit;
  // Wirkung zählt nicht ins Fazit (steht nicht auf der öffentlichen Karte).
  const { wirkung: _wirkung, ...alleEindruecke } = eigeneNoten;
  // Eine auf 0 zurückgezogene Note heißt „keine Note“ (T5c) und zählt nicht.
  const eigeneEindruecke = Object.fromEntries(
    Object.entries(alleEindruecke).filter(([, wert]) => (wert ?? 0) >= 1),
  ) as typeof alleEindruecke;
  void _wirkung;
  // Eigenes Sortenfazit nur, wenn Terpene (Karte), Overall oder die eigene Gesamtnote (BlattNote)
  // tatsächlich gesetzt wurden: nur diese drei Stufen fließen hinein, sonst wäre die Zahl bloß eine
  // Kopie des Community-Werts, obwohl man nur an der Charge gedreht hat. Die Gesamtnote kommt als
  // eigener Wert von außen (Review-Befund T6-R1); ohne sie fällt die Stufe im Fazit heraus
  // (sortenFazit lässt gesamtnote: null bereits herausfallen), nie den Community-Median unterschieben.
  const sorteBewegt = eigen !== null || Object.keys(eigeneEindruecke).length > 0 || eigeneGesamtnote !== null;
  const eigenerSortenFazit = sorteBewegt
    ? sortenFazit({
        eindruck: { ...(gesamteindruck?.werte ?? {}), ...eigeneEindruecke },
        treue: eigeneTreue ?? treue?.wert ?? null,
        gesamtnote: eigeneGesamtnote,
      })
    : null;
  // Eigenes Chargenfazit nur, wenn die Beschaffenheit selbst bewegt wurde (nicht nur Terpene/Overall).
  const chargeBewegt = Object.keys(eigeneAchsen).length > 0;
  const eigenerChargenFazit = chargeBewegt ? chargenFazit({ ...(beschaffenheit?.werte ?? {}), ...eigeneAchsen }) : null;
  const anzahlBewertungen = Math.max(treue?.anzahl ?? 0, gesamteindruck?.anzahl ?? 0, beschaffenheit?.anzahl ?? 0);

  /**
   * Ein Terpen an- oder abschalten (Nutzer 2026-10-03). Schaltet man eines der Kandidaten an,
   * endet das Pulsieren: die Wahl ist getroffen.
   */
  const terpenUmschalten = (terpen: string) => {
    setEigeneIntensitaet((alt) => ({ ...alt, [terpen]: (alt[terpen] ?? 0) > 0 ? 0 : 1 }));
    setPulsierend((alt) => (alt.has(terpen) ? new Set() : alt));
  };

  /**
   * Einen Geschmacksregler bewegen (Nutzer 2026-10-03): sobald der Wert über Null geht, ist der
   * Geschmack aktiv. Trägt ihn genau ein Terpen der Sorte, schaltet es sich selbst an. Tragen
   * ihn mehrere, schaltet sich keines, und die Kandidaten pulsieren, bis der Nutzer wählt.
   * Zieht man den Regler zurück auf 0, bleibt ein einmal aktiviertes Terpen an: es wieder
   * abzuschalten ist eine eigene Entscheidung, kein Nebeneffekt.
   */
  const geschmackAendern = (key: keyof GeschmacksMatrix, wert: number) => {
    setEigen((alt) => ({ ...(alt ?? start), [key]: wert }));
    if (!eingabe) return;
    if (wert <= 0) {
      setPulsierend(new Set());
      return;
    }
    const achse = GESCHMACKS_ACHSEN.findIndex((eintrag) => eintrag.key === key);
    const offen = terpenKandidaten(achse, kartenTerpene).filter((name) => !aktiveTerpene.has(name));
    if (offen.length === 1) {
      setEigeneIntensitaet((alt) => ({ ...alt, [offen[0]]: 1 }));
      setPulsierend(new Set());
    } else {
      setPulsierend(new Set(offen));
    }
  };

  const hatFazit = sortenFazitWert !== null || chargenFazitWert !== null;
  // Kurz-Fazit der mobilen Leiste (T16): eigene Sortennote, solange nichts bewegt wurde die der
  // Community; das Delta erst, wenn beide Werte stehen.
  const kurzWert = eigenerSortenFazit ?? sortenFazitWert ?? chargenFazitWert;
  const kurzLabel =
    eigenerSortenFazit !== null
      ? istBetreiber
        ? texte.aroma.erkundung.deinFazitBetreiber
        : texte.aroma.erkundung.deinFazit
      : sortenFazitWert !== null
        ? texte.aroma.erkundung.communityFazit
        : texte.aroma.erkundung.chargenFazit;

  return (
    // Die Schritte in voller Breite; das Fazit läuft ab 118rem außen im Seitenrand mit (T16).
    <div ref={wurzel} className="relative flex flex-col gap-16 md:gap-24">
      {modus === "maske" ? (
        // Werte der Regler fürs umschließende Formular: Noten nur, wenn gesetzt (Start bei 0 =
        // keine Note, T5c; Pflicht, der Server meldet eine fehlende Note, statt 0 zu speichern),
        // Geschmack immer, Beschaffenheit und Restfeuchte nur, was bewegt wurde (optional).
        <div hidden>
          {BEWERTUNGS_ACHSEN.map(({ key }) =>
            (eigeneNoten[key] ?? 0) >= 1 ? (
              <input key={key} type="hidden" name={`note-${key}`} value={Math.round(eigeneNoten[key]! * 10) / 10} />
            ) : null,
          )}
          {GESCHMACKS_ACHSEN.map(({ key }) => (
            <input key={key} type="hidden" name={`geschmack-${key}`} value={Math.round(werte[key] * 2) / 2} />
          ))}
          {Object.entries(eigeneAchsen).map(([key, wert]) => (
            <input key={key} type="hidden" name={`beschaffenheit-${key}`} value={Math.round((wert ?? 0) * 2) / 2} />
          ))}
          {eigeneFeuchte !== undefined ? <input type="hidden" name="feuchtigkeit" value={eigeneFeuchte} /> : null}
          {/* Herstellerterpene auf 0 heißen „nicht geschmeckt“ und zählen; ein ergänztes auf 0
              ist nicht ergänzt und geht nicht in den Median (T5, lib/aromakarte.ts). */}
          {Object.entries(gezaehlteTerpene(eigeneIntensitaet, herstellerNamen)).map(([terpen, wert]) => (
            <input key={terpen} type="hidden" name={`terpen-${terpen}`} value={terpenAnAus(wert)} />
          ))}
        </div>
      ) : null}
      {/* Sortenkopf ganz oben (Nutzer 2026-09-25): erst sieht man, was bewertet wurde. */}
      {bild ? <div>{bild}</div> : null}

      <div className="flex min-w-0 flex-col gap-16 md:gap-24">

        {gesamteindruck ? (
          <Schritt nummer="1" titel={texte.aroma.erkundung.overall}>
            <GesamteindruckLeiste
              {...gesamteindruck}
              className="w-full"
              mitWirkung={eingabe}
              texte={texte}
              ohneTitel
              bedienung={{
                eigen: eigeneNoten,
                aendern: (key, wert) => setEigeneNoten((alt) => ({ ...alt, [key]: wert })),
                abNull: eingabe,
              }}
            />
          </Schritt>
        ) : null}

        <Schritt nummer="2" titel={texte.aroma.erkundung.terpz}>
          {treue || eigeneTreue !== null ? (
            <p className="text-small text-text-muted">
              {treue ? (
                <>
                  {texte.aroma.erkundung.naehe}{" "}
                  <span className="numeric text-text">{prozent(treue.wert, texte.sprache)}</span>
                </>
              ) : null}
              {eigeneTreue !== null ? (
                <>
                  {treue ? " · " : ""}{texte.aroma.erkundung.deinEindruck}{" "}
                  <span className="numeric text-kopierstift">{prozent(eigeneTreue, texte.sprache)}</span>
                </>
              ) : null}
            </p>
          ) : null}
          <p className="max-w-[60ch] text-small text-text-muted text-pretty">
            {texte.aroma.erkundung.anleitung}{modus === "maske" ? "" : ` ${texte.aroma.erkundung.nichtsGespeichert}`}
          </p>
          <div className="w-full min-w-0">
            <AromaKarte
              titel={titel}
              ohneTitel
              terpene={kartenTerpene}
              serien={alleSerien}
              staerken={staerken}
              ebenen={ebenen}
              regler={{
                werte,
                // Grüner Regler auf dem Community-Median (T5, zuvor die Herstellerangabe).
                vergleich: median?.geschmack ?? undefined,
                aendern: geschmackAendern,
              }}
              // Terpen-Schalter rechts in der Karte (Nutzer 2026-10-03, zuvor Stärkeregler 0 bis 5),
              // nur in der Maske. Ergänzt ist, was an ist (terpenEbenen oben).
              terpenSchalter={
                eingabe
                  ? {
                      an: aktiveTerpene,
                      anteil: terpenMedian,
                      pulsierend,
                      umschalten: terpenUmschalten,
                    }
                  : undefined
              }
              lernen={katalog}
              texte={texte}
            />
            {/* Am Kartenende: Deine Nase vs. Community (T5), mittlere |Δ| zum Median und die
                Zahl der ergänzten Terpene. Der Wert in Kopierstift wie „Dein Eindruck“. */}
            {nase ? (
              <p className="mt-6 text-center text-small text-text-muted text-pretty">
                <span className="font-medium text-text">{texte.aroma.karte.nase}</span>{" "}
                <span aria-hidden="true" className="numeric text-kopierstift">
                  {t(texte.aroma.karte.delta, { wert: formatiereZahl(nase.delta, 1, texte.sprache) })}
                </span>
                <span className="sr-only">
                  {t(texte.aroma.karte.deltaVorgelesen, { wert: formatiereZahl(nase.delta, 1, texte.sprache) })}
                </span>
                {", "}
                {mehrzahl(texte.sprache, texte.aroma.karte.ergaenzteTerpene, nase.ergaenzt)}
              </p>
            ) : null}
          </div>
        </Schritt>

        {beschaffenheit ? (
          // In der Maske gilt die Qualität der eigenen Charge, nicht der Sorte (Bewertung v2, T4).
          <Schritt nummer="3" titel={eingabe ? texte.aroma.erkundung.dieseCharge : texte.aroma.erkundung.qualitaet}>
            {eingabe ? (
              <p className="max-w-[60ch] text-small text-text-muted text-pretty">{texte.aroma.erkundung.chargeSatz}</p>
            ) : null}
            <BeschaffenheitsLeiste
              {...beschaffenheit}
              className="w-full"
              ohneTitel
              sweetSpot={eingabe}
              texte={texte}
              bedienung={{
                eigen: eigeneBeschaffenheit,
                aendern: (schluessel, wert) =>
                  setEigeneBeschaffenheit((alt) => ({
                    ...alt,
                    [schluessel]: wert,
                  })),
              }}
            />
          </Schritt>
        ) : null}

        {/* Nullhoch, die negativen Ränder heben die zusätzliche Lücke auf: der Satz sitzt
            genau in der Mitte zwischen Qualität und Fazit (Nutzer 2026-09-26). */}
        {zwischenruf ? <div className="relative -my-8 h-0 md:-my-12">{zwischenruf}</div> : null}

        {geaendert || children ? (
          <div className="flex flex-wrap items-center justify-center gap-6">
            {children}
            {geaendert ? (
              <button
                type="button"
                onClick={() => {
                  setEigen(anfang.geschmack);
                  setEigeneBeschaffenheit(anfang.beschaffenheit);
                  setEigeneNoten(anfang.noten);
                  setEigeneIntensitaet(anfang.intensitaet);
                }}
                className="min-h-11 text-small text-accent underline underline-offset-4 hover:text-accent-hover"
              >
                {texte.aroma.erkundung.zuruecksetzen}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {hatFazit && kurzWert !== null ? (
        <FazitLauf
          id={fazitId}
          beobachte={wurzel}
          texte={texte}
          kurz={{
            label: kurzLabel,
            wert: prozent(kurzWert, texte.sprache),
            delta: fazitDelta(eigenerSortenFazit, sortenFazitWert),
          }}
        >
          {/* Zwei Fazits, seit T16 mitlaufend statt nach den Schritten (Nutzer 2026-09-25, seit T6 getrennt): das
              Sortenfazit aus Overall, Terpen-Abgleich und Gesamtnote steht groß in der Handschrift
              des Logos, weil es die Stimme der Community ist (Ausnahme zu Regel 3, ui-design-engine).
              Das Chargenfazit (Qualitäts-Balance) steht kleiner daneben und fließt nie in die Sorte. */}
          <div className="flex flex-col items-center gap-4 text-center">
            <dl className="flex flex-wrap items-end justify-center gap-x-24 gap-y-8">
              {sortenFazitWert !== null ? (
                <div className="flex flex-col items-center gap-2">
                  <dt className="text-small uppercase tracking-wide text-text-muted">{texte.aroma.erkundung.communityFazit}</dt>
                  {/* tabular-nums auf dem dd: gilt für die Zahl und ihre Konturen gleich,
                      damit die Konturen deckungsgleich bleiben. */}
                  <dd className="relative isolate flex justify-center tabular-nums">
                    {/* Die Essenz der Seite (Nutzer 2026-09-25): dieselben driftenden Konturen
                        wie die Wortmarke im Hero, dazu ein ruhiges Pulsieren. In der 18rem-Spalte ab xl fest
                          4rem (T16-Fix I1): text-umschlag wüchse dort bis 16rem und bräche um. */}
                    {["marke-kontur-1", "marke-kontur-2", "marke-kontur-3", "marke-kontur-4"].map((klasse) => (
                      <span key={klasse} aria-hidden="true" className={`marke-kontur ${klasse} font-hand text-umschlag leading-none min-[118rem]:text-[4rem]`}>
                        <span>{prozent(sortenFazitWert, texte.sprache)}</span>
                      </span>
                    ))}
                    <span className="fazit-puls farbverlauf font-hand text-umschlag leading-none min-[118rem]:text-[4rem]">
                      {prozent(sortenFazitWert, texte.sprache)}
                    </span>
                  </dd>
                  <dd className="text-caption text-text-muted">
                    {mehrzahl(texte.sprache, texte.aroma.ausBewertungen, anzahlBewertungen)}
                  </dd>
                </div>
              ) : null}
              {chargenFazitWert !== null ? (
                <div className="flex flex-col items-center gap-2">
                  <dt className="text-small uppercase tracking-wide text-text-muted">{texte.aroma.erkundung.chargenFazit}</dt>
                  <dd className="farbverlauf font-hand text-notiz leading-none tabular-nums">
                    {prozent(chargenFazitWert, texte.sprache)}
                  </dd>
                  <dd className="text-caption text-text-muted">
                    {mehrzahl(texte.sprache, texte.aroma.ausBewertungen, beschaffenheit?.anzahl ?? 0)}
                  </dd>
                </div>
              ) : null}
              {eigenerSortenFazit !== null ? (
                <div className="flex flex-col items-center gap-2" aria-live="polite">
                  <dt className="text-small uppercase tracking-wide text-text-muted">
                    {istBetreiber ? texte.aroma.erkundung.deinFazitBetreiber : texte.aroma.erkundung.deinFazit}
                  </dt>
                  <dd className="farbverlauf font-hand text-notiz leading-none tabular-nums">
                    {prozent(eigenerSortenFazit, texte.sprache)}
                  </dd>
                  <dd className="text-caption text-text-muted">{texte.aroma.erkundung.ausReglern}</dd>
                </div>
              ) : null}
              {eigenerChargenFazit !== null ? (
                <div className="flex flex-col items-center gap-2" aria-live="polite">
                  <dt className="text-small uppercase tracking-wide text-text-muted">
                    {istBetreiber ? texte.aroma.erkundung.deineChargeBetreiber : texte.aroma.erkundung.deineCharge}
                  </dt>
                  <dd className="farbverlauf font-hand text-notiz leading-none tabular-nums">
                    {prozent(eigenerChargenFazit, texte.sprache)}
                  </dd>
                  <dd className="text-caption text-text-muted">{texte.aroma.erkundung.ausReglern}</dd>
                </div>
              ) : null}
            </dl>
            <p className="max-w-[60ch] text-caption text-text-muted text-pretty">
              {texte.aroma.erkundung.fazitErklaerung}
            </p>
          </div>
        </FazitLauf>
      ) : null}
    </div>
  );
}

/**
 * Ein Schritt der Erkundung (Nutzer 2026-09-25): erst der Gesamteindruck, dann
 * die Terpene in der Karte, zum Schluss die Beschaffenheit, jeder in voller
 * Breite. Die große Ziffer steht in der Handschrift der Sektionshintergründe,
 * im Farbverlauf der Marke, damit die drei Schritte als Ablauf lesbar sind.
 */
function Schritt({
  nummer,
  titel,
  children,
}: {
  nummer: string;
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={`Schritt ${nummer}: ${titel}`} className="relative isolate flex w-full flex-col gap-8 md:pl-24">
      {/* Ziffer im Hintergrund, blass wie die Sektions-Schlagworte, in fester Höhe
          für alle Schritte (Maß: Schritt 1) und halb links neben dem Inhalt, damit sie
          lesbar bleibt (Nutzer 2026-09-25). */}
      <svg
        aria-hidden="true"
        viewBox="0 0 60 100"
        preserveAspectRatio="xMinYMid meet"
        className="pointer-events-none absolute top-0 left-0 -z-10 h-[28rem] w-auto -translate-x-4 select-none overflow-visible text-kopierstift opacity-15"
      >
        <text x="0" y="88" style={{ fontSize: 118 }} className="font-hand text-kulisse" fill="currentColor">
          {nummer}
        </text>
      </svg>
      {/* Links in Logoschrift und Farbverlauf wie die Schlagworte (Nutzer 2026-09-25). */}
      <h3
        className="farbverlauf border-t border-border pt-8 font-hand text-erzaehlung leading-[0.9]"
        style={{ fontSize: "calc(var(--text-kapitel) * 1.35)" }}
      >
        {titel}
      </h3>
      {children}
    </section>
  );
}
