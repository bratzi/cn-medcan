"use client";

import { freigabeSetzen, rolleSetzen } from "@/app/admin/aktionen";
import { useAktion } from "@/components/admin/useAktion";
import { Button, Meldung, Select } from "@/components/ui";
import { MITGLIED_ROLLEN, type MitgliedRolle } from "@/db/enums";

const ROLLEN_LABEL: Record<MitgliedRolle, string> = {
  MITGLIED: "Mitglied",
  FACHKREIS: "Fachkreis",
  ADMIN: "Betreiber",
};

const ROLLEN_OPTIONEN = MITGLIED_ROLLEN.map((rolle) => ({
  wert: rolle,
  label: ROLLEN_LABEL[rolle],
}));

type Props = {
  mitgliedId: string;
  anzeigename: string;
  freigegeben: boolean;
  rolle: MitgliedRolle;
  /** Der eigene Satz des angemeldeten Betreibers - Aktionen darauf gesperrt. */
  istSelbst: boolean;
};

/**
 * Die beiden Admin-Aktionen an einem Mitglied.
 *
 * Die Sperre am eigenen Satz ist hier nur Bedienkomfort; entschieden wird sie
 * in lib/admin-eingabe.ts, aufgerufen aus der Server Action. Was der Client
 * ausgraut, ist keine Absicherung.
 *
 * Zustand und Fehlertext kommen aus `useAktion` - dieselbe Mechanik wie in
 * der Umfrageverwaltung, samt Sperre bis zur Hydration.
 */
export function MitgliedAktionen({
  mitgliedId,
  anzeigename,
  freigegeben,
  rolle,
  istSelbst,
}: Props) {
  const { bereit, fehler, ausfuehren } = useAktion();

  function freigabeUmschalten() {
    const daten = new FormData();
    daten.set("mitgliedId", mitgliedId);
    daten.set("aktion", freigegeben ? "ZURUECKNEHMEN" : "FREIGEBEN");
    ausfuehren(() => freigabeSetzen(daten));
  }

  function rolleAendern(wert: string) {
    if (wert === rolle) return;
    const daten = new FormData();
    daten.set("mitgliedId", mitgliedId);
    daten.set("rolle", wert);
    ausfuehren(() => rolleSetzen(daten));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variante={freigegeben ? "secondary" : "primary"}
          disabled={!bereit || (istSelbst && freigegeben)}
          onClick={freigabeUmschalten}
        >
          {freigegeben ? "Freigabe zurücknehmen" : "Freigeben"}
          <span className="sr-only"> — {anzeigename}</span>
        </Button>

        <Select
          id={`rolle-${mitgliedId}`}
          label={`Rolle von ${anzeigename}`}
          labelVersteckt
          optionen={ROLLEN_OPTIONEN}
          value={rolle}
          disabled={!bereit || istSelbst}
          onChange={(ereignis) => rolleAendern(ereignis.target.value)}
          className="w-40"
          feldClassName="w-40"
        />
      </div>

      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
    </div>
  );
}
