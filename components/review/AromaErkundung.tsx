"use client";

import { useState } from "react";

import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";
import { SweetSpot, type SweetSpotZeile } from "@/components/review/SweetSpot";
import {
  BeschaffenheitsLeiste,
  type BeschaffenheitsSchluessel,
  type BeschaffenheitsWerte,
} from "@/components/review/BeschaffenheitsLeiste";
import { GesamteindruckLeiste, type Gesamteindruck, type NotenKey } from "@/components/review/GesamteindruckLeiste";
import type { KatalogEintrag } from "@/components/review/TerpenErgaenzen";
import {
  achsenIndex,
  ergaenztesTerpen,
  MAX,
  herstellerProfil,
  herstellerTreue,
  terpenStaerken,
  type KartenTerpen,
  type Treue,
} from "@/lib/aromakarte";
import { BEWERTUNGS_ACHSEN, GESCHMACKS_ACHSEN, leereGeschmacksMatrix, type GeschmacksMatrix } from "@/lib/query/bewertung";
import type { Vorbelegung } from "@/lib/bewertung-vorbelegung";
import { communityFazit } from "@/lib/fazit";
import { formatiereAnteil } from "@/lib/format";
import { mehrzahl } from "@/lib/i18n/text";
import type { AromaTexte } from "@/lib/i18n/typen";

const prozent = (anteil: number, sprache: AromaTexte["sprache"]) => formatiereAnteil(anteil, 0, sprache);

/**
 * Aroma-Erkundung in drei Schritten: Gesamteindruck, Terpene, Beschaffenheit,
 * jeder in voller Breite; das Community-Fazit aus allen drei steht danach (Nutzer 2026-09-25). Im Terpen-Schritt geschieht alles in der Karte: die Geschmacksbalken links
 * sind Regler; man zieht, wie stark man jede Geschmacksrichtung schmeckt,
 * und sieht als lila Serie das eigene Profil gegen die Herstellerangabe.
 * Lerneffekt: zur gezogenen Richtung leuchten die Terpene auf, die sie
 * tragen, und die Karte nennt sie. Ohne Anmeldung, speichert nichts.
 */
export function AromaErkundung({
  titel,
  bild,
  terpene,
  serien,
  zeilen,
  katalog = [],
  treue = null,
  beschaffenheit,
  gesamteindruck,
  eingabe = false,
  vorbelegung = null,
  zwischenruf,
  children,
  texte,
}: {
  titel: string;
  /** Sortenkopf (Symbolbild groß, Herstellerangaben) über der Karte, als Server-Teil hereingereicht. */
  bild?: React.ReactNode;
  terpene: readonly KartenTerpen[];
  serien: readonly AromaSerie[];
  /** Community-Mittel je Terpen; Terpene ohne Bewertung starten im Sweet Spot. */
  zeilen: readonly SweetSpotZeile[];
  /** Alle bekannten Terpene: für Terpene, die der Hersteller nicht angibt. */
  katalog?: readonly KatalogEintrag[];
  /** Herstellertreue aus allen Bewertungen der Sorte. */
  treue?: Treue | null;
  /** Restfeuchte und Beschaffenheit, gemittelt über die Bewertungen. */
  beschaffenheit?: BeschaffenheitsWerte;
  /** Allgemeine Noten 1 bis 5, gemittelt über die Bewertungen. */
  gesamteindruck?: Gesamteindruck;
  /**
   * Bewertungsmaske (Nutzer 2026-09-25: sieht exakt aus wie die Startseite):
   * die Regler sind die Eingabe, ihre Werte gehen als versteckte Felder ins
   * umschließende Formular (Feldnamen wie lib/bewertung-eingabe.ts).
   */
  eingabe?: boolean;
  /**
   * Eigene gespeicherte Bewertung als Start der Regler (Masterplan Bewertung
   * v2, T4): „Dein Fazit“ steht sofort, „Zurücksetzen“ kehrt zu ihr zurück.
   */
  vorbelegung?: Pick<Vorbelegung, "geschmack" | "noten" | "intensitaet" | "beschaffenheit"> | null;
  texte: AromaTexte;
  /** Hintergrundsatz (Schlagwort) mittig zwischen Qualität und Fazit, nur auf der Startseite. */
  zwischenruf?: React.ReactNode;
  children?: React.ReactNode;
}) {
  // Start der eigenen Regler: leer oder die gespeicherte Bewertung. Die Startobjekte
  // bleiben als Referenz stehen: jede Änderung ersetzt sie, „Zurücksetzen“ setzt genau
  // sie wieder ein. So heißt „geändert“ einfach: nicht mehr dasselbe Objekt.
  const [anfang] = useState(() => ({
    geschmack: vorbelegung?.geschmack ?? null,
    beschaffenheit: (vorbelegung?.beschaffenheit ?? {}) as Partial<Record<BeschaffenheitsSchluessel, number>>,
    noten: (vorbelegung?.noten ?? {}) as Partial<Record<NotenKey, number>>,
    intensitaet: vorbelegung?.intensitaet ?? {},
  }));
  const [eigen, setEigen] = useState<GeschmacksMatrix | null>(anfang.geschmack);
  const [eigeneBeschaffenheit, setEigeneBeschaffenheit] = useState(anfang.beschaffenheit);
  const [eigeneNoten, setEigeneNoten] = useState(anfang.noten);
  const [eigeneIntensitaet, setEigeneIntensitaet] = useState<Record<string, number>>(anfang.intensitaet);
  // Eigene Werte da (bewegt oder vorbelegt): dann steht „Dein Fazit“.
  const bewegt =
    eigen !== null ||
    Object.keys(eigeneBeschaffenheit).length > 0 ||
    Object.keys(eigeneNoten).length > 0 ||
    Object.keys(eigeneIntensitaet).length > 0;
  const geaendert =
    eigen !== anfang.geschmack ||
    eigeneBeschaffenheit !== anfang.beschaffenheit ||
    eigeneNoten !== anfang.noten ||
    eigeneIntensitaet !== anfang.intensitaet;

  // Karte: alle bekannten Terpene. Was der Hersteller nicht angibt, steht grau
  // daneben und wird farbig, sobald seine Geschmacksrichtung über 0 liegt.
  const angegeben = new Set(terpene.map((terpen) => terpen.name));
  const ergaenzt: KartenTerpen[] = katalog
    .filter((terpen) => !angegeben.has(terpen.name))
    .map((terpen) => ergaenztesTerpen(terpen.name, terpen.geschmack));
  const kartenTerpene = [...terpene, ...ergaenzt];
  const stufen = {
    ...Object.fromEntries(zeilen.map((zeile) => [zeile.terpen, zeile.wert])),
    ...eigeneIntensitaet,
  };
  // Sweet Spot in der Maske (Nutzer 2026-09-26: wieder erfassen): je Herstellerterpen
  // eine Spur, Start am Community-Mittel, ohne Bewertung im Sweet Spot (3).
  const sweetSpotZeilen: SweetSpotZeile[] = terpene.map(
    (terpen) => zeilen.find((zeile) => zeile.terpen === terpen.name) ?? { terpen: terpen.name, wert: 3 },
  );

  const hersteller = herstellerProfil(terpene);
  const community = serien.find((serie) => serie.ton === "lila")?.matrix;
  // Start der Regler: was die Community geschmeckt hat, sonst die Herstellerangabe.
  const start = community ?? hersteller ?? leereGeschmacksMatrix();
  const werte = eigen ?? start;
  // Stärke je Terpen: Herstellerterpene leuchten nach ihrer Angabe; nicht
  // angegebene bleiben grau, bis ihre Geschmacksrichtung spürbar ist (ab 0,5),
  // kleine Community-Rauschwerte färben sie also nicht.
  const basis = terpenStaerken(kartenTerpene, stufen);
  const staerken = Object.fromEntries(
    kartenTerpene.map((terpen) => {
      if (angegeben.has(terpen.name)) return [terpen.name, basis[terpen.name] ?? 0];
      const achse = GESCHMACKS_ACHSEN[achsenIndex(terpen.geschmack)];
      const wert = achse ? werte[achse.key] : 0;
      return [terpen.name, wert < 0.5 ? 0 : Math.min(wert / MAX, 1) * 0.6];
    }),
  );
  const eigeneTreue =
    eigen && hersteller ? herstellerTreue(hersteller, eigen) : null;
  const alleSerien: AromaSerie[] = eigen
    ? [
        ...serien.filter((serie) => serie.ton === "gruen"),
        { name: texte.aroma.serien.eigen, ton: "lila", matrix: eigen },
      ]
    : [...serien];

  // Community-Fazit aus den drei Stufen; "Dein Fazit" setzt die eigenen Regler
  // über die Community-Werte, sobald etwas bewegt wurde.
  const fazit = communityFazit({
    eindruck: gesamteindruck?.werte ?? {},
    treue: treue?.wert ?? null,
    beschaffenheit: beschaffenheit?.werte ?? {},
  });
  const { feuchte: eigeneFeuchte, ...eigeneAchsen } = eigeneBeschaffenheit;
  // Wirkung zählt nicht ins Fazit (steht nicht auf der öffentlichen Karte).
  const { wirkung: _wirkung, ...eigeneEindruecke } = eigeneNoten;
  void _wirkung;
  const mittelNoten: Partial<Record<NotenKey, number>> = gesamteindruck?.werte ?? {};
  const eigenesFazit = bewegt
    ? communityFazit({
        eindruck: { ...(gesamteindruck?.werte ?? {}), ...eigeneEindruecke },
        treue: eigeneTreue ?? treue?.wert ?? null,
        beschaffenheit: { ...(beschaffenheit?.werte ?? {}), ...eigeneAchsen },
      })
    : null;
  const anzahlBewertungen = Math.max(treue?.anzahl ?? 0, gesamteindruck?.anzahl ?? 0, beschaffenheit?.anzahl ?? 0);

  return (
    <div className="flex flex-col gap-16 md:gap-24">
      {eingabe ? (
        // Werte der Regler fürs umschließende Formular: Noten immer (Pflicht, Start
        // am Community-Mittel, sonst 3), Geschmack immer, Beschaffenheit und
        // Restfeuchte nur, was bewegt wurde (optional).
        <div hidden>
          {BEWERTUNGS_ACHSEN.map(({ key }) => (
            <input key={key} type="hidden" name={`note-${key}`} value={Math.round(eigeneNoten[key] ?? mittelNoten[key] ?? 3)} />
          ))}
          {GESCHMACKS_ACHSEN.map(({ key }) => (
            <input key={key} type="hidden" name={`geschmack-${key}`} value={Math.round(werte[key] * 2) / 2} />
          ))}
          {Object.entries(eigeneAchsen).map(([key, wert]) => (
            <input key={key} type="hidden" name={`beschaffenheit-${key}`} value={Math.round((wert ?? 0) * 2) / 2} />
          ))}
          {eigeneFeuchte !== undefined ? <input type="hidden" name="feuchtigkeit" value={eigeneFeuchte} /> : null}
          {Object.entries(eigeneIntensitaet).map(([terpen, wert]) => (
            <input key={terpen} type="hidden" name={`terpen-${terpen}`} value={wert} />
          ))}
        </div>
      ) : null}
      {/* Sortenkopf ganz oben (Nutzer 2026-09-25): erst sieht man, was bewertet wurde. */}
      {bild}

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
          {texte.aroma.erkundung.anleitung}{eingabe ? "" : ` ${texte.aroma.erkundung.nichtsGespeichert}`}
        </p>
        <div className="w-full min-w-0">
          <AromaKarte
            titel={titel}
            ohneTitel
            terpene={kartenTerpene}
            serien={alleSerien}
            staerken={staerken}
            regler={{
              werte,
              vergleich: hersteller ?? community,
              aendern: (key, wert) =>
                setEigen((alt) => ({ ...(alt ?? start), [key]: wert })),
            }}
            lernen={katalog}
            texte={texte}
          />
        </div>
        {eingabe ? (
          <SweetSpot
            titel={texte.aroma.erkundung.intensitaet}
            quer
            texte={texte}
            zeilen={sweetSpotZeilen}
            bedienung={{
              eigen: eigeneIntensitaet,
              // Ganze Stufen, wie die Server Action sie annimmt (lib/bewertung-eingabe.ts).
              aendern: (terpen, wert) => setEigeneIntensitaet((alt) => ({ ...alt, [terpen]: Math.round(wert) })),
            }}
          />
        ) : null}
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

      {/* Community-Fazit nach allen drei Schritten (Nutzer 2026-09-25, zuvor darüber): das Fazit
          aus Gesamteindruck, Terpenen und Beschaffenheit, in der Handschrift des Logos,
          weil es die Stimme der Community ist (Ausnahme zu Regel 3, ui-design-engine). */}
      {fazit !== null ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <dl className="flex flex-wrap items-end justify-center gap-x-24 gap-y-8">
            <div className="flex flex-col items-center gap-2">
              <dt className="text-small uppercase tracking-wide text-text-muted">{texte.aroma.erkundung.communityFazit}</dt>
              {/* tabular-nums auf dem dd: gilt für die Zahl und ihre Konturen gleich,
                  damit die Konturen deckungsgleich bleiben. */}
              <dd className="relative isolate flex justify-center tabular-nums">
                {/* Die Essenz der Seite (Nutzer 2026-09-25): dieselben driftenden Konturen
                    wie die Wortmarke im Hero, dazu ein ruhiges Pulsieren. */}
                {["marke-kontur-1", "marke-kontur-2", "marke-kontur-3", "marke-kontur-4"].map((klasse) => (
                  <span key={klasse} aria-hidden="true" className={`marke-kontur ${klasse} font-hand text-umschlag leading-none`}>
                    <span>{prozent(fazit, texte.sprache)}</span>
                  </span>
                ))}
                <span className="fazit-puls farbverlauf font-hand text-umschlag leading-none">{prozent(fazit, texte.sprache)}</span>
              </dd>
              <dd className="text-caption text-text-muted">
                {mehrzahl(texte.sprache, texte.aroma.ausBewertungen, anzahlBewertungen)}
              </dd>
            </div>
            {eigenesFazit !== null ? (
              <div className="flex flex-col items-center gap-2" aria-live="polite">
                <dt className="text-small uppercase tracking-wide text-text-muted">{texte.aroma.erkundung.deinFazit}</dt>
                <dd className="farbverlauf font-hand text-notiz leading-none tabular-nums">{prozent(eigenesFazit, texte.sprache)}</dd>
                <dd className="text-caption text-text-muted">{texte.aroma.erkundung.ausReglern}</dd>
              </div>
            ) : null}
          </dl>
          <p className="max-w-[60ch] text-caption text-text-muted text-pretty">
            {texte.aroma.erkundung.fazitErklaerung}
          </p>
        </div>
      ) : null}

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
