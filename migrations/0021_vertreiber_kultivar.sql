-- 0021_vertreiber_kultivar
--
-- Spec 2026-10-13 (Vertreiber, Blüte, Charge): Kultivar als „Blüte“ über alle
-- Handelsnamen; der bisherige Hersteller wird Vertreiber (pharmazeutischer
-- Unternehmer in Deutschland), hersteller_id bleibt dem echten Anbauer.
-- importeur_id steckt im Fremdschlüssel der Tabelle und kann in SQLite nicht
-- per DROP COLUMN fallen: sie wird geleert und nicht mehr gelesen.

CREATE TABLE "kultivare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL COLLATE NOCASE,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "kultivare_name_key" ON "kultivare"("name");

ALTER TABLE "strains" ADD COLUMN "kultivar_id" TEXT REFERENCES "kultivare" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "strains" ADD COLUMN "vertreiber_id" TEXT REFERENCES "unternehmen" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ab hier Datenschritte. Sie sind wiederholbar (INSERT OR IGNORE, WHERE-Wächter),
-- damit ein halb gelaufener Lauf beim erneuten Einspielen nichts zerstört:
-- ein zweiter Lauf der Umschreibung würde sonst Vertreiber und Hersteller verlieren.
-- Ein Kultivar je getrimmtem, kleingeschriebenem Namen; ohne Namen zählt der Handelsname.
INSERT OR IGNORE INTO "kultivare" ("id", "name")
SELECT lower(hex(randomblob(16))), min(trim(coalesce(nullif(trim("kultivar_name"), ''), "handelsname")))
FROM "strains"
GROUP BY lower(trim(coalesce(nullif(trim("kultivar_name"), ''), "handelsname")));

UPDATE "strains" SET "kultivar_id" = (
    SELECT k."id" FROM "kultivare" k
    WHERE k."name" = trim(coalesce(nullif(trim("strains"."kultivar_name"), ''), "strains"."handelsname"))
) WHERE "kultivar_id" IS NULL;

-- Eine Anweisung: SQLite wertet alle SET-Ausdrücke gegen die alte Zeile aus.
UPDATE "strains" SET
    "vertreiber_id" = coalesce("importeur_id", "hersteller_id"),
    "hersteller_id" = CASE
        WHEN "importeur_id" IS NOT NULL AND "hersteller_id" IS NOT NULL AND "importeur_id" <> "hersteller_id" THEN "hersteller_id"
        ELSE NULL END,
    "importeur_id" = NULL
WHERE "vertreiber_id" IS NULL;

CREATE INDEX "strains_kultivar_id_idx" ON "strains"("kultivar_id");
CREATE INDEX "strains_vertreiber_id_idx" ON "strains"("vertreiber_id");

CREATE TABLE "kultivar_kennwerte" (
    "kultivar_id" TEXT NOT NULL PRIMARY KEY,
    "terpen_median" TEXT NOT NULL,
    "geschmack_median" TEXT NOT NULL,
    "gesamtnote_median" REAL,
    "gesamtnote_mittel" REAL,
    "anzahl" INTEGER NOT NULL,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "kultivar_kennwerte_kultivar_id_fkey" FOREIGN KEY ("kultivar_id") REFERENCES "kultivare" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "vertreiber_kennwerte" (
    "vertreiber_id" TEXT NOT NULL PRIMARY KEY,
    "qualitaet_mittel" REAL,
    "achsen_mittel" TEXT NOT NULL,
    "restfeuchte_median" REAL,
    "anzahl" INTEGER NOT NULL,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "vertreiber_kennwerte_vertreiber_id_fkey" FOREIGN KEY ("vertreiber_id") REFERENCES "unternehmen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "sorten_kennwerte" ADD COLUMN "qualitaet_mittel" REAL;
ALTER TABLE "sorten_kennwerte" ADD COLUMN "restfeuchte_median" REAL;
ALTER TABLE "sorten_kennwerte" ADD COLUMN "qualitaet_anzahl" INTEGER NOT NULL DEFAULT 0;

-- Vorschläge: das bisherige Feld „Hersteller“ meinte die Marke, also den Vertreiber.
ALTER TABLE "sorten_vorschlaege" ADD COLUMN "vertreiber" TEXT;
ALTER TABLE "sorten_vorschlaege" ADD COLUMN "kultivar_id" TEXT REFERENCES "kultivare" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
UPDATE "sorten_vorschlaege" SET "vertreiber" = "hersteller", "hersteller" = NULL
WHERE "vertreiber" IS NULL AND "hersteller" IS NOT NULL;
