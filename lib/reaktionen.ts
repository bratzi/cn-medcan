import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { KommentarZiel, ZielArt } from "@/db/enums";

/**
 * Reine Hilfen für Likes und Kommentare (Spec 2026-10-14). Zähler werden beim Schreiben
 * gepflegt, nie beim Lesen gezählt (CPU-Limit 10 ms). Alles hier liefert Prisma-Promises,
 * die der Aufrufer in einem $transaction-Batch bündelt.
 */
type Db = Pick<PrismaClient, "like" | "kommentar" | "zaehler">;

export function zaehlerUpsert(prisma: Db, art: ZielArt, id: string, feld: "likes" | "kommentare", delta: 1 | -1) {
  if (delta === 1) {
    return prisma.zaehler.upsert({
      where: { zielArt_zielId: { zielArt: art, zielId: id } },
      create: { zielArt: art, zielId: id, [feld]: 1 },
      update: { [feld]: { increment: 1 } },
    });
  }
  return prisma.zaehler.updateMany({ where: { zielArt: art, zielId: id, [feld]: { gt: 0 } }, data: { [feld]: { decrement: 1 } } });
}

/**
 * Setzt den Like-Zähler aus der echten Zeilenzahl neu. D1 hat keine interaktiven Transaktionen,
 * ein bedingtes Senken ("nur wenn eine Zeile gelöscht wurde") geht im Batch nicht. Das Neuzählen
 * ist dagegen ein einziges Statement, korrigiert sich bei Rennen selbst und läuft nur auf dem
 * Schreibpfad (Abmelden eines Likes), nie beim Lesen. Parameter immer als Template-Werte.
 */
export function zaehlerLikesNeu(prisma: Pick<PrismaClient, "$executeRaw">, art: ZielArt, id: string) {
  return prisma.$executeRaw`INSERT INTO "zaehler" ("ziel_art","ziel_id","likes") VALUES (${art}, ${id}, (SELECT COUNT(*) FROM "likes" WHERE "ziel_art" = ${art} AND "ziel_id" = ${id})) ON CONFLICT ("ziel_art","ziel_id") DO UPDATE SET "likes" = excluded."likes"`;
}

export function kommentarZaehlerZiele(ziel: KommentarZiel, zielId: string, kultivarId: string | null): Array<{ art: ZielArt; id: string }> {
  if (ziel === "PROFIL") return [{ art: "MITGLIED", id: zielId }];
  return kultivarId ? [{ art: "BEWERTUNG", id: zielId }, { art: "BLUETE", id: kultivarId }] : [{ art: "BEWERTUNG", id: zielId }];
}

/** Polymorphe Ziele haben keinen Fremdschlüssel: wer ein Ziel löscht, räumt hiermit im selben Batch ab. */
export function raeumeZielAb(prisma: Db, art: ZielArt, id: string) {
  const kommentarZiel: KommentarZiel | null = art === "BEWERTUNG" ? "BEWERTUNG" : art === "MITGLIED" ? "PROFIL" : null;
  return [
    prisma.like.deleteMany({ where: { zielArt: art, zielId: id } }),
    prisma.kommentar.deleteMany({ where: kommentarZiel ? { zielArt: kommentarZiel, zielId: id } : { id: "__keins__" } }),
    prisma.zaehler.deleteMany({ where: { zielArt: art, zielId: id } }),
  ];
}

export function istDoppelt(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: unknown }).code === "P2002";
}
