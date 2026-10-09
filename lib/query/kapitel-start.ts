import "server-only";

import { cache } from "react";

import { kapitelAus, type KapitelDaten } from "@/lib/kapitel-start";
import { getPrisma } from "@/lib/prisma";
import { oeffentlicheWerte, profilAusDaten } from "@/lib/profil";
import { verlaufAusDaten } from "@/lib/profil-verlauf";
import { stimmZahlen } from "@/lib/query/konto";

const FREI = { freigegeben: true, strain: { aktiv: true } } as const;

async function eigeneZahlen(autorId: string) {
  const prisma = await getPrisma();
  const wo = { ...FREI, autorId };
  const [bewertet, schnitt, zuletzt] = await Promise.all([
    prisma.review.count({ where: wo }),
    prisma.review.aggregate({ where: { ...wo, gesamtnote: { not: null } }, _avg: { gesamtnote: true } }),
    prisma.review.findFirst({
      where: wo,
      orderBy: [{ erstelltAm: "desc" }, { id: "asc" }],
      select: { gesamtnote: true, erstelltAm: true, strain: { select: { slug: true, handelsname: true } } },
    }),
  ]);
  return {
    bewertet,
    schnitt: schnitt._avg.gesamtnote ?? null,
    zuletzt: zuletzt
      ? { slug: zuletzt.strain.slug, handelsname: zuletzt.strain.handelsname, gesamtnote: zuletzt.gesamtnote, erstelltAm: zuletzt.erstelltAm }
      : null,
  };
}

/**
 * Schaufenster für Gäste (Spec Dein Kapitel 4.1): das öffentliche Kapitel des Betreibers, nur was
 * /profil/<kurzId> ohnehin zeigt. Privat oder nicht freigegeben: null, die Sektion zeigt dann die
 * leere Gast-Fassung. Statisch mit der Seite (300 s).
 */
export const ladeSchaufensterKapitel = cache(async (): Promise<KapitelDaten | null> => {
  const prisma = await getPrisma();
  const m = await prisma.mitglied.findFirst({
    where: { rolle: "ADMIN", profilOeffentlich: true, freigegeben: true },
    orderBy: { erstelltAm: "asc" },
    select: { id: true, anzeigename: true, erstelltAm: true, avatar: { select: { id: true } }, profil: { select: { oeffentlich: true } } },
  });
  if (!m) return null;
  const [zahlen, vonEuch] = await Promise.all([
    eigeneZahlen(m.id),
    prisma.review.count({ where: { ...FREI, istRedaktionell: false } }),
  ]);
  return kapitelAus({
    anzeigename: m.anzeigename,
    avatarId: m.avatar?.id ?? null,
    rolle: "betreiber",
    seit: m.erstelltAm,
    ...zahlen,
    dritte: { art: "vonEuch", zahl: vonEuch },
    netz: oeffentlicheWerte(m.profil?.oeffentlich ?? null),
  });
});

/**
 * Das eigene Kapitel für /api/startseite (Spec 4.2). Liest den gespeicherten Profilstand, rechnet nie
 * neu (CPU-Limit 10 ms); neu gerechnet wird auf /profil. null, wenn das Mitglied fehlt.
 */
export async function ladeEigenesKapitel(mitgliedId: string): Promise<KapitelDaten | null> {
  const prisma = await getPrisma();
  const [m, zahlen, stimmen] = await Promise.all([
    prisma.mitglied.findUnique({
      where: { id: mitgliedId },
      select: { anzeigename: true, rolle: true, erstelltAm: true, avatar: { select: { id: true } }, profil: { select: { geschmack: true, terpene: true, anzahl: true, gewichtet: true, verlauf: true } } },
    }),
    eigeneZahlen(mitgliedId),
    stimmZahlen(mitgliedId),
  ]);
  if (!m) return null;
  return kapitelAus({
    anzeigename: m.anzeigename,
    avatarId: m.avatar?.id ?? null,
    rolle: m.rolle === "ADMIN" ? "betreiber" : "mitglied",
    seit: m.erstelltAm,
    ...zahlen,
    dritte: { art: "gestimmt", zahl: stimmen.stimmen },
    netz: m.profil ? profilAusDaten(m.profil) : null,
    verlauf: verlaufAusDaten(m.profil?.verlauf ?? null),
  });
}
