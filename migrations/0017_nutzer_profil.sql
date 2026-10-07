-- 0017_nutzer_profil
--
-- Profil und Dashboard, Stufe 1 (Spec 2026-10-07). Profilwerte eines Mitglieds,
-- beim Speichern einer Bewertung vorberechnet (CPU-Limit 10 ms); /profil rechnet
-- nur neu, wenn der Stand aelter als 24 h ist. Nur Aroma, nie Wirkung (HWG).
-- Dazu die Markierung bestaetigter Vorschlaege. Rein additiv: alter Code laeuft weiter.

-- CreateTable
CREATE TABLE "nutzer_profil" (
    "mitglied_id" TEXT NOT NULL PRIMARY KEY,
    "geschmack" TEXT NOT NULL,
    "terpene" TEXT NOT NULL,
    "anzahl" INTEGER NOT NULL,
    "gewichtet" INTEGER NOT NULL,
    "berechnet_am" DATETIME NOT NULL,
    CONSTRAINT "nutzer_profil_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AlterTable
ALTER TABLE "nutzer_empfehlungen" ADD COLUMN "bestaetigt" BOOLEAN NOT NULL DEFAULT false;
