import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/sprache/route";

const ANFRAGE = (kopf: Record<string, string>) =>
  new NextRequest("https://example.test/api/sprache", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...kopf },
    body: "sprache=en",
  });

test("Sprach-POST: cross-site wird mit 403 abgewiesen", async () => {
  const antwort = await POST(ANFRAGE({ "sec-fetch-site": "cross-site" }));
  assert.equal(antwort.status, 403);
  assert.equal(antwort.headers.get("set-cookie"), null);
});

test("Sprach-POST: fremder Origin wird mit 403 abgewiesen", async () => {
  const antwort = await POST(ANFRAGE({ origin: "https://boese.test" }));
  assert.equal(antwort.status, 403);
});

test("Sprach-POST: eigener Origin und fehlende Header gehen durch", async () => {
  const kopfe: Record<string, string>[] = [{ origin: "https://example.test", "sec-fetch-site": "same-origin" }, {}];
  for (const kopf of kopfe) {
    const antwort = await POST(ANFRAGE(kopf));
    assert.equal(antwort.status, 303);
    assert.match(antwort.headers.get("set-cookie") ?? "", /en/);
  }
});
