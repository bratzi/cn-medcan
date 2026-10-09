import type { Randnotiz } from "@/components/kapitel/Randnotizen";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { ProfilWerte, VerlaufSchritt } from "@/lib/profil-typen";

/**
 * Ein Kapitel auf der Startseite (Spec Dein Kapitel 4): das Schaufenster des Betreibers oder das eigene.
 * JSON-fest, weil das eigene über /api/startseite kommt. Nur Aroma, nie Wirkung (HWG).
 */
export type KapitelDaten = {
  anzeigename: string;
  avatarId: string | null;
  /** Freigegebene Bewertungen zu aktiven Sorten. */
  bewertet: number;
  /** Mittel der eigenen Gesamtnoten, eine Stelle; null ohne Gesamtnote. */
  schnitt: number | null;
  /** Dritte Randnotiz: eigene Stimmen (Mitglied) oder Community-Bewertungen (Schaufenster). */
  dritte: { art: "gestimmt" | "vonEuch"; zahl: number };
  /** null ohne Bewertung oder ohne gewichtete Bewertung. */
  netz: ProfilWerte | null;
  /** Verlauf des Netzes, älteste zuerst; nur im eigenen Kapitel, sonst leer (Nutzer 2026-10-09). */
  verlauf: VerlaufSchritt[];
  zuletzt: { slug: string; handelsname: string; gesamtnote: number | null; datum: string } | null;
};

export type KapitelEingabe = Omit<KapitelDaten, "zuletzt" | "verlauf"> & {
  verlauf?: VerlaufSchritt[];
  zuletzt: { slug: string; handelsname: string; gesamtnote: number | null; erstelltAm: Date } | null;
};

export function kapitelAus(e: KapitelEingabe): KapitelDaten {
  const ohneBewertung = e.bewertet === 0;
  return {
    anzeigename: e.anzeigename,
    avatarId: e.avatarId,
    bewertet: e.bewertet,
    schnitt: ohneBewertung || e.schnitt === null ? null : Math.round(e.schnitt * 10) / 10,
    dritte: e.dritte,
    netz: ohneBewertung || !e.netz || e.netz.gewichtet === 0 ? null : e.netz,
    verlauf: ohneBewertung || !e.netz || e.netz.gewichtet === 0 ? [] : (e.verlauf ?? []),
    zuletzt:
      ohneBewertung || !e.zuletzt
        ? null
        : { slug: e.zuletzt.slug, handelsname: e.zuletzt.handelsname, gesamtnote: e.zuletzt.gesamtnote, datum: e.zuletzt.erstelltAm.toISOString() },
  };
}

export function kapitelNotizen(d: KapitelDaten, texte: Woerterbuch["start"]["kapitel"], sprache: Sprache): Randnotiz[] {
  const ganz = (n: number) => formatiereZahl(n, 0, sprache);
  const notizen: Randnotiz[] = [
    { zahl: ganz(d.bewertet), wort: texte.bewertet, satz: t(texte.satzBewertet, { zahl: ganz(d.bewertet) }) },
  ];
  if (d.schnitt !== null) {
    const zahl = formatiereZahl(d.schnitt, 1, sprache);
    notizen.push({ zahl, wort: texte.imSchnitt, satz: t(texte.satzSchnitt, { zahl }) });
  }
  const gestimmt = d.dritte.art === "gestimmt";
  notizen.push({
    zahl: ganz(d.dritte.zahl),
    wort: gestimmt ? texte.gestimmt : texte.vonEuch,
    satz: t(gestimmt ? texte.satzGestimmt : texte.satzVonEuch, { zahl: ganz(d.dritte.zahl) }),
  });
  return notizen;
}
