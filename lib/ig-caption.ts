import type { GeschmacksKategorie } from "@/db/enums";
import { hwgTreffer } from "@/lib/hwg-filter";
import type { IgReview } from "@/lib/ig-feed";
import { IG_SPERRE, kartenZitat } from "@/lib/ig-karte";
import { de } from "@/lib/i18n/de";

/**
 * Instagram-Caption aus fester Vorlage (Weg 2 ohne Cowork, Nutzer 2026-10-14). Nur Aroma, Aussehen,
 * Charge und Note (HWG); das Zitat läuft durch denselben Filter wie die Karte.
 */
// 3 bis 5 Hashtags (Instagram 2026, Skill ig-hashtag-strategist): drei feste plus höchstens zwei Aromen.
const GRUND_TAGS = ["#bookofterpz", "#medizinalcannabis", "#terpene"];

const note = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function igCaption(r: IgReview): string {
  const namen = r.aromen.map((a) => de.label.geschmack[a as GeschmacksKategorie] ?? a);
  const zitat = kartenZitat(r.notiz);
  const fakten = [
    r.gesamtnote !== null ? `${note(r.gesamtnote)} von 5 Blättern.` : "",
    namen.length ? `Im Vordergrund: ${namen.join(", ")}.` : "",
    r.charge ? `Charge ${r.charge}.` : "",
  ].filter(Boolean);
  const tags = [...GRUND_TAGS, ...r.aromen.slice(0, 2).map((a) => `#${a.toLowerCase()}`)];
  const titel = r.vertreiber ? `${r.bluete} von ${r.vertreiber}` : r.bluete;
  const absaetze = [fakten.join(" "), zitat ? `„${zitat}“` : "", `Vorabzugang zum Portal: schreib uns per DM`, tags.join(" ")];
  return `${titel}\n${absaetze.filter(Boolean).join("\n\n")}`;
}

const HASHTAG = /#[\p{L}\p{N}_]+/gu;

/** Engagement-Köder (Instagram stuft sie herab) und typische KI-Floskeln, die Leser als generiert erkennen. */
const FLOSKELN =
  /doppel-?\s?tipp|double tap|markier\w*\s+\d|tagge?\s+\d|kommentier\w*\s+(mit\s+)?[„"]?ja\b|was (denkt|meint|sagt) ihr\??|was denkst du\?|das ergebnis\?|spoiler:|plot twist|lass(t)? uns (eintauchen|darüber reden)|game-?changer|next level|ehrlich gesagt|real talk|in der heutigen (schnelllebigen )?zeit|tauchen wir ein/i;

/** Prüft eine Caption des Themen-Agenten vor dem Entwurf; leere Liste = in Ordnung. */
export function igCaptionPruefen(caption: string): string[] {
  const fehler: string[] = [];
  const ohneTags = caption.replace(HASHTAG, "");
  if (hwgTreffer(ohneTags)) fehler.push("HWG-Filter schlägt an");
  const treffer = IG_SPERRE.exec(ohneTags);
  if (treffer) fehler.push(`Sperrwort: ${treffer[0]}`);
  const tags = caption.match(HASHTAG) ?? [];
  if (tags.length < 3 || tags.length > 5) fehler.push(`Hashtags: ${tags.length} statt 3 bis 5`);
  if (caption.length > 2200) fehler.push("länger als 2200 Zeichen");
  // Es gibt keinen Link in der Bio (Nutzer 2026-10-16): Vorabzugang per DM.
  if (/link in (der )?bio/i.test(ohneTags)) fehler.push("„Link in Bio“: es gibt keinen Link, Vorabzugang per DM");
  // Handwerk (docs/instagram/handwerk.md, aus den ig-*-Skills): Hook vor dem „mehr“-Falz, keine Köder, wenig Striche.
  const hook = caption.split("\n")[0] ?? "";
  if (hook.length > 125) fehler.push(`Hook (erste Zeile) ${hook.length} statt höchstens 125 Zeichen`);
  const floskel = FLOSKELN.exec(ohneTags);
  if (floskel) fehler.push(`Floskel oder Köder: ${floskel[0]}`);
  const striche = (ohneTags.match(/\s[–—]\s|—/g) ?? []).length;
  if (striche > 2) fehler.push(`${striche} Gedankenstriche statt höchstens 2`);
  return fehler;
}
