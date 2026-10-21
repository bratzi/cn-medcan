import { test } from "node:test";
import assert from "node:assert/strict";

import { auswahlSegment, seitenDatei } from "@/lib/seiten-tor";

const q = (s = "") => new URLSearchParams(s);

test("auswahlSegment: Standard, Vertreiber, alle", () => {
  assert.equal(auswahlSegment(null, false), "standard");
  assert.equal(auswahlSegment("abc", false), "v-abc");
  assert.equal(auswahlSegment("abc", true), "v-abc-alle");
  assert.equal(auswahlSegment(null, true), "standard");
});

test("seitenDatei: feste Leseseiten", () => {
  assert.equal(seitenDatei("de", "/", q()), "/_seiten/de/index.html");
  assert.equal(seitenDatei("en", "/blueten", q("typ=INDICA")), "/_seiten/en/blueten/index.html");
  assert.equal(seitenDatei("de", "/jury/seite/2", q()), "/_seiten/de/jury/seite/2/index.html");
  assert.equal(seitenDatei("de", "/neu", q("f=4")), "/_seiten/de/neu/index.html");
});

test("seitenDatei: Strain mit Auswahl", () => {
  assert.equal(seitenDatei("de", "/blueten/mac-1", q()), "/_seiten/de/blueten/mac-1/standard.html");
  assert.equal(seitenDatei("de", "/blueten/mac-1", q("vertreiber=da73")), "/_seiten/de/blueten/mac-1/v-da73.html");
  assert.equal(seitenDatei("de", "/blueten/mac-1", q("vertreiber=da73&alle=1")), "/_seiten/de/blueten/mac-1/v-da73-alle.html");
});

test("seitenDatei: unbrauchbare Werte fallen auf Standard oder null", () => {
  assert.equal(seitenDatei("de", "/blueten/mac-1", q("vertreiber=../x")), "/_seiten/de/blueten/mac-1/standard.html");
  assert.equal(seitenDatei("de", "/blueten/mac-1", q("ware=irgendwas")), "/_seiten/de/blueten/mac-1/standard.html");
  assert.equal(seitenDatei("de", "/blueten/%E0%A4%A", q()), null);
  assert.equal(seitenDatei("de", "/blueten/a/b", q()), null);
  assert.equal(seitenDatei("de", "/admin", q()), null);
  assert.equal(seitenDatei("de", "/api/katalog", q()), null);
  assert.equal(seitenDatei("de", "/blueten/", q()), "/_seiten/de/blueten/index.html");
});
