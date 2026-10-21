"use client";

import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Blaettern } from "@/components/katalog/Blaettern";
import { FilterFeld, SuchFeld } from "@/components/katalog/FilterFelder";
import { FilterSchublade } from "@/components/katalog/FilterSchublade";
import { GeschmackLegende } from "@/components/katalog/GeschmackZeile";
import { BlueteKarte, StrainKarte, type KartenTexte } from "@/components/katalog/KatalogKarte";
import { MobilLeiste } from "@/components/katalog/MobilLeiste";
import { Werkzeugleiste } from "@/components/katalog/Werkzeugleiste";
import type { DiashowBild } from "@/components/produkt/BudpicDiashow";
import { SKELETT_FLAECHE, SkelettAnsage } from "@/components/story/Skelette";
import { buttonKlassen } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { einzelLinkKlassen, textLinkKlassen } from "@/components/ui/textlink";
import { alsDiashow } from "@/lib/budpic-anzeige";
import { cn } from "@/lib/cn";
import { formatierePreisProGramm, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { CHIPS } from "@/lib/katalog/chipleiste";
import { filtere, verdichte, zaehleOptionen, type KatalogErgebnis } from "@/lib/katalog/filtern";
import {
  abonniereFilterSpalte,
  filterSpalteOffen,
  gespeicherteFilterWahl,
  setzeFilterWahl,
  zeigeFilterWahl,
} from "@/lib/katalog/filterspalte";
import type { BlueteZeile, KatalogDaten } from "@/lib/katalog/typen";
import { filterDeaktiviert, weiter, type Ladezustand } from "@/lib/katalog/zustand";
import type { BudpicAnzeige } from "@/lib/query/budpics";
import { istFilterLeer, leererFilter, parseStrainFilter, serialisiereFilter, type StrainFilter } from "@/lib/query/filter";

type Props = {
  /** Erste Seite ohne Filter, auf dem Server gerendert: steht, bis der Katalog geladen ist. */
  start: { zeilen: BlueteZeile[]; gesamt: number; seitenAnzahl: number; vertreiber: { i: string; n: string }[] };
  /** Ganzes Wörterbuch: die Karten brauchen es für Geschmäcker und Diashow. */
  w: Woerterbuch;
  sprache: Sprache;
};

/**
 * Raster der Karten (Task 2): Spalten ab 15rem, so viele wie passen (bei 1280 px ohne Filterspalte
 * vier, bei 1920 px mit Spalte fünf). Jede Karte spannt fünf Zeilen, die sie per subgrid teilt.
 */
const RASTER = "grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-6";
const KARTEN_ZELLE = "row-span-5 grid min-w-0 grid-cols-1 grid-rows-subgrid";

const START: Ladezustand = { art: "start" };
/** Höchstens so viele Kultivare je Budpic-Anfrage (Route begrenzt ebenso). */
const BUDPIC_BUENDEL = 24;

/** Einstieg "Blüte vorschlagen", mit dem Suchbegriff als Vorbelegung. */
function vorschlagLink(suche: string | undefined): string {
  return suche ? `/vorschlagen?name=${encodeURIComponent(suche)}` : "/vorschlagen";
}

function adresse(filter: StrainFilter): string {
  const query = serialisiereFilter(filter).toString();
  return `${window.location.pathname}${query ? `?${query}` : ""}`;
}

function aktiveAnzahl(f: StrainFilter, leer: StrainFilter): number {
  return (
    (f.q ? 1 : 0) + f.typ.length + f.form.length + f.geschmack.length + f.terp.length + f.vertreiber.length + f.apotheke.length +
    (f.thcMin !== leer.thcMin || f.thcMax !== leer.thcMax ? 1 : 0) + (f.preisMax !== undefined ? 1 : 0) +
    (f.note !== undefined ? 1 : 0) + (f.bewertet ? 1 : 0) + (f.cbd ? 1 : 0) + (f.nurVerfuegbar ? 1 : 0) + (f.kultivar ? 1 : 0)
  );
}

type Chip = { schluessel: string; text: string; ohne: Partial<StrainFilter> };

function aktiveChips(f: StrainFilter, w: Woerterbuch, sprache: Sprache, daten: KatalogDaten | null): Chip[] {
  const a = w.katalog.aktiv;
  const l = w.katalog.leiste;
  const leer = leererFilter();
  const vertreiber = new Map(daten?.vertreiber.map((v) => [v.i, v.n]) ?? []);
  const apotheken = new Map(daten?.apotheken.map((x) => [x.s, x.n]) ?? []);
  const chips: Chip[] = [];
  if (f.q) chips.push({ schluessel: "q", text: t(a.suche, { wert: f.q }), ohne: { q: undefined } });
  for (const x of f.typ) chips.push({ schluessel: `typ-${x}`, text: w.label.kultivarTyp[x], ohne: { typ: f.typ.filter((y) => y !== x) } });
  for (const x of f.form) chips.push({ schluessel: `form-${x}`, text: w.label.darreichungsform[x], ohne: { form: f.form.filter((y) => y !== x) } });
  for (const x of f.geschmack)
    chips.push({ schluessel: `g-${x}`, text: t(a.geschmack, { wert: w.label.geschmack[x] }), ohne: { geschmack: f.geschmack.filter((y) => y !== x) } });
  for (const x of f.terp) chips.push({ schluessel: `terp-${x}`, text: x, ohne: { terp: f.terp.filter((y) => y !== x) } });
  if (f.note !== undefined) chips.push({ schluessel: "note", text: t(l.abNote, { note: formatiereZahl(f.note, 1, sprache) }), ohne: { note: undefined } });
  if (f.bewertet) chips.push({ schluessel: "bewertet", text: l.nurBewertet, ohne: { bewertet: false } });
  if (f.cbd) chips.push({ schluessel: "cbd", text: l.cbdReich, ohne: { cbd: false } });
  if (f.thcMin !== leer.thcMin || f.thcMax !== leer.thcMax)
    chips.push({ schluessel: "thc", text: t(a.thc, { von: f.thcMin, bis: f.thcMax }), ohne: { thcMin: leer.thcMin, thcMax: leer.thcMax } });
  if (f.preisMax !== undefined)
    chips.push({ schluessel: "preis", text: t(a.bisPreis, { preis: formatierePreisProGramm(f.preisMax, sprache) }), ohne: { preisMax: undefined } });
  if (f.nurVerfuegbar) chips.push({ schluessel: "verf", text: l.nurVerfuegbar, ohne: { nurVerfuegbar: false } });
  for (const x of f.vertreiber)
    chips.push({ schluessel: `v-${x}`, text: t(a.vertreiber, { wert: vertreiber.get(x) ?? a.vertreiberUnbekannt }), ohne: { vertreiber: f.vertreiber.filter((y) => y !== x) } });
  for (const x of f.apotheke)
    chips.push({ schluessel: `a-${x}`, text: t(a.apotheke, { wert: apotheken.get(x) ?? x }), ohne: { apotheke: f.apotheke.filter((y) => y !== x) } });
  if (f.kultivar) {
    const name = daten?.kultivare.find((k) => k.i === f.kultivar)?.n ?? a.vertreiberUnbekannt;
    chips.push({ schluessel: "kultivar", text: t(a.kultivar, { wert: name }), ohne: { kultivar: undefined } });
  }
  return chips;
}

/** Platzhalter für einen Deep-Link mit Filter, solange der Katalog lädt (Startliste wäre falsch). */
function ListenSkelett({ ansage }: { ansage: string }) {
  return (
    <div role="status" className={RASTER}>
      <SkelettAnsage text={ansage} />
      {[0, 1, 2, 3, 4, 5].map((stelle) => (
        <span key={stelle} aria-hidden="true" className={`${SKELETT_FLAECHE} h-96`} />
      ))}
    </div>
  );
}

/**
 * Client-Insel der Blütenseite (Spec 2026-10-20): lädt den ganzen Katalog einmal, filtert, sortiert
 * und blättert im Browser. URL per history.replaceState/pushState, kein Router-Neuladen.
 */
export function KatalogAnsicht({ start, w, sprache }: Props) {
  const texte = w.katalog;
  const [filter, setFilter] = useState<StrainFilter>(() => leererFilter());
  const [zustand, dispatch] = useReducer(weiter, START);
  const [schubladeOffen, setSchubladeOffen] = useState(false);
  const [mitDeepLink, setMitDeepLink] = useState(false);
  const [budpics, setBudpics] = useState<ReadonlyMap<string, DiashowBild[]>>(new Map());
  const angefragt = useRef(new Set<string>());
  const listeRef = useRef<HTMLDivElement>(null);

  // Filterspalte ab lg (lib/katalog/filterspalte.ts): sichtbar macht sie CSS, hier nur der Zustand für
  // aria-expanded. Auf dem Server und bei der Hydration „zu“, danach aus Attribut und Breite.
  const filterId = useId();
  const filterOffen = useSyncExternalStore(abonniereFilterSpalte, filterSpalteOffen, () => false);
  // Wahl aus dem Speicher nachziehen, vor dem Zeichnen: nach Reacts Entwicklungs-Remount (setzt die
  // <html>-Attribute zurück) und falls das Kopf-Skript sie nicht setzen konnte.
  useLayoutEffect(() => zeigeFilterWahl(gespeicherteFilterWahl()), []);
  const filterUmschalten = useCallback(() => setzeFilterWahl(filterSpalteOffen() ? "zu" : "offen"), []);

  const laden = useCallback(() => {
    dispatch({ typ: "laden" });
    fetch("/api/katalog", { priority: "low" } as RequestInit)
      .then((antwort) => {
        if (!antwort.ok) throw new Error(String(antwort.status));
        return antwort.json() as Promise<KatalogDaten>;
      })
      .then((daten) => dispatch({ typ: "geladen", daten }))
      .catch(() => dispatch({ typ: "fehlgeschlagen" }));
  }, []);

  // Start: Filter aus der Adresse (Seite bleibt statisch), Katalog laden, Zurück-Taste hören.
  useEffect(() => {
    const ausAdresse = () => parseStrainFilter(new URLSearchParams(window.location.search));
    // Übernahme im .then(): kein setState direkt im Effekt-Körper (react-hooks/set-state-in-effect).
    void Promise.resolve().then(() => {
      const erster = ausAdresse();
      setFilter(erster);
      setMitDeepLink(!istFilterLeer(erster) || erster.seite > 1 || erster.ansicht !== leererFilter().ansicht);
      laden();
    });
    const zurueck = () => setFilter(ausAdresse());
    window.addEventListener("popstate", zurueck);
    return () => window.removeEventListener("popstate", zurueck);
  }, [laden]);

  const daten = zustand.art === "bereit" ? zustand.daten : null;
  const verdichtet = useMemo(() => (daten ? verdichte(daten) : null), [daten]);
  const ergebnis: KatalogErgebnis | null = useMemo(() => (verdichtet ? filtere(verdichtet, filter) : null), [verdichtet, filter]);
  // Deep-Link mit zu großer Seite: filtere() kappt sie, die Adresse zieht nach (ohne neuen Verlaufseintrag).
  useEffect(() => {
    if (ergebnis && ergebnis.seite !== filter.seite) window.history.replaceState(null, "", adresse({ ...filter, seite: ergebnis.seite }));
  }, [ergebnis, filter]);
  // Zählen über alle Optionen ist teurer als Filtern: verzögert, damit Tippen flüssig bleibt.
  const verzoegert = useDeferredValue(filter);
  const zahlen = useMemo(() => (verdichtet ? zaehleOptionen(verdichtet, verzoegert) : null), [verdichtet, verzoegert]);

  const setze = useCallback((teil: Partial<StrainFilter>) => {
    setFilter((alt) => {
      const neu = { ...alt, ...teil, seite: teil.seite ?? 1 };
      window.history.replaceState(null, "", adresse(neu));
      return neu;
    });
  }, []);

  const geheZu = useCallback((seite: number) => {
    setFilter((alt) => {
      const neu = { ...alt, seite };
      window.history.pushState(null, "", adresse(neu));
      return neu;
    });
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listeRef.current?.scrollIntoView({ block: "start", behavior: reduziert ? "auto" : "smooth" });
  }, []);

  const zuruecksetzen = useCallback(() => setze(leererFilter()), [setze]);

  // Budpics nur für sichtbare Blüten: gesammelt, gebündelt nachgeladen; bis dahin Musterbild.
  const sichtbareKultivare = useMemo(
    () => (ergebnis?.ansicht === "bluete" ? ergebnis.zeilen : start.zeilen).filter((z) => z.slug).map((z) => z.id),
    [ergebnis, start.zeilen],
  );
  useEffect(() => {
    const offen = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const holen = () => {
      const ids = [...offen].slice(0, BUDPIC_BUENDEL);
      offen.clear();
      if (ids.length === 0) return;
      fetch(`/api/katalog/budpics?ids=${ids.join(",")}`)
        .then((antwort): Promise<Record<string, BudpicAnzeige[]>> | Record<string, BudpicAnzeige[]> => (antwort.ok ? antwort.json() : {}))
        .then((roh) => {
          const eintraege = Object.entries(roh).filter(([, liste]) => liste.length > 0);
          if (eintraege.length === 0) return;
          setBudpics((alt) => {
            const neu = new Map(alt);
            for (const [id, liste] of eintraege) neu.set(id, alsDiashow(liste, w, sprache));
            return neu;
          });
        })
        .catch(() => undefined);
    };
    const beobachter = new IntersectionObserver(
      (sicht) => {
        for (const e of sicht) {
          const id = (e.target as HTMLElement).dataset.kultivar;
          if (!e.isIntersecting || !id || angefragt.current.has(id)) continue;
          angefragt.current.add(id);
          offen.add(id);
          beobachter.unobserve(e.target);
        }
        if (offen.size > 0 && !timer) timer = setTimeout(() => ((timer = undefined), holen()), 150);
      },
      { rootMargin: "200px" },
    );
    for (const el of listeRef.current?.querySelectorAll<HTMLElement>("[data-kultivar]") ?? []) {
      if (!angefragt.current.has(el.dataset.kultivar ?? "")) beobachter.observe(el);
    }
    return () => {
      beobachter.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [sichtbareKultivare, w, sprache]);

  const deaktiviert = filterDeaktiviert(zustand);
  const leer = leererFilter();
  const aktiv = aktiveAnzahl(filter, leer);
  const chips = aktiveChips(filter, w, sprache, daten);
  const gesamt = ergebnis?.gesamt ?? start.gesamt;
  const bluetenAnsicht = ergebnis ? ergebnis.ansicht === "bluete" : true;
  const vertreiberNamen = new Map((daten?.vertreiber ?? start.vertreiber).map((v) => [v.i, v.n]));
  const vertreiberName = (id: string) => vertreiberNamen.get(id) ?? texte.karte.vertreiberUnbekannt;
  const kartenTexte: KartenTexte = { ...texte.karte, kultivarTyp: w.label.kultivarTyp, darreichungsform: w.label.darreichungsform };
  const labels = { kultivarTyp: w.label.kultivarTyp, darreichungsform: w.label.darreichungsform, geschmack: w.label.geschmack };
  const zeigeSkelett = !ergebnis && mitDeepLink && zustand.art !== "fehler";
  const feldProps = { filter, zahlen, daten, setze, texte: texte.leiste, labels, sprache, deaktiviert };
  // Übergang bis zur Chipleiste (Task B4): Felder untereinander.
  const felder = (
    <div className="flex flex-col gap-6">
      <SuchFeld {...feldProps} />
      {CHIPS.map((chip) => <FilterFeld key={chip} chip={chip} {...feldProps} />)}
    </div>
  );

  const trefferText = bluetenAnsicht
    ? mehrzahl(sprache, texte.kultivar.anzahl, gesamt)
    : mehrzahl(sprache, texte.anzahl, gesamt, { sichtbar: ergebnis?.zeilen.length ?? 0 });

  return (
    <div className="mt-10">
      <MobilLeiste filter={filter} aktiv={aktiv} gesamt={gesamt} setze={setze} oeffne={() => setSchubladeOffen(true)} texte={texte.leiste} />
      <FilterSchublade
        offen={schubladeOffen}
        schliesse={() => setSchubladeOffen(false)}
        gesamt={gesamt}
        zuruecksetzen={zuruecksetzen}
        zuruecksetzenText={texte.zuruecksetzen}
        texte={texte.leiste}
        sprache={sprache}
      >
        {felder}
      </FilterSchublade>

      {/* Werkzeugleiste über Filterspalte und Raster; Ziel beim Blättern, damit Sortierung und Zahl im Blick bleiben. */}
      <div ref={listeRef} className="mt-6 flex scroll-mt-[calc(var(--kopf-h,4rem)+4.5rem)] flex-col gap-6 lg:mt-0">
        <Werkzeugleiste
          filter={filter}
          aktiv={aktiv}
          filterOffen={filterOffen}
          filterId={filterId}
          umschalten={filterUmschalten}
          setze={setze}
          deaktiviert={deaktiviert}
          trefferText={zeigeSkelett ? texte.laedt : trefferText}
          texte={texte}
        />

        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          {/* Sichtbar nur per CSS (.katalog-filterspalte): ab lg nach Wahl, ohne Wahl ab 2xl; ausgeblendet nimmt das Raster die ganze Breite. */}
          <aside
            id={filterId}
            aria-label={texte.filter}
            className="katalog-filterspalte sticky top-[calc(var(--kopf-h,4rem)+2rem)] max-h-[calc(100dvh-var(--kopf-h,4rem)-4rem)] w-72 shrink-0 self-start overflow-y-auto"
          >
            {felder}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-6">
          {zustand.art === "fehler" ? (
            <div role="alert" className="flex flex-wrap items-center gap-4 border-l-2 border-border-strong pl-4 text-small text-text">
              <span>{texte.ladeFehler}</span>
              <button type="button" onClick={laden} className={einzelLinkKlassen()}>
                {texte.erneutVersuchen}
              </button>
            </div>
          ) : null}

          {chips.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h2 className="sr-only">{texte.aktiv.titel}</h2>
              <ul className="flex flex-wrap items-center gap-2">
                {chips.map((chip) => (
                  <li key={chip.schluessel}>
                    <button
                      type="button"
                      disabled={deaktiviert}
                      onClick={() => setze(chip.ohne)}
                      aria-label={t(texte.aktiv.entfernen, { wert: chip.text })}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-small text-text hover:border-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed"
                    >
                      {chip.text}
                      <span aria-hidden="true">×</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" disabled={deaktiviert} onClick={zuruecksetzen} className={cn("min-h-11 px-2", einzelLinkKlassen())}>
                    {texte.alleLoeschen}
                  </button>
                </li>
              </ul>
            </div>
          ) : null}

          {zeigeSkelett ? (
            <ListenSkelett ansage={texte.laedt} />
          ) : ergebnis && ergebnis.zeilen.length === 0 ? (
            <EmptyState
              titel={texte.leerTitel}
              beschreibung={texte.leerText}
              aktion={
                <div className="flex flex-wrap gap-4">
                  <button type="button" onClick={() => setze({ ...leererFilter(), ansicht: filter.ansicht })} className={buttonKlassen("secondary")}>
                    {texte.zuruecksetzen}
                  </button>
                  <Link prefetch={false} href={vorschlagLink(filter.q)} className={buttonKlassen("secondary")}>
                    {texte.vorschlagen}
                  </Link>
                </div>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              <GeschmackLegende texte={w.katalog.geschmack} />
              <ul className={RASTER}>
                {ergebnis?.ansicht === "ware"
                  ? ergebnis.zeilen.map((zeile) => (
                      <li key={zeile.i} className={KARTEN_ZELLE}>
                        <StrainKarte zeile={zeile} vertreiberName={vertreiberName} texte={kartenTexte} sprache={sprache} fachkreis={daten?.fachkreis ?? false} w={w} />
                      </li>
                    ))
                  : (ergebnis?.zeilen ?? start.zeilen).map((zeile) => (
                      <li key={zeile.id} className={KARTEN_ZELLE} data-kultivar={zeile.slug ? zeile.id : undefined}>
                        <BlueteKarte zeile={zeile} vertreiberName={vertreiberName} budpics={budpics.get(zeile.id)} texte={kartenTexte} sprache={sprache} w={w} />
                      </li>
                    ))}
              </ul>
            </div>
          )}

          {ergebnis && ergebnis.zeilen.length > 0 ? (
            <p className="text-small text-text-muted">
              {texte.fehlt}{" "}
              <Link prefetch={false} href={vorschlagLink(filter.q)} className={textLinkKlassen()}>
                {texte.schlagVor}
              </Link>
            </p>
          ) : null}

          <Blaettern
            seite={ergebnis?.seite ?? 1}
            seitenAnzahl={ergebnis?.seitenAnzahl ?? start.seitenAnzahl}
            geheZu={geheZu}
            hrefFuer={(seite) => {
              const query = serialisiereFilter({ ...filter, seite }).toString();
              return query ? `?${query}` : "?";
            }}
            texte={texte}
          />
          </div>
        </div>
      </div>
    </div>
  );
}
