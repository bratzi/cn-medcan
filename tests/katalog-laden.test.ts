import assert from "node:assert/strict";
import { test } from "node:test";

import { KATALOG_SQL_WAREN } from "@/lib/katalog/laden";

test("Katalog-SQL: öffentlich nur Bestände ohne Fachkreis-Pflicht", () => {
  const sql = KATALOG_SQL_WAREN(false);
  assert.match(sql, /nur_fuer_fachkreise\s*=\s*0/);
  assert.match(sql, /s\.aktiv\s*=\s*1/);
});

test("Katalog-SQL: Fachkreis ohne Bestandsgrenze", () => {
  assert.doesNotMatch(KATALOG_SQL_WAREN(true), /nur_fuer_fachkreise/);
});

test("Katalog-SQL: jedes Wire-Feld der Ware ist gesetzt", () => {
  const sql = KATALOG_SQL_WAREN(false);
  for (const feld of ["i", "s", "h", "k", "y", "f", "g", "t0", "t1", "c0", "c1", "v", "b", "tp", "st", "u"])
    assert.match(sql, new RegExp(`'${feld}',`), `Feld ${feld} fehlt`);
});
