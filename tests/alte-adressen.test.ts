import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { prepareDestination } from "next/dist/shared/lib/router/utils/prepare-destination";

import { ALTE_KATALOG_WEITERLEITUNGEN, bewertenWeiterleitung } from "@/lib/alte-adressen";

/** Spielt die Redirect-Regeln so durch, wie Next sie auswertet. */
function weiterleiten(pfad: string, query: Record<string, string> = {}) {
  for (const regel of ALTE_KATALOG_WEITERLEITUNGEN) {
    const params = getPathMatch(regel.source)(pfad);
    if (params === false) continue;
    const { parsedDestination } = prepareDestination({
      appendParamsToQuery: false,
      destination: regel.destination,
      params,
      query,
    });
    const suche = new URLSearchParams(parsedDestination.query as Record<string, string>).toString();
    const ziel = parsedDestination.pathname + (suche ? `?${suche}` : "") + (parsedDestination.hash ?? "");
    return { ziel, permanent: regel.permanent };
  }
  return null;
}

test("/produkte leitet dauerhaft auf /blueten, Query bleibt erhalten", () => {
  assert.deepEqual(weiterleiten("/produkte"), { ziel: "/blueten", permanent: true });
  assert.deepEqual(weiterleiten("/produkte", { typ: "INDICA", seite: "2" }), {
    ziel: "/blueten?typ=INDICA&seite=2",
    permanent: true,
  });
});

test("/produkte/:slug leitet dauerhaft auf /blueten/:slug", () => {
  assert.deepEqual(weiterleiten("/produkte/nebelharz-22"), { ziel: "/blueten/nebelharz-22", permanent: true });
  assert.deepEqual(weiterleiten("/produkte/nebelharz-22", { a: "1" }), {
    ziel: "/blueten/nebelharz-22?a=1",
    permanent: true,
  });
});

test("/bewerten/:slug: Query steht vor dem Fragment, dauerhaft", () => {
  assert.deepEqual(bewertenWeiterleitung("/bewerten/nebelharz-22", ""), "/blueten/nebelharz-22#bewerten");
  assert.deepEqual(bewertenWeiterleitung("/bewerten/apples-bananas", "?a=1"), "/blueten/apples-bananas?a=1#bewerten");
  assert.equal(bewertenWeiterleitung("/bewerten/a/b", ""), null);
  assert.equal(bewertenWeiterleitung("/blueten/a", ""), null);
});

test("config-Redirects tragen kein Fragment: OpenNext haengt die Query hinter den fertigen Zielstring", () => {
  for (const regel of ALTE_KATALOG_WEITERLEITUNGEN) assert.ok(!regel.destination.includes("#"), regel.source);
  assert.equal(weiterleiten("/bewerten/nebelharz-22"), null);
});

test("nur die alten Adressen werden umgeleitet", () => {
  assert.equal(weiterleiten("/blueten"), null);
  assert.equal(weiterleiten("/blueten/nebelharz-22"), null);
  assert.equal(weiterleiten("/produkte-archiv"), null);
  assert.equal(weiterleiten("/produkte/a/b"), null);
});

test("Ziel existiert als Route, die alte Route ist weg, next.config nutzt die Regeln", () => {
  const wurzel = process.cwd();
  assert.ok(existsSync(join(wurzel, "app/[lang]/blueten/page.tsx")));
  assert.ok(existsSync(join(wurzel, "app/[lang]/blueten/[slug]/page.tsx")));
  assert.ok(!existsSync(join(wurzel, "app/[lang]/produkte")));
  assert.ok(!existsSync(join(wurzel, "app/[lang]/bewerten")));
  assert.ok(existsSync(join(wurzel, "app/[lang]/blueten/[slug]/aktionen.ts")));
  const config = readFileSync(join(wurzel, "next.config.ts"), "utf8");
  assert.match(config, /redirects\(\)\s*\{\s*return \[\.\.\.ALTE_KATALOG_WEITERLEITUNGEN\]/);
});
