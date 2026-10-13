import { getPrisma } from "@/lib/prisma";
import { ladeVertreiberDerBluete, type VertreiberEintrag } from "@/lib/query/vertreiber";

export type BeispielKandidat = {
  kultivarId: string;
  name: string;
  /** Verschiedene Vertreiber mit mindestens einer bewerteten Charge. */
  bewerteteVertreiber: number;
  /** Summe der Qualitäts-Bewertungen über alle Handelsnamen. */
  bewertungen: number;
  /** Aktive Handelsnamen des Kultivars. */
  handelsnamen: number;
};

export type VertreiberBeispiel = { kultivarId: string; name: string; zeilen: VertreiberEintrag[] };

/** Rangfolge der Spec (Abschnitt 1): nie nach Qualität, nur nach Menge, dann Name. */
export function waehleBeispiel(kandidaten: readonly BeispielKandidat[]): BeispielKandidat | null {
  const tauglich = kandidaten.filter((k) => k.handelsnamen >= 2);
  tauglich.sort(
    (a, b) =>
      b.bewerteteVertreiber - a.bewerteteVertreiber ||
      b.bewertungen - a.bewertungen ||
      b.handelsnamen - a.handelsnamen ||
      a.name.localeCompare(b.name, "de"),
  );
  return tauglich[0] ?? null;
}

const KANDIDATEN_MAX = 200;

async function bewerteteKandidaten(): Promise<BeispielKandidat[]> {
  const prisma = await getPrisma();
  const bewertet = await prisma.sortenKennwerte.findMany({
    where: { qualitaetAnzahl: { gt: 0 }, strain: { aktiv: true, kultivarId: { not: null } } },
    select: { qualitaetAnzahl: true, strain: { select: { kultivarId: true, vertreiberId: true } } },
    take: KANDIDATEN_MAX,
  });
  const jeKultivar = new Map<string, { vertreiber: Set<string>; bewertungen: number }>();
  for (const zeile of bewertet) {
    const id = zeile.strain.kultivarId;
    if (!id) continue;
    const eintrag = jeKultivar.get(id) ?? { vertreiber: new Set<string>(), bewertungen: 0 };
    if (zeile.strain.vertreiberId) eintrag.vertreiber.add(zeile.strain.vertreiberId);
    eintrag.bewertungen += zeile.qualitaetAnzahl;
    jeKultivar.set(id, eintrag);
  }
  const ids = [...jeKultivar.keys()];
  if (ids.length === 0) return [];
  const [zaehlung, namen] = await Promise.all([
    prisma.strain.groupBy({ by: ["kultivarId"], where: { aktiv: true, kultivarId: { in: ids } }, _count: { _all: true } }),
    prisma.kultivar.findMany({ where: { id: { in: ids } }, select: { id: true, name: true }, take: KANDIDATEN_MAX }),
  ]);
  const anzahl = new Map(zaehlung.map((z) => [z.kultivarId ?? "", z._count._all]));
  return namen.map((n) => ({
    kultivarId: n.id,
    name: n.name,
    bewerteteVertreiber: jeKultivar.get(n.id)?.vertreiber.size ?? 0,
    bewertungen: jeKultivar.get(n.id)?.bewertungen ?? 0,
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
  const namen = await prisma.kultivar.findMany({ where: { id: { in: ids } }, select: { id: true, name: true }, take: 20 });
  const anzahl = new Map(zaehlung.map((z) => [z.kultivarId ?? "", z._count._all]));
  return namen.map((n) => ({ kultivarId: n.id, name: n.name, bewerteteVertreiber: 0, bewertungen: 0, handelsnamen: anzahl.get(n.id) ?? 0 }));
}

/** Beispiel für das Startseiten-Kapitel; null, wenn kein Kultivar zwei Handelsnamen hat. */
export async function ladeVertreiberBeispiel(): Promise<VertreiberBeispiel | null> {
  const sieger = waehleBeispiel(await bewerteteKandidaten()) ?? waehleBeispiel(await groessteKandidaten());
  if (!sieger) return null;
  const zeilen = await ladeVertreiberDerBluete(sieger.kultivarId, "");
  return { kultivarId: sieger.kultivarId, name: sieger.name, zeilen };
}
