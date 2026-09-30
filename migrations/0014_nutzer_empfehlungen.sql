-- 0014_nutzer_empfehlungen
--
-- Persoenliche Empfehlungen nach aehnlichem Aroma (T11, Nutzer 2026-09-29).
-- Beim Speichern einer Bewertung vorberechnet (lib/empfehlung.ts), damit keine
-- Seite je Aufruf ueber alle Sorten rechnet (CPU-Limit 10 ms). Nur Aroma, nie
-- Wirkung (HWG). Nur eine neue Tabelle, kein Umbau. Bestehende Mitglieder
-- bekommen ihre Liste mit der naechsten gespeicherten Bewertung.

-- CreateTable
CREATE TABLE "nutzer_empfehlungen" (
    "mitglied_id" TEXT NOT NULL,
    "strain_id" TEXT NOT NULL,
    "rang" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "bezug_strain_id" TEXT NOT NULL,
    "gemeinsam" TEXT NOT NULL,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("mitglied_id", "strain_id"),
    CONSTRAINT "nutzer_empfehlungen_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "nutzer_empfehlungen_strain_id_fkey" FOREIGN KEY ("strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "nutzer_empfehlungen_bezug_strain_id_fkey" FOREIGN KEY ("bezug_strain_id") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "nutzer_empfehlungen_mitglied_id_rang_idx" ON "nutzer_empfehlungen"("mitglied_id", "rang");
