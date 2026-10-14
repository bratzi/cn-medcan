import { test } from "node:test";
import assert from "node:assert/strict";
import { browserPfad, feedSchluessel, markenAus } from "../scripts/ig-gemeinsam";

test("Schlüssel aus IG_FEED_KEY oder IG_FEED_URL", () => {
  assert.equal(feedSchluessel({ IG_FEED_KEY: "a" }), "a");
  assert.equal(feedSchluessel({ IG_FEED_URL: "https://x.dev/api/ig-feed?key=b" }), "b");
  assert.throws(() => feedSchluessel({ IG_FEED_URL: "https://x.dev/api/ig-feed" }), /IG_FEED_KEY/);
});

test("Browser: Umgebung, Windows-Edge, Linux-Playwright, sonst Fehler", () => {
  assert.equal(browserPfad("linux", () => true, () => [], { IG_BROWSER: "/b" }), "/b");
  const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  assert.equal(browserPfad("win32", (p) => p === edge, () => [], {}), edge);
  assert.equal(
    browserPfad("linux", (p) => p.endsWith("/chrome"), () => ["chromium-1194", "chromium", "ffmpeg-1011"], {}),
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  );
  assert.throws(() => browserPfad("linux", () => false, () => [], {}), /kein Browser/);
});

test("Marken aus mediaUrls, robust ohne Feld", () => {
  const m = markenAus([
    { mediaUrls: ["https://b.s3.amazonaws.com/images/1792007422753-f7932866-c769.png"] },
    { mediaUrls: ["https://b.s3.amazonaws.com/images/1792-bot-thema-terpen-limonen.png"] },
    { mediaUrls: "kaputt" },
    {},
    null,
  ]);
  assert.deepEqual([...m].sort(), ["bot-thema-terpen-limonen", "f7932866-c769"]);
});
