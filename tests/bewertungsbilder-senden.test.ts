import { test } from "node:test";
import assert from "node:assert/strict";

import { bilderSenden, type VorgemerktesBild } from "@/lib/bewertungsbilder-senden";

const bild = (name: string): VorgemerktesBild => ({
  schluessel: name,
  name,
  blob: new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" }),
  breite: 10,
  hoehe: 10,
  vorschau: `blob:${name}`,
});
const OPTIONEN = { fehlgeschlagen: "Sitzung weg", dateiFehler: "{name}: {grund}" };

test("bilderSenden: eine Datei je Aufruf mit strainId, Fortschritt je Bild", async () => {
  const gesehen: string[] = [];
  const stand: string[] = [];
  const lauf = await bilderSenden([bild("a.jpg"), bild("b.jpg")], "s1", async (daten) => {
    const datei = daten.get("bild") as File;
    gesehen.push(`${daten.get("strainId")}|${datei.type}|${datei.name}`);
    return { ok: true, id: "x", sofortSichtbar: false };
  }, { ...OPTIONEN, fortschritt: (nr, gesamt) => stand.push(`${nr}/${gesamt}`) });
  assert.deepEqual(gesehen, ["s1|image/webp|bewertungsbild.webp", "s1|image/webp|bewertungsbild.webp"]);
  assert.deepEqual(stand, ["1/2", "2/2"]);
  assert.deepEqual(lauf, { gesendet: 2, uebrig: [], fehler: [] });
});

test("bilderSenden: Fehler und geworfene Fehler bleiben vorgemerkt, die übrigen laufen weiter", async () => {
  const a = bild("a.jpg");
  const b = bild("b.jpg");
  const c = bild("c.jpg");
  let n = 0;
  const lauf = await bilderSenden([a, b, c], "s1", async () => {
    n += 1;
    if (n === 1) return { ok: false, fehler: "zu groß" };
    if (n === 2) throw new Error("Netz");
    return { ok: true, id: "x", sofortSichtbar: true };
  }, { ...OPTIONEN, fortschritt: () => {} });
  assert.equal(lauf.gesendet, 1);
  assert.deepEqual(lauf.uebrig, [a, b]);
  assert.deepEqual(lauf.fehler, ["a.jpg: zu groß", "b.jpg: Sitzung weg"]);
});

test("bilderSenden: ohne Bilder kein Aufruf", async () => {
  let aufrufe = 0;
  const lauf = await bilderSenden([], "s1", async () => {
    aufrufe += 1;
    return { ok: true, id: "x", sofortSichtbar: false };
  }, { ...OPTIONEN, fortschritt: () => {} });
  assert.equal(aufrufe, 0);
  assert.deepEqual(lauf, { gesendet: 0, uebrig: [], fehler: [] });
});

test("bilderSenden: strikt nacheinander, nie zwei Aufrufe gleichzeitig", async () => {
  let gleichzeitig = 0;
  let hoechstens = 0;
  await bilderSenden([bild("a"), bild("b"), bild("c")], "s1", async () => {
    gleichzeitig += 1;
    hoechstens = Math.max(hoechstens, gleichzeitig);
    await new Promise((r) => setTimeout(r, 5));
    gleichzeitig -= 1;
    return { ok: true, id: "x", sofortSichtbar: false };
  }, { ...OPTIONEN, fortschritt: () => {} });
  assert.equal(hoechstens, 1);
});
