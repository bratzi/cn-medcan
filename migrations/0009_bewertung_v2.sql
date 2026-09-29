-- 0009_bewertung_v2
--
-- Masterplan Bewertung v2 (T3). Nur ADD COLUMN, neuer Index und neue
-- Tabelle, ohne Tabellenumbau: Trigger aus db/constraints.sql bleiben stehen.
--
-- - gesamtnote: 0,5 bis 5 in halben Schritten; bestehende Bewertungen bleiben
--   NULL (zulaessig). Die Qualitaet der Charge steckt weiter in
--   `beschaffenheit` und haengt ueber charge_id an der Charge.
-- - Eine Bewertung je Mitglied und Sorte (NULL-Autoren, also Seed, bleiben
--   frei, weil SQLite NULL in Unique-Indizes nicht vergleicht).
-- - sorten_kennwerte: Community-Mediane je Sorte, geschrieben beim Speichern.

ALTER TABLE "reviews" ADD COLUMN "gesamtnote" REAL;

CREATE UNIQUE INDEX "reviews_autor_id_strain_id_key" ON "reviews"("autor_id", "strain_id");

CREATE TABLE "sorten_kennwerte" (
    "strain_id" TEXT NOT NULL PRIMARY KEY,
    "terpen_median" TEXT NOT NULL,
    "geschmack_median" TEXT NOT NULL,
    "gesamtnote_median" REAL,
    "gesamtnote_mittel" REAL,
    "anzahl" INTEGER NOT NULL,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "sorten_kennwerte_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
