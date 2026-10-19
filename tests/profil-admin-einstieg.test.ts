import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("Profil: Verwaltung als Kopf-Aktion nur für ADMIN, mit Zahl", () => {
  const q = readFileSync("app/[lang]/profil/page.tsx", "utf8");
  assert.match(q, /rolle === "ADMIN"\s*\?\s*summeOffen\(await ladeAdminZaehler\(\)\)/);
  assert.match(q, /href: "\/admin"/);
  assert.equal(de.profil.seite.verwaltungOffen, "Verwaltung · {zahl} offen");
  assert.equal(en.profil.seite.verwaltungOffen, "Admin · {zahl} open");
});
