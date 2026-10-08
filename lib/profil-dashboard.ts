import type { Randnotiz } from "@/components/kapitel/Randnotizen";
import { formatiereDatum, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { noteOderErsatz } from "@/lib/profil";
import type { AuswertungsZeile } from "@/lib/profil-typen";

export type Monat = { schluessel: string; kurz: string; anzahl: number; laufend: boolean };
export type Stufe = { stufe: 1 | 2 | 3 | 4 | 5; anzahl: number };

/** Formatter auf Modulebene (Regel 10), Monat in UTC wie die Schlüssel. */
const MONATE: Record<Sprache, Intl.DateTimeFormat> = {
  de: new Intl.DateTimeFormat("de-DE", { month: "short", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }),
};

const schluessel = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

/** Bewertungen je Monat, die letzten zwölf inklusive laufendem (Spec 6, Aktivität). */
export function monatsReihe(daten: readonly Date[], jetzt: Date, sprache: Sprache): Monat[] {
  const reihe: Monat[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth() - i, 1));
    reihe.push({ schluessel: schluessel(d), kurz: MONATE[sprache].format(d).replace(".", ""), anzahl: 0, laufend: i === 0 });
  }
  const index = new Map(reihe.map((m, i) => [m.schluessel, i]));
  for (const d of daten) {
    const i = index.get(schluessel(d));
    if (i !== undefined) reihe[i].anzahl++;
  }
  return reihe;
}

/** Wie oft welche gerundete Gesamtnote (Spec 6, Notenverteilung); immer fünf Stufen. */
export function notenVerteilung(zeilen: readonly AuswertungsZeile[]): Stufe[] {
  const stufen: Stufe[] = ([1, 2, 3, 4, 5] as const).map((stufe) => ({ stufe, anzahl: 0 }));
  for (const z of zeilen) {
    const n = Math.min(5, Math.max(1, Math.round(noteOderErsatz(z))));
    stufen[n - 1].anzahl++;
  }
  return stufen;
}

/** Datum als TT.MM. bzw. DD/MM, ohne Jahr. */
const TAG: Record<Sprache, Intl.DateTimeFormat> = {
  de: new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }),
  en: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }),
};

/**
 * Die Randnotizen des Profils (Spec 5). Ohne Bewertung nur „0 bewertet“; der
 * Abstand zur Community entfällt ohne Vergleich. Vorzeichen als echtes Minus.
 */
export function profilNotizen(
  { zeilen, differenz, hersteller }: { zeilen: readonly AuswertungsZeile[]; differenz: number | null; hersteller: number },
  texte: Woerterbuch["profil"]["kapitel"],
  sprache: Sprache,
): Randnotiz[] {
  const anzahl = String(zeilen.length);
  const notizen: Randnotiz[] = [{ zahl: anzahl, wort: texte.bewertet, satz: t(texte.srBewertet, { zahl: anzahl }) }];
  if (zeilen.length === 0) return notizen;

  const schnitt = formatiereZahl(zeilen.reduce((s, z) => s + noteOderErsatz(z), 0) / zeilen.length, 1, sprache);
  notizen.push({ zahl: schnitt, wort: texte.schnitt, satz: t(texte.srSchnitt, { zahl: schnitt }) });
  if (differenz !== null) {
    // Vorzeichen am gerundeten Wert, damit nie „±0,0“ entsteht.
    const gerundet = Math.round(Math.abs(differenz) * 10) / 10;
    const betrag = formatiereZahl(gerundet, 1, sprache);
    const zahl = gerundet === 0 ? betrag : differenz > 0 ? `+${betrag}` : `−${betrag}`;
    notizen.push({ zahl, wort: texte.community, satz: t(texte.srCommunity, { zahl }) });
  }
  notizen.push({ zahl: String(hersteller), wort: texte.hersteller, satz: t(texte.srHersteller, { zahl: hersteller }) });
  const letzte = zeilen.reduce((a, b) => (b.erstelltAm > a.erstelltAm ? b : a)).erstelltAm;
  notizen.push({
    zahl: TAG[sprache].format(letzte),
    wort: texte.zuletzt,
    satz: t(texte.srZuletzt, { zahl: formatiereDatum(letzte, sprache) }),
  });
  return notizen;
}
