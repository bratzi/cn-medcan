import { unstable_rethrow } from "next/navigation";
import { cache } from "react";

import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { benachrichtigungenLaden } from "@/lib/query/benachrichtigungen";
import { ladeStimmen, stimmZahlen } from "@/lib/query/konto";
import { aktuellesProfil, ladeAuswertungsZeilen } from "@/lib/query/profil";
import { aktiveUmfrage } from "@/lib/query/umfragen";
import { ladeGemocht, ladeReaktionsZahlen } from "@/lib/query/reaktionen";
import { eigeneVorschlaege } from "@/lib/query/vorschlaege";

/** Fehler eines Teils reißen die Seite nicht mit; Redirects gehen durch. */
export function oderNull<T>(name: string) {
  return (fehler: unknown): T | null => {
    unstable_rethrow(fehler);
    console.error(`${name} fehlgeschlagen`, fehler);
    return null;
  };
}

/** Wie oderNull, aber undefined: der Aufrufer unterscheidet „gescheitert“ von „keiner“. */
export function oderUndefined<T>(name: string) {
  return (fehler: unknown): T | undefined => {
    unstable_rethrow(fehler);
    console.error(`${name} fehlgeschlagen`, fehler);
    return undefined;
  };
}

type Ergebnis<F extends (...a: never[]) => Promise<unknown>> = Awaited<ReturnType<F>>;

// Je Aufruf eine Abfrage je Quelle, auch wenn Kopf und Boxen sie lesen (CPU-Limit 10 ms).
// Erst das Profil: ist es veraltet, schreibt es auch die Vorschläge neu.
export const textLaden = cache(async () => {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  return { w, sprache };
});
export const profilLaden = cache((id: string) => aktuellesProfil(id).catch(oderNull<Ergebnis<typeof aktuellesProfil>>("aktuellesProfil")));
export const zeilenLaden = cache((id: string) => ladeAuswertungsZeilen(id).catch(oderNull<Ergebnis<typeof ladeAuswertungsZeilen>>("ladeAuswertungsZeilen")));
export const nachrichtenLaden = cache((id: string) => benachrichtigungenLaden(id).catch(oderNull<Ergebnis<typeof benachrichtigungenLaden>>("benachrichtigungenLaden")));
export const vorschlaegeLaden = cache((id: string) => eigeneVorschlaege(id).catch(oderNull<Ergebnis<typeof eigeneVorschlaege>>("eigeneVorschlaege")));
export const stimmenLaden = cache((id: string) => ladeStimmen(id).catch(oderNull<Ergebnis<typeof ladeStimmen>>("ladeStimmen")));
export const stimmZahlenLaden = cache((id: string) => stimmZahlen(id).catch(oderNull<Ergebnis<typeof stimmZahlen>>("stimmZahlen")));
export const umfrageLaden = cache(() => aktiveUmfrage().catch(oderNull<Ergebnis<typeof aktiveUmfrage>>("aktiveUmfrage")));
/** Folgende und erhaltene Likes für den Profilkopf: Summe der Zähler (aggregate), je Aufruf einmal. */
export const reaktionsZahlenLaden = cache((id: string) => ladeReaktionsZahlen(id).catch(oderNull<Ergebnis<typeof ladeReaktionsZahlen>>("ladeReaktionsZahlen")));
export const gemochtLaden = cache((id: string) => ladeGemocht(id).catch(oderNull<Ergebnis<typeof ladeGemocht>>("ladeGemocht")));
