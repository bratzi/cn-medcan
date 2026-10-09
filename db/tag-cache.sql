-- Tag-Cache fuer OpenNext (On-Demand-Revalidierung, Session 54, 2026-10-09).
-- Liegt in der eigenen Datenbank cn-medcan-tags (Binding NEXT_TAG_CACHE_D1), nicht in cn-medcan-db:
-- prisma migrate diff --from-local-d1 wuerde eine fremde Tabelle sonst zum Loeschen vorschlagen.
-- Schema wie OpenNext populate-cache (node_modules/@opennextjs/cloudflare/dist/cli/commands/populate-cache.js).
CREATE TABLE IF NOT EXISTS revalidations (tag TEXT NOT NULL, revalidatedAt INTEGER NOT NULL, stale INTEGER, expire INTEGER default NULL, UNIQUE(tag) ON CONFLICT REPLACE);
