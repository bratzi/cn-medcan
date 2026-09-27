"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { blueteVorschlagen, type VorschlagErgebnis } from "@/app/vorschlagen/aktionen";
import { Button, Field, Input, Meldung, Select, textLinkKlassen } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import type { SelectOption } from "@/components/ui";
import { KULTIVAR_TYPEN } from "@/db/enums";
import { MAX_VORSCHLAG_NOTIZ, MAX_VORSCHLAG_TERPENE } from "@/lib/vorschlag-eingabe";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

const RANG = ["eins", "zwei", "drei"] as const;

type Props = {
  terpene: readonly string[];
  nameVorbelegt: string;
  texte: Woerterbuch["vorschlag"];
  typen: Woerterbuch["label"]["kultivarTyp"];
  sprache: Sprache;
};

/**
 * Eine fehlende Bluete vorschlagen. Die Pruefung liegt in
 * lib/vorschlag-eingabe.ts und laeuft in der Server Action; maxLength ist
 * Bedienkomfort, keine Absicherung.
 */
export function BlueteVorschlagFormular({ terpene, nameVorbelegt, texte, typen, sprache }: Props) {
  const TYPEN: SelectOption[] = KULTIVAR_TYPEN.map((typ) => ({ wert: typ, label: typen[typ] }));
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [antwort, setAntwort] = useState<VorschlagErgebnis | null>(null);
  const optionen: SelectOption[] = terpene.map((name) => ({ wert: name, label: terpenAnzeige(name, sprache) }));

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const formular = ereignis.currentTarget;
    setLaeuft(true);
    setAntwort(null);
    try {
      const ergebnis = await blueteVorschlagen(new FormData(formular));
      setAntwort(ergebnis);
      if (ergebnis.ok) {
        formular.reset();
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

      {antwort && !antwort.ok ? (
        <Meldung art="fehler">
          {antwort.fehler}
          {antwort.vorhanden ? (
            <>
              {" "}
              <Link href={`/blueten/${antwort.vorhanden.slug}`} className={textLinkKlassen()}>
                {t(texte.zuBluete, { name: antwort.vorhanden.handelsname })}
              </Link>
            </>
          ) : null}
          {antwort.schonVorgeschlagen ? (
            <>
              {" "}
              <Link href="/mitglied" className={textLinkKlassen()}>
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
