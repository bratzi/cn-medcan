"use client";

import type { FormEvent } from "react";

import { blueteAblehnen, blueteFreigeben, blueteZuordnen } from "@/app/admin/vorschlag-aktionen";
import type { Aktion } from "@/components/admin/useAktion";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Input, Meldung, Select } from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import { BESTRAHLUNGEN, KULTIVAR_TYPEN } from "@/db/enums";
import { MAX_FREIGABE_TERPENE, type FreigabeVorbelegung } from "@/lib/vorschlag-eingabe";

type Props = {
  schluessel: string;
  vorbelegung: FreigabeVorbelegung;
  terpene: readonly string[];
  katalog: readonly SelectOption[];
};

type AdminErgebnis = { ok: true } | { ok: false; fehler: string };

const TYPEN: SelectOption[] = KULTIVAR_TYPEN.map((t) => ({ wert: t, label: t }));
const BESTRAHLUNG: SelectOption[] = BESTRAHLUNGEN.map((b) => ({ wert: b, label: b }));

/** Drei Wege fuer eine Gruppe: freigeben (Bluete anlegen), zuordnen, ablehnen. */
export function BlueteFreigabe({ schluessel, vorbelegung: v, terpene, katalog }: Props) {
  const freigabe = useAktion();
  const zuordnung = useAktion();
  const ablehnung = useAktion();
  const terpenOptionen: SelectOption[] = terpene.map((t) => ({ wert: t, label: t }));
  const id = (feld: string) => `freigabe-${schluessel}-${feld}`;

  function senden(aktion: Aktion, lauf: (fd: FormData) => Promise<AdminErgebnis>) {
    return (ereignis: FormEvent<HTMLFormElement>) => {
      ereignis.preventDefault();
      const daten = new FormData(ereignis.currentTarget);
      aktion.ausfuehren(() => lauf(daten));
    };
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={senden(freigabe, blueteFreigeben)} className="flex flex-col gap-6">
        <input type="hidden" name="vorschlagSchluessel" value={schluessel} />
        <Input id={id("name")} name="handelsname" label="Handelsname" pflicht required defaultValue={v.handelsname} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Input id={id("kultivar")} name="kultivarName" label="Kultivar" defaultValue={v.kultivarName} />
          <Select
            id={id("typ")}
            name="kultivarTyp"
            label="Typ"
            required
            optionen={TYPEN}
            platzhalter="Bitte wählen"
            defaultValue={v.kultivarTyp}
          />
          <Input id={id("thcmin")} name="thcMin" label="THC von %" required inputMode="decimal" defaultValue={v.thcMin} />
          <Input id={id("thcmax")} name="thcMax" label="THC bis %" required inputMode="decimal" defaultValue={v.thcMax} />
          <Input id={id("cbdmin")} name="cbdMin" label="CBD von %" required inputMode="decimal" defaultValue={v.cbdMin} />
          <Input id={id("cbdmax")} name="cbdMax" label="CBD bis %" required inputMode="decimal" defaultValue={v.cbdMax} />
          <Input id={id("hersteller")} name="hersteller" label="Hersteller" defaultValue={v.hersteller} />
          <Input id={id("land")} name="anbauland" label="Anbauland" />
          <Select id={id("bestrahlung")} name="bestrahlung" label="Bestrahlung" optionen={BESTRAHLUNG} defaultValue="UNBEKANNT" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: MAX_FREIGABE_TERPENE }, (_, i) => (
            <Select
              key={i}
              id={id(`terpen${i + 1}`)}
              name={`terpen${i + 1}`}
              label={`Terpen Rang ${i + 1}`}
              optionen={terpenOptionen}
              platzhalter="Keines"
              defaultValue={v.terpene[i] ?? ""}
            />
          ))}
        </div>
        {freigabe.fehler ? <Meldung art="fehler">{freigabe.fehler}</Meldung> : null}
        <div>
          <Button type="submit" disabled={!freigabe.bereit}>
            {freigabe.laeuft ? "Wird angelegt …" : "Freigeben und anlegen"}
          </Button>
        </div>
      </form>

      <form onSubmit={senden(zuordnung, blueteZuordnen)} className="flex flex-col gap-4">
        <input type="hidden" name="vorschlagSchluessel" value={schluessel} />
        <Select
          id={id("zuordnen")}
          name="strainId"
          label="Oder einer vorhandenen Blüte zuordnen"
          optionen={katalog}
          platzhalter="Blüte wählen"
          required
        />
        {zuordnung.fehler ? <Meldung art="fehler">{zuordnung.fehler}</Meldung> : null}
        <div>
          <Button type="submit" variante="secondary" disabled={!zuordnung.bereit}>
            {zuordnung.laeuft ? "Wird zugeordnet …" : "Zuordnen"}
          </Button>
        </div>
      </form>

      <form onSubmit={senden(ablehnung, blueteAblehnen)} className="flex flex-col gap-4">
        <input type="hidden" name="vorschlagSchluessel" value={schluessel} />
        <Input id={id("grund")} name="begruendung" label="Begründung (sieht das Mitglied)" maxLength={300} />
        {ablehnung.fehler ? <Meldung art="fehler">{ablehnung.fehler}</Meldung> : null}
        <div>
          <Button type="submit" variante="ghost" disabled={!ablehnung.bereit}>
            {ablehnung.laeuft ? "Wird abgelehnt …" : "Ablehnen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
