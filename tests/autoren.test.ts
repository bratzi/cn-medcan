import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { alsEintrag } from "@/components/review/eintrag";
import { autorZahlen, ladeAutorZahlen } from "@/lib/query/autoren";
import type { ReviewEintrag } from "@/lib/query/strains";

const quelle = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

const REVIEW: ReviewEintrag = {
  id: "r1",
  istRedaktionell: false,
  autorName: "Mia",
  gesamtnote: 4,
  aussehen: 4,
  geruch: 4,
  geschmack: 4,
  wirkung: 4,
  konsistenz: 4,
  feuchtigkeitProzent: null,
  geschmacksMatrix: null,
  terpenIntensitaet: null,
  beschaffenheit: null,
  notiz: null,
  instagramReelUrl: null,
  chargenNr: null,
  erstelltAm: new Date("2026-09-12T12:00:00Z"),
};

test("autorZahlen: je Autor die Anzahl, Zeilen ohne Autor fallen weg", () => {
  const karte = autorZahlen([
    { autorId: "a", anzahl: 7 },
    { autorId: null, anzahl: 3 },
    { autorId: "b", anzahl: 1 },
  ]);
  assert.deepEqual([...karte], [["a", 7], ["b", 1]]);
});

test("ladeAutorZahlen: ohne Autoren keine Abfrage", async () => {
  let aufrufe = 0;
  const karte = await ladeAutorZahlen([], async () => {
    aufrufe += 1;
    return [];
  });
  assert.equal(aufrufe, 0);
  assert.equal(karte.size, 0);
});

test("ladeAutorZahlen: jede Id nur einmal gefragt, Zahlen kommen zurück", async () => {
  let gefragt: readonly string[] = [];
  const karte = await ladeAutorZahlen(["a", "b", "a"], async (ids) => {
    gefragt = ids;
    return [{ autorId: "a", anzahl: 5 }];
  });
  assert.deepEqual(gefragt, ["a", "b"]);
  assert.equal(karte.get("a"), 5);
  assert.equal(karte.get("b"), undefined);
});

test("ladeAutorZahlen: scheitert die Abfrage, fehlt nur die Zahl und die Seite bleibt", async () => {
  const karte = await ladeAutorZahlen(["a"], async () => {
    throw new Error("D1 nicht erreichbar");
  });
  assert.equal(karte.size, 0);
});

test("alsEintrag reicht die Zahl der Bewertungen des Autors durch, ohne Zahl bleibt null", () => {
  const produkt = { handelsname: "Nebelharz 22 (fiktiv)", slug: "nebelharz-22" };
  assert.equal(alsEintrag({ ...REVIEW, autorBewertungen: 7 }, produkt).autorBewertungen, 7);
  assert.equal(alsEintrag(REVIEW, produkt).autorBewertungen, null);
  assert.equal(alsEintrag({ ...REVIEW, autorBewertungen: null }, produkt).autorBewertungen, null);
});

test("Abfrage: die Sortenabfrage lädt die Autor-Id, die Zahlen kommen getrennt, über alle Sorten und nur freigegeben", () => {
  const strains = quelle("lib/query/strains.ts");
  assert.match(strains, /istRedaktionell: true,\s*autorId: true,/);
  assert.match(strains, /await ladeAutorZahlen\(/);
  assert.match(strains, /autorBewertungen: review\.autorId \? \(autorZahlen\.get\(review\.autorId\) \?\? null\) : null,/);
  const autoren = quelle("lib/query/autoren.ts");
  assert.match(autoren, /by: \["autorId"\]/);
  assert.match(autoren, /freigegeben: true/);
  assert.doesNotMatch(autoren, /strainId/, "die Zahl zählt über alle Sorten");
});
