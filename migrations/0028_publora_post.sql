-- 0028_publora_post (Spec 2026-10-16 Admin-Dashboard). Per wrangler d1 execute --file, genau einmal.
CREATE TABLE IF NOT EXISTS publora_post (
  id TEXT PRIMARY KEY NOT NULL,
  gruppe TEXT NOT NULL,
  plattform TEXT NOT NULL,
  art TEXT NOT NULL,
  status TEXT NOT NULL,
  geplant_am TEXT,
  titel TEXT NOT NULL DEFAULT '',
  abgerufen_am TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS publora_post_geplant ON publora_post(geplant_am);
CREATE TABLE IF NOT EXISTS sync_stand (
  schluessel TEXT PRIMARY KEY NOT NULL,
  stand TEXT NOT NULL
);
