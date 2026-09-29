-- 0010_kennwerte_nachtragen
--
-- Masterplan Bewertung v2 (T5). Die Aroma-Karte liest den Community-Median
-- (gruener Regler, "Deine Nase vs. Community") aus sorten_kennwerte. Die
-- Tabelle wird seit T3 beim Speichern und Freigeben fortgeschrieben
-- (lib/kennwerte.ts); Sorten, deren Bewertungen alle aelter sind, haben noch
-- keine Zeile. Diese Migration traegt sie einmal nach.
--
-- Nur INSERT, keine Aenderung bestehender Zeilen (ON CONFLICT DO NOTHING):
-- was das Speichern schon geschrieben hat, bleibt. Ein zweiter Lauf aendert
-- nichts. Gerechnet wird wie in lib/bewertung-v2.ts (sortenKennwerte):
-- - nur freigegebene Bewertungen;
-- - Geschmack: Median je Achse, gelesen wie parseGeschmacksMatrix: die acht
--   alten Achsen muessen als Zahl von 0 bis 5 dastehen, Fruchtig und Minzig
--   (seit 2026-09-26) duerfen fehlen und zaehlen dann 0; sonst zaehlt die
--   Matrix als lauter Nullen;
-- - Terpene: Median je Terpen; eine Zeile mit einem Wert ausserhalb der
--   ganzen Zahlen 0 bis 5 zaehlt wie in parseTerpenIntensitaet als leer;
-- - Gesamtnote: Median und Mittel (zwei Stellen) ueber die vorhandenen Noten.
-- Median: bei gerader Anzahl das Mittel der beiden mittleren Werte.
-- Kaputtes JSON wird vorab durch 'null' ersetzt, damit keine JSON-Funktion
-- auf ungueltigem Text laeuft. Getestet in tests/kennwerte-nachtragen.test.ts.

WITH
  achsen ("key", "pflicht") AS (
    VALUES ('zitrus', 1), ('fruchtig', 0), ('suess', 1), ('blumig', 1), ('kraeutrig', 1),
           ('minzig', 0), ('holzig', 1), ('wuerzig', 1), ('erdig', 1), ('diesel', 1)
  ),
  frei AS (
    SELECT
      "id",
      "strain_id",
      CASE WHEN json_valid("geschmacks_matrix") THEN "geschmacks_matrix" ELSE 'null' END AS "m",
      CASE WHEN "terpen_intensitaet" IS NOT NULL AND json_valid("terpen_intensitaet")
        THEN "terpen_intensitaet" ELSE 'null' END AS "t",
      "gesamtnote"
    FROM "reviews"
    WHERE "freigegeben" = 1
  ),
  matrix_gueltig AS (
    SELECT
      f."id",
      CASE
        WHEN json_type(f."m") <> 'object' THEN 0
        WHEN EXISTS (
          SELECT 1 FROM achsen a
          WHERE CASE
            WHEN json_type(f."m", '$.' || a."key") IS NULL THEN a."pflicht" = 1
            WHEN json_type(f."m", '$.' || a."key") NOT IN ('integer', 'real') THEN 1
            ELSE json_extract(f."m", '$.' || a."key") NOT BETWEEN 0 AND 5
          END
        ) THEN 0
        ELSE 1
      END AS "gueltig"
    FROM frei f
  ),
  geschmack_werte AS (
    SELECT
      f."strain_id",
      a."key",
      CASE WHEN g."gueltig" = 1 THEN COALESCE(json_extract(f."m", '$.' || a."key"), 0) ELSE 0 END AS "wert"
    FROM frei f
    JOIN matrix_gueltig g ON g."id" = f."id"
    CROSS JOIN achsen a
  ),
  terpen_gueltig AS (
    SELECT f."strain_id", f."t"
    FROM frei f
    WHERE CASE
      WHEN json_type(f."t") <> 'object' THEN 0
      WHEN EXISTS (
        SELECT 1 FROM json_each(f."t") e
        WHERE e."key" = '' OR e."type" <> 'integer' OR e."value" < 0 OR e."value" > 5
      ) THEN 0
      ELSE 1
    END = 1
  ),
  terpen_werte AS (
    SELECT t."strain_id", e."key", e."value" AS "wert"
    FROM terpen_gueltig t, json_each(t."t") e
  ),
  geschmack_median AS (
    SELECT "strain_id", "key", AVG("wert") AS "median"
    FROM (
      SELECT "strain_id", "key", "wert",
        ROW_NUMBER() OVER (PARTITION BY "strain_id", "key" ORDER BY "wert") AS "nr",
        COUNT(*) OVER (PARTITION BY "strain_id", "key") AS "n"
      FROM geschmack_werte
    )
    WHERE "nr" IN (("n" + 1) / 2, ("n" + 2) / 2)
    GROUP BY "strain_id", "key"
  ),
  terpen_median AS (
    SELECT "strain_id", "key", AVG("wert") AS "median"
    FROM (
      SELECT "strain_id", "key", "wert",
        ROW_NUMBER() OVER (PARTITION BY "strain_id", "key" ORDER BY "wert") AS "nr",
        COUNT(*) OVER (PARTITION BY "strain_id", "key") AS "n"
      FROM terpen_werte
    )
    WHERE "nr" IN (("n" + 1) / 2, ("n" + 2) / 2)
    GROUP BY "strain_id", "key"
  ),
  noten_median AS (
    SELECT "strain_id", AVG("gesamtnote") AS "median"
    FROM (
      SELECT "strain_id", "gesamtnote",
        ROW_NUMBER() OVER (PARTITION BY "strain_id" ORDER BY "gesamtnote") AS "nr",
        COUNT(*) OVER (PARTITION BY "strain_id") AS "n"
      FROM frei
      WHERE "gesamtnote" IS NOT NULL
    )
    WHERE "nr" IN (("n" + 1) / 2, ("n" + 2) / 2)
    GROUP BY "strain_id"
  ),
  noten_mittel AS (
    SELECT "strain_id", ROUND(AVG("gesamtnote"), 2) AS "mittel"
    FROM frei
    WHERE "gesamtnote" IS NOT NULL
    GROUP BY "strain_id"
  ),
  anzahl AS (
    SELECT "strain_id", COUNT(*) AS "anzahl" FROM frei GROUP BY "strain_id"
  ),
  geschmack_json AS (
    SELECT "strain_id", json_group_object("key", "median") AS "json" FROM geschmack_median GROUP BY "strain_id"
  ),
  terpen_json AS (
    SELECT "strain_id", json_group_object("key", "median") AS "json" FROM terpen_median GROUP BY "strain_id"
  )
INSERT INTO "sorten_kennwerte" (
  "strain_id", "terpen_median", "geschmack_median", "gesamtnote_median", "gesamtnote_mittel", "anzahl", "aktualisiert_am"
)
SELECT
  a."strain_id",
  COALESCE(t."json", '{}'),
  COALESCE(g."json", '{}'),
  nm."median",
  nt."mittel",
  a."anzahl",
  CURRENT_TIMESTAMP
FROM anzahl a
LEFT JOIN terpen_json t ON t."strain_id" = a."strain_id"
LEFT JOIN geschmack_json g ON g."strain_id" = a."strain_id"
LEFT JOIN noten_median nm ON nm."strain_id" = a."strain_id"
LEFT JOIN noten_mittel nt ON nt."strain_id" = a."strain_id"
WHERE 1
ON CONFLICT ("strain_id") DO NOTHING;
