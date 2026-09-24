-- Beispielrunde (Nutzerentscheidung 2026-09-25): eine laufende Abstimmung mit
-- vier Community-Plaetzen aus dem Katalog. Wiederholbar (feste Ids).
PRAGMA defer_foreign_keys = true;
INSERT INTO umfragen (id, titel, beschreibung, phase, aktiv, start_am, endet_am, community_plaetze, erstellt_am)
VALUES ('runde-herbst-2026', 'Herbstrunde 2026', 'Welche Sorte testen wir als Nächstes? Eine Stimme pro Mitglied.',
        'ABSTIMMUNG', 'AKTIV', CURRENT_TIMESTAMP, datetime('now', '+14 days'), 4, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET phase = 'ABSTIMMUNG', aktiv = 'AKTIV', endet_am = datetime('now', '+14 days');
INSERT INTO umfrage_optionen (id, umfrage_id, strain_id, reihenfolge, herkunft, erstellt_am)
SELECT 'runde-herbst-2026-' || rn, 'runde-herbst-2026', id, rn, 'COMMUNITY', CURRENT_TIMESTAMP FROM (
  SELECT s.id, ROW_NUMBER() OVER (ORDER BY s.thc_max_prozent DESC, s.handelsname) AS rn
  FROM strains s
  WHERE s.aktiv = 1 AND s.darreichungsform = 'BLUETE'
    AND EXISTS (SELECT 1 FROM strain_terpene st WHERE st.strain_id = s.id)
    AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.strain_id = s.id)
) WHERE rn <= 4
ON CONFLICT(id) DO NOTHING;
