-- 0032_unternehmen_logo
--
-- Hersteller-Logos (Spec 2026-10-21, Abschnitt 2): Pfad einer Datei unter
-- public/marken/ (z. B. /marken/hersteller/aurora.svg). Leer: die Seite zeigt
-- eine Initialen-Marke. Rein additiv; Rueckweg: ALTER TABLE "unternehmen" DROP COLUMN "logo_pfad".

ALTER TABLE "unternehmen" ADD COLUMN "logo_pfad" TEXT;

-- Erste Logos (offizielle Websites, Quellen im Commit): nur setzen, wo noch nichts steht.
UPDATE "unternehmen" SET "logo_pfad" = '/marken/hersteller/cannamedical.svg' WHERE "name" = 'Cannamedical Pharma GmbH' AND "logo_pfad" IS NULL;
UPDATE "unternehmen" SET "logo_pfad" = '/marken/hersteller/cansativa.svg' WHERE "name" IN ('Cansativa', 'Cansativa Group', 'Cansativa GmbH (Vertrieb im Auftrag der BfArM-Cannabisagentur)') AND "logo_pfad" IS NULL;
UPDATE "unternehmen" SET "logo_pfad" = '/marken/hersteller/avaay.webp' WHERE "name" = 'Avaay Medical GmbH (Sanity Group)' AND "logo_pfad" IS NULL;
