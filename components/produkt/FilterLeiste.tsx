"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState, useTransition } from "react";

import { Button, Field, RangeSlider, Select } from "@/components/ui";
import { formatierePreisProGramm, formatiereProzent } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import {
  SORTIERUNGEN,
  istFilterLeer,
  leererFilter,
  serialisiereFilter,
} from "@/lib/query/filter";
import type { Sortierung, StrainFilter } from "@/lib/query/filter";
import type { FilterFacetten } from "@/lib/query/strains";

type Props = {
  facetten: FilterFacetten;
  filter: StrainFilter;
  /** Trefferzahl, wird per aria-live angekuendigt. */
  gesamt: number;
  texte: Woerterbuch["katalog"]["leiste"];
  /** Filter, Zuruecksetzen: gemeinsam mit der Seite. */
  titel: string;
  zuruecksetzen: string;
  labels: Pick<Woerterbuch["label"], "kultivarTyp" | "darreichungsform" | "geschmack">;
  sprache: Sprache;
};

/** Verzoegerung fuer Freitext und Slider in Millisekunden. */
const DEBOUNCE_MS = 300;

/** Preis-Slider in 50-Cent-Schritten — feiner waere ohne Nutzen. */
const PREIS_SCHRITT = 50;

/**
 * h-11 / min-h-11 = 44px Touch-Target, deshalb kein 8px-Vielfaches.
 *
 * Die Checkbox-Gruppen nutzen `gap-1` (4px) zwischen den Zeilen: jede Zeile
 * ist bereits 44px hoch, mit 8px Abstand ergaebe das 52px Rhythmus und die
 * Gruppe zerfiele optisch in Einzelzeilen. 4px haelt die Zeilen als eine
 * Gruppe zusammen und bleibt trotzdem als Trennung lesbar.
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

/** Zustand der verzoegerten Felder. Quelle der Wahrheit bleibt die URL. */
type Entwurf = {
  q: string;
  thcMin: number;
  thcMax: number;
  preisMax: number | undefined;
};

function entwurfAus(filter: StrainFilter): Entwurf {
  return {
    q: filter.q ?? "",
    thcMin: filter.thcMin,
    thcMax: filter.thcMax,
    preisMax: filter.preisMax,
  };
}

function gleich(entwurf: Entwurf, filter: StrainFilter): boolean {
  return (
    entwurf.q === (filter.q ?? "") &&
    entwurf.thcMin === filter.thcMin &&
    entwurf.thcMax === filter.thcMax &&
    entwurf.preisMax === filter.preisMax
  );
}

function umschalten<T>(werte: readonly T[], wert: T, aktiv: boolean): T[] {
  return aktiv ? [...werte, wert] : werte.filter((eintrag) => eintrag !== wert);
}

export function FilterLeiste({ facetten, filter, gesamt, texte, titel, zuruecksetzen, labels, sprache }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const basisId = useId();

  const filterSchluessel = serialisiereFilter(filter).toString();
  const [entwurf, setEntwurf] = useState<Entwurf>(() => entwurfAus(filter));
  const [gesehenerSchluessel, setGesehenerSchluessel] = useState(filterSchluessel);

  // Kam ein neuer Filter von aussen (Chip entfernt, Zuruecksetzen, Zurueck-
  // Taste), wird der Entwurf nachgezogen. Stimmt er schon mit der URL ueberein,
  // bleibt er unangetastet — sonst wuerde die eigene Navigation Tippen loeschen.
  if (gesehenerSchluessel !== filterSchluessel) {
    setGesehenerSchluessel(filterSchluessel);
    if (!gleich(entwurf, filter)) setEntwurf(entwurfAus(filter));
  }

  const schreibe = useCallback(
    (naechster: StrainFilter) => {
      const query = serialisiereFilter(naechster).toString();
      if (query === searchParams.toString()) return;
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  /** Sofortige Aenderung (Checkbox, Select). Setzt die Seite zurueck. */
  const setzeSofort = useCallback(
    (teil: Partial<StrainFilter>) => {
      schreibe({ ...filter, ...teil, seite: 1 });
    },
    [filter, schreibe],
  );

  const entwurfOffen = !gleich(entwurf, filter);

  // Debounce: Freitext und Slider navigieren erst 300 ms nach der letzten
  // Aenderung. Jede weitere Eingabe raeumt den Timer wieder ab.
  useEffect(() => {
    if (!entwurfOffen) return;
    const timer = setTimeout(() => {
      schreibe({
        ...filter,
        q: entwurf.q.trim() === "" ? undefined : entwurf.q.trim(),
        thcMin: entwurf.thcMin,
        thcMax: entwurf.thcMax,
        preisMax: entwurf.preisMax,
        seite: 1,
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [entwurf, entwurfOffen, filter, schreibe]);

  const preisVerfuegbar =
    facetten.preisSpanneCent.min !== null && facetten.preisSpanneCent.max !== null;
  const preisMin = facetten.preisSpanneCent.min ?? 0;
  const preisMax = facetten.preisSpanneCent.max ?? 0;
  const aktuellerPreis = entwurf.preisMax ?? preisMax;

  const zeigeApothekenScroll = facetten.apotheken.length > 8;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h3 text-text">{titel}</h2>
        {!istFilterLeer(filter) ? (
          <Button
            variante="ghost"
            groesse="sm"
            onClick={() => schreibe({ ...leererFilter(), sortierung: filter.sortierung })}
          >
            {zuruecksetzen}
          </Button>
        ) : null}
      </div>

      {/* Ein einziger Live-Bereich fuer Trefferzahl und Ladezustand. */}
      <p role="status" aria-live="polite" className="text-small text-text-muted">
        {pending ? texte.wirdAngewendet : mehrzahl(sprache, texte.treffer, gesamt)}
      </p>

      <Field id={`${basisId}-q`} label={texte.suche}>
        {(attribute) => (
          <input
            {...attribute}
            type="search"
            name="q"
            value={entwurf.q}
            autoComplete="off"
            onChange={(event) =>
              setEntwurf((alt) => ({ ...alt, q: event.target.value }))
            }
            className={SUCHFELD}
          />
        )}
      </Field>

      <fieldset className="flex flex-col gap-1 border-0 p-0">
        <legend className="text-small font-medium text-text">{texte.kultivarTyp}</legend>
        {facetten.typen.map((facette) => (
          <label key={facette.wert} className={CHECKBOX_ZEILE}>
            <input
              type="checkbox"
              checked={filter.typ.includes(facette.wert)}
              disabled={facette.anzahl === 0}
              onChange={(event) =>
                setzeSofort({
                  typ: umschalten(filter.typ, facette.wert, event.target.checked),
                })
              }
              className={CHECKBOX}
            />
            <span>
              {labels.kultivarTyp[facette.wert]}{" "}
              <span className="numeric text-text-muted">({facette.anzahl})</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-1 border-0 p-0">
        <legend className="text-small font-medium text-text">{texte.darreichungsform}</legend>
        {facetten.formen.map((facette) => (
          <label key={facette.wert} className={CHECKBOX_ZEILE}>
            <input
              type="checkbox"
              checked={filter.form.includes(facette.wert)}
              disabled={facette.anzahl === 0}
              onChange={(event) =>
                setzeSofort({
                  form: umschalten(filter.form, facette.wert, event.target.checked),
                })
              }
              className={CHECKBOX}
            />
            <span>
              {labels.darreichungsform[facette.wert]}{" "}
              <span className="numeric text-text-muted">({facette.anzahl})</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-1 border-0 p-0">
        <legend className="text-small font-medium text-text">{texte.geschmack}</legend>
        {/* Achsen ohne Treffer bleiben stehen und werden nur deaktiviert,
            damit die Leiste beim Filtern nicht die Hoehe wechselt. */}
        {facetten.geschmaecker.map((facette) => (
          <label key={facette.wert} className={CHECKBOX_ZEILE}>
            <input
              type="checkbox"
              checked={filter.geschmack.includes(facette.wert)}
              disabled={facette.anzahl === 0}
              onChange={(event) =>
                setzeSofort({
                  geschmack: umschalten(
                    filter.geschmack,
                    facette.wert,
                    event.target.checked,
                  ),
                })
              }
              className={CHECKBOX}
            />
            <span>
              {labels.geschmack[facette.wert]}{" "}
              <span className="numeric text-text-muted">({facette.anzahl})</span>
            </span>
          </label>
        ))}
      </fieldset>

      <RangeSlider
        label={texte.thc}
        bis={texte.bis}
        min={facetten.thcSpanne.min}
        max={facetten.thcSpanne.max}
        wert={[entwurf.thcMin, entwurf.thcMax]}
        formatiere={(n) => formatiereProzent(n, 1, sprache)}
        onChange={([min, max]) =>
          setEntwurf((alt) => ({ ...alt, thcMin: min, thcMax: max }))
        }
      />

      {preisVerfuegbar ? (
        <Field
          id={`${basisId}-preis`}
          label={texte.hoechstpreis}
          hinweis={t(texte.aktuell, { preis: formatierePreisProGramm(aktuellerPreis, sprache) })}
        >
          {(attribute) => (
            <input
              {...attribute}
              type="range"
              min={preisMin}
              max={preisMax}
              step={PREIS_SCHRITT}
              value={aktuellerPreis}
              aria-valuetext={formatierePreisProGramm(aktuellerPreis, sprache)}
              onChange={(event) =>
                setEntwurf((alt) => ({ ...alt, preisMax: Number(event.target.value) }))
              }
              className="h-11 w-full cursor-pointer bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            />
          )}
        </Field>
      ) : (
        <p className="text-small text-text-muted">
          {texte.keinPreis}
        </p>
      )}

      <fieldset className="flex flex-col gap-1 border-0 p-0">
        <legend className="text-small font-medium text-text">{texte.verfuegbarkeit}</legend>
        <label className={CHECKBOX_ZEILE}>
          <input
            type="checkbox"
            checked={filter.nurVerfuegbar}
            onChange={(event) => setzeSofort({ nurVerfuegbar: event.target.checked })}
            className={CHECKBOX}
          />
          <span>{texte.nurVerfuegbar}</span>
        </label>
      </fieldset>

      {facetten.apotheken.length > 0 ? (
        <fieldset className="flex flex-col gap-1 border-0 p-0">
          <legend className="text-small font-medium text-text">{texte.apotheke}</legend>
          <div
            className={
              zeigeApothekenScroll
                ? "max-h-80 overflow-y-auto rounded-md border border-border px-2"
                : undefined
            }
          >
            {facetten.apotheken.map((apotheke) => (
              <label key={apotheke.slug} className={CHECKBOX_ZEILE}>
                <input
                  type="checkbox"
                  checked={filter.apotheke.includes(apotheke.slug)}
                  onChange={(event) =>
                    setzeSofort({
                      apotheke: umschalten(
                        filter.apotheke,
                        apotheke.slug,
                        event.target.checked,
                      ),
                    })
                  }
                  className={CHECKBOX}
                />
                <span>
                  {apotheke.name}
                  <span className="text-text-muted">, {apotheke.ort}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <Select
        id={`${basisId}-sortierung`}
        label={texte.sortierung}
        value={filter.sortierung}
        optionen={SORTIERUNGEN.map((wert) => ({
          wert,
          label: texte.sortierungen[wert],
        }))}
        onChange={(event) =>
          setzeSofort({ sortierung: event.target.value as Sortierung })
        }
      />
    </div>
  );
}
