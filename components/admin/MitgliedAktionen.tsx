"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { freigabeSetzen, rolleSetzen } from "@/app/admin/aktionen";
import { Button, Select } from "@/components/ui";
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
 */
export function MitgliedAktionen({
  mitgliedId,
  anzeigename,
  freigegeben,
  rolle,
  istSelbst,
}: Props) {
  const router = useRouter();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function ausfuehren(lauf: () => Promise<{ ok: boolean; fehler?: string }>) {
    setLaeuft(true);
    setFehler(null);
    const ergebnis = await lauf();
    setLaeuft(false);
    if (!ergebnis.ok) {
      setFehler(ergebnis.fehler ?? "Unbekannter Fehler.");
      return;
    }
    router.refresh();
  }

  function freigabeUmschalten() {
    const daten = new FormData();
    daten.set("mitgliedId", mitgliedId);
    daten.set("aktion", freigegeben ? "ZURUECKNEHMEN" : "FREIGEBEN");
    void ausfuehren(() => freigabeSetzen(daten));
  }

  function rolleAendern(wert: string) {
    if (wert === rolle) return;
    const daten = new FormData();
    daten.set("mitgliedId", mitgliedId);
    daten.set("rolle", wert);
    void ausfuehren(() => rolleSetzen(daten));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          groesse="sm"
          variante={freigegeben ? "secondary" : "primary"}
          disabled={laeuft || (istSelbst && freigegeben)}
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
          disabled={laeuft || istSelbst}
          onChange={(ereignis) => rolleAendern(ereignis.target.value)}
          className="w-40"
          feldClassName="w-40"
        />
      </div>

      {fehler ? (
        <p role="alert" className="text-small text-danger">
          <span className="font-medium">Fehler: </span>
          {fehler}
        </p>
      ) : null}
    </div>
  );
}
