/**
 * Wortfilter gegen Heilversprechen in Kommentaren (HWG, Spec 2026-10-14). Grob mit Absicht:
 * lieber einmal zu viel ablehnen. Klein, Umlaute normiert. Zwei Listen: MUSTER gelten nur als
 * ganze Wörter/Wendungen („hilfreich“, „Schmerzensgeld“, „Therapiehund“ treffen nicht);
 * STAEMME treffen auch mitten im Wort, „linder“ nur am Wortanfang („Zylinder“ trifft nicht).
 */
const MUSTER = [
  "heilt", "heilen", "heilung", "hilft bei", "hilft gegen", "gegen schmerzen", "gegen schlafstoerung",
  "schmerzen", "schmerz", "therapie", "depression", "depressionen", "angst", "angststoerung", "schlafstoerung",
  "schlafstoerungen", "migraene", "uebelkeit", "krebs", "epilepsie", "adhs", "ptbs", "entzuendung",
  "half bei", "half gegen", "helfen bei", "helfen gegen", "helfe bei", "helfe gegen",
  "cures", "cure", "heals", "helps with", "for pain", "pain", "anxiety", "insomnia", "depression", "nausea", "cancer", "therapy",
];

/** Wortstämme: treffen auch mitten im Wort (Schmerzlinderung, Migränen, depressiv). "linder" gilt nur am Wortanfang (lindernd, Linderung), nicht in "Zylinder". */
const STAEMME = [/(^|[^a-z])linder/, /schmerzlinder/, /migraene/, /depressi/, /schlafstoerung/, /uebelkeit/, /epilepsi/, /entzuendung/];

function normiere(s: string): string {
  return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

const REGEX = MUSTER.map((m) => ({ m, r: new RegExp(`(^|[^a-z])${m.replace(/ /g, "\\s+")}($|[^a-z])`) }));

export function hwgTreffer(text: string): string | null {
  const t = normiere(text);
  return STAEMME.find((st) => st.test(t))?.source ?? REGEX.find(({ r }) => r.test(t))?.m ?? null;
}
