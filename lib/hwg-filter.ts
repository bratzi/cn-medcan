/**
 * Wortfilter gegen Heilversprechen in Kommentaren (HWG, Spec 2026-10-14). Grob mit Absicht:
 * lieber einmal zu viel ablehnen. Ganze Wörter/Wendungen, klein, Umlaute normiert.
 * „hilfreich“, „Schmerzensgeld“ oder „Therapiehund“ treffen nicht, weil Wortgrenzen gelten.
 */
const MUSTER = [
  "heilt", "heilen", "heilung", "hilft bei", "hilft gegen", "gegen schmerzen", "gegen schlafstoerung",
  "schmerzen", "schmerz", "therapie", "depression", "depressionen", "angst", "angststoerung", "schlafstoerung",
  "schlafstoerungen", "migraene", "uebelkeit", "krebs", "epilepsie", "adhs", "ptbs", "entzuendung",
  "half bei", "half gegen", "helfen bei", "helfen gegen", "helfe bei", "helfe gegen",
  "cures", "cure", "heals", "helps with", "for pain", "pain", "anxiety", "insomnia", "depression", "nausea", "cancer", "therapy",
];

/** Wortstämme: treffen auch mitten im Wort (Linderung, lindernd, Schmerzlinderung, Migränen, depressiv). */
const STAEMME = ["linder", "migraene", "depressi", "schlafstoerung", "uebelkeit", "epilepsi", "entzuendung"];

function normiere(s: string): string {
  return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

const REGEX = MUSTER.map((m) => ({ m, r: new RegExp(`(^|[^a-z])${m.replace(/ /g, "\\s+")}($|[^a-z])`) }));

export function hwgTreffer(text: string): string | null {
  const t = normiere(text);
  return STAEMME.find((st) => t.includes(st)) ?? REGEX.find(({ r }) => r.test(t))?.m ?? null;
}
