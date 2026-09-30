import { Suspense } from "react";

import { RegisterAuswahl, type RegisterAnsicht } from "@/components/story/RegisterAuswahl";
import { Schlagwort } from "@/components/story/Schlagwort";
import { UeberlaufWort, ueberlaufPlatz } from "@/components/story/UeberlaufWort";
import { holeSprache, holeWoerterbuch, type Sprache, type Woerterbuch } from "@/lib/i18n";
import { terpenAnzeige } from "@/lib/i18n/terpen";
import { mehrzahl } from "@/lib/i18n/text";
import { ladeTerpenRegister, type RegisterKatalogTerpen } from "@/lib/query/strains";
import { sicher } from "@/lib/sicher";
import { baueTerpenRegister, notenAnker } from "@/lib/terpen-register";

type Stofftext = { duft: string; vorkommen: string };

/**
 * Baut aus Katalog und Wörterbuch die fertige Ansicht für den Browser: nur
 * Texte und Anteile, damit die Client-Insel kein Wörterbuch braucht. Terpene
 * ohne eigenen Text zeigen im Deutschen das Aromaprofil aus der Datenbank.
 */
export function baueAnsicht(katalog: readonly RegisterKatalogTerpen[], w: Woerterbuch, sprache: Sprache): RegisterAnsicht {
  const texte = w.start.register;
  const stoffe = texte.stoffe as Record<string, Stofftext | undefined>;
  const saetze = w.aroma.satz as Record<string, string | undefined>;
  const hinweise = w.aroma.begleitHinweis as Record<string, string | undefined>;
  const profil = new Map(katalog.map((eintrag) => [eintrag.name, eintrag.aromaProfil.trim()]));
  const register = baueTerpenRegister(katalog);
  const sortenKurz = (anzahl: number) => mehrzahl(sprache, texte.sortenKurz, anzahl);

  return {
    terpene: register.terpene.map((terpen) => ({
      anker: terpen.anker,
      name: terpenAnzeige(terpen.name, sprache),
      icon: terpen.name,
      sorten: terpen.sorten,
      sortenText: terpen.sorten > 0 ? mehrzahl(sprache, texte.sorten, terpen.sorten) : texte.keineSorte,
      sortenKurz: sortenKurz(terpen.sorten),
      duft: stoffe[terpen.schluessel]?.duft ?? (sprache === "de" ? profil.get(terpen.name) || null : null),
      vorkommen: stoffe[terpen.schluessel]?.vorkommen ?? null,
      noten: terpen.noten.map((note, index) => ({
        anker: notenAnker(note.geschmack),
        geschmack: note.geschmack,
        label: w.label.geschmack[note.geschmack],
        anteil: note.anteil,
        haupt: index === 0,
      })),
    })),
    noten: register.noten.map((note) => ({
      anker: note.anker,
      geschmack: note.geschmack,
      label: w.label.geschmack[note.geschmack],
      traeger: note.terpene.map((terpen) => ({
        anker: terpen.anker,
        name: terpenAnzeige(terpen.name, sprache),
        icon: terpen.name,
        anteil: terpen.anteil,
        sortenKurz: sortenKurz(terpen.sorten),
      })),
      begleitstoffe: note.begleitstoffe.map((stoff) => ({
        name: terpenAnzeige(stoff.name, sprache),
        hinweis: hinweise[stoff.name] ?? "",
        satz: saetze[stoff.name.toLowerCase()] ?? "",
      })),
    })),
  };
}

/** Lädt den Katalog; ohne Terpene entfällt das Register still (Spec 13.3). */
async function Inhalt() {
  const [katalog, w, sprache] = await Promise.all([
    sicher(() => ladeTerpenRegister(), [], "Terpen-Register der Startseite"),
    holeWoerterbuch(),
    holeSprache(),
  ]);
  if (katalog.length === 0) return null;
  const ansicht = baueAnsicht(katalog, w, sprache);
  // Vorgewählt ist das Terpen in den meisten unserer Sorten: der wahrscheinlichste Einstieg.
  const start = ansicht.terpene.reduce((best, terpen) => (terpen.sorten > best.sorten ? terpen : best)).anker;
  const t = w.start.register;
  return (
    <RegisterAuswahl
      ansicht={ansicht}
      start={start}
      texte={{
        terpene: t.terpene,
        geschmaecker: t.geschmaecker,
        terpen: w.aroma.karte.terpen,
        geschmack: w.aroma.karte.geschmacksrichtung,
        duft: t.duft,
        vorkommen: t.vorkommen,
        noten: t.noten,
        hauptnote: t.hauptnote,
        traeger: t.traeger,
        begleitstoffe: t.begleitstoffe,
      }}
    />
  );
}

/**
 * Sektion zwischen Storytelling und Aroma-Karte (T12, Nutzer 2026-09-29): alle
 * Terpene und Geschmäcker als Register. Terpen wählen zeigt Duft, Vorkommen,
 * Noten und die Zahl unserer Sorten; Geschmack wählen zeigt die Terpene
 * dahinter. Kopf wie die Nachbarsektion (AromaSektion). Ohne JavaScript stehen
 * alle Tafeln untereinander (globals.css, `.register-*`); Bewegung kommt allein
 * aus bewegung/register.ts.
 *
 * `z-10` (T18, Nutzer 2026-09-30): das Schlagwort hängt halb über der oberen
 * Kante. Die Sektion davor (TransparentMachen) liegt mit `z-10` und deckendem
 * Papier eine Ebene höher und deckte die obere Hälfte ab; auf gleicher Ebene
 * liegt die spätere Sektion oben, der Satz bleibt ganz lesbar.
 */
export async function TerpenRegister() {
  const texte = (await holeWoerterbuch()).start.register;
  return (
    <section
      aria-labelledby="register-titel"
      data-story="register"
      className="relative isolate z-10 overflow-x-clip px-4 py-32 sm:px-8 sm:py-48"
    >
      <Schlagwort satz={texte.schlagwort} ton="lila" />
      <div className="mx-auto w-full max-w-360">
        <h2
          id="register-titel"
          className="relative isolate max-w-4xl font-buch text-kapitel text-text text-balance max-md:mx-auto max-md:text-center"
          style={ueberlaufPlatz}
        >
          {texte.titel}{" "}
          <span className="max-md:hidden">
            <UeberlaufWort wort={texte.ueberlauf} />
          </span>
          <span className="md:hidden">
            <UeberlaufWort wort={texte.ueberlauf} absatz />
          </span>
        </h2>
        <p className="mt-6 max-w-[60ch] text-body text-text-muted text-pretty max-md:mx-auto max-md:text-center">
          {texte.text}
        </p>
        <Suspense fallback={<div className="mt-16 h-96 w-full bg-surface-sunken" data-skelett="" />}>
          <Inhalt />
        </Suspense>
      </div>
    </section>
  );
}
