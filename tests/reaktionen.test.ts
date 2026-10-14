import { test } from "node:test";
import assert from "node:assert/strict";
import { kommentarZaehlerZiele, zaehlerUpsert, raeumeZielAb, istDoppelt, zaehlerLikesNeu } from "@/lib/reaktionen";

function attrappe() {
  const rufe: Array<[string, string, unknown]> = [];
  const modell = (name: string) => new Proxy({}, { get: (_t, op: string) => (arg: unknown) => (rufe.push([name, op, arg]), Promise.resolve()) });
  return { rufe, prisma: { like: modell("like"), kommentar: modell("kommentar"), zaehler: modell("zaehler") } as never };
}

test("Kommentar an Bewertung zählt bei Bewertung und Blüte, an Profil beim Mitglied", () => {
  assert.deepEqual(kommentarZaehlerZiele("BEWERTUNG", "r1", "k1"), [{ art: "BEWERTUNG", id: "r1" }, { art: "BLUETE", id: "k1" }]);
  assert.deepEqual(kommentarZaehlerZiele("BEWERTUNG", "r1", null), [{ art: "BEWERTUNG", id: "r1" }]);
  assert.deepEqual(kommentarZaehlerZiele("PROFIL", "m1", "egal"), [{ art: "MITGLIED", id: "m1" }]);
});

test("Zähler: +1 legt an, -1 senkt nur über 0", () => {
  const { rufe, prisma } = attrappe();
  zaehlerUpsert(prisma, "BEWERTUNG", "r1", "likes", 1);
  zaehlerUpsert(prisma, "BEWERTUNG", "r1", "likes", -1);
  assert.equal(rufe[0][1], "upsert");
  assert.deepEqual((rufe[0][2] as { create: unknown }).create, { zielArt: "BEWERTUNG", zielId: "r1", likes: 1 });
  assert.equal(rufe[1][1], "updateMany");
  assert.deepEqual((rufe[1][2] as { where: unknown }).where, { zielArt: "BEWERTUNG", zielId: "r1", likes: { gt: 0 } });
});

test("Abräumen löscht Likes, Kommentare und Zähler des Ziels", () => {
  const { rufe, prisma } = attrappe();
  raeumeZielAb(prisma, "BEWERTUNG", "r1");
  assert.deepEqual(rufe.map((r) => r[0] + "." + r[1]), ["like.deleteMany", "kommentar.deleteMany", "zaehler.deleteMany"]);
  raeumeZielAb(prisma, "MITGLIED", "m1");
  assert.deepEqual((rufe[4][2] as { where: unknown }).where, { zielArt: "PROFIL", zielId: "m1" });
});

test("zaehlerLikesNeu zählt per $executeRaw mit Parametern neu", () => {
  const aufrufe: unknown[][] = [];
  const prisma = { $executeRaw: (...a: unknown[]) => (aufrufe.push(a), Promise.resolve(1)) } as never;
  zaehlerLikesNeu(prisma, "BEWERTUNG", "r1");
  assert.equal(aufrufe.length, 1);
  const [teile, ...werte] = aufrufe[0] as [string[], ...unknown[]];
  assert.deepEqual(werte, ["BEWERTUNG", "r1", "BEWERTUNG", "r1"]);
  assert.match(teile.join("?"), /COUNT\(\*\) FROM "likes".*ON CONFLICT.*DO UPDATE SET "likes" = excluded\."likes"/);
});

test("P2002 gilt als doppelt", () => {
  assert.equal(istDoppelt({ code: "P2002" }), true);
  assert.equal(istDoppelt(new Error("x")), false);
});
