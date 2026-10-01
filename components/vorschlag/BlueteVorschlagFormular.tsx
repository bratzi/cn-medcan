"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { blueteVorschlagen, type VorschlagErgebnis } from "@/app/vorschlagen/aktionen";
import { Button, Field, Input, Meldung, Select, textLinkKlassen } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import type { SelectOption } from "@/components/ui";
import { KULTIVAR_TYPEN } from "@/db/enums";
import { BUDPIC_MAX_BYTES, BUDPIC_MAX_KANTE } from "@/lib/budpics";
import { bildVerkleinernFrei } from "@/lib/bild-verkleinern";
import { MAX_VORSCHLAG_NOTIZ, MAX_VORSCHLAG_TERPENE } from "@/lib/vorschlag-eingabe";
import { VORSCHLAG_MAX_BILDER } from "@/lib/vorschlag-bilder";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

const RANG = ["eins", "zwei", "drei"] as const;

type Props = {
  terpene: readonly string[];
  nameVorbelegt: string;
  texte: Woerterbuch["vorschlag"];
  typen: Woerterbuch["label"]["kultivarTyp"];
  sprache: Sprache;
  /** Nur die Meldungen des Bild-Ablaufs (budpicMeldungen). */
  meldungen: Record<string, string>;
};

/**
 * Eine fehlende Bluete vorschlagen. Die Pruefung liegt in
 * lib/vorschlag-eingabe.ts und laeuft in der Server Action; maxLength ist
 * Bedienkomfort, keine Absicherung.
 *
 * Bilder (T10): dieselbe Verkleinerung wie bei den Budpics, aber sie gehen mit
 * dem Vorschlag raus und werden erst bei der Freigabe zu offenen Budpics. Der
 * Server prueft jede Datei erneut.
 */
export function BlueteVorschlagFormular({ terpene, nameVorbelegt, texte, typen, sprache, meldungen }: Props) {
  const TYPEN: SelectOption[] = KULTIVAR_TYPEN.map((typ) => ({ wert: typ, label: typen[typ] }));
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [antwort, setAntwort] = useState<VorschlagErgebnis | null>(null);
  const eingabe = useRef<HTMLInputElement>(null);
  const [bilder, setBilder] = useState<Blob[]>([]);
  const [bereitet, setBereitet] = useState(false);
  const [bildFehler, setBildFehler] = useState<string[]>([]);
  const optionen: SelectOption[] = terpene.map((name) => ({ wert: name, label: terpenAnzeige(name, sprache) }));

  async function bilderGewaehlt(ereignis: React.ChangeEvent<HTMLInputElement>) {
    const alle = Array.from(ereignis.target.files ?? []);
    // Dieselben Dateien sollen sich erneut waehlen lassen (nach einem Fehler).
    ereignis.target.value = "";
    if (alle.length === 0) return;
    const platz = VORSCHLAG_MAX_BILDER - bilder.length;
    const dateien = alle.slice(0, Math.max(platz, 0));
    const fehler: string[] = [];
    if (alle.length > dateien.length) fehler.push(t(meldungen["vorschlag.zuVieleBilder"], { max: VORSCHLAG_MAX_BILDER }));
    setBildFehler([]);
    setBereitet(true);
    const neu: Blob[] = [];
    try {
      for (const datei of dateien) {
        const klein = await bildVerkleinernFrei(datei, { maxKante: BUDPIC_MAX_KANTE, maxBytes: BUDPIC_MAX_BYTES });
        if (klein.ok) neu.push(klein.blob);
        else fehler.push(`${datei.name}: ${t(meldungen[klein.fehler.schluessel], klein.fehler.parameter)}`);
      }
    } finally {
      setBilder((alt) => [...alt, ...neu]);
      setBildFehler(fehler);
      setBereitet(false);
    }
  }

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const formular = ereignis.currentTarget;
    setLaeuft(true);
    setAntwort(null);
    try {
      const daten = new FormData(formular);
      for (const bild of bilder) daten.append("bild", new File([bild], "vorschlag.webp", { type: "image/webp" }));
      const ergebnis = await blueteVorschlagen(daten);
      setAntwort(ergebnis);
      if (ergebnis.ok) {
        formular.reset();
        setBilder([]);
        setBildFehler([]);
        router.refresh();
      }
    } catch {
      setAntwort({ ok: false, fehler: texte.fehlerAllgemein });
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-6">
      <Input
        id="vorschlag-name"
        name="handelsname"
        label={texte.handelsname}
        pflicht={texte.pflicht}
        required
        maxLength={120}
        defaultValue={nameVorbelegt}
        hinweis={texte.handelsnameHinweis}
      />
      <Input
        id="vorschlag-quelle"
        name="quelle"
        label={texte.quelle}
        pflicht={texte.pflicht}
        required
        maxLength={300}
        hinweis={texte.quelleHinweis}
      />
      <Input id="vorschlag-hersteller" name="hersteller" label={texte.hersteller} maxLength={120} hinweis={texte.freiwillig} />
      <Input
        id="vorschlag-kultivar"
        name="kultivarName"
        label={texte.kultivar}
        maxLength={120}
        hinweis={texte.kultivarHinweis}
      />
      <Select id="vorschlag-typ" name="kultivarTyp" label={texte.typ} optionen={TYPEN} platzhalter={texte.weissNicht} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input id="vorschlag-thc" name="thc" label={texte.thc} inputMode="decimal" hinweis={texte.freiwillig} />
        <Input id="vorschlag-cbd" name="cbd" label={texte.cbd} inputMode="decimal" hinweis={texte.freiwillig} />
      </div>
      {RANG.slice(0, MAX_VORSCHLAG_TERPENE).map((rang, i) => (
        <Select
          key={rang}
          id={`vorschlag-terpen${i + 1}`}
          name={`terpen${i + 1}`}
          label={texte.rang[rang]}
          optionen={optionen}
          platzhalter={texte.keineAngabe}
        />
      ))}
      <Field id="vorschlag-notiz" label={texte.notiz} hinweis={texte.freiwillig}>
        {(attribute) => (
          <textarea
            {...attribute}
            name="notiz"
            rows={3}
            maxLength={MAX_VORSCHLAG_NOTIZ}
            className="w-full rounded-md border border-border-strong bg-surface px-4 py-2 text-body text-text"
          />
        )}
      </Field>

      <div className="flex flex-col items-start gap-2">
        <p className="text-body font-medium text-text">{texte.bilder}</p>
        <p className="max-w-[56ch] text-small text-text-muted">{t(texte.bilderHinweis, { max: VORSCHLAG_MAX_BILDER })}</p>
        <input
          ref={eingabe}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={bilderGewaehlt}
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variante="secondary"
            groesse="sm"
            disabled={!hydriert || bereitet || bilder.length >= VORSCHLAG_MAX_BILDER}
            onClick={() => eingabe.current?.click()}
          >
            {bereitet ? texte.bilderPruefen : texte.bilderWaehlen}
          </Button>
          {bilder.length > 0 ? (
            <>
              <span role="status" className="text-small text-text-muted">
                {mehrzahl(sprache, texte.bilderAusgewaehlt, bilder.length)}
              </span>
              <Button type="button" variante="ghost" groesse="sm" onClick={() => setBilder([])}>
                {texte.bilderEntfernen}
              </Button>
            </>
          ) : null}
        </div>
        {bildFehler.length > 0 ? (
          <ul role="alert" className="flex flex-col gap-1 text-small text-danger">
            {bildFehler.map((zeile, i) => (
              <li key={i}>{zeile}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {antwort && !antwort.ok ? (
        <Meldung art="fehler">
          {antwort.fehler}
          {antwort.vorhanden ? (
            <>
              {" "}
              <Link prefetch={false} href={`/blueten/${antwort.vorhanden.slug}`} className={textLinkKlassen()}>
                {t(texte.zuBluete, { name: antwort.vorhanden.handelsname })}
              </Link>
            </>
          ) : null}
          {antwort.schonVorgeschlagen ? (
            <>
              {" "}
              <Link prefetch={false} href="/mitglied" className={textLinkKlassen()}>
                {texte.zuKonto}
              </Link>
            </>
          ) : null}
        </Meldung>
      ) : null}
      {antwort?.ok ? (
        <Meldung art="erfolg">{texte.danke}</Meldung>
      ) : null}

      <div>
        <Button type="submit" disabled={laeuft || !hydriert}>
          {laeuft ? texte.sendet : texte.absenden}
        </Button>
      </div>
    </form>
  );
}
