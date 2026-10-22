import { test } from "node:test";
import assert from "node:assert/strict";

import { alteStrainAdresse, seitenDatei } from "@/lib/seiten-tor";

const q = (s = "") => new URLSearchParams(s);

test("seitenDatei: feste Leseseiten", () => {
  assert.equal(seitenDatei("de", "/", q()), "/_seiten/de/index.html");
  assert.equal(seitenDatei("en", "/blueten", q("typ=INDICA")), "/_seiten/en/blueten/index.html");
  assert.equal(seitenDatei("de", "/jury/seite/2", q()), "/_seiten/de/jury/seite/2/index.html");
  assert.equal(seitenDatei("de", "/neu", q("f=4")), "/_seiten/de/neu/index.html");
});

test("seitenDatei: eine Datei je Strain, Query wählt nichts", () => {
  assert.equal(seitenDatei("de", "/blueten/mac-1", q()), "/_seiten/de/blueten/mac-1/index.html");
  assert.equal(seitenDatei("de", "/blueten/mac-1", q("ware=irgendwas")), "/_seiten/de/blueten/mac-1/index.html");
  assert.equal(seitenDatei("en", "/blueten/mac-1/", q()), "/_seiten/en/blueten/mac-1/index.html");
});

test("seitenDatei: unbrauchbare Werte ergeben null", () => {
  assert.equal(seitenDatei("de", "/blueten/%E0%A4%A", q()), null);
  assert.equal(seitenDatei("de", "/blueten/a/b", q()), null);
  assert.equal(seitenDatei("de", "/admin", q()), null);
  assert.equal(seitenDatei("de", "/api/katalog", q()), null);
  assert.equal(seitenDatei("de", "/blueten/", q()), "/_seiten/de/blueten/index.html");
});

test("alteStrainAdresse: Varianten-Segment und ?vertreiber= auf die eine Seite", () => {
  assert.equal(alteStrainAdresse("/blueten/mac-1/standard", q()), "/blueten/mac-1");
  assert.equal(alteStrainAdresse("/blueten/mac-1/v-da73-alle", q()), "/blueten/mac-1");
  assert.equal(alteStrainAdresse("/blueten/mac-1", q("vertreiber=da73")), "/blueten/mac-1");
  assert.equal(alteStrainAdresse("/blueten/mac-1", q("vertreiber=da73&alle=1&ware=x")), "/blueten/mac-1?ware=x");
  assert.equal(alteStrainAdresse("/blueten/mac-1", q("alle=1")), "/blueten/mac-1");
});

test("alteStrainAdresse: alles andere bleibt", () => {
  assert.equal(alteStrainAdresse("/blueten/mac-1", q()), null);
  assert.equal(alteStrainAdresse("/blueten/mac-1", q("ware=x")), null);
  assert.equal(alteStrainAdresse("/blueten/mac-1/quatsch", q()), null);
  assert.equal(alteStrainAdresse("/blueten", q("vertreiber=x")), null);
  assert.equal(alteStrainAdresse("/admin/x/standard", q()), null);
});
