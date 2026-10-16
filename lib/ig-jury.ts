import type { IgKarussell, IgSlide } from "@/lib/ig-karussell";
import { juryTextBloecke } from "@/lib/jury-text";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";

/**
 * Terpz-Jury auf Instagram (Spec 2026-10-16, Task 9): aus einem veröffentlichten Beitrag ein Karussell-Entwurf; die
 * Autorin oder der Autor steht mit @handle in der Caption, das Collab setzt der Betreiber von Hand. Rein, ohne Netz; Handwerk nach docs/instagram/handwerk.md.
 */
export type JuryFeedBeitrag = {
  slug: string;
  titel: string;
  anriss: string;
  zitat: string;
  autor: { name: string; instagram: string | null };
  bilder: string[];
  review: { gesamtnote: number | null; aromen: string[] } | null;
};

const ZITAT_MAX = 180;
const COVER_TITEL_MAX = 60;
const HOOK_MAX = 125;
const HOOK_ENDE = " – die Terpz-Jury hat probiert.";
const TAGS = "#bookofterpz #terpzjury #sortenbewertung #aromaprofil";

function kuerzen(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const schnitt = t.slice(0, max - 1);
  const wort = schnitt.lastIndexOf(" ");
  return `${(wort > max / 2 ? schnitt.slice(0, wort) : schnitt).trimEnd()}…`;
}

/** Erster Absatz des Beitragstextes ohne Markdown, höchstens 180 Zeichen (Zwischentitel und Listen zählen nicht). */
export function juryZitat(text: string): string {
  const absatz = juryTextBloecke(text).find((x) => x.art === "absatz");
  if (!absatz) return "";
  return kuerzen(absatz.teile.map((zeile) => zeile.map((t) => t.text).join("")).join(" "), ZITAT_MAX);
}

function handleSauber(h: string | null): string | null {
  const t = (h ?? "").trim().replace(/^@+/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(t) ? t : null;
}

/** Hinweis für den Betreiber: wen er in Publora oder auf Instagram von Hand als Collaborator hinzufügt. */
export function collabHinweis(autor: { name: string; instagram: string | null }): string {
  const handle = handleSauber(autor.instagram);
  return handle ? `Collaborator von Hand hinzufügen: @${handle}` : `${autor.name}: kein Handle hinterlegt`;
}

export function juryKarussell(b: JuryFeedBeitrag): { karussell: IgKarussell; caption: string } {
  const handle = handleSauber(b.autor.instagram);
  const note = b.review?.gesamtnote;
  const slides: IgSlide[] = [
    {
      typ: "cover",
      kicker: "Terpz-Jury",
      titel: kuerzen(b.titel, COVER_TITEL_MAX),
      grafik: typeof note === "number" ? { art: "blaetter", note } : { art: "icons", namen: ["buch"] },
    },
  ];
  const label = new Map<string, string>(GESCHMACKS_ACHSEN.map((a) => [a.enumWert, a.label]));
  const aromen = (b.review?.aromen ?? []).filter((a) => label.has(a)).slice(0, 5);
  if (aromen.length)
    slides.push({ typ: "inhalt", titel: "Aroma", punkte: aromen.map((a) => label.get(a)!), grafik: { art: "icons", namen: aromen } });
  const zitat = b.zitat.trim();
  if (zitat) slides.push({ typ: "inhalt", titel: "Aus dem Beitrag", text: zitat, grafik: { art: "icons", namen: ["geschmack"] } });
  slides.push({
    typ: "cta",
    titel: "Ganzer Beitrag im Book of Terpz",
    text: `Von ${b.autor.name} aus der Terpz-Jury.`,
    grafik: { art: "icons", namen: ["community", "blatt"] },
  });

  const hook = kuerzen(b.titel, HOOK_MAX - HOOK_ENDE.length) + HOOK_ENDE;
  const caption = [hook, b.anriss.trim(), handle ? `Von @${handle}` : "", "Lust auf Vorabzugang? Schreib uns per DM.", TAGS]
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n\n(Von @[^\n]+)\n\n/, "\n\n$1\n");
  return { karussell: { saeule: "portal", schluessel: `jury-${b.slug}`.slice(0, 40).replace(/-+$/, ""), slides }, caption };
}

/** Ein veröffentlichter Beitrag bleibt veröffentlicht: kein späterer Fehler darf ihn zurück in den Feed schicken. */
export const IG_GESCHUETZT = "VEROEFFENTLICHT";
export function igUeberschreibbar(alt: string): boolean {
  return alt !== IG_GESCHUETZT;
}

/** Adresse, falls Instagram den Permalink nicht liefert: das Profil, damit der Status trotzdem stimmt. */
export const IG_PROFIL_ADRESSE = "https://www.instagram.com/bookofterpz/";

export const IG_MELDUNG_STATUS =["ENTWURF", "GEPLANT", "VEROEFFENTLICHT", "FEHLER"] as const;
export type IgMeldung = { slug: string; igStatus: (typeof IG_MELDUNG_STATUS)[number]; igUrl?: string | null };

const IG_ADRESSE = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._\-/?=&%]+$/;

/** Prüft die Meldung des Skripts an `/api/jury-ig`; leere Liste = gültig. */
export function igMeldungPruefen(m: unknown): string[] {
  if (typeof m !== "object" || m === null) return ["body"];
  const { slug, igStatus, igUrl } = m as Record<string, unknown>;
  const f: string[] = [];
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,80}$/.test(slug)) f.push("slug");
  if (!(IG_MELDUNG_STATUS as readonly unknown[]).includes(igStatus)) f.push("igStatus");
  if (igStatus === "VEROEFFENTLICHT") {
    if (typeof igUrl !== "string" || igUrl.length > 300 || !IG_ADRESSE.test(igUrl)) f.push("igUrl");
  } else if (igUrl !== undefined && igUrl !== null) f.push("igUrl");
  return f;
}
