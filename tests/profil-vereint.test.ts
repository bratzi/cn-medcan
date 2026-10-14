import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { ALTE_KONTO_WEITERLEITUNGEN } from "@/lib/alte-adressen";

const lies = (p: string) => readFileSync(p, "utf8");
const seite = () => lies("app/[lang]/profil/page.tsx");
const profilReihen = () => lies("app/[lang]/profil/profil-reihen.tsx");
const kontoReihen = () => lies("app/[lang]/profil/konto-reihen.tsx");

test("/profil: keine Reiter, Profilkopf, alle Reihen in fester Reihenfolge", () => {
  const q = seite();
  assert.doesNotMatch(q, /ProfilReiter|ProfilRahmen|ProfilSeitenleiste|ansichtAus|\?ansicht=/);
  const reihe = ["<ProfilKopf", "<ReiheGeschmack", "<ReiheVerlauf", "<ReiheRegister", "<ReiheAehnliches", "<ReiheVertreiber", "<ReiheMitbestimmen", "<ReiheStimmen", "<ReiheNachrichten", "<ReiheEinstellungen"].map((s) => q.indexOf(s));
  assert.ok(reihe.every((i) => i > 0), JSON.stringify(reihe));
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  assert.match(q, /redirect\("\/anmelden\?weiter=%2Fprofil"\)/);
  assert.match(q, /index: false/);
});

test("/profil: Boxen mit eindeutigen Ids und den Sprungzielen des Profilkopfs", () => {
  const alle = profilReihen() + kontoReihen();
  // "netz" steht zweimal (Leer- und Vollzweig von ReiheGeschmack/ReiheNetz), rendert aber nur einmal.
  for (const id of ["topflop", "aktivitaet", "verteilung", "bewertungen", "aehnliches", "vertreiber", "schnitte", "community", "umfrage", "meine-vorschlaege", "stimmen", "nachrichten", "status", "einstellungen"]) {
    assert.equal((alle.match(new RegExp(`id="${id}"`, "g")) ?? []).length, 1, id);
  }
  assert.doesNotMatch(alle, /id="vorschlaege"/);
});

test("/profil: eine Primäraktion, der Stimmzettel ist hier sekundär (Review Focus)", () => {
  assert.match(kontoReihen(), /<UmfrageJetzt[\s\S]*?aktion="secondary"/);
  assert.doesNotMatch(seite() + profilReihen() + kontoReihen(), /buttonKlassen\("primary"/);
  assert.match(lies("components/mitglied/UmfrageJetzt.tsx"), /buttonKlassen\(aktion\)/);
});

test("/profil: Teilfehler werden geloggt, Redirects gehen durch (Review Focus)", () => {
  const q = lies("app/[lang]/profil/laden.ts");
  assert.match(q, /unstable_rethrow\(fehler\)/);
  assert.match(q, /console\.error\(`\$\{name\} fehlgeschlagen`, fehler\)/);
  for (const f of ["benachrichtigungenLaden", "eigeneVorschlaege", "ladeStimmen", "stimmZahlen", "aktiveUmfrage", "aktuellesProfil", "ladeAuswertungsZeilen"]) assert.match(q, new RegExp(`${f}\\(`), f);
});

test("/profil: Konto-Boxen tragen Formulare, Abmelden und die Verwaltung nur für Admins", () => {
  const q = kontoReihen();
  for (const s of ["<ProfilFormular", "<AvatarFormular", "<ProfilSichtbarkeit", "<AbmeldeButton", "<GelesenMarkieren ids={ungelesen} />", "<MeineStimmen", "<UmfrageJetzt"]) assert.ok(q.includes(s), s);
  assert.match(q, /rolle === "ADMIN"/);
  assert.match(q, /href="\/admin"/);
});

test("Alte Adressen: /mitglied leitet dauerhaft auf /profil (Review Focus)", () => {
  assert.deepEqual([...ALTE_KONTO_WEITERLEITUNGEN], [{ source: "/mitglied", destination: "/profil", permanent: true }]);
  assert.match(lies("next.config.ts"), /\.\.\.ALTE_KONTO_WEITERLEITUNGEN/);
  assert.equal(existsSync("app/[lang]/mitglied/page.tsx"), false);
});

test("Register-Links ohne ansicht, Sprungziel bleibt die Überschrift (Review Focus)", () => {
  const q = lies("components/profil/BewertungsRegister.tsx");
  assert.doesNotMatch(q, /ansicht: "bewertungen"|ansicht=/);
  assert.match(q, /#bewertungen-titel/);
});

test("Kein Link im Code zeigt mehr auf /mitglied", () => {
  for (const p of ["app/[lang]/admin/vorschlag-aktionen.ts", "components/vorschlag/BlueteVorschlagFormular.tsx", "app/[lang]/blueten/[slug]/aktionen.ts", "app/[lang]/mitglied/aktionen.ts", "app/[lang]/vorschlagen/aktionen.ts"]) {
    assert.doesNotMatch(lies(p), /"\/mitglied"/, p);
  }
});
