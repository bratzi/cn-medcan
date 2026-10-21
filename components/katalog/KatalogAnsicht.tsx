"use client";

import Link from "next/link";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { Blaettern } from "@/components/katalog/Blaettern";
import { SuchFeld } from "@/components/katalog/FilterFelder";
import { BlueteKarte, StrainKarte, type KartenTexte } from "@/components/katalog/KatalogKarte";
import { Werkzeugleiste, type AktiverChip } from "@/components/katalog/Werkzeugleiste";
import type { DiashowBild } from "@/components/produkt/BudpicDiashow";
import { SKELETT_FLAECHE, SkelettAnsage } from "@/components/story/Skelette";
import { buttonKlassen } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { einzelLinkKlassen, textLinkKlassen } from "@/components/ui/textlink";
import { alsDiashow } from "@/lib/budpic-anzeige";
import { formatierePreisProGramm, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { filtere, verdichte, zaehleOptionen, type KatalogErgebnis } from "@/lib/katalog/filtern";
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
 * Raster der Karten (Spec 2026-10-21): volle Breite ohne Filterspalte, 1/2/3/4/5 Spalten.
 * Jede Karte spannt fünf Zeilen, die sie per subgrid teilt.
 */
const RASTER = "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";
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

function aktiveChips(f: StrainFilter, w: Woerterbuch, sprache: Sprache, daten: KatalogDaten | null): AktiverChip[] {
  const a = w.katalog.aktiv;
  const l = w.katalog.leiste;
  const leer = leererFilter();
  const vertreiber = new Map(daten?.vertreiber.map((v) => [v.i, v.n]) ?? []);
  const apotheken = new Map(daten?.apotheken.map((x) => [x.s, x.n]) ?? []);
  const chips: AktiverChip[] = [];
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
  const [mitDeepLink, setMitDeepLink] = useState(false);
  const [budpics, setBudpics] = useState<ReadonlyMap<string, DiashowBild[]>>(new Map());
  const angefragt = useRef(new Set<string>());
  const listeRef = useRef<HTMLDivElement>(null);

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
  const chips = aktiveChips(filter, w, sprache, daten);
  const gesamt = ergebnis?.gesamt ?? start.gesamt;
  const bluetenAnsicht = ergebnis ? ergebnis.ansicht === "bluete" : true;
  const vertreiberNamen = new Map((daten?.vertreiber ?? start.vertreiber).map((v) => [v.i, v.n]));
  const vertreiberName = (id: string) => vertreiberNamen.get(id) ?? texte.karte.vertreiberUnbekannt;
  const kartenTexte: KartenTexte = { ...texte.karte, kultivarTyp: w.label.kultivarTyp, darreichungsform: w.label.darreichungsform };
  const labels = { kultivarTyp: w.label.kultivarTyp, darreichungsform: w.label.darreichungsform, geschmack: w.label.geschmack };
  const zeigeSkelett = !ergebnis && mitDeepLink && zustand.art !== "fehler";
  const feldProps = { filter, zahlen, daten, setze, texte: texte.leiste, labels, sprache, deaktiviert };

  const trefferText = bluetenAnsicht
    ? mehrzahl(sprache, texte.kultivar.anzahl, gesamt)
    : mehrzahl(sprache, texte.anzahl, gesamt, { sichtbar: ergebnis?.zeilen.length ?? 0 });

  return (
    <div className="mt-10 flex flex-col gap-6">
      {/* Suche über der Leiste, volle Inhaltsbreite (Spec 2026-10-21). */}
      <SuchFeld {...feldProps} />

      {/* Ziel beim Blättern: Leiste und Raster, damit Sortierung und Zahl im Blick bleiben. */}
      <div ref={listeRef} className="flex scroll-mt-(--kopf-h,4rem) flex-col gap-6">
        <Werkzeugleiste
          {...feldProps}
          texte={texte}
          trefferText={zeigeSkelett ? texte.laedt : trefferText}
          gesamt={gesamt}
          aktiveChips={chips}
          zuruecksetzen={zuruecksetzen}
        />

        <div className="flex min-w-0 flex-col gap-6">
          {zustand.art === "fehler" ? (
            <div role="alert" className="flex flex-wrap items-center gap-4 border-l-2 border-border-strong pl-4 text-small text-text">
              <span>{texte.ladeFehler}</span>
              <button type="button" onClick={laden} className={einzelLinkKlassen()}>
                {texte.erneutVersuchen}
              </button>
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
  );
}
