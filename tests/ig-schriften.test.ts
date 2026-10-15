import { test } from "node:test";
import assert from "node:assert/strict";
import { cssLokal, htmlMitLokalenSchriften, htmlOffline, pngMasse } from "../scripts/ig-gemeinsam";

test("pngMasse liest Breite × Höhe aus dem Kopf", () => {
  const kopf = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(kopf);
  kopf.writeUInt32BE(1080, 16);
  kopf.writeUInt32BE(1300, 20);
  assert.equal(pngMasse(kopf), "1080×1300");
  assert.equal(pngMasse(Buffer.from("x")), null);
});

test("cssLokal: Data-URLs aus lokalen Dateien, null bei fehlender Datei", () => {
  const css = "src: url(./a.woff2) format('woff2'); src: url(./b.woff2);";
  const voll = cssLokal(css, () => Buffer.from("x"));
  assert.ok(voll?.includes("url(data:font/woff2;base64,eA==)"));
  assert.equal(cssLokal(css, (n) => (n === "a.woff2" ? Buffer.from("x") : undefined)), null);
});

test("Schriften kommen aus scripts/ig-schriften, ohne Netz", async () => {
  const echt = globalThis.fetch;
  globalThis.fetch = (() => {
    throw new Error("Netz verboten");
  }) as typeof fetch;
  try {
    for (const familie of ["family=Mr+Dafoe", "family=Mr+Dafoe&family=Newsreader:ital,opsz,wght@0,6..72,200;0,6..72,400;1,6..72,400"]) {
      const html = `<head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${familie}&display=block"></head>`;
      assert.ok(htmlMitLokalenSchriften(html)?.includes("data:font/woff2;base64,"));
      const aus = await htmlOffline(html);
      assert.ok(!aus.includes("googleapis") && !aus.includes("gstatic") && aus.includes("<style>"));
    }
  } finally {
    globalThis.fetch = echt;
  }
  assert.equal(htmlMitLokalenSchriften('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbekannt">'), null);
});
