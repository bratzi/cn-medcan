-- 0015_noten_als_float
--
-- Overall-Noten als Dezimalzahl (Nutzer 2026-10-03): der Regler fuer Aussehen, Geruch,
-- Geschmack, Wirkung und Konsistenz soll dieselbe Granularitaet haben wie "Diese Charge",
-- also Zehntelschritte. Die Spalten hatten INTEGER-Affinitaet; SQLite haette 3,7 beim
-- Schreiben auf 4 gerundet und der Regler haette gelogen.
--
-- SQLite kennt kein ALTER COLUMN TYPE, deshalb eine Tabellenkopie im Muster von
-- 0003_umfragen.sql. Uebernommen werden alle Spalten in ihrer heutigen Form (0001 angelegt,
-- 0003 umgebaut, 0004 terpen_intensitaet, 0005 beschaffenheit, 0009 gesamtnote) sowie alle
-- fuenf Indizes.
--
-- ACHTUNG: Die Trigger aus db/constraints.sql haengen an der Tabelle und fallen mit ihr.
-- Nach dieser Migration muss db/constraints.sql erneut eingespielt werden:
--   npm run db:constraints:remote
-- Die Pruefungen dort gelten unveraendert weiter: "not between 1 and 5" trifft auf 3,7
-- genauso zu wie auf 4.

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strain_id" TEXT NOT NULL,
    "charge_id" TEXT,
    "autor_id" TEXT,
    "ist_redaktionell" BOOLEAN NOT NULL DEFAULT false,
    "aussehen" REAL NOT NULL,
    "geruch" REAL NOT NULL,
    "geschmack" REAL NOT NULL,
    "wirkung" REAL NOT NULL,
    "konsistenz" REAL NOT NULL,
    "feuchtigkeit_prozent" REAL,
    "geschmacks_matrix" TEXT NOT NULL,
    "notiz" TEXT,
    "instagram_reel_url" TEXT,
    "freigegeben" BOOLEAN NOT NULL DEFAULT false,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert_am" DATETIME NOT NULL,
    "terpen_intensitaet" TEXT,
    "beschaffenheit" TEXT,
    "gesamtnote" REAL,
    CONSTRAINT "reviews_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "chargen" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reviews_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "mitglied" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_reviews" ("id", "strain_id", "charge_id", "autor_id", "ist_redaktionell", "aussehen", "geruch", "geschmack", "wirkung", "konsistenz", "feuchtigkeit_prozent", "geschmacks_matrix", "notiz", "instagram_reel_url", "freigegeben", "erstellt_am", "aktualisiert_am", "terpen_intensitaet", "beschaffenheit", "gesamtnote")
SELECT "id", "strain_id", "charge_id", "autor_id", "ist_redaktionell", "aussehen", "geruch", "geschmack", "wirkung", "konsistenz", "feuchtigkeit_prozent", "geschmacks_matrix", "notiz", "instagram_reel_url", "freigegeben", "erstellt_am", "aktualisiert_am", "terpen_intensitaet", "beschaffenheit", "gesamtnote"
FROM "reviews";

DROP TABLE "reviews";
ALTER TABLE "new_reviews" RENAME TO "reviews";

CREATE INDEX "reviews_strain_id_freigegeben_idx" ON "reviews"("strain_id", "freigegeben");
CREATE INDEX "reviews_charge_id_idx" ON "reviews"("charge_id");
CREATE INDEX "reviews_autor_id_idx" ON "reviews"("autor_id");
CREATE INDEX "reviews_ist_redaktionell_erstellt_am_idx" ON "reviews"("ist_redaktionell", "erstellt_am");
CREATE UNIQUE INDEX "reviews_autor_id_strain_id_key" ON "reviews"("autor_id", "strain_id");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
