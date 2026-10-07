import { test } from "node:test";
import assert from "node:assert/strict";

import { istKurzId, KURZ_ID_LAENGE, KURZ_ID_ZEICHEN, neueKurzId, profilHref } from "@/lib/kurz-id";

test("neueKurzId: 8 Zeichen aus dem Alphabet", () => {
  for (let i = 0; i < 200; i++) {
    const id = neueKurzId();
    assert.equal(id.length, KURZ_ID_LAENGE);
    assert.ok(istKurzId(id), id);
  }
});

test("neueKurzId: verwirft Bytes jenseits des Vielfachen (keine Schieflage)", () => {
  // 248 = 8 * 31 ist das erste verworfene Byte; danach kommt 0, also das erste Zeichen.
  const folge = [248, 255, ...Array(8).fill(0)];
  const id = neueKurzId((n) => Uint8Array.from(folge.splice(0, n)));
  assert.equal(id, KURZ_ID_ZEICHEN[0].repeat(8));
});

test("istKurzId: nur genau 8 Zeichen aus dem Alphabet", () => {
  assert.equal(istKurzId("abcd2345"), true);
  for (const falsch of ["", "abcd234", "abcd23456", "ABCD2345", "abcd2301", "abcd-345", "x'--aaaa"]) {
    assert.equal(istKurzId(falsch), false, falsch);
  }
});

test("profilHref", () => {
  assert.equal(profilHref("abcd2345"), "/profil/abcd2345");
});
