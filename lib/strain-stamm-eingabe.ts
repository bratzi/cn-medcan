/**
 * Pruefung der Strain-Stammdaten im Admin (Spec 2026-10-21, Abschnitt 3).
 * Ohne Datenbank, damit direkt testbar; ueber Rechte entscheidet lib/session.ts.
 */
import { z } from "zod";

import { DARREICHUNGSFORMEN, KULTIVAR_TYPEN, type Darreichungsform, type KultivarTyp } from "@/db/enums";

export const MAX_STAMM_TERPENE = 5;

export type StrainStamm = {
  strainId: string;
  handelsname: string;
  kultivarId: string | null;
  vertreiberId: string | null;
  kultivarTyp: KultivarTyp;
  darreichungsform: Darreichungsform;
  thcMinProzent: number;
  thcMaxProzent: number;
  cbdMinProzent: number;
  cbdMaxProzent: number;
  terpenIds: string[];
  aktiv: boolean;
};

export type StammPruef = { ok: true; wert: StrainStamm } | { ok: false; fehler: string };

const leerZuNull = z
  .string()
  .optional()
  .transform((s) => (s?.trim() ? s.trim() : null));

const prozent = (name: string) =>
  z
    .string({ error: `${name} fehlt.` })
    .transform((s) => s.trim().replace(",", "."))
    .refine((s) => s !== "" && Number.isFinite(Number(s)), `${name} ist keine Zahl.`)
    .transform(Number)
    .refine((n) => n >= 0 && n <= 100, `${name} muss zwischen 0 und 100 liegen.`);

const schema = z
  .object({
    strainId: z.string().trim().min(1, "Strain fehlt."),
    handelsname: z.string().trim().min(1, "Handelsname fehlt.").max(120, "Handelsname ist zu lang."),
    kultivarId: leerZuNull,
    vertreiberId: leerZuNull,
    kultivarTyp: z.enum(KULTIVAR_TYPEN, { error: "Unbekannter Typ." }),
    darreichungsform: z.enum(DARREICHUNGSFORMEN, { error: "Unbekannte Darreichungsform." }),
    thcMin: prozent("THC min"),
    thcMax: prozent("THC max"),
    cbdMin: prozent("CBD min"),
    cbdMax: prozent("CBD max"),
    terpene: z
      .array(z.string())
      .optional()
      .transform((l) => (l ?? []).map((t) => t.trim()).filter(Boolean))
      .refine((l) => l.length <= MAX_STAMM_TERPENE, `Höchstens ${MAX_STAMM_TERPENE} Terpene.`)
      .refine((l) => new Set(l).size === l.length, "Ein Terpen ist doppelt gewählt."),
    aktiv: z.string().optional(),
  })
  .refine((w) => w.thcMin <= w.thcMax, "THC min liegt über THC max.")
  .refine((w) => w.cbdMin <= w.cbdMax, "CBD min liegt über CBD max.");

export function strainStammPruefen(eingabe: Record<string, unknown>): StammPruef {
  const r = schema.safeParse(eingabe);
  if (!r.success) return { ok: false, fehler: r.error.issues[0]?.message ?? "Eingabe ungültig." };
  const w = r.data;
  return {
    ok: true,
    wert: {
      strainId: w.strainId,
      handelsname: w.handelsname,
      kultivarId: w.kultivarId,
      vertreiberId: w.vertreiberId,
      kultivarTyp: w.kultivarTyp,
      darreichungsform: w.darreichungsform,
      thcMinProzent: w.thcMin,
      thcMaxProzent: w.thcMax,
      cbdMinProzent: w.cbdMin,
      cbdMaxProzent: w.cbdMax,
      terpenIds: w.terpene,
      aktiv: w.aktiv === "on",
    },
  };
}

/** Wie Importskript und Freigabe: Handelsname und Kultivar klein (SQLite sucht nicht case-insensitiv). */
export function strainSuchtext(handelsname: string, kultivarName: string | null): string {
  return [handelsname, kultivarName].filter(Boolean).join(" ").toLowerCase();
}

export type TerpenRang = { terpenId: string; rang: number };

/**
 * Abgleich der Terpen-Zeilen: bleibende Terpene behalten ihre Zeile samt Konzentration und
 * bekommen nur den neuen Rang, entfernte werden gelöscht, neue ohne Konzentration angelegt.
 */
export function terpenAbgleich(
  vorhanden: TerpenRang[],
  neu: string[],
): { loeschen: string[]; rangNeu: TerpenRang[]; anlegen: TerpenRang[] } {
  const alt = new Map(vorhanden.map((v) => [v.terpenId, v.rang]));
  const ziel = new Set(neu);
  const rangNeu: TerpenRang[] = [];
  const anlegen: TerpenRang[] = [];
  neu.forEach((terpenId, i) => {
    const rang = i + 1;
    if (!alt.has(terpenId)) anlegen.push({ terpenId, rang });
    else if (alt.get(terpenId) !== rang) rangNeu.push({ terpenId, rang });
  });
  return { loeschen: vorhanden.filter((v) => !ziel.has(v.terpenId)).map((v) => v.terpenId), rangNeu, anlegen };
}
