import { test } from "node:test";
import assert from "node:assert/strict";

import { tokenErzeugen } from "@/lib/gate";
import { tor } from "@/lib/tor";

const SECRET = "s".repeat(32);
function env(dateien: Record<string, string>) {
  return {
    SITE_PASSWORD: "pw",
    SITE_SESSION_SECRET: SECRET,
    ASSETS: {
      async fetch(r: Request | string) {
        const pfad = new URL(typeof r === "string" ? r : r.url).pathname;
        return pfad in dateien ? new Response(dateien[pfad], { status: 200 }) : new Response("nf", { status: 404 });
      },
    },
  };
}
async function mitGate(url: string, extra: Record<string, string> = {}) {
  const token = await tokenErzeugen(SECRET, "besucher");
  return new Request(url, { headers: { cookie: `cn_gate=${token}`, ...extra } });
}

test("ohne Gate-Cookie: Umleitung auf /zugang, auch für /_seiten", async () => {
  for (const pfad of ["/blueten/mac-1", "/_seiten/de/blueten/mac-1/index.html"]) {
    const antwort = await tor(new Request(`https://x.dev${pfad}`), env({}));
    assert.equal(antwort?.status, 307);
    assert.match(antwort!.headers.get("location")!, /\/zugang\?weiter=/);
  }
});

test("mit Gate: liefert die Datei des Strains als HTML", async () => {
  const antwort = await tor(await mitGate("https://x.dev/blueten/mac-1"), env({ "/_seiten/de/blueten/mac-1/index.html": "<p>v1</p>" }));
  assert.equal(antwort?.status, 200);
  assert.equal(await antwort!.text(), "<p>v1</p>");
  assert.match(antwort!.headers.get("content-type")!, /text\/html/);
});

test("alte Varianten-Adressen: 308 auf die eine Strain-Seite, ohne Asset-Abruf", async () => {
  for (const [von, nach] of [
    ["/blueten/mac-1?vertreiber=v1&alle=1", "/blueten/mac-1"],
    ["/blueten/mac-1/v-v1", "/blueten/mac-1"],
    ["/blueten/mac-1?vertreiber=v1&ware=x", "/blueten/mac-1?ware=x"],
  ]) {
    const antwort = await tor(new Request(`https://x.dev${von}`), env({}));
    assert.equal(antwort?.status, 308);
    assert.equal(antwort!.headers.get("location"), `https://x.dev${nach}`);
  }
});

test("RSC-Anfrage bekommt HTML (Next navigiert dann hart)", async () => {
  const antwort = await tor(await mitGate("https://x.dev/blueten/mac-1?_rsc=abc", { RSC: "1" }), env({ "/_seiten/de/blueten/mac-1/index.html": "<p>s</p>" }));
  assert.match(antwort!.headers.get("content-type")!, /text\/html/);
});

test("fehlende Datei, Admin, API: an Next (null)", async () => {
  assert.equal(await tor(await mitGate("https://x.dev/blueten/neu-da"), env({})), null);
  assert.equal(await tor(await mitGate("https://x.dev/admin"), env({})), null);
  assert.equal(await tor(await mitGate("https://x.dev/api/katalog"), env({})), null);
});

test("/_seiten direkt mit Gate: 404, nie Durchgriff", async () => {
  const antwort = await tor(await mitGate("https://x.dev/_seiten/de/index.html"), env({ "/_seiten/de/index.html": "x" }));
  assert.equal(antwort?.status, 404);
});

test("Insel ohne Sitzungscookie: gast ohne Next", async () => {
  const antwort = await tor(await mitGate("https://x.dev/api/ich/strain?kultivar=k&vertreiber=v"), env({}));
  assert.deepEqual(await antwort!.json(), { zugang: "gast" });
  assert.equal(antwort!.headers.get("cache-control"), "private, no-store");
});

test("Sprache aus Cookie", async () => {
  const antwort = await tor(await mitGate("https://x.dev/", { cookie: `cn_gate=${await tokenErzeugen(SECRET, "besucher")}; sprache=en` }), env({ "/_seiten/en/index.html": "en" }));
  assert.equal(await antwort!.text(), "en");
});

test("Asset-Antwort 307 (Cloudflare html_handling): Rückfall an Next mit strukturierter Warnung", async () => {
  const warnungen: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => void warnungen.push(args.join(" "));
  try {
    const e = {
      ...env({}),
      ASSETS: { fetch: async () => new Response(null, { status: 307, headers: { Location: "/x/" } }) },
    };
    assert.equal(await tor(await mitGate("https://x.dev/blueten/mac-1"), e), null);
  } finally {
    console.warn = original;
  }
  assert.equal(warnungen.length, 1);
  assert.deepEqual(JSON.parse(warnungen[0]), { tor: "asset", status: 307, datei: "/_seiten/de/blueten/mac-1/index.html" });
});

test("Asset-Antwort 404: Rückfall an Next ohne Warnung", async () => {
  const warnungen: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => void warnungen.push(args.join(" "));
  try {
    assert.equal(await tor(await mitGate("https://x.dev/blueten/neu-da"), env({})), null);
  } finally {
    console.warn = original;
  }
  assert.equal(warnungen.length, 0);
});

test("Abrufpfad ist exakt der Dateipfad (html_handling none)", async () => {
  const abgerufen: string[] = [];
  const e = {
    ...env({}),
    ASSETS: { fetch: async (r: Request | string) => (abgerufen.push(new URL(typeof r === "string" ? r : r.url).pathname), new Response("x")) },
  };
  await tor(await mitGate("https://x.dev/jury/seite/2"), e);
  await tor(await mitGate("https://x.dev/blueten/mac-1?ware=x"), e);
  assert.deepEqual(abgerufen, ["/_seiten/de/jury/seite/2/index.html", "/_seiten/de/blueten/mac-1/index.html"]);
});

test("wrangler.jsonc: assets mit html_handling none, sonst 307 auf .html-Pfade", async () => {
  const { readFileSync } = await import("node:fs");
  const wrangler = readFileSync("wrangler.jsonc", "utf8");
  assert.match(wrangler, /"assets":\s*\{[^}]*"html_handling":\s*"none"[^}]*\}/);
  assert.match(wrangler, /"run_worker_first":\s*\["\/_seiten\/\*"\]/);
});
