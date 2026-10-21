-- 0032_unternehmen_logo
--
-- Hersteller-Logos (Spec 2026-10-21, Abschnitt 2): Pfad einer Datei unter
-- public/marken/ (z. B. /marken/hersteller/aurora.svg). Leer: die Seite zeigt
-- eine Initialen-Marke. Rein additiv; Rueckweg: ALTER TABLE "unternehmen" DROP COLUMN "logo_pfad".

ALTER TABLE "unternehmen" ADD COLUMN "logo_pfad" TEXT;
