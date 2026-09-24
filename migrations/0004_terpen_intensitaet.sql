-- 0004_terpen_intensitaet
--
-- Spec Redesign 15: Sweet Spot je Terpen. Eine nullbare Spalte, per ADD
-- COLUMN ohne Tabellenumbau: Trigger aus db/constraints.sql bleiben stehen.

ALTER TABLE "reviews" ADD COLUMN "terpen_intensitaet" TEXT;
