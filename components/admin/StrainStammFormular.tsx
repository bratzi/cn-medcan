"use client";

import { useActionState } from "react";

import { strainStammSpeichern, type StammErgebnis } from "@/app/[lang]/admin/strains/aktionen";
import { Button, Input, Meldung, Select } from "@/components/ui";
import { DARREICHUNGSFORMEN, KULTIVAR_TYPEN } from "@/db/enums";
import { MAX_STAMM_TERPENE } from "@/lib/strain-stamm-eingabe";

type Eintrag = { id: string; name: string };

export type StammStrain = {
  id: string;
  handelsname: string;
  kultivarId: string | null;
  vertreiberId: string | null;
  kultivarTyp: string;
  darreichungsform: string;
  thcMinProzent: number;
  thcMaxProzent: number;
  cbdMinProzent: number;
  cbdMaxProzent: number;
  aktiv: boolean;
  terpenIds: string[];
};

const TYP_LABEL: Record<string, string> = { INDICA: "Indica", SATIVA: "Sativa", HYBRID: "Hybrid", RUDERALIS: "Ruderalis" };
const FORM_LABEL: Record<string, string> = { BLUETE: "Blüte", EXTRAKT: "Extrakt", GRANULAT: "Granulat" };

const optionen = (l: Eintrag[]) => l.map((e) => ({ wert: e.id, label: e.name }));

/** Stammdaten einer Strain bearbeiten (nur ADMIN, Spec 2026-10-21 Abschnitt 3). */
export function StrainStammFormular({
  strain,
  kultivare,
  vertreiber,
  terpene,
}: {
  strain: StammStrain;
  kultivare: Eintrag[];
  vertreiber: Eintrag[];
  terpene: Eintrag[];
}) {
  const [ergebnis, aktion, laeuft] = useActionState<StammErgebnis, FormData>(strainStammSpeichern, null);
  const keins = { wert: "", label: "– keiner –" };

  return (
    <form action={aktion} className="flex flex-col gap-8">
      <input type="hidden" name="strainId" value={strain.id} />

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 text-h4 text-text">Bezeichnung</legend>
        <Input id="handelsname" name="handelsname" label="Handelsname" required pflicht defaultValue={strain.handelsname} feldClassName="sm:col-span-2" />
        <Select id="kultivarId" name="kultivarId" label="Kultivar" optionen={[keins, ...optionen(kultivare)]} defaultValue={strain.kultivarId ?? ""} />
        <Select id="vertreiberId" name="vertreiberId" label="Vertreiber" optionen={[keins, ...optionen(vertreiber)]} defaultValue={strain.vertreiberId ?? ""} />
        <Select id="kultivarTyp" name="kultivarTyp" label="Typ" optionen={KULTIVAR_TYPEN.map((t) => ({ wert: t, label: TYP_LABEL[t] ?? t }))} defaultValue={strain.kultivarTyp} />
        <Select
          id="darreichungsform"
          name="darreichungsform"
          label="Darreichungsform"
          optionen={DARREICHUNGSFORMEN.map((f) => ({ wert: f, label: FORM_LABEL[f] ?? f }))}
          defaultValue={strain.darreichungsform}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <legend className="mb-4 text-h4 text-text">Cannabinoide in Prozent</legend>
        <Input id="thcMin" name="thcMin" label="THC min" inputMode="decimal" required defaultValue={String(strain.thcMinProzent)} />
        <Input id="thcMax" name="thcMax" label="THC max" inputMode="decimal" required defaultValue={String(strain.thcMaxProzent)} />
        <Input id="cbdMin" name="cbdMin" label="CBD min" inputMode="decimal" required defaultValue={String(strain.cbdMinProzent)} />
        <Input id="cbdMax" name="cbdMax" label="CBD max" inputMode="decimal" required defaultValue={String(strain.cbdMaxProzent)} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-4 text-h4 text-text">Terpene nach Rang</legend>
        {Array.from({ length: MAX_STAMM_TERPENE }, (_, i) => (
          <Select
            key={i}
            id={`terpen-${i + 1}`}
            name="terpene"
            label={`Rang ${i + 1}`}
            optionen={[{ wert: "", label: "– keines –" }, ...optionen(terpene)]}
            defaultValue={strain.terpenIds[i] ?? ""}
          />
        ))}
      </fieldset>

      <label className="flex min-h-11 items-center gap-2 text-body text-text">
        <input type="checkbox" name="aktiv" defaultChecked={strain.aktiv} className="size-5 accent-accent" />
        Aktiv (im Katalog sichtbar)
      </label>

      <div className="flex flex-col gap-4" aria-live="polite">
        {ergebnis?.ok ? <Meldung art="erfolg">Gespeichert.</Meldung> : null}
        {ergebnis && !ergebnis.ok ? <Meldung art="fehler">{ergebnis.fehler}</Meldung> : null}
      </div>
      <Button type="submit" disabled={laeuft} className="self-start">
        {laeuft ? "Wird gespeichert …" : "Speichern"}
      </Button>
    </form>
  );
}
