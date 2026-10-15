-- Sorten-Dublette "8 Ball Kush" / "8-Ball Kush" (Live-Befund 2026-10-15, Remote gelesen):
--   behalten: 5c7950b912cb4aa216cf111b8633e6ae "8 Ball Kush" (Slug 8-ball-kush, 2 Handelsnamen)
--   entfällt: 8d75be47744fe4385080efbf4bf7b57c "8-Ball Kush" (Slug 8-ball-kush-2, 1 Handelsname)
-- Beide haben 0 Reviews und 0 Vorschläge; die Anweisungen dafür stehen trotzdem da, damit die
-- Datei auch nach neuen Bewertungen noch stimmt. Wiederholbar: nach dem ersten Lauf greifen
-- alle Anweisungen ins Leere.
-- Per `wrangler d1 execute cn-medcan-db --remote --file` einspielen, nicht per `migrations apply`.
UPDATE strains SET kultivar_id = '5c7950b912cb4aa216cf111b8633e6ae'
  WHERE kultivar_id = '8d75be47744fe4385080efbf4bf7b57c';
UPDATE reviews SET kultivar_id = '5c7950b912cb4aa216cf111b8633e6ae'
  WHERE kultivar_id = '8d75be47744fe4385080efbf4bf7b57c';
UPDATE sorten_vorschlaege SET kultivar_id = '5c7950b912cb4aa216cf111b8633e6ae'
  WHERE kultivar_id = '8d75be47744fe4385080efbf4bf7b57c';
-- Kennwerte sind abgeleitet: beide Sorten verwerfen, der nächste Speichervorgang (lib/kennwerte.ts)
-- schreibt sie für die behaltene Sorte neu.
DELETE FROM kultivar_vertreiber_kennwerte
  WHERE kultivar_id IN ('5c7950b912cb4aa216cf111b8633e6ae', '8d75be47744fe4385080efbf4bf7b57c');
DELETE FROM kultivar_kennwerte
  WHERE kultivar_id IN ('5c7950b912cb4aa216cf111b8633e6ae', '8d75be47744fe4385080efbf4bf7b57c');
DELETE FROM kultivare WHERE id = '8d75be47744fe4385080efbf4bf7b57c';
