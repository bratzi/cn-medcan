-- Tageszähler für Neubauten über den Deploy-Hook (Spec 2026-10-21, Seiten aus Assets, 3.4).
-- Per wrangler d1 execute --file, genau einmal, vor dem Deploy. Rückweg: DROP TABLE IF EXISTS neubau_zaehler;
-- Deckel schützt das Budget von Workers Builds Free (3000 Build-Minuten im Monat).
CREATE TABLE IF NOT EXISTS neubau_zaehler (
  tag TEXT PRIMARY KEY NOT NULL,
  anzahl INTEGER NOT NULL
);
