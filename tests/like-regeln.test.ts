import { test } from "node:test";
import assert from "node:assert/strict";
import { likeErlaubt } from "@/lib/like-regeln";

const basis = { art: "BEWERTUNG" as const, zielId: "r1", ichId: "m1", zielAutorId: "m2", oeffentlich: true };

test("fremde, öffentliche Bewertung darf geliket werden", () => assert.equal(likeErlaubt(basis), "ok"));
test("eigene Bewertung nicht", () => assert.equal(likeErlaubt({ ...basis, zielAutorId: "m1" }), "selbst"));
test("sich selbst folgen nicht", () => assert.equal(likeErlaubt({ ...basis, art: "MITGLIED", zielId: "m1", zielAutorId: "m1" }), "selbst"));
test("unfreigegebene Bewertung oder privates Profil gilt als weg", () => assert.equal(likeErlaubt({ ...basis, oeffentlich: false }), "weg"));
test("vorhandenes Like lässt sich auch bei nicht öffentlichem Ziel zurücknehmen", () => assert.equal(likeErlaubt({ ...basis, oeffentlich: false, vorhanden: true }), "ok"));
test("neues Like auf nicht öffentliches Ziel bleibt weg", () => assert.equal(likeErlaubt({ ...basis, oeffentlich: false, vorhanden: false }), "weg"));
test("Blüte hat keinen Autor", () => assert.equal(likeErlaubt({ ...basis, art: "BLUETE", zielAutorId: null }), "ok"));
