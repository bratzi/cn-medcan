import { test } from "node:test";
import assert from "node:assert/strict";
import { juryTextBloecke } from "@/lib/jury-text";

test("Absätze, Zwischentitel, Liste, Fett, Kursiv", () => {
  const b = juryTextBloecke("## Nase\n\nErst **Beere**, dann *Teig*.\n\n- Zitrus\n- Kiefer");
  assert.equal(b[0].art, "zwischentitel");
  assert.deepEqual(b[1].teile[0], [{ text: "Erst " }, { text: "Beere", fett: true }, { text: ", dann " }, { text: "Teig", kursiv: true }, { text: "." }]);
  assert.equal(b[2].art, "liste");
  assert.equal(b[2].teile.length, 2);
});

test("HTML und Links bleiben Text", () => {
  const b = juryTextBloecke("<script>x</script> [a](javascript:alert(1))");
  assert.equal(b[0].teile[0].map((t) => t.text).join(""), "<script>x</script> [a](javascript:alert(1))");
});
