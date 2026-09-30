-- 0013_vorschlag_bilder
--
-- Bilder zu einem Bluetenvorschlag (T10, Nutzer 2026-09-29): WebP, lange Kante
-- hoechstens 1280 px, hoechstens 150 KB, als BLOB in D1 (kein R2, nie
-- kostenpflichtig). Sie warten am Vorschlag; bei Freigabe oder Zuordnung
-- uebernimmt die Aktion sie als offene Budpics der Sorte und loescht diese
-- Zeilen. Nur eine neue Tabelle, kein Umbau.

-- CreateTable
CREATE TABLE "sorten_vorschlag_bilder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vorschlag_id" TEXT NOT NULL,
    "daten" BLOB NOT NULL,
    "breite" INTEGER NOT NULL,
    "hoehe" INTEGER NOT NULL,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sorten_vorschlag_bilder_vorschlag_id_fkey" FOREIGN KEY ("vorschlag_id") REFERENCES "sorten_vorschlaege" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "sorten_vorschlag_bilder_vorschlag_id_idx" ON "sorten_vorschlag_bilder"("vorschlag_id");
