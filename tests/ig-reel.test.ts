import { test } from "node:test";
import assert from "node:assert/strict";
import { reelPruefen, type IgReel } from "@/lib/ig-reel";

const r: IgReel = {
  saeule: "transparenz",
  schluessel: "so-bewerten-wir",
  szenen: [
    { kicker: "So bewerten wir", titel: "Fünf Noten", blaetter: 4, sekunden: 4 },
    { titel: "Aussehen & Geruch", text: "Jede Sorte gleich geprüft.", icons: ["aussehen", "geruch"], sekunden: 5 },
    { titel: "Geschmack", icons: ["geschmack"], sekunden: 5 },
    { titel: "Vorabzugang per DM", icons: ["community"], sekunden: 4 },
  ],
};

test("gültiges Reel", () => assert.deepEqual(reelPruefen(r), []));

test("Dauer 15 bis 30 s", () => {
  assert.ok(reelPruefen({ ...r, szenen: r.szenen.slice(0, 3) }).some((f) => f.includes("Dauer")));
  assert.ok(reelPruefen({ ...r, szenen: [...r.szenen, ...r.szenen] }).some((f) => f.includes("Dauer")));
});

test("Sperrwort in Szene lehnt ab", () => {
  assert.ok(reelPruefen({ ...r, szenen: [{ titel: "Entspannt am Abend", sekunden: 4 }, ...r.szenen.slice(1)] }).length > 0);
});

test("schluessel geprüft", () => {
  assert.ok(reelPruefen({ ...r, schluessel: "Ä x" }).some((f) => f.includes("schluessel")));
});

test("höchstens fünf Icons je Szene", () => {
  const icons = ["a", "b", "c", "d", "e", "f"];
  assert.ok(reelPruefen({ ...r, szenen: [{ ...r.szenen[0], icons }, ...r.szenen.slice(1)] }).some((f) => f.includes("Icons")));
});

test("jede Szene braucht Icons oder Blätter, kein Link in der Bio", () => {
  const ohne = { ...r, szenen: [{ titel: "Leer", sekunden: 4 }, ...r.szenen.slice(1)] };
  assert.ok(reelPruefen(ohne).some((f) => f.includes("Icons oder Blätter")));
  const bio = { ...r, szenen: [{ ...r.szenen[0], titel: "Link in Bio" }, ...r.szenen.slice(1)] };
  assert.ok(reelPruefen(bio).some((f) => f.includes("Link in der Bio")));
});
