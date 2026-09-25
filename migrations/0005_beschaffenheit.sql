-- 0005_beschaffenheit
--
-- Beschaffenheit je Bewertung (Chlorophyll, Bud-Dichte, Terpendichte,
-- Trichomfarbe), je 0 bis 5 in halben Schritten, als JSON wie
-- terpen_intensitaet. Nullbare Spalte per ADD COLUMN, ohne Tabellenumbau.

ALTER TABLE "reviews" ADD COLUMN "beschaffenheit" TEXT;
