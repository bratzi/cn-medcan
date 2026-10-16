-- 0026_jury (Spec 2026-10-16). Per wrangler d1 execute --file, genau einmal.
ALTER TABLE mitglied ADD COLUMN jury INTEGER NOT NULL DEFAULT 0;
-- Der Betreiber wird Jury-Mitglied; seine Bewertungen bleiben Jury-Bewertungen (istRedaktionell).
UPDATE mitglied SET jury = 1 WHERE rolle = 'ADMIN';
CREATE TABLE IF NOT EXISTS jury_ausgaben (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL,
  titel TEXT NOT NULL,
  einleitung TEXT NOT NULL DEFAULT '',
  erscheint_am DATETIME,
  status TEXT NOT NULL DEFAULT 'ENTWURF',
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS jury_ausgaben_slug_key ON jury_ausgaben(slug);
CREATE TABLE IF NOT EXISTS jury_beitraege (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL,
  titel TEXT NOT NULL,
  anriss TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  autor_id TEXT NOT NULL REFERENCES mitglied(id) ON DELETE CASCADE,
  review_id TEXT REFERENCES reviews(id) ON DELETE SET NULL,
  ausgabe_id TEXT REFERENCES jury_ausgaben(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ENTWURF',
  notiz TEXT,
  ig_url TEXT,
  ig_status TEXT NOT NULL DEFAULT 'KEIN',
  veroeffentlicht_am DATETIME,
  erstellt_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  geaendert_am DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS jury_beitraege_slug_key ON jury_beitraege(slug);
CREATE INDEX IF NOT EXISTS jury_beitraege_status_idx ON jury_beitraege(status, veroeffentlicht_am);
CREATE INDEX IF NOT EXISTS jury_beitraege_autor_idx ON jury_beitraege(autor_id, status);
CREATE INDEX IF NOT EXISTS jury_beitraege_ausgabe_idx ON jury_beitraege(ausgabe_id, position);
CREATE TABLE IF NOT EXISTS jury_bilder (
  id TEXT PRIMARY KEY NOT NULL,
  beitrag_id TEXT NOT NULL REFERENCES jury_beitraege(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  daten BLOB NOT NULL,
  breite INTEGER NOT NULL,
  hoehe INTEGER NOT NULL,
  symbolbild INTEGER NOT NULL DEFAULT 0,
  alt TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS jury_bilder_beitrag_idx ON jury_bilder(beitrag_id, position);
