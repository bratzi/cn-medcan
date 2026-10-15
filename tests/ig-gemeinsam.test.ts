import { test } from "node:test";
import assert from "node:assert/strict";
import { browserPfad, cssMitDaten, entwurfMedien, feedSchluessel, istThemenMarke, linkDurchStil, markenAus, planZeit, pngOk, schriftUrls } from "../scripts/ig-gemeinsam";

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

test("Schriften offline: URLs finden, als Data-URL einsetzen, Link durch Stil ersetzen", () => {
  const css =
    "@font-face{src:url(https://fonts.gstatic.com/a.woff2) format('woff2')}@font-face{src:url(https://fonts.gstatic.com/a.woff2)}@font-face{src:url(https://fonts.gstatic.com/b.woff2)}";
  assert.deepEqual(schriftUrls(css), ["https://fonts.gstatic.com/a.woff2", "https://fonts.gstatic.com/b.woff2"]);
  const aus = cssMitDaten(
    css,
    new Map([
      ["https://fonts.gstatic.com/a.woff2", "QQ"],
      ["https://fonts.gstatic.com/b.woff2", "RR"],
    ]),
  );
  assert.ok(aus.includes("url(data:font/woff2;base64,QQ)") && aus.includes("url(data:font/woff2;base64,RR)"));
  assert.ok(!aus.includes("gstatic"));
  const html = '<head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mr+Dafoe&display=block"><title>x</title></head>';
  const neu = linkDurchStil(html, "a{b:c}");
  assert.ok(neu.includes("<style>a{b:c}</style>") && !neu.includes("googleapis"));
  assert.equal(linkDurchStil("<p>ohne</p>", "a{}"), "<p>ohne</p>");
});

test("pngOk: gültig, abgeschnitten, falsche Größe", () => {
  const png = (b: number, h: number, ende = true) => {
    const kopf = Buffer.alloc(33);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(kopf);
    kopf.writeUInt32BE(b, 16);
    kopf.writeUInt32BE(h, 20);
    return ende ? Buffer.concat([kopf, Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82])]) : kopf;
  };
  assert.equal(pngOk(png(1080, 1350), 1080, 1350), true);
  assert.equal(pngOk(png(1080, 1350, false), 1080, 1350), false);
  assert.equal(pngOk(png(1080, 1300), 1080, 1350), false);
  assert.equal(pngOk(Buffer.from("kein png"), 1, 1), false);
});

test("planZeit: jetzt = +3 Minuten, Vergangenes und Unsinn abgelehnt", () => {
  const t0 = new Date("2026-10-15T12:00:00.000Z");
  assert.equal(planZeit("jetzt", t0), "2026-10-15T12:03:00.000Z");
  assert.equal(planZeit("2026-10-16T16:00:00Z", t0), "2026-10-16T16:00:00.000Z");
  assert.throws(() => planZeit("2026-10-15T12:01:00Z", t0), /Zukunft/);
  assert.throws(() => planZeit("morgen", t0), /gültige/);
});
