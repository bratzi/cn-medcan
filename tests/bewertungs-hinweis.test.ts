import { test } from "node:test";
import assert from "node:assert/strict";

import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("Hinweis nach dem Speichern nennt Beta und etwa 10 Minuten", () => {
  assert.match(de.bewerten.gespeichert, /Beta/);
  assert.match(de.bewerten.gespeichert, /10 Minuten/);
  assert.match(de.bewerten.eingegangen, /Freigabe/);
  assert.match(de.bewerten.eingegangen, /10 Minuten/);
  assert.match(en.bewerten.gespeichert, /beta/i);
  assert.match(en.bewerten.gespeichert, /10 minutes/);
});
