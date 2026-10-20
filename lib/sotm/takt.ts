/**
 * Takt des Strain of the Month (Spec 2026-10-20, Teil B): schliesst die
 * abgelaufene Runde, oeffnet die naechste und schaltet am 15. in die
 * Abstimmung. Idempotent: jeder Schritt liest neu und schreibt in einem batch,
 * ein zweiter Takt im selben Zustand tut nichts.
 */
import { gewinnerErmitteln } from "@/lib/umfrage-eingabe";
import { sotmLage } from "@/lib/sotm/kalender";

export type SqlZiel = {
  alle<T>(sql: string, ...werte: unknown[]): Promise<T[]>;
  batch(befehle: { sql: string; werte: unknown[] }[]): Promise<void>;
};

export function d1Ziel(db: D1Database): SqlZiel {
  return {
    async alle<T>(sql: string, ...werte: unknown[]) {
      return (await db.prepare(sql).bind(...werte).all<T>()).results;
    },
    async batch(befehle) {
      await db.batch(befehle.map((b) => db.prepare(b.sql).bind(...b.werte)));
    },
  };
}

export type TaktErgebnis = { schritte: ("BEENDET" | "ABSTIMMUNG" | "KANDIDATEN" | "NEUE_RUNDE")[] };

/** So legt Prisma DateTime in D1 ab: ISO-Text mit +00:00. */
const datum = (d: Date) => d.toISOString().replace("Z", "+00:00");

type Aktive = { id: string; phase: string; monat: string | null };

const aktiveLesen = async (db: SqlZiel) =>
  (await db.alle<Aktive>("SELECT id, phase, monat FROM umfragen WHERE aktiv = 'AKTIV'"))[0];

export async function sotmTakt(
  db: SqlZiel,
  jetzt: Date,
  neueId: () => string = () => crypto.randomUUID(),
): Promise<TaktErgebnis> {
  const lage = sotmLage(jetzt);
  const schritte: TaktErgebnis["schritte"] = [];

  // 1./2. Abgelaufene (oder monatslose Alt-)Runde beenden.
  let aktive = await aktiveLesen(db);
  if (aktive && (aktive.monat === null || aktive.monat <= lage.laufenderMonat)) {
    const optionen = await db.alle<{ id: string; herkunft: string; reihenfolge: number; stimmen: number }>(
      "SELECT o.id, o.herkunft, o.reihenfolge, COUNT(s.id) AS stimmen FROM umfrage_optionen o LEFT JOIN stimmen s ON s.option_id = o.id WHERE o.umfrage_id = ? GROUP BY o.id",
      aktive.id,
    );
    const gewinner = gewinnerErmitteln(
      optionen.map((o) => ({ ...o, stimmen: Number(o.stimmen), reihenfolge: Number(o.reihenfolge) })) as Parameters<
        typeof gewinnerErmitteln
      >[0],
      1,
    );
    const befehle: { sql: string; werte: unknown[] }[] = [];
    if (gewinner.length > 0) {
      befehle.push({
        sql: `UPDATE umfrage_optionen SET ist_gewinner = 1 WHERE id IN (${gewinner.map(() => "?").join(", ")})`,
        werte: gewinner,
      });
    }
    befehle.push({
      sql: "UPDATE umfragen SET phase = 'BEENDET', aktiv = NULL, endet_am = ? WHERE id = ? AND aktiv = 'AKTIV'",
      werte: [datum(jetzt), aktive.id],
    });
    await db.batch(befehle);
    schritte.push("BEENDET");
    aktive = await aktiveLesen(db);
  }

  // 3. Neue Runde fuer den Zielmonat oeffnen.
  if (!aktive) {
    const vorhanden = await db.alle<{ id: string }>("SELECT id FROM umfragen WHERE monat = ?", lage.zielMonat);
    if (vorhanden.length === 0) {
      const id = neueId();
      const vorschlagBis = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth(), 15) - 1);
      await db.batch([
        {
          sql: "INSERT OR IGNORE INTO umfragen (id, titel, phase, aktiv, start_am, vorschlag_bis_am, community_plaetze, erstellt_am, monat) VALUES (?, ?, 'VORSCHLAG', 'AKTIV', ?, ?, 1, ?, ?)",
          werte: [id, `Strain of the Month ${lage.zielMonat}`, datum(jetzt), datum(vorschlagBis), datum(jetzt), lage.zielMonat],
        },
      ]);
      aktive = await aktiveLesen(db);
      // Konflikt (parallel angelegt): die fremde Runde gehoert dem anderen Takt.
      if (aktive?.id !== id) return { schritte };
      schritte.push("NEUE_RUNDE");
    }
  }

  // 4. Am 15. in die Abstimmung schalten, notfalls mit allen Vorschlaegen.
  if (aktive && aktive.phase === "VORSCHLAG" && lage.phase === "ABSTIMMUNG" && aktive.monat === lage.zielMonat) {
    const community = await db.alle<{ id: string }>(
      "SELECT id FROM umfrage_optionen WHERE umfrage_id = ? AND herkunft = 'COMMUNITY' LIMIT 1",
      aktive.id,
    );
    const befehle: { sql: string; werte: unknown[] }[] = [];
    if (community.length === 0) {
      const kandidaten = await db.alle<{ strain_id: string }>(
        "SELECT strain_id FROM umfrage_vorschlaege WHERE umfrage_id = ? GROUP BY strain_id ORDER BY MIN(erstellt_am), strain_id",
        aktive.id,
      );
      if (kandidaten.length > 0) {
        kandidaten.forEach((k, i) =>
          befehle.push({
            sql: "INSERT OR IGNORE INTO umfrage_optionen (id, umfrage_id, strain_id, reihenfolge, herkunft, ist_gewinner, erstellt_am) VALUES (?, ?, ?, ?, 'COMMUNITY', 0, ?)",
            werte: [neueId(), aktive.id, k.strain_id, i + 1, datum(jetzt)],
          }),
        );
        befehle.push({ sql: "UPDATE umfrage_vorschlaege SET uebernommen = 1 WHERE umfrage_id = ?", werte: [aktive.id] });
        schritte.push("KANDIDATEN");
      }
    }
    befehle.push({
      sql: "UPDATE umfragen SET phase = 'ABSTIMMUNG' WHERE id = ? AND phase = 'VORSCHLAG'",
      werte: [aktive.id],
    });
    await db.batch(befehle);
    schritte.push("ABSTIMMUNG");
  }

  return { schritte };
}
