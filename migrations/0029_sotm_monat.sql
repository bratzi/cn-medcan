-- 0029_sotm_monat (Spec 2026-10-20 Teil B). Per wrangler d1 execute --file, genau einmal.
-- Monat (JJJJ-MM) des Strain of the Month, über den diese Runde abstimmt. Altrunden: NULL.
ALTER TABLE umfragen ADD COLUMN monat TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS umfragen_monat_key ON umfragen(monat);
