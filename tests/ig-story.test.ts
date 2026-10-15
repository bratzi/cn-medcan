import assert from "node:assert/strict";
import test from "node:test";

import { storyFuer, storyHtml, storyMarke, storyVideoArgumente } from "../scripts/ig-gemeinsam";

test("storyMarke: Feed-Marke wird zu bot-story-…", () => {
  assert.equal(storyMarke("bot-reel-aroma-karte"), "bot-story-reel-aroma-karte");
  assert.equal(storyMarke("bot-k-wissen-myrcen"), "bot-story-k-wissen-myrcen");
  assert.throws(() => storyMarke("abc"));
});

test("storyFuer: findet den Story-Entwurf zum Feed-Post", () => {
  const posts = [
    { postGroupId: "a1", status: "draft", mediaUrls: ["https://x/images/1700-bot-k-wissen-myrcen-1.png", "https://x/images/1700-bot-k-wissen-myrcen-2.png"] },
    { postGroupId: "s1", status: "draft", mediaUrls: ["https://x/videos/1701-bot-story-k-wissen-myrcen.mp4"] },
    { postGroupId: "s2", status: "scheduled", mediaUrls: ["https://x/videos/1702-bot-story-reel-alt.mp4"] },
  ];
  assert.equal(storyFuer(posts, "a1"), "s1");
  assert.equal(storyFuer(posts, "s1"), null, "eine Story hat keine Story");
  assert.equal(storyFuer(posts, "zz"), null);
});

test("storyVideoArgumente: Bild mittig auf 1080×1920, 6 s, H.264", () => {
  const a = storyVideoArgumente("in.png", "out.mp4");
  assert.ok(a.includes("in.png") && a.at(-1) === "out.mp4");
  assert.ok(a.join(" ").includes("1080:1920"));
  // Remotions ffmpeg hat kein pad-Filter.
  assert.ok(!a.join(" ").includes("pad="));
  assert.ok(a.includes("libx264") && a.includes("yuv420p"));
  assert.equal(a[a.indexOf("-t") + 1], "6");
});

test("storyHtml: Bild auf 1080×1920 dunklem Grund", () => {
  const h = storyHtml("file:///x.png");
  assert.ok(h.includes("1920px") && h.includes("file:///x.png") && h.includes("#0d1210"));
});
