import { getPrisma } from "@/lib/prisma";
import { sprachParameter } from "@/lib/i18n/vorrendern";
import { auswahlSegment } from "@/lib/seiten-tor";

/** Umkehrung von auswahlSegment: "standard", "v-<id>", "v-<id>-alle". */
export function leseAuswahl(segment: string): { vertreiberId: string | null; alle: boolean } | null {
  if (segment === "standard") return { vertreiberId: null, alle: false };
  const treffer = /^v-([A-Za-z0-9-]+?)(-alle)?$/.exec(segment);
  return treffer ? { vertreiberId: treffer[1], alle: Boolean(treffer[2]) } : null;
}

export function variantenFuer(sorten: { slug: string; vertreiberIds: string[] }[]) {
  const sprachen = ["de", "en"];
  return sprachen.flatMap((lang) =>
    sorten.flatMap(({ slug, vertreiberIds }) => [
      { lang, slug, auswahl: auswahlSegment(null, false) },
      ...vertreiberIds.flatMap((id) => [
        { lang, slug, auswahl: auswahlSegment(id, false) },
        { lang, slug, auswahl: auswahlSegment(id, true) },
      ]),
    ]),
  );
}

/** Für generateStaticParams: nur im Build mit D1-Abzug (VORRENDERN=1), sonst leer. */
export async function strainVarianten() {
  if (sprachParameter().length === 0) return [];
  const prisma = await getPrisma();
  const zeilen = await prisma.strain.findMany({
    where: { aktiv: true, kultivar: { isNot: null } },
    select: { vertreiberId: true, kultivar: { select: { slug: true } } },
    take: 5000,
  });
  const karte = new Map<string, Set<string>>();
  for (const z of zeilen) {
    const slug = z.kultivar?.slug;
    if (!slug) continue;
    const set = karte.get(slug) ?? new Set<string>();
    if (z.vertreiberId) set.add(z.vertreiberId);
    karte.set(slug, set);
  }
  return variantenFuer([...karte].map(([slug, ids]) => ({ slug, vertreiberIds: [...ids] })));
}
