import { test } from "node:test";
import assert from "node:assert/strict";

import { ichStrain } from "@/lib/ich-strain";

const eingabe = { kultivarId: "k", vertreiberId: "v", strainId: "s" };
const basis = {
  ladeEigeneBewertung: async () => null,
  ladeLiveNetzBasis: async () => null,
  vorbelegungAus: (r: unknown) => r as never,
};

test("ohne Sitzung: gast", async () => {
  assert.deepEqual(await ichStrain({ ...basis, mitglied: async () => null }, eingabe), { zugang: "gast" });
});

test("ohne Freigabe: mitglied, keine Daten", async () => {
  const r = await ichStrain({ ...basis, mitglied: async () => ({ mitgliedId: "m", freigegeben: false, rolle: "MITGLIED" }) as never }, eingabe);
  assert.deepEqual(r, { zugang: "mitglied" });
});

test("freigegeben: Vorbelegung und Live-Netz, Fehler im Netz kostet nur das Netz", async () => {
  const r = await ichStrain(
    {
      ...basis,
      mitglied: async () => ({ mitgliedId: "m", freigegeben: true, rolle: "ADMIN" }) as never,
      ladeEigeneBewertung: async () => ({ id: "r" }) as never,
      ladeLiveNetzBasis: async () => {
        throw new Error("kaputt");
      },
    },
    eingabe,
  );
  assert.equal(r.zugang, "freigegeben");
  if (r.zugang !== "freigegeben") return;
  assert.equal(r.istBetreiber, true);
  assert.deepEqual(r.vorbelegung, { id: "r" });
  assert.equal(r.liveNetz, null);
});

test("ohne Vertreiber: jüngste eigene Bewertung der Sorte, gleich bei welchem Vertreiber", async () => {
  const gefragt: unknown[] = [];
  const r = await ichStrain(
    {
      ...basis,
      mitglied: async () => ({ mitgliedId: "m", freigegeben: true, rolle: "MITGLIED" }) as never,
      ladeEigeneBewertung: async (...args: unknown[]) => (gefragt.push(args), { id: "r", vertreiberId: "v7" }) as never,
    },
    { ...eingabe, vertreiberId: null },
  );
  assert.deepEqual(gefragt, [["m", "k", null]]);
  assert.equal(r.zugang === "freigegeben" && (r.vorbelegung as unknown as { vertreiberId: string }).vertreiberId, "v7");
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { readFileSync } from "node:fs";

import { holeIchStrain, ichStrainAdresse, useIchStrain } from "@/lib/ich-strain-client";

test("ichStrainAdresse: Vertreiber nur, wenn bekannt", () => {
  assert.equal(ichStrainAdresse({ kultivarId: "k", strainId: "s", vertreiberId: null }), "/api/ich/strain?kultivar=k&strain=s");
  assert.equal(ichStrainAdresse({ kultivarId: "k", strainId: "s", vertreiberId: "v" }), "/api/ich/strain?kultivar=k&strain=s&vertreiber=v");
});

test("holeIchStrain: beide Inseln teilen einen Abruf je Adresse, Fehler zählt als Gast", async () => {
  let abrufe = 0;
  const holen = async () => {
    abrufe++;
    return new Response(JSON.stringify({ zugang: "mitglied" }), { status: 200 });
  };
  const [a, b] = await Promise.all([holeIchStrain("/api/ich/strain?x=1", holen), holeIchStrain("/api/ich/strain?x=1", holen)]);
  assert.equal(abrufe, 1);
  assert.deepEqual(a, { zugang: "mitglied" });
  assert.deepEqual(b, { zugang: "mitglied" });
  const kaputt = await holeIchStrain("/api/ich/strain?x=2", async () => new Response("", { status: 500 }));
  assert.deepEqual(kaputt, { zugang: "gast" });
});

test("useIchStrain: ohne Effekt (Server, statische Datei) Gast, die Insel zeigt dann den Gastzustand", () => {
  // Die Insel selbst zieht das Formular samt Server-Aktionen, das lässt sich hier nicht laden: der Hook
  // trägt den Zustand, die Insel verzweigt nur darauf (Quelltextprüfung darunter).
  function Probe() {
    return createElement("p", null, useIchStrain({ kultivarId: "k", strainId: "s", vertreiberId: "v" }).zugang);
  }
  assert.equal(renderToStaticMarkup(createElement(Probe)), "<p>gast</p>");
  const insel = readFileSync("components/sorte/BewertenInsel.tsx", "utf8");
  assert.match(insel, /if \(ich\.zugang === "mitglied"\)\s*return \(\s*<>\s*\{kopfGast\}\s*\{nichtFreigegeben\}/);
  assert.match(insel, /if \(ich\.zugang !== "freigegeben"\)\s*return \(\s*<>\s*\{kopfGast\}\s*\{gast\}/);
});
