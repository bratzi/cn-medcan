-- Vertreiber-Dublette (Live-Befund 2026-10-13, Nutzer: zusammenlegen auf ADREXpharma).
-- "Adrex Pharma" trug nur "Adrex 30/1 8BK CAN" als Vertreiber, sonst keine Bezüge,
-- keine Kennwerte. Wiederholbar: beide Anweisungen greifen nach dem ersten Lauf ins Leere.
-- Per `wrangler d1 execute --remote --file` eingespielt, nicht per `migrations apply`.
UPDATE strains SET vertreiber_id = '0a887b0e-8034-5ef7-88c1-2655bc6fb362'
  WHERE vertreiber_id = 'aec23db2-ab02-58e2-88a9-0d20142e88bb';
UPDATE strains SET hersteller_id = '0a887b0e-8034-5ef7-88c1-2655bc6fb362'
  WHERE hersteller_id = 'aec23db2-ab02-58e2-88a9-0d20142e88bb';
DELETE FROM vertreiber_kennwerte WHERE vertreiber_id = 'aec23db2-ab02-58e2-88a9-0d20142e88bb';
DELETE FROM unternehmen WHERE id = 'aec23db2-ab02-58e2-88a9-0d20142e88bb';
