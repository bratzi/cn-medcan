import { getPrisma } from "@/lib/prisma";
import { sprachParameter } from "@/lib/i18n/vorrendern";

/** Eine Seite je Strain und Sprache (Plan 2026-10-22, eine Seite je Strain); doppelte Slugs einmal. */
export function slugParameter(slugs: readonly string[]) {
  const einmal = [...new Set(slugs)];
  return ["de", "en"].flatMap((lang) => einmal.map((slug) => ({ lang, slug })));
}

/** Für generateStaticParams: nur im Build mit D1-Abzug (VORRENDERN=1), sonst leer. */
export async function strainSlugs() {
  if (sprachParameter().length === 0) return [];
  const prisma = await getPrisma();
  const zeilen = await prisma.kultivar.findMany({
    where: { strains: { some: { aktiv: true } } },
    select: { slug: true },
    take: 5000,
  });
  return slugParameter(zeilen.flatMap((z) => (z.slug ? [z.slug] : [])));
}
