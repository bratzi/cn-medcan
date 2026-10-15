import { test } from "node:test";
import assert from "node:assert/strict";
import { browserPfad, entwurfMedien, feedSchluessel, istThemenMarke, markenAus } from "../scripts/ig-gemeinsam";

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
test("Themen-Marken: Themenkarte und Karussell zählen, Bewertungen nicht", () => {
  assert.equal(istThemenMarke("bot-thema-terpen-limonen"), true);
  assert.equal(istThemenMarke("bot-k-wissen-myrcen"), true);
  assert.equal(istThemenMarke("f7932866-c769"), false);
});

test("entwurfMedien: Fehler nach create-post nennt den halben Entwurf", async () => {
  const echt = globalThis.fetch;
  process.env.PUBLORA_API_KEY = "x";
  process.env.INSTAGRAM_PLATFORM_ID = "instagram-1";
  const antwort = (daten: unknown, status = 200) => new Response(JSON.stringify(daten), { status });
  globalThis.fetch = (async (url: string | URL | Request) => {
    const u = String(url);
    if (u.endsWith("/create-post")) return antwort({ postGroupId: "pg1" });
    if (u.endsWith("/get-upload-url")) return antwort({ error: "kaputt" }, 500);
    return antwort({});
  }) as typeof fetch;
  try {
    await assert.rejects(
      entwurfMedien("c", [{ pfad: "x.png", name: "x.png", typ: "image/png" }]),
      /get-upload-url.*\(Entwurf pg1 unvollständig, in Publora löschen\)/,
    );
  } finally {
    globalThis.fetch = echt;
  }
});

test("markenAus: Karussell-Slides ergeben eine Marke, Videos zählen mit", () => {
  const posts = [
    { mediaUrls: ["https://c.dev/images/171-bot-k-wissen-terpene-1.png", "https://c.dev/images/171-bot-k-wissen-terpene-2.png"] },
    { mediaUrls: ["https://c.dev/videos/172-bot-reel-schema.mp4"] },
    { mediaUrls: ["https://c.dev/images/173-abc123.png"] },
  ];
  assert.deepEqual([...markenAus(posts)].sort(), ["abc123", "bot-k-wissen-terpene", "bot-reel-schema"]);
});
