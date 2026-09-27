-- 0008_benachrichtigung_parameter
--
-- Benachrichtigungen rendern ihren Satz beim Anzeigen in der Sprache des
-- Lesers (Spec Englisch 5.4). text bleibt Pflicht (deutscher Rueckfall);
-- ADD COLUMN baut die Tabelle nicht um, die Trigger aus db/constraints.sql
-- bleiben bestehen - constraints.sql muss hier nicht erneut laufen.
ALTER TABLE "benachrichtigungen" ADD COLUMN "parameter" TEXT;
