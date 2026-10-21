"use client";

import { useState, type FormEvent } from "react";

import { herstellerSpeichern } from "@/app/[lang]/admin/hersteller-aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { MarkenLogo } from "@/components/medien/Bild";
import { Button, Input, Meldung } from "@/components/ui";
import { markenInitialen, sichererLogoPfad } from "@/lib/marken";

type Props = {
  id: string;
  name: string;
  rolle: string;
  website: string | null;
  logoPfad: string | null;
  /** Wie viele aktive Strains das Unternehmen vertreibt (Orientierung, was wichtig ist). */
  strains: number;
};

/**
 * Eine Zeile in admin/hersteller: Vorschau (Logo oder Initialen-Marke), Name, Website, Logo-Pfad.
 * Geprüft wird in der Server Action (lib/hersteller-eingabe.ts); die Vorschau folgt der Eingabe sofort.
 */
export function HerstellerZeile({ id, name, rolle, website, logoPfad, strains }: Props) {
  const { bereit, laeuft, fehler, erfolg, ausfuehren } = useAktion();
  const [pfad, setPfad] = useState(logoPfad ?? "");
  const [anzeigename, setAnzeigename] = useState(name);
  const vorschau = sichererLogoPfad(pfad);

  function speichern(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const daten = new FormData(e.currentTarget);
    ausfuehren(() => herstellerSpeichern(daten));
  }

  return (
    <li className="border border-border bg-surface-raised p-4">
      <form onSubmit={speichern} className="grid gap-4 md:grid-cols-[8rem_1fr_1fr_1fr_auto] md:items-end">
        <input type="hidden" name="id" value={id} />
        <div className="flex flex-col items-start gap-2">
          <span className="flex h-12 w-32 items-center justify-center rounded-sm bg-neutral-50 px-2">
            {vorschau ? (
              <MarkenLogo pfad={vorschau} className="max-h-10 max-w-full" />
            ) : (
              <span aria-hidden="true" className="font-buch text-h3 text-neutral-500">
                {markenInitialen(anzeigename)}
              </span>
            )}
          </span>
          <span className="numeric text-caption text-text-muted">
            {rolle} · {strains} Strains
          </span>
        </div>
        <Input id={`${id}-name`} name="name" label="Name" defaultValue={name} onChange={(e) => setAnzeigename(e.target.value)} required maxLength={120} />
        <Input id={`${id}-website`} name="website" label="Website" type="url" defaultValue={website ?? ""} hinweis="Freiwillig, mit https://" />
        <Input
          id={`${id}-logo`}
          name="logoPfad"
          label="Logo"
          defaultValue={logoPfad ?? ""}
          onChange={(e) => setPfad(e.target.value)}
          placeholder="/marken/hersteller/name.svg"
          hinweis="Datei unter public/marken/, leer: Initialen"
        />
        <Button type="submit" disabled={!bereit}>
          {laeuft ? "Speichert …" : "Speichern"}
        </Button>
      </form>
      {fehler ? (
        <Meldung art="fehler" className="mt-2">
          {fehler}
        </Meldung>
      ) : erfolg ? (
        <Meldung art="erfolg" className="mt-2">
          Gespeichert.
        </Meldung>
      ) : null}
    </li>
  );
}
