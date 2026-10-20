/**
 * Reine Umformung fuer den Strain of the Month, ohne Datenbank und ohne
 * "server-only" (testbar mit tsx). Die Abfrage steht in lib/query/sotm.ts.
 */
export type SotmAnsicht = {
  monat: string;
  strain: { slug: string; handelsname: string; bluete: string; aktiv: boolean; bildPfad: string | null };
  mitglieder: { anzahl: number; schnitt: number | null };
  betreiber: { gesamtnote: number | null } | null;
};

export type SotmRoh = {
  monat: string;
  strain: {
    slug: string;
    handelsname: string;
    herstellerBildPfad: string | null;
    aktiv: boolean;
    kultivar: { name: string } | null;
  };
  mitglieder: { anzahl: number; schnitt: number | null };
  betreiber: { gesamtnote: number | null } | null;
};

export function sotmAus(roh: SotmRoh): SotmAnsicht {
  const { strain, mitglieder } = roh;
  return {
    monat: roh.monat,
    strain: {
      slug: strain.slug,
      handelsname: strain.handelsname,
      bluete: strain.kultivar?.name ?? strain.handelsname,
      aktiv: strain.aktiv,
      bildPfad: strain.herstellerBildPfad,
    },
    mitglieder: {
      anzahl: mitglieder.anzahl,
      schnitt: mitglieder.anzahl > 0 && mitglieder.schnitt != null ? Math.round(mitglieder.schnitt * 10) / 10 : null,
    },
    betreiber: roh.betreiber ? { gesamtnote: roh.betreiber.gesamtnote } : null,
  };
}
