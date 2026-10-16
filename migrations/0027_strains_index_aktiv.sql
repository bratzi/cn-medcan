-- D1-Tageslimit (5 Mio. Lesezeilen) am 2026-10-16 überschritten: EXISTS-Unterabfragen auf strains
-- (Sorten-Explorer, Sortensuche, Vertreiberliste) nahmen den Einzelindex auf aktiv und lasen je
-- Kultivar bzw. Vertreiber alle aktiven Strains. Mit diesen Indizes sucht SQLite gezielt.
CREATE INDEX IF NOT EXISTS "strains_kultivar_id_aktiv_idx" ON "strains"("kultivar_id", "aktiv");
CREATE INDEX IF NOT EXISTS "strains_vertreiber_id_aktiv_idx" ON "strains"("vertreiber_id", "aktiv");
