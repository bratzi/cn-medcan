-- 0019_profil_oeffentliches_netz
--
-- Profil Stufe 2, Review W1: das oeffentliche Profil zeigt ein Netz nur aus
-- freigegebenen Bewertungen. Gleiche Form wie geschmack/terpene/anzahl/gewichtet,
-- als ein JSON-Text; NULL, bis das Profil neu gerechnet ist (dann zeigt die
-- oeffentliche Seite kein Netz). Rein additiv.

-- AlterTable
ALTER TABLE "nutzer_profil" ADD COLUMN "oeffentlich" TEXT;
