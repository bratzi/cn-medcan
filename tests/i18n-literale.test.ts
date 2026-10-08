import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Waechter gegen deutsche Oberflaechentexte in bereits umgestellten Dateien
 * (Spec Englisch 8). Jede Welle traegt ihre Dateien in UMGESTELLT ein.
 * Kommentare zaehlen nicht; Eigennamen stehen in ERLAUBT.
 */
const UMGESTELLT: string[] = [
  "app/[lang]/layout.tsx",
  "components/layout/SprachSchalter.tsx",
  // Welle 1: Rahmen
  "lib/navigation.ts",
  "components/layout/Kopf.tsx",
  "components/layout/Fuss.tsx",
  "components/layout/KontoZaehler.tsx",
  "components/layout/ThemaSchalter.tsx",
  "app/[lang]/not-found.tsx",
  "app/[lang]/anmelden/page.tsx",
  "app/[lang]/registrieren/page.tsx",
  "components/auth/AnmeldeFormular.tsx",
  "components/auth/RegistrierFormular.tsx",
  "components/auth/AbmeldeButton.tsx",
  "components/auth/fehlertexte.ts",
  "app/[lang]/zugang/page.tsx",
  "components/zugang/ZugangFelder.tsx",
  // Welle 2: Katalog und Aroma-Baum
  "app/[lang]/blueten/page.tsx",
  "app/[lang]/blueten/[slug]/page.tsx",
  "components/produkt/FilterLeiste.tsx",
  "components/produkt/AktiveFilter.tsx",
  "components/produkt/ProduktCard.tsx",
  "components/produkt/Titelblatt.tsx",
  "components/produkt/TerpenChips.tsx",
  "components/produkt/CannabinoidBar.tsx",
  "lib/labels.ts",
  "components/review/AromaErkundung.tsx",
  "components/review/FazitLauf.tsx",
  "components/review/AromaKarte.tsx",
  "components/review/SortenKopf.tsx",
  "components/review/GesamteindruckLeiste.tsx",
  "components/review/BeschaffenheitsLeiste.tsx",
  "components/review/Aufklaerung.tsx",
  // T7: Buch zum Blättern (CommunityStimmen ging darin auf).
  "components/review/Buch.tsx",
  "components/rangliste/Ranglisten.tsx",
  "components/rangliste/RanglistenKarte.tsx",
  "components/review/BewertungsBuch.tsx",
  "components/review/BlattAnzeige.tsx",
  "components/medien/SchalterSymbole.tsx",
  "lib/buch.ts",
  "components/review/BlattUrteil.tsx",
  "components/review/NotenLeiste.tsx",
  "components/review/BuchKolophon.tsx",
  "components/review/BuchDoppelseite.tsx",
  "components/review/BuchNotiz.tsx",
  "components/review/BuchBildfeld.tsx",
  "components/review/BuchReiter.tsx",
  "components/review/erkundung-daten.ts",
  // Welle 3: Reviews und Bewerten
  "app/[lang]/reviews/page.tsx",
  "app/[lang]/blueten/[slug]/aktionen.ts",
  "app/[lang]/blueten/[slug]/bewertungsbild-aktionen.ts",
  "lib/bewertung-eingabe.ts",
  "components/review/BewertungsFormular.tsx",
  "components/review/BewertungsBilder.tsx",
  "components/review/BlattNote.tsx",
  "components/produkt/InstagramEmbed.tsx",
  "components/produkt/ReelNachKlick.tsx",
  // Welle 4a: Umfragen
  "app/[lang]/umfragen/page.tsx",
  "app/[lang]/umfragen/aktionen.ts",
  "components/umfrage/UmfrageKarte.tsx",
  "components/umfrage/Kandidat.tsx",
  "components/umfrage/StimmFormular.tsx",
  "components/umfrage/VorschlagFormular.tsx",
  "components/umfrage/phasen.ts",
  "components/umfrage/zeitraum.ts",
  // Welle 4b: Startseite
  "components/story/Auftakt.tsx",
  "components/story/TransparentMachen.tsx",
  "components/story/AromaSektion.tsx",
  "components/story/GemeinsamLernen.tsx",
  "components/story/WissenBuendeln.tsx",
  "components/story/Randspalte.tsx",
  "components/story/NeuesterEintrag.tsx",
  "components/story/DeinKapitel.tsx",
  "components/kapitel-start/KapitelAufschlag.tsx",
  "components/kapitel-start/KapitelImBrowser.tsx",
  "components/story/Abstimmung.tsx",
  "components/story/Katalog.tsx",
  "components/story/Skelette.tsx",
  "components/medien/LoopSchalter.tsx",
  "lib/query/community.ts",
  // Welle 4c: Apotheken (zurueckgestellt, aber uebersetzt)
  "app/[lang]/apotheken/page.tsx",
  "app/[lang]/apotheken/[slug]/page.tsx",
  // Welle 5: Mitgliederbereich, Vorschlagen
  "app/[lang]/mitglied/page.tsx",
  "app/[lang]/mitglied/aktionen.ts",
  "components/auth/ProfilFormular.tsx",
  "lib/mitglied-eingabe.ts",
  "app/[lang]/vorschlagen/page.tsx",
  "app/[lang]/vorschlagen/aktionen.ts",
  "components/vorschlag/BlueteVorschlagFormular.tsx",
  "lib/query/benachrichtigungen.ts",
  // T11: Empfehlungen
  "components/story/Empfehlungen.tsx",
  "components/empfehlung/EmpfehlungsListe.tsx",
  "lib/empfehlung-text.ts",
  // T12: Register der Terpene und Geschmäcker.
  "components/story/TerpenRegister.tsx",
  "components/story/RegisterAuswahl.tsx",
  // Profil Stufe 1 (Spec 2026-10-07)
  "app/[lang]/profil/page.tsx",
  "components/profil/ProfilNetz.tsx",
  "components/profil/TerpenRangliste.tsx",
  "components/profil/TopFlop.tsx",
  "components/profil/CommunityVergleich.tsx",
  "components/profil/Schnitte.tsx",
  "components/profil/ProfilReiter.tsx",
  // Profil Stufe 3: Verlauf, Lieblingshersteller, Mini-Netz
  "components/profil/NetzGrafik.tsx",
  "components/profil/NetzVerlauf.tsx",
  "components/profil/NetzLegende.tsx",
  "components/profil/Lieblingshersteller.tsx",
  "components/review/MiniNetz.tsx",
  // Profil Stufe 2: oeffentliches Profil
  "app/[lang]/profil/[kurzId]/page.tsx",
  "components/profil/OeffentlicheBewertungen.tsx",
  "components/mitglied/ProfilSichtbarkeit.tsx",
  // Kapitel Profil und Konto (Spec 2026-10-08)
  "components/kapitel/Feld.tsx",
  "components/kapitel/FeldSkelett.tsx",
  "components/kapitel/KapitelRaster.tsx",
  "components/kapitel/Kapitelkopf.tsx",
  "components/kapitel/Randnotizen.tsx",
  "components/profil/Aktivitaet.tsx",
  "components/profil/NotenVerteilung.tsx",
  "components/profil/BewertungsRegister.tsx",
  "components/mitglied/UmfrageJetzt.tsx",
  "components/mitglied/MeineStimmen.tsx",
];

// "alle": Name des Suchparameters ?alle=1 im Bewertungs-Register, kein Oberflaechentext.
const ERLAUBT: string[] = ["Book of Terpz", "Deutsch", "alle"];

const DEUTSCH =
  /[äöüÄÖÜß]|\b(und|oder|nicht|mit|für|bitte|Bitte|keine?|noch|eine?|wird|werden|ist|sind|zur|zum|dein|deine|wir|uns|Sie|jetzt|hier|alle|wählen)\b/;

function ohneKommentare(quelle: string): string {
  return quelle
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[\s;])\/\/.*$/gm, "$1");
}

function texte(quelle: string): string[] {
  const aus: string[] = [];
  for (const m of quelle.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`([^`]*)`/g)) aus.push(m[1] ?? m[2] ?? m[3] ?? "");
  for (const m of quelle.matchAll(/>([^<>{}]+)</g)) aus.push(m[1]);
  return aus.map((s) => s.trim()).filter(Boolean);
}

test("umgestellte Dateien enthalten keine deutschen Oberflaechentexte", () => {
  const funde: string[] = [];
  for (const pfad of UMGESTELLT) {
    for (const roh of texte(ohneKommentare(readFileSync(pfad, "utf8")))) {
      // JSX-Ausdruecke ({texte.wir}) sind kein Text; nur was ausserhalb steht, zaehlt.
      const text = roh.replace(/\{[^{}]*\}/g, "").trim();
      if (!text) continue;
      if (ERLAUBT.some((e) => text === e)) continue;
      if (text.startsWith("@/") || text.startsWith("./") || text === "use client" || text === "use server") continue;
      // Ids und Schluessel in kebab-case (z. B. "alle-titel") sind kein Oberflaechentext.
      if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(text)) continue;
      if (DEUTSCH.test(text)) funde.push(`${pfad}: ${text}`);
    }
  }
  assert.deepEqual(funde, []);
});

test("Selbsttest: der Waechter findet deutsche Strings in Anfuehrungszeichen, auch mit n", () => {
  const funde = texte(ohneKommentare('const a = "Bitte wählen"; const b = t("Kein Treffer"); const c = \'Menü öffnen\';'));
  assert.ok(funde.includes("Bitte wählen"), JSON.stringify(funde));
  assert.ok(funde.includes("Kein Treffer"), JSON.stringify(funde));
  assert.ok(funde.includes("Menü öffnen"), JSON.stringify(funde));
});
