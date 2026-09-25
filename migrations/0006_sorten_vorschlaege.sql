-- 0006_sorten_vorschlaege
--
-- Bluete vorschlagen (Spec 2026-09-25): Vorschlaege der Mitglieder und
-- Benachrichtigungen im Mitgliederbereich. Nur neue Tabellen, kein Umbau.
--
-- WICHTIG: Danach db/constraints.sql erneut ausfuehren (Trigger der neuen Tabellen).

-- CreateTable
CREATE TABLE "sorten_vorschlaege" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mitglied_id" TEXT NOT NULL,
    "handelsname" TEXT NOT NULL,
    "schluessel" TEXT NOT NULL,
    "hersteller" TEXT,
    "kultivar_name" TEXT,
    "kultivar_typ" TEXT,
    "thc_prozent" REAL,
    "cbd_prozent" REAL,
    "terpene" TEXT,
    "quelle" TEXT NOT NULL,
    "notiz" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFEN',
    "strain_id" TEXT,
    "begruendung" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entschieden_am" DATETIME,
    CONSTRAINT "sorten_vorschlaege_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sorten_vorschlaege_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "benachrichtigungen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mitglied_id" TEXT NOT NULL,
    "art" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "link" TEXT,
    "gelesen_am" DATETIME,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "benachrichtigungen_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "sorten_vorschlaege_status_schluessel_idx" ON "sorten_vorschlaege"("status", "schluessel");

-- CreateIndex
CREATE INDEX "sorten_vorschlaege_mitglied_id_idx" ON "sorten_vorschlaege"("mitglied_id");

-- CreateIndex
CREATE INDEX "sorten_vorschlaege_strain_id_idx" ON "sorten_vorschlaege"("strain_id");

-- CreateIndex
CREATE UNIQUE INDEX "sorten_vorschlaege_mitglied_id_schluessel_key" ON "sorten_vorschlaege"("mitglied_id", "schluessel");

-- CreateIndex
CREATE INDEX "benachrichtigungen_mitglied_id_gelesen_am_idx" ON "benachrichtigungen"("mitglied_id", "gelesen_am");
