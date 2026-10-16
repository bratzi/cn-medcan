"use client";

import { useState } from "react";

import { ausgabeSpeichern, ausgabeVeroeffentlichen } from "@/app/[lang]/admin/jury/aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Badge, Button, Field, Input, Meldung } from "@/components/ui";
import { mehrzahl } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Texte = Woerterbuch["admin"]["jury"];

export type AdminAusgabe = {
  id: string;
  slug: string;
  titel: string;
  einleitung: string;
  /** ISO-Text oder null. */
  erscheintAm: string | null;
  status: string;
  beitraege: number;
};

const FELD =
  "w-full rounded-md border border-border-strong bg-surface px-4 py-2 text-body text-text " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** Formular für eine neue oder eine vorhandene Ausgabe (Slug entsteht nur beim Anlegen). */
function AusgabeFormular({ ausgabe, texte }: { ausgabe?: AdminAusgabe; texte: Texte }) {
  const aktion = useAktion();
  const kennung = ausgabe?.id ?? "neu";
  const [zuruecksetzen, setZuruecksetzen] = useState(0);

  return (
    <form
      // key: nach dem Anlegen beginnt das Formular leer.
      key={zuruecksetzen}
      onSubmit={(e) => {
        e.preventDefault();
        const daten = new FormData(e.currentTarget);
        if (ausgabe) daten.set("id", ausgabe.id);
        aktion.ausfuehren(() => ausgabeSpeichern(daten), () => (ausgabe ? undefined : setZuruecksetzen((n) => n + 1)));
      }}
      className="flex max-w-[68ch] flex-col gap-4"
    >
      <Input
        id={`ausgabe-titel-${kennung}`}
        name="titel"
        label={texte.ausgabeTitel}
        pflicht={texte.pflicht}
        required
        maxLength={90}
        defaultValue={ausgabe?.titel}
      />
      <Field id={`ausgabe-einleitung-${kennung}`} label={texte.ausgabeEinleitung}>
        {(attribute) => <textarea {...attribute} name="einleitung" rows={3} maxLength={1000} defaultValue={ausgabe?.einleitung} className={FELD} />}
      </Field>
      <Input
        id={`ausgabe-datum-${kennung}`}
        name="erscheintAm"
        type="date"
        label={texte.ausgabeDatum}
        hinweis={texte.ausgabeDatumHinweis}
        defaultValue={ausgabe?.erscheintAm?.slice(0, 10)}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variante="secondary" disabled={!aktion.bereit}>
          {aktion.laeuft ? texte.laeuft : ausgabe ? texte.ausgabeSpeichern : texte.ausgabeAnlegen}
        </Button>
      </div>
      <div aria-live="polite" className="min-h-6">
        {aktion.fehler ? <Meldung art="fehler">{aktion.fehler}</Meldung> : null}
      </div>
    </form>
  );
}

function AusgabeZeile({ ausgabe, texte }: { ausgabe: AdminAusgabe; texte: Texte }) {
  const aktion = useAktion();
  const veroeffentlicht = ausgabe.status === "VEROEFFENTLICHT";
  const status = (texte.ausgabeStatus as Record<string, string>)[ausgabe.status] ?? ausgabe.status;
  return (
    <li className="flex flex-col gap-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h4 className="font-buch text-h3 text-text wrap-break-word">{ausgabe.titel}</h4>
          <p className="flex flex-wrap items-center gap-2 text-small text-text-muted">
            <Badge variante={veroeffentlicht ? "success" : "neutral"}>{status}</Badge>
            <span>{mehrzahl("de", texte.ausgabeBeitraege, ausgabe.beitraege)}</span>
          </p>
        </div>
        {veroeffentlicht ? null : (
          <Button
            type="button"
            disabled={!aktion.bereit}
            onClick={() => {
              const daten = new FormData();
              daten.set("id", ausgabe.id);
              aktion.ausfuehren(() => ausgabeVeroeffentlichen(daten));
            }}
          >
            {aktion.laeuft ? texte.laeuft : texte.ausgabeVeroeffentlichen}
          </Button>
        )}
      </div>
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-small font-medium text-text underline underline-offset-4">
          {texte.ausgabeBearbeiten}
        </summary>
        <div className="pt-4">
          <AusgabeFormular ausgabe={ausgabe} texte={texte} />
        </div>
      </details>
      <div aria-live="polite" className="min-h-6">
        {aktion.fehler ? <Meldung art="fehler">{aktion.fehler}</Meldung> : null}
      </div>
    </li>
  );
}

/** Ausgaben: oben das Formular für eine neue, darunter die Liste mit Veröffentlichen und Ändern. */
export function AusgabenVerwaltung({ ausgaben, texte }: { ausgaben: readonly AdminAusgabe[]; texte: Texte }) {
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="ausgabe-neu-titel" className="flex flex-col gap-4">
        <h3 id="ausgabe-neu-titel" className="text-h3 text-text">
          {texte.ausgabeNeu}
        </h3>
        <AusgabeFormular texte={texte} />
      </section>
      {ausgaben.length === 0 ? (
        <p className="text-body text-text-muted">{texte.leerAusgaben}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {ausgaben.map((a) => (
            <AusgabeZeile key={a.id} ausgabe={a} texte={texte} />
          ))}
        </ul>
      )}
    </div>
  );
}
