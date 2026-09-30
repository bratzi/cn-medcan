-- 0012_budpics
--
-- Bluetenbilder der Mitglieder (T9, Nutzer 2026-09-29): WebP, lange Kante
-- hoechstens 1280 px, hoechstens 150 KB, als BLOB in D1 (kein R2, nie
-- kostenpflichtig). Neue Bilder sind OFFEN, erst die Freigabe in /admin macht
-- sie oeffentlich. Nur eine neue Tabelle, kein Umbau.
--
-- D1: eine Zeile darf hoechstens 2 MB haben; ein BLOB ist ein gebundener
-- Parameter und zaehlt nicht zur Anweisungslaenge. 150 KB liegen weit darunter.
-- Der Status ist per CHECK begrenzt (SQLite prueft ihn bei jedem Schreiben).

-- CreateTable
CREATE TABLE "budpics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strain_id" TEXT NOT NULL,
    "mitglied_id" TEXT NOT NULL,
    "daten" BLOB NOT NULL,
    "breite" INTEGER NOT NULL,
    "hoehe" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFEN' CHECK ("status" IN ('OFFEN', 'FREIGEGEBEN', 'ABGELEHNT')),
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "budpics_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "budpics_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "budpics_strain_id_status_idx" ON "budpics"("strain_id", "status");

-- CreateIndex
CREATE INDEX "budpics_status_erstellt_am_idx" ON "budpics"("status", "erstellt_am");

-- CreateIndex
CREATE INDEX "budpics_mitglied_id_status_idx" ON "budpics"("mitglied_id", "status");
