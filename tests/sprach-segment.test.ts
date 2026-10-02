import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const lies = (datei: string) => readFileSync(datei, "utf8");

// Spec 2026-10-01 (statische Seiten), 4.1 und 4.2.
test("Root-Layout liegt im internen Sprachsegment und liest die Sprache aus dem Pfad", () => {
  assert.equal(existsSync("app/layout.tsx"), false);
  assert.equal(existsSync("app/page.tsx"), false);
  const layout = lies("app/[lang]/layout.tsx");
  assert.match(layout, /from "next\/root-params"/);
  assert.match(layout, /if \(!istSprache\(await lang\(\)\)\) notFound\(\);/);
  assert.match(layout, /import "\.\.\/globals\.css";/);
  // Kein generateStaticParams: Next stufte sonst jede Seite als statisch ein (Spec 4.3).
  assert.doesNotMatch(layout, /generateStaticParams/);
});

test("holeSprache liest root-params, keine Cookies und Header", () => {
  const quelle = lies("lib/i18n/sprache.ts");
  assert.match(quelle, /from "next\/root-params"/);
  assert.doesNotMatch(quelle, /next\/headers|cookies\(|headers\(/);
});

test("Unbekannte Pfade enden im 404 der Sprache", () => {
  assert.match(lies("app/[lang]/[...rest]/page.tsx"), /notFound\(\);/);
  assert.equal(existsSync("app/[lang]/not-found.tsx"), true);
});

test("Proxy: erst Gate, dann Sprach-Rewrite; API ohne Rewrite", () => {
  const proxy = lies("proxy.ts");
  assert.match(proxy, /!istOhneGate\(pathname\)/);
  assert.match(proxy, /if \(istApiPfad\(pathname\)\) return NextResponse\.next\(\);/);
  assert.match(proxy, /acceptLanguage: request\.headers\.get\("accept-language"\)/);
  assert.match(proxy, /intern\.pathname = internerPfad\(sprache, pathname\);/);
  assert.match(proxy, /return NextResponse\.rewrite\(intern\);/);
  assert.ok(proxy.indexOf("istOhneGate(pathname)") < proxy.indexOf("NextResponse.rewrite(intern)"));
});

test("NavLink vergleicht ohne Sprachpräfix", () => {
  assert.match(
    lies("components/layout/NavLink.tsx"),
    /istAktiv\(ohneSprachPraefix\(usePathname\(\) \?\? ""\), href\)/,
  );
});
