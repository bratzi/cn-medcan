-- 0007_fruchtig_minzig
--
-- Aroma-Karte (Nutzer 2026-09-26): zwei neue Geschmacksachsen FRUCHTIG und
-- MINZIG. Die Spalte terpene.geschmack bleibt TEXT. Farnesen (gruener Apfel)
-- bekommt Fruchtig als Hauptnote. Die Verteilung je Terpen auf mehrere Achsen
-- steht im Code (lib/terpen-aromen.ts), nicht in der Datenbank.
--
-- WICHTIG: VORHER db/constraints.sql ausfuehren (Pruef-Trigger kennen die neuen
-- Werte); ohne das bricht dieses Update am Trigger terpene_update_chk ab.

UPDATE "terpene" SET "geschmack" = 'FRUCHTIG' WHERE "name" = 'Farnesen';
