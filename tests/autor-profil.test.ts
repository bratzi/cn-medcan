import { test } from "node:test";
import assert from "node:assert/strict";

import { autorProfilAus } from "@/lib/autor-profil";

test("autorProfilAus: nur bei öffentlichem Profil mit Kurz-Id", () => {
  assert.equal(autorProfilAus({ profilOeffentlich: true, kurzId: "abcd2345" }), "abcd2345");
  assert.equal(autorProfilAus({ profilOeffentlich: false, kurzId: "abcd2345" }), null);
  assert.equal(autorProfilAus({ profilOeffentlich: true, kurzId: null }), null);
  assert.equal(autorProfilAus(null), null);
});
