import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { prepareDestination } from "next/dist/shared/lib/router/utils/prepare-destination";

import { ALTE_KATALOG_WEITERLEITUNGEN } from "@/lib/alte-adressen";

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
    return { ziel: parsedDestination.pathname + (suche ? `?${suche}` : ""), permanent: regel.permanent };
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

test("nur die alten Adressen werden umgeleitet", () => {
  assert.equal(weiterleiten("/blueten"), null);
  assert.equal(weiterleiten("/blueten/nebelharz-22"), null);
  assert.equal(weiterleiten("/produkte-archiv"), null);
  assert.equal(weiterleiten("/produkte/a/b"), null);
});

test("Ziel existiert als Route, die alte Route ist weg, next.config nutzt die Regeln", () => {
  const wurzel = process.cwd();
  assert.ok(existsSync(join(wurzel, "app/blueten/page.tsx")));
  assert.ok(existsSync(join(wurzel, "app/blueten/[slug]/page.tsx")));
  assert.ok(!existsSync(join(wurzel, "app/produkte")));
  const config = readFileSync(join(wurzel, "next.config.ts"), "utf8");
  assert.match(config, /redirects\(\)\s*\{\s*return \[\.\.\.ALTE_KATALOG_WEITERLEITUNGEN\]/);
});
