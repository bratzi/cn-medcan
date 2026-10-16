"use client";

import { useRef, useState } from "react";

import { juryBildHochladen, juryBildLoeschen, juryBildSymbol, juryBildVerschieben } from "@/app/[lang]/admin/jury/aktionen";
import { useAktion, type AktionsErgebnis } from "@/components/admin/useAktion";
import { BudpicBild } from "@/components/medien/Bild";
import { Badge, Button, Input, Meldung } from "@/components/ui";
import { bildVerkleinernFrei } from "@/lib/bild-verkleinern";
import { JURY_BILD_MAX_BYTES, JURY_BILD_MAX_KANTE, JURY_BILDER_MAX } from "@/lib/jury";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

/** Löschen ist unwiderruflich: abgesetzt von den Knöpfen zum Ordnen, Gefahrenfarbe, eigene Klassen (cn mischt nicht). */
const LOESCH_KNOPF =
  "inline-flex h-9 items-center justify-center rounded-full border border-danger bg-surface-raised px-4 text-small font-medium text-danger " +
  "transition-colors duration-fast ease-standard hover:bg-surface-sunken disabled:pointer-events-none disabled:opacity-50 pointer-coarse:h-11";

export type AdminBild = { id: string; breite: number; hoehe: number; symbolbild: boolean; alt: string };

type Props = { beitragId: string; bilder: readonly AdminBild[]; texte: Woerterbuch["admin"]["jury"] };

/**
 * Bilder eines Jury-Beitrags: Reihenfolge, Symbolbild, Löschen und Upload (Spec 2026-10-16). Der Browser
 * verkleinert, der Server prüft jede Datei erneut (juryBildHochladen). Vorschau über /api/bild/offen/<id>,
 * die Betreiber und Autor sehen. Auch im Profil am eigenen Entwurf.
 */
export function BildVerwaltung({ beitragId, bilder, texte }: Props) {
  const aktion = useAktion();
  const eingabe = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [symbol, setSymbol] = useState(false);
  const [bereitet, setBereitet] = useState(false);
  /** Id des Bildes, dessen Löschen gerade bestätigt werden soll (zweistufig: Löschen ist unwiderruflich). */
  const [loeschFrage, setLoeschFrage] = useState<string | null>(null);
  const frei = JURY_BILDER_MAX - bilder.length;

  function los(lauf: (fd: FormData) => Promise<AktionsErgebnis>, id: string, extra?: Record<string, string>) {
    const daten = new FormData();
    daten.set("id", id);
    for (const [k, v] of Object.entries(extra ?? {})) daten.set(k, v);
    aktion.ausfuehren(() => lauf(daten));
  }

  function dateienGewaehlt(ereignis: React.ChangeEvent<HTMLInputElement>) {
    const dateien = Array.from(ereignis.target.files ?? []).slice(0, Math.max(frei, 0));
    ereignis.target.value = "";
    if (dateien.length === 0) return;
    const altText = alt;
    const symbolbild = symbol;
    aktion.ausfuehren(
      async () => {
        setBereitet(true);
        try {
          // Eine Datei je Aufruf, nacheinander: die Grenze prüft der Server vor dem Schreiben.
          for (const datei of dateien) {
            const klein = await bildVerkleinernFrei(datei, { maxKante: JURY_BILD_MAX_KANTE, maxBytes: JURY_BILD_MAX_BYTES });
            if (!klein.ok) return { ok: false, fehler: `${datei.name}: ${texte.bildFehler}` };
            const daten = new FormData();
            daten.set("beitragId", beitragId);
            daten.set("bild", new File([klein.blob], "jury.webp", { type: "image/webp" }));
            daten.set("alt", altText);
            if (symbolbild) daten.set("symbolbild", "1");
            const ergebnis = await juryBildHochladen(daten);
            if (!ergebnis.ok) return ergebnis;
          }
          return { ok: true };
        } finally {
          setBereitet(false);
        }
      },
      () => {
        setAlt("");
        setSymbol(false);
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-body font-medium text-text">{texte.bilder}</h4>
      {bilder.length === 0 ? (
        <p className="text-small text-text-muted">{texte.bilderLeer}</p>
      ) : (
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bilder.map((b, i) => {
            const nr = String(i + 1);
            return (
              <li key={b.id} className="flex flex-col gap-2 border border-border p-2">
                <div className="aspect-4/3 w-full overflow-hidden bg-surface-sunken">
                  <BudpicBild id={b.id} offen breite={b.breite} hoehe={b.hoehe} alt={b.alt || t(texte.bildNr, { nr })} className="size-full object-contain" />
                </div>
                <p className="flex flex-wrap items-center gap-2 text-small text-text-muted">
                  <span className="numeric">{t(texte.bildNr, { nr })}</span>
                  {b.symbolbild ? (
                    <Badge variante="neutral" zeichen={false}>
                      {texte.symbolbildBadge}
                    </Badge>
                  ) : null}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    groesse="sm"
                    variante="secondary"
                    aria-label={t(texte.nachVorn, { nr })}
                    disabled={!aktion.bereit || i === 0}
                    onClick={() => los(juryBildVerschieben, b.id, { richtung: "-1" })}
                  >
                    <span aria-hidden="true">←</span>
                  </Button>
                  <Button
                    type="button"
                    groesse="sm"
                    variante="secondary"
                    aria-label={t(texte.nachHinten, { nr })}
                    disabled={!aktion.bereit || i === bilder.length - 1}
                    onClick={() => los(juryBildVerschieben, b.id, { richtung: "1" })}
                  >
                    <span aria-hidden="true">→</span>
                  </Button>
                  <Button
                    type="button"
                    groesse="sm"
                    variante="secondary"
                    aria-label={t(b.symbolbild ? texte.keinSymbolbild : texte.symbolbild, { nr })}
                    aria-pressed={b.symbolbild}
                    disabled={!aktion.bereit}
                    onClick={() => los(juryBildSymbol, b.id, { symbolbild: b.symbolbild ? "0" : "1" })}
                  >
                    {texte.symbolbildBadge}
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
                  {loeschFrage === b.id ? (
                    <>
                      <span className="text-small font-medium text-danger">{texte.loeschenFrage}</span>
                      <button
                        type="button"
                        aria-label={t(texte.loeschenEndgueltig, { nr })}
                        className={LOESCH_KNOPF}
                        disabled={!aktion.bereit}
                        onClick={() => {
                          setLoeschFrage(null);
                          los(juryBildLoeschen, b.id);
                        }}
                      >
                        {t(texte.loeschenEndgueltig, { nr })}
                      </button>
                      <Button type="button" groesse="sm" variante="ghost" onClick={() => setLoeschFrage(null)}>
                        {texte.abbrechen}
                      </Button>
                    </>
                  ) : (
                    <button
                      type="button"
                      aria-label={t(texte.loeschen, { nr })}
                      className={LOESCH_KNOPF}
                      disabled={!aktion.bereit}
                      onClick={() => setLoeschFrage(b.id)}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {frei > 0 ? (
        <div className="flex max-w-[68ch] flex-col items-start gap-4">
          <p className="text-small text-text-muted">{t(texte.bilderHinweis, { max: JURY_BILDER_MAX })}</p>
          <Input
            id={`bild-alt-${beitragId}`}
            label={texte.bildAlt}
            hinweis={texte.bildAltHinweis}
            maxLength={200}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            feldClassName="w-full"
          />
          <label className="flex min-h-11 items-center gap-2 text-body text-text">
            <input type="checkbox" checked={symbol} onChange={(e) => setSymbol(e.target.checked)} className="size-5 accent-accent" />
            {texte.symbolbildBadge}
          </label>
          <input
            ref={eingabe}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={dateienGewaehlt}
            tabIndex={-1}
            aria-hidden="true"
          />
          <Button type="button" variante="secondary" groesse="sm" disabled={!aktion.bereit || bereitet} onClick={() => eingabe.current?.click()}>
            {bereitet || aktion.laeuft ? texte.bildPruefen : texte.bildWaehlen}
          </Button>
        </div>
      ) : (
        <p className="text-small text-text-muted">{t(texte.bildVoll, { max: JURY_BILDER_MAX })}</p>
      )}
      <div aria-live="polite" className="min-h-6">
        {aktion.fehler ? <Meldung art="fehler">{aktion.fehler}</Meldung> : null}
      </div>
    </div>
  );
}
