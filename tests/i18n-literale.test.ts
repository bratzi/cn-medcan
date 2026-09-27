import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Waechter gegen deutsche Oberflaechentexte in bereits umgestellten Dateien
 * (Spec Englisch 8). Jede Welle traegt ihre Dateien in UMGESTELLT ein.
 * Kommentare zaehlen nicht; Eigennamen stehen in ERLAUBT.
 */
const UMGESTELLT: string[] = [
  "app/layout.tsx",
  "components/layout/SprachSchalter.tsx",
  // Welle 1: Rahmen
  "lib/navigation.ts",
  "components/layout/Kopf.tsx",
  "components/layout/Fuss.tsx",
  "components/layout/KontoZaehler.tsx",
  "components/layout/ThemaSchalter.tsx",
  "app/not-found.tsx",
  "app/anmelden/page.tsx",
  "app/registrieren/page.tsx",
  "components/auth/AnmeldeFormular.tsx",
  "components/auth/RegistrierFormular.tsx",
  "components/auth/AbmeldeButton.tsx",
  "components/auth/fehlertexte.ts",
  "app/zugang/page.tsx",
  "components/zugang/ZugangFelder.tsx",
  // Welle 2: Katalog und Aroma-Baum
  "app/blueten/page.tsx",
  "app/blueten/[slug]/page.tsx",
  "components/produkt/FilterLeiste.tsx",
  "components/produkt/AktiveFilter.tsx",
  "components/produkt/ProduktCard.tsx",
  "components/produkt/Titelblatt.tsx",
  "components/produkt/TerpenChips.tsx",
  "components/produkt/CannabinoidBar.tsx",
  "lib/labels.ts",
  "components/review/AromaErkundung.tsx",
  "components/review/AromaKarte.tsx",
  "components/review/SortenKopf.tsx",
  "components/review/SweetSpot.tsx",
  "components/review/GesamteindruckLeiste.tsx",
  "components/review/BeschaffenheitsLeiste.tsx",
  "components/review/Aufklaerung.tsx",
  "components/review/CommunityStimmen.tsx",
  "components/review/Inhaltsverzeichnis.tsx",
  "components/review/Doppelseite.tsx",
  "components/review/erkundung-daten.ts",
  // Welle 3: Reviews und Bewerten
  "app/reviews/page.tsx",
  "app/bewerten/[slug]/page.tsx",
  "app/bewerten/aktionen.ts",
  "lib/bewertung-eingabe.ts",
  "components/review/BewertungsFormular.tsx",
  "components/produkt/InstagramEmbed.tsx",
  "components/produkt/ReelNachKlick.tsx",
  // Welle 4a: Umfragen
  "app/umfragen/page.tsx",
  "app/umfragen/aktionen.ts",
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
  "components/story/Abstimmung.tsx",
  "components/story/Katalog.tsx",
  "components/story/Skelette.tsx",
  "components/medien/LoopSchalter.tsx",
  "lib/query/community.ts",
];

const ERLAUBT: string[] = ["Book of Terpz", "Deutsch"];

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
  for (const m of quelle.matchAll(/"((?:[^"\\n]|\.)*)"|'((?:[^'\\n]|\.)*)'|`([^`]*)`/g)) aus.push(m[1] ?? m[2] ?? m[3] ?? "");
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
