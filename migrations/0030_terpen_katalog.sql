-- 0030_terpen_katalog
--
-- Terpen-Audit 2026-10-20 (docs/terpene-audit-2026-10-20.md): Farnesen bekommt
-- in der Datenbank wieder Fruchtig als Hauptnote (der Stamm-Import hatte es auf
-- Suess zurueckgesetzt), und die Terpene der ersten Prioritaet kommen in den
-- Katalog. Die Hauptnote steht wie der erste Eintrag in lib/terpen-aromen.ts.
-- Ids wie in scripts/stamm/sql-erzeugen.py (uuid5), damit ein spaeterer Import
-- dieselben Zeilen trifft.

UPDATE "terpene" SET "geschmack" = 'FRUCHTIG' WHERE "name" = 'Farnesen';

INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('41c86bca-93ed-5442-8e94-853ac27a3e7f', 'beta-Pinen', 'grün, holzig, harzig', 'HOLZIG') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('430aaff7-43f9-59a1-95ce-e82f02d3339c', 'Terpineol', 'Flieder, Kiefer', 'BLUMIG') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('5fe08aaa-f4be-5279-aa01-a69aeec3dc33', 'Eukalyptol', 'Eukalyptus, kühl, kampferartig', 'MINZIG') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('dcdccc4f-24bc-5eff-80e8-c6c4d41f07e4', 'Borneol', 'kampferartig, holzig', 'MINZIG') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('5911e513-d352-5e24-b758-ce38071cfaae', 'Fenchol', 'kampferartig, Kiefer, Kräuter', 'MINZIG') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('35ca9b6f-bad4-53b2-8817-3eae3f174fef', 'Guajol', 'Holz, Rose, Tee', 'HOLZIG') ON CONFLICT("name") DO NOTHING;
