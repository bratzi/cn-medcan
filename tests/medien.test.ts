import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { MEDIEN, dateienVon, type Medium } from "@/lib/medien";

function beispiel(art: Medium["art"], breite = 4000): Medium {
  return {
    id: "x",
    art,
    pexelsId: 1,
    datei: "x",
    breite,
    hoehe: 3000,
    alt: art === "foto" ? "Beispiel" : "",
    urheber: "Jemand",
    quelle: "https://www.pexels.com/photo/1/",
  };
}

test("Fotos liegen in drei Breiten vor, nie breiter als das Original", () => {
  assert.deepEqual(dateienVon(beispiel("foto")), ["x-640.webp", "x-1280.webp", "x-1920.webp"]);
  assert.deepEqual(dateienVon(beispiel("foto", 1500)), ["x-640.webp", "x-1280.webp"]);
  assert.deepEqual(dateienVon(beispiel("foto", 500)), ["x-500.webp"]);
});

test("Masken und Videos haben feste Dateinamen", () => {
  assert.deepEqual(dateienVon(beispiel("maske")), ["x-maske.png"]);
  assert.deepEqual(dateienVon(beispiel("video")), ["x.mp4", "x-standbild.webp"]);
});

test("Schlüssel und Dateinamen sind eindeutig", () => {
  const ids = MEDIEN.map((m) => m.id);
  const dateien = MEDIEN.map((m) => m.datei);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(dateien).size, dateien.length);
});

test("jedes Foto hat einen Alt-Text, jede Quelle ist eine Pexels-Seite", () => {
  for (const m of MEDIEN) {
    if (m.art === "foto") assert.ok(m.alt.trim().length > 0, `${m.id}: Alt-Text fehlt`);
    assert.match(m.quelle, /^https:\/\/www\.pexels\.com\//, `${m.id}: Quelle`);
    assert.ok(m.urheber.trim().length > 0, `${m.id}: Urheber fehlt`);
  }
});

test("jede Datei in public/medien steht im Verzeichnis und umgekehrt", () => {
  const ordner = join(process.cwd(), "public", "medien");
  const vorhanden = existsSync(ordner)
    ? readdirSync(ordner).filter((datei) => !datei.startsWith("."))
    : [];
  const erwartet = MEDIEN.flatMap(dateienVon);
  assert.deepEqual([...vorhanden].sort(), [...erwartet].sort());
});
