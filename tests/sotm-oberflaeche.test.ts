import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { HAUPTNAVIGATION } from "@/lib/navigation";
import { ALTE_UMFRAGEN_WEITERLEITUNGEN } from "@/lib/alte-adressen";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

const lies = (datei: string) => readFileSync(datei, "utf8");

test("Seite /sotm existiert, /umfragen ist weg und leitet dauerhaft weiter", () => {
  assert.ok(existsSync("app/[lang]/sotm/page.tsx"));
  assert.ok(existsSync("app/[lang]/sotm/aktionen.ts"));
  assert.ok(!existsSync("app/[lang]/umfragen"));
  for (const regel of ALTE_UMFRAGEN_WEITERLEITUNGEN) {
    assert.equal(regel.destination, "/sotm");
    assert.equal(regel.permanent, true);
  }
});

test("Navigation nennt /sotm als SOTM", () => {
  assert.ok(HAUPTNAVIGATION.some((e) => e.href === "/sotm" && e.schluessel === "sotm"));
  assert.ok(!HAUPTNAVIGATION.some((e) => (e.href as string) === "/umfragen"));
  assert.equal(de.kopf.navigation.sotm, "SOTM");
  assert.equal(en.kopf.navigation.sotm, "SOTM");
});

test("Startseite zeigt SotmSektion statt Abstimmung und bleibt statisch", () => {
  const q = lies("app/[lang]/page.tsx");
  assert.match(q, /<SotmSektion \/>/);
  assert.doesNotMatch(q, /<Abstimmung \/>/);
  assert.match(q, /dynamic = "force-static"/);
  assert.ok(!existsSync("components/story/Abstimmung.tsx"));
});

test("Seite /sotm zeigt die Sektion groß und hat keine Suspense-Grenze", () => {
  const q = lies("app/[lang]/sotm/page.tsx");
  assert.match(q, /<SotmSektion ort="sotm">/);
  assert.doesNotMatch(q, /<Suspense\b/);
});

test("Admin: kein Phasen-Knopf, keine gesetzten Plätze, keine Anlegen-Aktion", () => {
  const steuerung = lies("components/admin/RundeSteuerung.tsx");
  assert.doesNotMatch(steuerung, /PhasenSchalter|GesetztenPlatzFormular/);
  assert.match(steuerung, /nach Kalender/);
  const aktionen = lies("app/[lang]/admin/umfrage-aktionen.ts");
  assert.doesNotMatch(aktionen, /phaseWeiterschalten|umfrageAnlegen|gesetztenPlatzVergeben/);
  assert.doesNotMatch(aktionen, /revalidiereSprachen\("\/umfragen"\)/);
  for (const weg of ["PhasenSchalter", "GesetztenPlatzFormular", "RundeAnlegenFormular"]) {
    assert.ok(!existsSync(`components/admin/${weg}.tsx`), weg);
  }
});

test("Kein Pfad /umfragen mehr in Quelltext und Revalidierung", () => {
  for (const datei of ["app/[lang]/sotm/aktionen.ts", "app/[lang]/admin/umfrage-aktionen.ts", "components/umfrage/UmfrageKarte.tsx", "lib/navigation.ts"]) {
    assert.doesNotMatch(lies(datei), /["'`]\/umfragen/, datei);
  }
});

test("Takt im Browser: ein POST bei vergangenem Phasenende, dann refresh", () => {
  const q = lies("components/sotm/SotmTaktImBrowser.tsx");
  assert.match(q, /^"use client"/);
  assert.match(q, /fetch\("\/api\/sotm\/takt", \{ method: "POST" \}\)/);
  assert.match(q, /Date\.parse\(phaseEndet\) > Date\.now\(\)/);
  assert.match(q, /router\.refresh\(\)/);
});

test("Sektion: Monat lang, Knopf nur bei aktiver Blüte, Rest-Texte aus sotmLage", () => {
  const q = lies("components/sotm/SotmSektion.tsx");
  assert.match(q, /month: "long", year: "numeric"/);
  assert.match(q, /sotm\.strain\.aktiv \?/);
  assert.match(q, /#bewerten/);
  assert.match(q, /sotmLage\(/);
  assert.match(q, /resttage\(/);
  assert.match(q, /w\.sotm\.keineVorschlaege/);
});

test("Texte de und en: gleiche Schlüssel, keine verbotenen Wörter", () => {
  const form = (o: unknown): unknown =>
    typeof o === "string" ? "s" : Object.fromEntries(Object.entries(o as object).map(([k, v]) => [k, form(v)]));
  assert.deepEqual(form(de.sotm), form(en.sotm));
  assert.equal(de.sotm.titel, "Strain of the Month");
  assert.equal(de.sotm.keiner, "Diesen Monat gibt es keinen Strain of the Month.");
  assert.equal(de.sotm.jetztBewerten, "Jetzt bewerten");
  assert.equal(de.sotm.keineVorschlaege, "Noch keine Vorschläge in dieser Runde.");
  assert.equal(en.sotm.keineVorschlaege, "No suggestions in this round yet.");
  assert.match(de.sotm.rest.vorschlag.other, /Vorschläge bis \{datum\}, noch \{anzahl\} Tage/);
  assert.match(de.sotm.rest.abstimmung.other, /Abstimmung bis \{datum\}, noch \{anzahl\} Tage/);
  const alle = JSON.stringify([de.sotm, en.sotm]);
  assert.doesNotMatch(alle, /Ware|Stärke|—|–/);
});
