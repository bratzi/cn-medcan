-- 0031_terpen_katalog_zwei
--
-- Terpen-Audit 2026-10-20, zweite Prioritaet: Valencen, Geraniol,
-- Caryophyllenoxid, Camphen, delta-3-Caren, Phellandren und Selinen kommen in
-- den Katalog (nur Aroma-Karte, nicht ins Terpen-Netz). Hauptnote wie der erste
-- Eintrag in lib/terpen-aromen.ts, Ids wie scripts/stamm/sql-erzeugen.py (uuid5).
-- Rein additiv; Rueckweg: DELETE FROM terpene WHERE name IN (...) solange keine
-- strain_terpene-Zeile darauf zeigt.

INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('6a725b61-93c1-5223-b10a-9341897a5870', 'Valencen', 'süße Orange, holzig', 'ZITRUS') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('1a587873-adf1-5fcf-99a7-d5e02c05ece1', 'Geraniol', 'Rose, Geranie, Zitrus', 'BLUMIG') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('da623440-a2c2-5313-9764-5444ebaa6a94', 'Caryophyllenoxid', 'trocken holzig, würzig', 'HOLZIG') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('f1efdb95-ad19-52bb-8192-f583bc5a7247', 'Camphen', 'kampferartig, Tanne', 'HOLZIG') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('03fef482-f78d-50cb-b57c-787475b7947c', 'delta-3-Caren', 'süß-harzig, Kiefer, Zitrus', 'HOLZIG') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('68331ce0-7629-5db1-846d-d21461ee928a', 'Phellandren', 'pfeffrig-minzig, Dill', 'KRAEUTRIG') ON CONFLICT("name") DO NOTHING;
INSERT INTO "terpene" ("id", "name", "aroma_profil", "geschmack") VALUES ('bb45f51f-3a2f-5dbc-8c4c-f1cefc42dfde', 'Selinen', 'krautig, Sellerie', 'KRAEUTRIG') ON CONFLICT("name") DO NOTHING;
