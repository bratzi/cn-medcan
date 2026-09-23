-- 0003_umfragen
--
-- Block B, Schritt 4: das Umfragemodell (umfragen, umfrage_vorschlaege,
-- umfrage_optionen, stimmen) und zwei Aenderungen an `reviews`.
--
-- Der Block "RedefineTables" mit DROP TABLE "reviews" ist der normale
-- SQLite-Tabellenumbau (neu anlegen, Zeilen kopieren, umbenennen) - SQLite
-- kann Spalten und Fremdschluessel nicht nachtraeglich aendern. Die Zeilen
-- werden mitkopiert. Das ist NICHT die d1_migrations-Falle aus db/README.md.
--
-- WICHTIG: Nach dieser Migration muss db/constraints.sql erneut laufen.
-- SQLite verwirft beim Tabellenumbau alle Trigger der alten Tabelle.

-- CreateTable
CREATE TABLE "umfragen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'VORSCHLAG',
    "aktiv" TEXT,
    "start_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vorschlag_bis_am" DATETIME,
    "endet_am" DATETIME,
    "community_plaetze" INTEGER NOT NULL DEFAULT 2,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "umfrage_vorschlaege" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "umfrage_id" TEXT NOT NULL,
    "strain_id" TEXT NOT NULL,
    "mitglied_id" TEXT NOT NULL,
    "begruendung" TEXT,
    "uebernommen" BOOLEAN NOT NULL DEFAULT false,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "umfrage_vorschlaege_umfrage_id_fkey" FOREIGN KEY ("umfrage_id") REFERENCES "umfragen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "umfrage_vorschlaege_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "umfrage_vorschlaege_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "umfrage_optionen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "umfrage_id" TEXT NOT NULL,
    "strain_id" TEXT NOT NULL,
    "reihenfolge" INTEGER NOT NULL,
    "herkunft" TEXT NOT NULL,
    "ist_gewinner" BOOLEAN NOT NULL DEFAULT false,
    "ergebnis_review_id" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "umfrage_optionen_umfrage_id_fkey" FOREIGN KEY ("umfrage_id") REFERENCES "umfragen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "umfrage_optionen_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "umfrage_optionen_ergebnis_review_id_fkey" FOREIGN KEY ("ergebnis_review_id") REFERENCES "reviews" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stimmen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "umfrage_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "mitglied_id" TEXT NOT NULL,
    "abgegeben_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stimmen_umfrage_id_fkey" FOREIGN KEY ("umfrage_id") REFERENCES "umfragen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stimmen_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "umfrage_optionen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stimmen_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strain_id" TEXT NOT NULL,
    "charge_id" TEXT,
    "autor_id" TEXT,
    "ist_redaktionell" BOOLEAN NOT NULL DEFAULT false,
    "aussehen" INTEGER NOT NULL,
    "geruch" INTEGER NOT NULL,
    "geschmack" INTEGER NOT NULL,
    "wirkung" INTEGER NOT NULL,
    "konsistenz" INTEGER NOT NULL,
    "feuchtigkeit_prozent" REAL,
    "geschmacks_matrix" TEXT NOT NULL,
    "notiz" TEXT,
    "instagram_reel_url" TEXT,
    "freigegeben" BOOLEAN NOT NULL DEFAULT false,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "reviews_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "chargen" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reviews_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "mitglied" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_reviews" ("aktualisiert_am", "aussehen", "autor_id", "charge_id", "erstellt_am", "feuchtigkeit_prozent", "freigegeben", "geruch", "geschmack", "geschmacks_matrix", "id", "instagram_reel_url", "konsistenz", "notiz", "strain_id", "wirkung") SELECT "aktualisiert_am", "aussehen", "autor_id", "charge_id", "erstellt_am", "feuchtigkeit_prozent", "freigegeben", "geruch", "geschmack", "geschmacks_matrix", "id", "instagram_reel_url", "konsistenz", "notiz", "strain_id", "wirkung" FROM "reviews";
DROP TABLE "reviews";
ALTER TABLE "new_reviews" RENAME TO "reviews";
CREATE INDEX "reviews_strain_id_freigegeben_idx" ON "reviews"("strain_id", "freigegeben");
CREATE INDEX "reviews_charge_id_idx" ON "reviews"("charge_id");
CREATE INDEX "reviews_autor_id_idx" ON "reviews"("autor_id");
CREATE INDEX "reviews_ist_redaktionell_erstellt_am_idx" ON "reviews"("ist_redaktionell", "erstellt_am");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "umfragen_aktiv_key" ON "umfragen"("aktiv");

-- CreateIndex
CREATE INDEX "umfragen_phase_idx" ON "umfragen"("phase");

-- CreateIndex
CREATE INDEX "umfrage_vorschlaege_umfrage_id_uebernommen_idx" ON "umfrage_vorschlaege"("umfrage_id", "uebernommen");

-- CreateIndex
CREATE INDEX "umfrage_vorschlaege_strain_id_idx" ON "umfrage_vorschlaege"("strain_id");

-- CreateIndex
CREATE INDEX "umfrage_vorschlaege_mitglied_id_idx" ON "umfrage_vorschlaege"("mitglied_id");

-- CreateIndex
CREATE UNIQUE INDEX "umfrage_vorschlaege_umfrage_id_mitglied_id_strain_id_key" ON "umfrage_vorschlaege"("umfrage_id", "mitglied_id", "strain_id");

-- CreateIndex
CREATE INDEX "umfrage_optionen_umfrage_id_herkunft_idx" ON "umfrage_optionen"("umfrage_id", "herkunft");

-- CreateIndex
CREATE INDEX "umfrage_optionen_strain_id_idx" ON "umfrage_optionen"("strain_id");

-- CreateIndex
CREATE INDEX "umfrage_optionen_ergebnis_review_id_idx" ON "umfrage_optionen"("ergebnis_review_id");

-- CreateIndex
CREATE UNIQUE INDEX "umfrage_optionen_umfrage_id_strain_id_key" ON "umfrage_optionen"("umfrage_id", "strain_id");

-- CreateIndex
CREATE UNIQUE INDEX "umfrage_optionen_umfrage_id_reihenfolge_key" ON "umfrage_optionen"("umfrage_id", "reihenfolge");

-- CreateIndex
CREATE INDEX "stimmen_option_id_idx" ON "stimmen"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "stimmen_umfrage_id_mitglied_id_key" ON "stimmen"("umfrage_id", "mitglied_id");


-- Bestandsdaten: `reviews.autor_id` ist ab jetzt ein Fremdschluessel auf
-- `mitglied`. Die fiktiven Autoren-Ids aus dem Seed zeigen ins Leere. Der
-- Tabellenumbau oben laeuft mit foreign_keys=OFF und wuerde sie stehen
-- lassen - eine Zeile, die gegen ihren eigenen Fremdschluessel verstoesst und
-- erst beim naechsten Schreibzugriff auffaellt. Deshalb hier ausdruecklich
-- geleert: eine Bewertung ohne Mitglied dahinter ist erlaubt (die Spalte ist
-- optional), eine mit erfundener Zuordnung nicht.
UPDATE "reviews"
   SET "autor_id" = NULL
 WHERE "autor_id" IS NOT NULL
   AND "autor_id" NOT IN (SELECT "id" FROM "mitglied");

-- Die vorhandenen Bewertungen stammen vom Betreiber und sind damit
-- redaktionell. Community-Bewertungen entstehen erst ueber die Oberflaeche.
UPDATE "reviews" SET "ist_redaktionell" = true;
