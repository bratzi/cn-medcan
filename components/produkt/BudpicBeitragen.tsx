"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { budpicHochladen } from "@/app/blueten/[slug]/budpic-aktionen";
import { Button, einzelLinkKlassen, useHydriert } from "@/components/ui";
import { BUDPIC_MAX_BYTES, BUDPIC_MAX_DATEIEN, BUDPIC_MAX_KANTE } from "@/lib/budpics";
import { bildVerkleinernFrei } from "@/lib/bild-verkleinern";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

export type BudpicZugang = "gast" | "mitglied" | "freigegeben";

type Props = {
  zugang: BudpicZugang;
  strainId: string;
  slug: string;
  sprache: Sprache;
  texte: Woerterbuch["budpic"];
  /** Nur die Meldungen dieses Ablaufs (budpicMeldungen), nicht das ganze Woerterbuch (Nutzlast je Karte). */
  meldungen: Record<string, string>;
  /** Fuer die Karte: ohne den langen Hinweis. */
  kompakt?: boolean;
};

/**
 * "Bild beitragen" an jeder Stelle, an der ein Bluetenbild steht (T9, Nutzer
 * 2026-09-29). Gaeste bekommen einen Anmelde-Link, angemeldete aber noch nicht
 * freigegebene Mitglieder den Hinweis, dass die Freischaltung fehlt. Der
 * Server prueft jede Datei trotzdem erneut (Sitzung, Typ, Groesse, Masse).
 *
 * Jede Datei wird im Browser auf hoechstens 1280 px und 150 KB als WebP
 * verkleinert und einzeln gesendet; der Knopf wird in jedem Fall wieder
 * frei (try/finally), auch nach einem geworfenen Serverfehler.
 */
export function BudpicBeitragen({ zugang, strainId, slug, sprache, texte, meldungen, kompakt = false }: Props) {
  const hydriert = useHydriert();
  const eingabe = useRef<HTMLInputElement>(null);
  const [laeuft, setLaeuft] = useState<{ nr: number; gesamt: number } | null>(null);
  const [fehler, setFehler] = useState<string[]>([]);
  const [gesendet, setGesendet] = useState(0);

  if (zugang === "gast") {
    return (
      <Link href={`/anmelden?weiter=${encodeURIComponent(`/blueten/${slug}`)}`} className={einzelLinkKlassen()}>
        {texte.anmelden}
      </Link>
    );
  }
  if (zugang === "mitglied") {
    return <p className="max-w-[56ch] text-small text-text-muted">{meldungen["budpic.nurFreigeschaltet"]}</p>;
  }

  async function gewaehlt(ereignis: React.ChangeEvent<HTMLInputElement>) {
    const alle = Array.from(ereignis.target.files ?? []);
    // Dieselben Dateien sollen sich erneut waehlen lassen (nach einem Fehler).
    ereignis.target.value = "";
    if (alle.length === 0) return;
    const dateien = alle.slice(0, BUDPIC_MAX_DATEIEN);
    const meldungen_: string[] = [];
    if (alle.length > dateien.length) meldungen_.push(t(texte.zuViele, { max: BUDPIC_MAX_DATEIEN }));
    setFehler([]);
    setGesendet(0);
    let ok = 0;
    try {
      for (const [i, datei] of dateien.entries()) {
        setLaeuft({ nr: i + 1, gesamt: dateien.length });
        const grund = (text: string) => meldungen_.push(t(texte.dateiFehler, { name: datei.name, grund: text }));
        const klein = await bildVerkleinernFrei(datei, { maxKante: BUDPIC_MAX_KANTE, maxBytes: BUDPIC_MAX_BYTES });
        if (!klein.ok) {
          grund(t(meldungen[klein.fehler.schluessel] ?? meldungen["budpic.fehlgeschlagen"], klein.fehler.parameter));
          continue;
        }
        const daten = new FormData();
        daten.set("strainId", strainId);
        daten.set("bild", new File([klein.blob], "budpic.webp", { type: "image/webp" }));
        try {
          const ergebnis = await budpicHochladen(daten);
          if (ergebnis.ok) ok += 1;
          else grund(ergebnis.fehler);
        } catch {
          // Geworfener Serverfehler (z. B. abgelaufene Sitzung): weiter mit der naechsten Datei.
          grund(meldungen["budpic.fehlgeschlagen"]);
        }
      }
    } finally {
      setLaeuft(null);
      setGesendet(ok);
      setFehler(meldungen_);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        ref={eingabe}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={gewaehlt}
        tabIndex={-1}
        aria-hidden="true"
      />
      <Button variante="secondary" groesse="sm" disabled={!hydriert || laeuft !== null} onClick={() => eingabe.current?.click()}>
        {laeuft ? t(texte.laeuft, laeuft) : texte.beitragen}
      </Button>
      {kompakt ? null : <p className="max-w-[56ch] text-small text-text-muted">{t(texte.hinweis, { max: BUDPIC_MAX_DATEIEN })}</p>}
      {fehler.length > 0 ? (
        <ul role="alert" className="flex flex-col gap-1 text-small text-danger">
          {fehler.map((zeile, i) => (
            <li key={i}>
              <span className="font-medium">{texte.fehler} </span>
              {zeile}
            </li>
          ))}
        </ul>
      ) : null}
      {gesendet > 0 ? (
        <p role="status" className="text-small text-success">
          {mehrzahl(sprache, texte.danke, gesendet)}
        </p>
      ) : null}
    </div>
  );
}
