"use client";

import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";

import { DARREICHUNGSFORMEN, GESCHMACKS_KATEGORIEN, KULTIVAR_TYPEN } from "@/db/enums";
import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";
import { Field, RangeSlider } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatierePreisProGramm, formatiereProzent, formatiereZahl } from "@/lib/format";
import type { KatalogDaten } from "@/lib/katalog/typen";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

import { NOTEN_STUFEN } from "@/lib/query/filter";
import type { OptionsZahlen } from "@/lib/katalog/filtern";
import type { StrainFilter } from "@/lib/query/filter";

type Props = {
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

type Entwurf = { q: string; thcMin: number; thcMax: number; preisMax: number | undefined };

const entwurfAus = (f: StrainFilter): Entwurf => ({ q: f.q ?? "", thcMin: f.thcMin, thcMax: f.thcMax, preisMax: f.preisMax });
const gleich = (e: Entwurf, f: StrainFilter) =>
  e.q === (f.q ?? "") && e.thcMin === f.thcMin && e.thcMax === f.thcMax && e.preisMax === f.preisMax;

function umschalten<T>(werte: readonly T[], wert: T): T[] {
  return werte.includes(wert) ? werte.filter((w) => w !== wert) : [...werte, wert];
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

function Chip({ an, anzahl, onClick, deaktiviert, children }: {
  an: boolean; anzahl: number | undefined; onClick: () => void; deaktiviert: boolean; children: ReactNode;
}) {
  return (
    <button type="button" aria-pressed={an} disabled={deaktiviert} onClick={onClick} className={cn(PILLE, ton(an, anzahl), "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed")}>
      {children}
      <Zahl wert={anzahl} />
    </button>
  );
}

/** Gruppe ab Geschmack: <details>, Summary eine Zeile mit Zahl aktiver Auswahl. Kein JS für Auf/Zu. */
function Klappe({ titel, aktiv, children }: { titel: string; aktiv: number; children: ReactNode }) {
  return (
    <details className="group border-t border-border">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-2 text-small font-medium text-text">
        <span>
          {titel}
          {aktiv > 0 ? <span className="numeric ms-2 rounded-full bg-accent px-2 text-caption text-accent-fg">{aktiv}</span> : null}
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 transition-transform duration-fast group-open:rotate-180 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="flex flex-col gap-2 pb-4">{children}</div>
    </details>
  );
}

function Gruppe({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 text-small font-medium text-text">{titel}</legend>
      {children}
    </fieldset>
  );
}

/**
 * Alle Filterfelder der Blütenseite (Spec 2026-10-20 „Filter (neu geordnet)“), geteilt von
 * Desktop-Leiste und mobiler Schublade. Reihenfolge: Suche, Community, Terpene, dann
 * aufklappbar Geschmack, Typ, THC, CBD, Hersteller, Form, Verfügbarkeit, Fachkreis-Felder.
 */
export function FilterFelder({ filter, zahlen, daten, setze, texte, labels, sprache, deaktiviert }: Props) {
  const basisId = useId();
  const schluessel = `${filter.q ?? ""}|${filter.thcMin}|${filter.thcMax}|${filter.preisMax ?? ""}`;
  const [entwurf, setEntwurf] = useState<Entwurf>(() => entwurfAus(filter));
  const [gesehen, setGesehen] = useState(schluessel);
  const [alleTerpene, setAlleTerpene] = useState(false);
  const [vertreiberSuche, setVertreiberSuche] = useState("");

  // Neuer Filter von außen (Zurücksetzen, Zurück-Taste): Entwurf nachziehen, eigenes Tippen behalten.
  if (gesehen !== schluessel) {
    setGesehen(schluessel);
    if (!gleich(entwurf, filter)) setEntwurf(entwurfAus(filter));
  }

  const offen = !gleich(entwurf, filter);
  useEffect(() => {
    if (!offen) return;
    const timer = setTimeout(() => {
      const q = entwurf.q.trim();
      setze({ q: q === "" ? undefined : q, thcMin: entwurf.thcMin, thcMax: entwurf.thcMax, preisMax: entwurf.preisMax, seite: 1 });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [entwurf, offen, setze]);

  const sofort = (teil: Partial<StrainFilter>) => setze({ ...teil, seite: 1 });

  // Terpene nach Trefferzahl, gewählte immer sichtbar.
  const terpene = [...(daten?.terpene ?? [])].sort(
    (a, b) => (zahlen?.terp[b.n] ?? 0) - (zahlen?.terp[a.n] ?? 0) || a.n.localeCompare(b.n, sprache),
  );
  const terpenSicht = alleTerpene
    ? terpene
    : terpene.filter((tp, i) => i < TERPENE_SICHTBAR || filter.terp.includes(tp.n));

  const suche = vertreiberSuche.trim().toLowerCase();
  const vertreiber = [...(daten?.vertreiber ?? [])]
    .sort((a, b) => a.n.localeCompare(b.n, sprache))
    .filter((v) => filter.vertreiber.includes(v.i) || v.n.toLowerCase().includes(suche));

  const thcGeaendert = filter.thcMin !== THC_MIN || filter.thcMax !== THC_MAX;
  const notenText = (n: number) => t(texte.abNote, { note: formatiereZahl(n, 1, sprache) });

  return (
    <div className="flex flex-col gap-6" aria-disabled={deaktiviert || undefined}>
      {/* Suche: nur Desktop, mobil sitzt sie in der MobilLeiste. */}
      <div className="hidden lg:block">
        <Field id={`${basisId}-q`} label={texte.suche}>
          {(attribute) => (
            <input
              {...attribute}
              type="search"
              value={entwurf.q}
              autoComplete="off"
              disabled={deaktiviert}
              onChange={(event) => setEntwurf((alt) => ({ ...alt, q: event.target.value }))}
              className={SUCHFELD}
            />
          )}
        </Field>
      </div>

      <Gruppe titel={texte.community}>
        <div role="radiogroup" aria-label={texte.mindestnote} className="flex flex-wrap gap-2">
          {[undefined, ...NOTEN_STUFEN].map((stufe) => {
            const an = filter.note === stufe;
            const anzahl = stufe === undefined ? undefined : zahlen?.note[String(stufe) as keyof OptionsZahlen["note"]];
            return (
              <label key={stufe ?? "alle"} className={cn(PILLE, ton(an, anzahl))}>
                <input
                  type="radio"
                  name={`${basisId}-note`}
                  className="sr-only"
                  checked={an}
                  disabled={deaktiviert}
                  onChange={() => sofort({ note: stufe })}
                />
                {stufe === undefined ? texte.alleNoten : notenText(stufe)}
                <Zahl wert={anzahl} />
              </label>
            );
          })}
        </div>
        <label className={CHECKBOX_ZEILE}>
          <input
            type="checkbox"
            checked={filter.bewertet}
            disabled={deaktiviert}
            onChange={(event) => sofort({ bewertet: event.target.checked })}
            className={CHECKBOX}
          />
          <span>{texte.nurBewertet} <Zahl wert={zahlen?.bewertet} /></span>
        </label>
      </Gruppe>

      <Gruppe titel={texte.terpene}>
        <div className="flex flex-wrap gap-2">
          {terpenSicht.map((tp) => (
            <Chip
              key={tp.n}
              an={filter.terp.includes(tp.n)}
              anzahl={zahlen?.terp[tp.n]}
              deaktiviert={deaktiviert}
              onClick={() => sofort({ terp: umschalten(filter.terp, tp.n) })}
            >
              <TerpenIcon name={tp.n} className="size-4" />
              {tp.n}
            </Chip>
          ))}
        </div>
        {terpene.length > TERPENE_SICHTBAR ? (
          <button
            type="button"
            aria-expanded={alleTerpene}
            onClick={() => setAlleTerpene((alt) => !alt)}
            className="min-h-11 self-start text-small text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            {alleTerpene ? texte.wenigerTerpene : texte.mehrTerpene}
          </button>
        ) : null}
      </Gruppe>

      <div className="flex flex-col">
        <Klappe titel={texte.geschmack} aktiv={filter.geschmack.length}>
          <div className="flex flex-wrap gap-2">
            {GESCHMACKS_KATEGORIEN.map((g) => (
              <Chip
                key={g}
                an={filter.geschmack.includes(g)}
                anzahl={zahlen?.geschmack[g]}
                deaktiviert={deaktiviert}
                onClick={() => sofort({ geschmack: umschalten(filter.geschmack, g) })}
              >
                <GeschmackIcon geschmack={g} className="size-4" />
                {labels.geschmack[g]}
              </Chip>
            ))}
          </div>
        </Klappe>

        <Klappe titel={texte.kultivarTyp} aktiv={filter.typ.length}>
          <div className="flex flex-wrap gap-2">
            {KULTIVAR_TYPEN.map((typ) => (
              <Chip
                key={typ}
                an={filter.typ.includes(typ)}
                anzahl={zahlen?.typ[typ]}
                deaktiviert={deaktiviert}
                onClick={() => sofort({ typ: umschalten(filter.typ, typ) })}
              >
                {labels.kultivarTyp[typ]}
              </Chip>
            ))}
          </div>
        </Klappe>

        <Klappe titel={texte.thc} aktiv={(thcGeaendert ? 1 : 0) + (filter.cbd ? 1 : 0)}>
          <RangeSlider
            label={texte.thc}
            bis={texte.bis}
            min={THC_MIN}
            max={THC_MAX}
            wert={[entwurf.thcMin, entwurf.thcMax]}
            formatiere={(n) => formatiereProzent(n, 1, sprache)}
            onChange={([min, max]) => setEntwurf((alt) => ({ ...alt, thcMin: min, thcMax: max }))}
          />
          <label className={CHECKBOX_ZEILE}>
            <input
              type="checkbox"
              checked={filter.cbd}
              disabled={deaktiviert}
              onChange={(event) => sofort({ cbd: event.target.checked })}
              className={CHECKBOX}
            />
            <span>{texte.cbdReich} <Zahl wert={zahlen?.cbd} /></span>
          </label>
        </Klappe>

        {(daten?.vertreiber.length ?? 0) > 0 ? (
          <Klappe titel={texte.vertreiber} aktiv={filter.vertreiber.length}>
            <label htmlFor={`${basisId}-vs`} className="sr-only">{texte.vertreiberSuchen}</label>
            <input
              id={`${basisId}-vs`}
              type="search"
              value={vertreiberSuche}
              onChange={(event) => setVertreiberSuche(event.target.value)}
              placeholder={texte.vertreiberSuchen}
              className="min-h-11 rounded-md border border-border-strong bg-surface px-4 text-small text-text placeholder:text-text-muted"
            />
            <div className="flex max-h-80 flex-col gap-1 overflow-y-auto overscroll-contain rounded-md border border-border px-2">
              {vertreiber.map((v) => {
                const anzahl = zahlen?.vertreiber[v.i];
                return (
                  <label key={v.i} className={cn(CHECKBOX_ZEILE, anzahl === 0 && !filter.vertreiber.includes(v.i) && "text-text-muted")}>
                    <input
                      type="checkbox"
                      checked={filter.vertreiber.includes(v.i)}
                      disabled={deaktiviert}
                      onChange={() => sofort({ vertreiber: umschalten(filter.vertreiber, v.i) })}
                      className={CHECKBOX}
                    />
                    <span>{v.n} <Zahl wert={anzahl} /></span>
                  </label>
                );
              })}
            </div>
          </Klappe>
        ) : null}

        <Klappe titel={texte.darreichungsform} aktiv={filter.form.length}>
          <div className="flex flex-col gap-1">
            {DARREICHUNGSFORMEN.map((form) => (
              <label key={form} className={cn(CHECKBOX_ZEILE, zahlen?.form[form] === 0 && !filter.form.includes(form) && "text-text-muted")}>
                <input
                  type="checkbox"
                  checked={filter.form.includes(form)}
                  disabled={deaktiviert}
                  onChange={() => sofort({ form: umschalten(filter.form, form) })}
                  className={CHECKBOX}
                />
                <span>{labels.darreichungsform[form]} <Zahl wert={zahlen?.form[form]} /></span>
              </label>
            ))}
          </div>
        </Klappe>

        <Klappe titel={texte.verfuegbarkeit} aktiv={filter.nurVerfuegbar ? 1 : 0}>
          <label className={CHECKBOX_ZEILE}>
            <input
              type="checkbox"
              checked={filter.nurVerfuegbar}
              disabled={deaktiviert}
              onChange={(event) => sofort({ nurVerfuegbar: event.target.checked })}
              className={CHECKBOX}
            />
            <span>{texte.nurVerfuegbar}</span>
          </label>
        </Klappe>

        {/* Apotheke und Preis nur für Fachkreise (Freigabelogik liefert daten.fachkreis). */}
        {daten?.fachkreis ? (
          <>
            {daten.apotheken.length > 0 ? (
              <Klappe titel={texte.apotheke} aktiv={filter.apotheke.length}>
                <div className="flex max-h-80 flex-col gap-1 overflow-y-auto overscroll-contain">
                  {daten.apotheken.map((a) => (
                    <label key={a.s} className={CHECKBOX_ZEILE}>
                      <input
                        type="checkbox"
                        checked={filter.apotheke.includes(a.s)}
                        disabled={deaktiviert}
                        onChange={() => sofort({ apotheke: umschalten(filter.apotheke, a.s) })}
                        className={CHECKBOX}
                      />
                      <span>{a.n}</span>
                    </label>
                  ))}
                </div>
              </Klappe>
            ) : null}
            <Klappe titel={texte.hoechstpreis} aktiv={filter.preisMax !== undefined ? 1 : 0}>
              <Field
                id={`${basisId}-preis`}
                label={texte.hoechstpreis}
                labelVersteckt
                hinweis={t(texte.aktuell, { preis: formatierePreisProGramm(entwurf.preisMax ?? PREIS_OBEN, sprache) })}
              >
                {(attribute) => (
                  <input
                    {...attribute}
                    type="range"
                    min={0}
                    max={PREIS_OBEN}
                    step={PREIS_SCHRITT}
                    value={entwurf.preisMax ?? PREIS_OBEN}
                    disabled={deaktiviert}
                    aria-valuetext={formatierePreisProGramm(entwurf.preisMax ?? PREIS_OBEN, sprache)}
                    onChange={(event) => {
                      const wert = Number(event.target.value);
                      setEntwurf((alt) => ({ ...alt, preisMax: wert >= PREIS_OBEN ? undefined : wert }));
                    }}
                    className="h-11 w-full cursor-pointer bg-transparent"
                  />
                )}
              </Field>
            </Klappe>
          </>
        ) : null}
      </div>
    </div>
  );
}
