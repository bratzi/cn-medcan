-- 0020_profil_verlauf
--
-- Profil Stufe 3 (Spec 2026-10-07, Abschnitt 10): Verlauf des Netzes, beim
-- Speichern aus heutiger Sicht nachgerechnet. JSON-Liste der letzten 60 Schritte
-- [{anzahl, datum, geschmack}]; NULL, bis das Profil neu gerechnet ist.
-- Rein additiv: alter Code laeuft weiter.

-- AlterTable
ALTER TABLE "nutzer_profil" ADD COLUMN "verlauf" TEXT;
