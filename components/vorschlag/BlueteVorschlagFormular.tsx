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

const TYP_LABEL: Record<(typeof KULTIVAR_TYPEN)[number], string> = {
  INDICA: "Indica",
  SATIVA: "Sativa",
  HYBRID: "Hybrid",
  RUDERALIS: "Ruderalis",
};
const TYPEN: SelectOption[] = KULTIVAR_TYPEN.map((t) => ({ wert: t, label: TYP_LABEL[t] }));
const RANG = ["Dominantes Terpen", "Zweites Terpen", "Drittes Terpen"];

type Props = { terpene: readonly string[]; nameVorbelegt: string };

/**
 * Eine fehlende Bluete vorschlagen. Die Pruefung liegt in
 * lib/vorschlag-eingabe.ts und laeuft in der Server Action; maxLength ist
 * Bedienkomfort, keine Absicherung.
 */
export function BlueteVorschlagFormular({ terpene, nameVorbelegt }: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [antwort, setAntwort] = useState<VorschlagErgebnis | null>(null);
  const optionen: SelectOption[] = terpene.map((t) => ({ wert: t, label: t }));

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
      setAntwort({ ok: false, fehler: "Das hat nicht geklappt. Vielleicht ist die Sitzung abgelaufen, melde dich neu an." });
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-6">
      <Input
        id="vorschlag-name"
        name="handelsname"
        label="Handelsname"
        pflicht
        required
        maxLength={120}
        defaultValue={nameVorbelegt}
        hinweis="So, wie er auf der Packung oder beim Hersteller steht."
      />
      <Input
        id="vorschlag-quelle"
        name="quelle"
        label="Quelle"
        pflicht
        required
        maxLength={300}
        hinweis="Link zum Hersteller oder kurz, woher du es weißt, z. B. Packung."
      />
      <Input id="vorschlag-hersteller" name="hersteller" label="Hersteller" maxLength={120} hinweis="Freiwillig." />
      <Input
        id="vorschlag-kultivar"
        name="kultivarName"
        label="Kultivar"
        maxLength={120}
        hinweis="Freiwillig. Die Genetik hinter dem Handelsnamen, falls bekannt."
      />
      <Select id="vorschlag-typ" name="kultivarTyp" label="Typ" optionen={TYPEN} platzhalter="Weiß ich nicht" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input id="vorschlag-thc" name="thc" label="THC in %" inputMode="decimal" hinweis="Freiwillig." />
        <Input id="vorschlag-cbd" name="cbd" label="CBD in %" inputMode="decimal" hinweis="Freiwillig." />
      </div>
      {RANG.slice(0, MAX_VORSCHLAG_TERPENE).map((label, i) => (
        <Select
          key={label}
          id={`vorschlag-terpen${i + 1}`}
          name={`terpen${i + 1}`}
          label={label}
          optionen={optionen}
          platzhalter="Keine Angabe"
        />
      ))}
      <Field id="vorschlag-notiz" label="Notiz für uns" hinweis="Freiwillig.">
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
              <Link href={`/produkte/${antwort.vorhanden.slug}`} className={textLinkKlassen()}>
                Zu {antwort.vorhanden.handelsname}
              </Link>
            </>
          ) : null}
        </Meldung>
      ) : null}
      {antwort?.ok ? (
        <Meldung art="erfolg">Danke! Wir prüfen deinen Vorschlag und melden uns unter Mein Konto.</Meldung>
      ) : null}

      <div>
        <Button type="submit" disabled={laeuft || !hydriert}>
          {laeuft ? "Wird gesendet …" : "Blüte vorschlagen"}
        </Button>
      </div>
    </form>
  );
}
