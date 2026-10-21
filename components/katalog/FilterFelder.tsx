"use client";

import { useEffect, useEffectEvent, useId, useState } from "react";
import type { ReactNode } from "react";

import { DARREICHUNGSFORMEN, GESCHMACKS_KATEGORIEN, KULTIVAR_TYPEN } from "@/db/enums";
import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";
import { Field, RangeSlider } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatierePreisProGramm, formatiereProzent, formatiereZahl } from "@/lib/format";
import { suchTeil, type ChipSchluessel } from "@/lib/katalog/chipleiste";
import type { KatalogDaten } from "@/lib/katalog/typen";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

import { NOTEN_STUFEN } from "@/lib/query/filter";
import type { OptionsZahlen } from "@/lib/katalog/filtern";
import type { StrainFilter } from "@/lib/query/filter";

export type FeldProps = {
  filter: StrainFilter;
  zahlen: OptionsZahlen | null;
  daten: Pick<KatalogDaten, "vertreiber" | "terpene" | "apotheken" | "fachkreis"> | null;
  setze: (teil: Partial<StrainFilter>) => void;
  texte: Woerterbuch["katalog"]["leiste"];
  labels: Pick<Woerterbuch["label"], "kultivarTyp" | "darreichungsform" | "geschmack">;
  sprache: Sprache;
  deaktiviert: boolean;
};

/** Verzögerung für Freitext und Slider in Millisekunden (wie bisher in FilterLeiste). */
const DEBOUNCE_MS = 300;
/** Sichtbare Terpene, bevor „mehr“ den Rest aufklappt (Hick: acht häufigste zuerst). */
const TERPENE_SICHTBAR = 8;
/** Preis-Slider (nur Fachkreis) in 50-Cent-Schritten bis 20 €/g. */
const PREIS_SCHRITT = 50;
const PREIS_OBEN = 2000;
const THC_MIN = 0;
const THC_MAX = 100;

/**
 * h-11 / min-h-11 = 44px Touch-Ziel, deshalb kein 8px-Vielfaches.
 * gap-1 (4 px) zwischen Checkbox-Zeilen hält die 44-px-Zeilen als eine Gruppe zusammen
 * (übernommen aus FilterLeiste, dort begründet).
 */
const CHECKBOX_ZEILE =
  "flex min-h-11 cursor-pointer items-center gap-2 text-small text-text " +
  "has-disabled:cursor-not-allowed has-disabled:text-text-muted";
const CHECKBOX =
  "size-4 shrink-0 accent-accent " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";
const SUCHFELD =
  "h-11 w-full rounded-md border border-border-strong bg-surface px-4 text-body text-text " +
  "transition-opacity duration-150 ease-standard " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** Pille für Mehrfachauswahl (aria-pressed) und Stufen (Radio über has-checked). */
const PILLE =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-small " +
  "transition-colors duration-fast ease-standard active:scale-[0.97] " +
  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring";
const PILLE_AN = "border-accent bg-accent-subtle text-text";
const PILLE_AUS = "border-border-strong bg-surface";

function umschalten<T>(werte: readonly T[], wert: T): T[] {
  return werte.includes(wert) ? werte.filter((w) => w !== wert) : [...werte, wert];
}

/**
 * Entwurf für Freitext und Slider: tippt sofort, schreibt nach DEBOUNCE_MS in die URL.
 * Neuer Wert von außen (Zurücksetzen, Zurück-Taste): Entwurf nachziehen, eigenes Tippen behalten.
 */
function useEntwurf<T>(aussen: T, schreibe: (wert: T) => void): [T, (neu: (alt: T) => T) => void] {
  const schluessel = JSON.stringify(aussen);
  const [entwurf, setEntwurf] = useState<T>(aussen);
  const [gesehen, setGesehen] = useState(schluessel);
  if (gesehen !== schluessel) {
    setGesehen(schluessel);
    if (JSON.stringify(entwurf) !== schluessel) setEntwurf(aussen);
  }
  const offen = JSON.stringify(entwurf) !== schluessel;
  const schreibeJetzt = useEffectEvent((wert: T) => schreibe(wert));
  useEffect(() => {
    if (!offen) return;
    const timer = setTimeout(() => schreibeJetzt(entwurf), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [entwurf, offen]);
  return [entwurf, setEntwurf];
}

function Zahl({ wert }: { wert: number | undefined }) {
  if (wert === undefined) return null;
  return <span className="numeric text-text-muted">{wert}</span>;
}

/** Ausgewählte Option nie abschwächen; Zahl 0 und nicht gewählt: muted, bleibt anklickbar (Spec). */
function ton(gewaehlt: boolean, anzahl: number | undefined) {
  if (gewaehlt) return PILLE_AN;
  return cn(PILLE_AUS, anzahl === 0 ? "text-text-muted" : "text-text");
}

function Pille({ an, anzahl, onClick, deaktiviert, children }: {
  an: boolean; anzahl: number | undefined; onClick: () => void; deaktiviert: boolean; children: ReactNode;
}) {
  return (
    <button type="button" aria-pressed={an} disabled={deaktiviert} onClick={onClick} className={cn(PILLE, ton(an, anzahl), "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed")}>
      {children}
      <Zahl wert={anzahl} />
    </button>
  );
}

/** Der Titel steht schon im Fenster (ChipFenster); die Legende bleibt für Screenreader. */
function Gruppe({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0">
      <legend className="sr-only">{titel}</legend>
      {children}
    </fieldset>
  );
}

function Haken({ an, deaktiviert, onChange, children, gedaempft = false }: {
  an: boolean; deaktiviert: boolean; onChange: (an: boolean) => void; children: ReactNode; gedaempft?: boolean;
}) {
  return (
    <label className={cn(CHECKBOX_ZEILE, gedaempft && "text-text-muted")}>
      <input type="checkbox" checked={an} disabled={deaktiviert} onChange={(e) => onChange(e.target.checked)} className={CHECKBOX} />
      <span>{children}</span>
    </label>
  );
}

const sofortAus = (setze: FeldProps["setze"]) => (teil: Partial<StrainFilter>) => setze({ ...teil, seite: 1 });

/** Freitextsuche über der Werkzeugleiste, eigener Entwurf für `q`. */
export function SuchFeld({ filter, setze, texte, deaktiviert }: FeldProps) {
  const id = useId();
  // Erster Suchtext springt auf Relevanz (lib/katalog/chipleiste.ts suchTeil).
  const [q, setQ] = useEntwurf(filter.q ?? "", (wert) => setze(suchTeil(filter, wert)));
  return (
    <Field id={`${id}-q`} label={texte.suche}>
      {(attribute) => (
        <input
          {...attribute}
          type="search"
          value={q}
          autoComplete="off"
          disabled={deaktiviert}
          onChange={(event) => {
            const wert = event.target.value;
            setQ(() => wert);
          }}
          className={SUCHFELD}
        />
      )}
    </Field>
  );
}

function CommunityFeld({ filter, zahlen, setze, texte, sprache, deaktiviert }: FeldProps) {
  const id = useId();
  const sofort = sofortAus(setze);
  const notenText = (n: number) => t(texte.abNote, { note: formatiereZahl(n, 1, sprache) });
  return (
    <Gruppe titel={texte.community}>
      <div role="radiogroup" aria-label={texte.mindestnote} className="flex flex-wrap gap-2">
        {[undefined, ...NOTEN_STUFEN].map((stufe) => {
          const an = filter.note === stufe;
          const anzahl = stufe === undefined ? undefined : zahlen?.note[String(stufe) as keyof OptionsZahlen["note"]];
          return (
            <label key={stufe ?? "alle"} className={cn(PILLE, ton(an, anzahl))}>
              <input type="radio" name={`${id}-note`} className="sr-only" checked={an} disabled={deaktiviert} onChange={() => sofort({ note: stufe })} />
              {stufe === undefined ? texte.alleNoten : notenText(stufe)}
              <Zahl wert={anzahl} />
            </label>
          );
        })}
      </div>
      <Haken an={filter.bewertet} deaktiviert={deaktiviert} onChange={(an) => sofort({ bewertet: an })}>
        {texte.nurBewertet} <Zahl wert={zahlen?.bewertet} />
      </Haken>
    </Gruppe>
  );
}

function TerpeneFeld({ filter, zahlen, daten, setze, texte, sprache, deaktiviert }: FeldProps) {
  const [alle, setAlle] = useState(false);
  const sofort = sofortAus(setze);
  // Terpene nach Trefferzahl, gewählte immer sichtbar.
  const terpene = [...(daten?.terpene ?? [])].sort(
    (a, b) => (zahlen?.terp[b.n] ?? 0) - (zahlen?.terp[a.n] ?? 0) || a.n.localeCompare(b.n, sprache),
  );
  const sicht = alle ? terpene : terpene.filter((tp, i) => i < TERPENE_SICHTBAR || filter.terp.includes(tp.n));
  return (
    <Gruppe titel={texte.terpene}>
      <div className="flex flex-wrap gap-2">
        {sicht.map((tp) => (
          <Pille key={tp.n} an={filter.terp.includes(tp.n)} anzahl={zahlen?.terp[tp.n]} deaktiviert={deaktiviert} onClick={() => sofort({ terp: umschalten(filter.terp, tp.n) })}>
            <TerpenIcon name={tp.n} className="size-4" />
            {tp.n}
          </Pille>
        ))}
      </div>
      {terpene.length > TERPENE_SICHTBAR ? (
        <button
          type="button"
          aria-expanded={alle}
          onClick={() => setAlle((alt) => !alt)}
          className="min-h-11 self-start text-small text-accent underline underline-offset-4 hover:text-accent-hover"
        >
          {alle ? texte.wenigerTerpene : texte.mehrTerpene}
        </button>
      ) : null}
    </Gruppe>
  );
}

function GeschmackFeld({ filter, zahlen, setze, texte, labels, deaktiviert }: FeldProps) {
  const sofort = sofortAus(setze);
  return (
    <Gruppe titel={texte.geschmack}>
      <div className="flex flex-wrap gap-2">
        {GESCHMACKS_KATEGORIEN.map((g) => (
          <Pille key={g} an={filter.geschmack.includes(g)} anzahl={zahlen?.geschmack[g]} deaktiviert={deaktiviert} onClick={() => sofort({ geschmack: umschalten(filter.geschmack, g) })}>
            <GeschmackIcon geschmack={g} className="size-4" />
            {labels.geschmack[g]}
          </Pille>
        ))}
      </div>
    </Gruppe>
  );
}

function TypFeld({ filter, zahlen, setze, texte, labels, deaktiviert }: FeldProps) {
  const sofort = sofortAus(setze);
  return (
    <Gruppe titel={texte.kultivarTyp}>
      <div className="flex flex-wrap gap-2">
        {KULTIVAR_TYPEN.map((typ) => (
          <Pille key={typ} an={filter.typ.includes(typ)} anzahl={zahlen?.typ[typ]} deaktiviert={deaktiviert} onClick={() => sofort({ typ: umschalten(filter.typ, typ) })}>
            {labels.kultivarTyp[typ]}
          </Pille>
        ))}
      </div>
    </Gruppe>
  );
}

function ThcFeld({ filter, zahlen, setze, texte, sprache, deaktiviert }: FeldProps) {
  const sofort = sofortAus(setze);
  const [spanne, setSpanne] = useEntwurf<[number, number]>([filter.thcMin, filter.thcMax], ([min, max]) =>
    setze({ thcMin: min, thcMax: max, seite: 1 }),
  );
  return (
    <Gruppe titel={texte.thc}>
      <RangeSlider
        label={texte.thc}
        bis={texte.bis}
        min={THC_MIN}
        max={THC_MAX}
        wert={spanne}
        formatiere={(n) => formatiereProzent(n, 1, sprache)}
        onChange={(wert) => setSpanne(() => wert)}
      />
      <Haken an={filter.cbd} deaktiviert={deaktiviert} onChange={(an) => sofort({ cbd: an })}>
        {texte.cbdReich} <Zahl wert={zahlen?.cbd} />
      </Haken>
    </Gruppe>
  );
}

function VertreiberFeld({ filter, zahlen, daten, setze, texte, sprache, deaktiviert }: FeldProps) {
  const id = useId();
  const [suche, setSuche] = useState("");
  const sofort = sofortAus(setze);
  if ((daten?.vertreiber.length ?? 0) === 0) return null;
  const s = suche.trim().toLowerCase();
  const liste = [...(daten?.vertreiber ?? [])]
    .sort((a, b) => a.n.localeCompare(b.n, sprache))
    .filter((v) => filter.vertreiber.includes(v.i) || v.n.toLowerCase().includes(s));
  return (
    <Gruppe titel={texte.vertreiber}>
      <label htmlFor={`${id}-vs`} className="sr-only">{texte.vertreiberSuchen}</label>
      <input
        id={`${id}-vs`}
        type="search"
        value={suche}
        onChange={(event) => setSuche(event.target.value)}
        placeholder={texte.vertreiberSuchen}
        className="min-h-11 rounded-md border border-border-strong bg-surface px-4 text-small text-text placeholder:text-text-muted"
      />
      <div className="flex flex-col gap-1">
        {liste.map((v) => {
          const an = filter.vertreiber.includes(v.i);
          const anzahl = zahlen?.vertreiber[v.i];
          return (
            <Haken key={v.i} an={an} deaktiviert={deaktiviert} gedaempft={anzahl === 0 && !an} onChange={() => sofort({ vertreiber: umschalten(filter.vertreiber, v.i) })}>
              {v.n} <Zahl wert={anzahl} />
            </Haken>
          );
        })}
      </div>
    </Gruppe>
  );
}

function FormFeld({ filter, zahlen, setze, texte, labels, deaktiviert }: FeldProps) {
  const sofort = sofortAus(setze);
  return (
    <Gruppe titel={texte.darreichungsform}>
      <div className="flex flex-col gap-1">
        {DARREICHUNGSFORMEN.map((form) => {
          const an = filter.form.includes(form);
          return (
            <Haken key={form} an={an} deaktiviert={deaktiviert} gedaempft={zahlen?.form[form] === 0 && !an} onChange={() => sofort({ form: umschalten(filter.form, form) })}>
              {labels.darreichungsform[form]} <Zahl wert={zahlen?.form[form]} />
            </Haken>
          );
        })}
      </div>
    </Gruppe>
  );
}

function VerfuegbarFeld({ filter, setze, texte, deaktiviert }: FeldProps) {
  const sofort = sofortAus(setze);
  return (
    <Gruppe titel={texte.verfuegbarkeit}>
      <Haken an={filter.nurVerfuegbar} deaktiviert={deaktiviert} onChange={(an) => sofort({ nurVerfuegbar: an })}>
        {texte.nurVerfuegbar}
      </Haken>
    </Gruppe>
  );
}

/** Apotheke und Höchstpreis nur für Fachkreise (Freigabelogik liefert daten.fachkreis). */
function MehrFeld({ filter, daten, setze, texte, sprache, deaktiviert }: FeldProps) {
  const id = useId();
  const sofort = sofortAus(setze);
  const [preis, setPreis] = useEntwurf(filter.preisMax, (wert) => setze({ preisMax: wert, seite: 1 }));
  if (!daten?.fachkreis) return null;
  const preisText = formatierePreisProGramm(preis ?? PREIS_OBEN, sprache);
  return (
    <div className="flex flex-col gap-6">
      {daten.apotheken.length > 0 ? (
        <fieldset className="flex flex-col gap-1 border-0 p-0">
          <legend className="mb-2 text-small font-medium text-text">{texte.apotheke}</legend>
          {daten.apotheken.map((a) => (
            <Haken key={a.s} an={filter.apotheke.includes(a.s)} deaktiviert={deaktiviert} onChange={() => sofort({ apotheke: umschalten(filter.apotheke, a.s) })}>
              {a.n}
            </Haken>
          ))}
        </fieldset>
      ) : null}
      <Field id={`${id}-preis`} label={texte.hoechstpreis} hinweis={t(texte.aktuell, { preis: preisText })}>
        {(attribute) => (
          <input
            {...attribute}
            type="range"
            min={0}
            max={PREIS_OBEN}
            step={PREIS_SCHRITT}
            value={preis ?? PREIS_OBEN}
            disabled={deaktiviert}
            aria-valuetext={preisText}
            onChange={(event) => {
              const wert = Number(event.target.value);
              setPreis(() => (wert >= PREIS_OBEN ? undefined : wert));
            }}
            className="h-11 w-full cursor-pointer bg-transparent"
          />
        )}
      </Field>
    </div>
  );
}

/**
 * Ein Filterfeld der Blütenseite je Chip (Spec 2026-10-21), Inhalt eines ChipFensters.
 * Reihenfolge der Chips steht in lib/katalog/chipleiste.ts.
 */
export function FilterFeld({ chip, ...props }: FeldProps & { chip: ChipSchluessel }) {
  switch (chip) {
    case "community": return <CommunityFeld {...props} />;
    case "terpene": return <TerpeneFeld {...props} />;
    case "geschmack": return <GeschmackFeld {...props} />;
    case "typ": return <TypFeld {...props} />;
    case "thc": return <ThcFeld {...props} />;
    case "vertreiber": return <VertreiberFeld {...props} />;
    case "form": return <FormFeld {...props} />;
    case "verfuegbar": return <VerfuegbarFeld {...props} />;
    case "mehr": return <MehrFeld {...props} />;
  }
}
