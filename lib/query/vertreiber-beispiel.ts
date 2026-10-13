import { getPrisma } from "@/lib/prisma";
import { ladeVertreiberDerBluete, type VertreiberEintrag } from "@/lib/query/vertreiber";

export type BeispielKandidat = {
  kultivarId: string;
  name: string;
  /** Verschiedene Vertreiber mit mindestens einer bewerteten Charge. */
  bewerteteVertreiber: number;
  /** Summe der Qualitäts-Bewertungen über alle Handelsnamen. */
  bewertungen: number;
  /** Verschiedene bekannte Vertreiber mit aktivem Handelsnamen des Kultivars. */
  vertreiber: number;
  /** Aktive Handelsnamen des Kultivars. */
  handelsnamen: number;
};

export type VertreiberBeispiel = { kultivarId: string; name: string; zeilen: VertreiberEintrag[] };

/** Rangfolge der Spec (Abschnitt 1): nie nach Qualität, nur nach Menge, dann Name. */
export function waehleBeispiel(kandidaten: readonly BeispielKandidat[]): BeispielKandidat | null {
  // Zwei Handelsnamen sind nicht zwei Vertreiber: der Vergleich braucht mindestens zwei Firmen.
  const tauglich = kandidaten.filter((k) => k.vertreiber >= 2);
  tauglich.sort(
    (a, b) =>
      b.bewerteteVertreiber - a.bewerteteVertreiber ||
      b.bewertungen - a.bewertungen ||
      b.vertreiber - a.vertreiber ||
      b.handelsnamen - a.handelsnamen ||
      a.name.localeCompare(b.name, "de"),
  );
  return tauglich[0] ?? null;
}

type BewerteteZeile = { qualitaetAnzahl: number; strain: { kultivarId: string | null; vertreiberId: string | null } };

/** Bewertete Vertreiber und Bewertungssumme je Kultivar; ohne Vertreiber zählt die Bewertung, der Vertreiber nicht. */
export function fasseBewertungenZusammen(
  zeilen: readonly BewerteteZeile[],
): Map<string, { vertreiber: Set<string>; bewertungen: number }> {
  const jeKultivar = new Map<string, { vertreiber: Set<string>; bewertungen: number }>();
  for (const zeile of zeilen) {
    const id = zeile.strain.kultivarId;
    if (!id) continue;
    const eintrag = jeKultivar.get(id) ?? { vertreiber: new Set<string>(), bewertungen: 0 };
    if (zeile.strain.vertreiberId) eintrag.vertreiber.add(zeile.strain.vertreiberId);
    eintrag.bewertungen += zeile.qualitaetAnzahl;
    jeKultivar.set(id, eintrag);
  }
  return jeKultivar;
}

/** Verschiedene bekannte Vertreiber je Kultivar aus den Gruppen (kultivarId, vertreiberId). */
export function zaehleVertreiberJeKultivar(
  gruppen: readonly { kultivarId: string | null; vertreiberId: string | null }[],
): Map<string, number> {
  const mengen = new Map<string, Set<string>>();
  for (const g of gruppen) {
    if (!g.kultivarId || !g.vertreiberId) continue;
    const menge = mengen.get(g.kultivarId) ?? new Set<string>();
    menge.add(g.vertreiberId);
    mengen.set(g.kultivarId, menge);
  }
  return new Map([...mengen].map(([id, menge]) => [id, menge.size]));
}

const KANDIDATEN_MAX = 90; // D1: höchstens 100 gebundene Parameter je Statement, die Ids landen in `in:`
const GRUPPEN_MAX = 500;

/** Vertreiber-Zählung je Kultivar für die gegebenen Ids (eine Abfrage). */
async function vertreiberJeKultivar(ids: string[]): Promise<Map<string, number>> {
  const prisma = await getPrisma();
  const gruppen = await prisma.strain.groupBy({
    by: ["kultivarId", "vertreiberId"],
    where: { aktiv: true, kultivarId: { in: ids }, vertreiberId: { not: null } },
    orderBy: [{ kultivarId: "asc" }, { vertreiberId: "asc" }],
    take: GRUPPEN_MAX,
  });
  return zaehleVertreiberJeKultivar(gruppen);
}

async function bewerteteKandidaten(): Promise<BeispielKandidat[]> {
  const prisma = await getPrisma();
  const bewertet = await prisma.sortenKennwerte.findMany({
    where: { qualitaetAnzahl: { gt: 0 }, strain: { aktiv: true, kultivarId: { not: null } } },
    select: { qualitaetAnzahl: true, strain: { select: { kultivarId: true, vertreiberId: true } } },
    orderBy: [{ qualitaetAnzahl: "desc" }, { strainId: "asc" }],
    take: KANDIDATEN_MAX,
  });
  const jeKultivar = fasseBewertungenZusammen(bewertet);
  const ids = [...jeKultivar.keys()];
  if (ids.length === 0) return [];
  const [zaehlung, namen, vertreiber] = await Promise.all([
    prisma.strain.groupBy({ by: ["kultivarId"], where: { aktiv: true, kultivarId: { in: ids } }, _count: { _all: true } }),
    prisma.kultivar.findMany({ where: { id: { in: ids } }, select: { id: true, name: true }, take: KANDIDATEN_MAX }),
    vertreiberJeKultivar(ids),
  ]);
  const anzahl = new Map(zaehlung.map((z) => [z.kultivarId ?? "", z._count._all]));
  return namen.map((n) => ({
    kultivarId: n.id,
    name: n.name,
    bewerteteVertreiber: jeKultivar.get(n.id)?.vertreiber.size ?? 0,
    bewertungen: jeKultivar.get(n.id)?.bewertungen ?? 0,
    vertreiber: vertreiber.get(n.id) ?? 0,
    handelsnamen: anzahl.get(n.id) ?? 0,
  }));
}

/** Ohne bewertete Kandidaten: die Kultivare mit den meisten aktiven Handelsnamen. */
async function groessteKandidaten(): Promise<BeispielKandidat[]> {
  const prisma = await getPrisma();
  const zaehlung = await prisma.strain.groupBy({
    by: ["kultivarId"],
    where: { aktiv: true, kultivarId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { kultivarId: "desc" } },
    take: 20,
  });
  const ids = zaehlung.map((z) => z.kultivarId).filter((id): id is string => id !== null);
  if (ids.length === 0) return [];
  const [namen, vertreiber] = await Promise.all([
    prisma.kultivar.findMany({ where: { id: { in: ids } }, select: { id: true, name: true }, take: 20 }),
    vertreiberJeKultivar(ids),
  ]);
  const anzahl = new Map(zaehlung.map((z) => [z.kultivarId ?? "", z._count._all]));
  return namen.map((n) => ({
    kultivarId: n.id,
    name: n.name,
    bewerteteVertreiber: 0,
    bewertungen: 0,
    vertreiber: vertreiber.get(n.id) ?? 0,
    handelsnamen: anzahl.get(n.id) ?? 0,
  }));
}

/** Beispiel für das Startseiten-Kapitel; null, wenn kein Kultivar zwei Handelsnamen hat. */
export async function ladeVertreiberBeispiel(): Promise<VertreiberBeispiel | null> {
  const sieger = waehleBeispiel(await bewerteteKandidaten()) ?? waehleBeispiel(await groessteKandidaten());
  if (!sieger) return null;
  const zeilen = await ladeVertreiberDerBluete(sieger.kultivarId, "");
  return { kultivarId: sieger.kultivarId, name: sieger.name, zeilen };
}
