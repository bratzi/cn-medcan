import { LoopSchalter } from "@/components/medien/LoopSchalter";
import Link from "next/link";
import { preload } from "react-dom";
import { Suspense } from "react";

import { Loop } from "@/components/medien/Loop";
import { AuftaktZahlen } from "@/components/story/AuftaktZahlen";
import { Kopfzeile } from "@/components/story/Kopfzeile";
import { AuftaktZahlenSkelett } from "@/components/story/Skelette";
import { Logo } from "@/components/marke/Logo";
import { Unterzeile } from "@/components/marke/Wortmarke";
import { holeWoerterbuch } from "@/lib/i18n";

/**
 * Sektion 1 (Spec Redesign 7 und 8): der Umschlag als Filmbühne. Das Video
 * füllt die erste Ansicht in Schwarzweiß, ein Verlauf dunkelt es zur Schrift
 * hin ab, die Sektion trägt dunkle Rollen (`buehne-dunkel`). Die h1 ist das
 * Logo in Pinselschrift (Nutzer 2026-10-07). Logo und Unterzeile
 * schreiben sich per CSS (globals.css, `schreiben`) und stehen deshalb ohne
 * JavaScript und bei reduzierter Bewegung sofort da; dann bleibt auch das
 * Standbild stehen (loops.ts startet das Video nur mit der StoryBuehne).
 *
 * `data-story-einstieg` markiert, was die StoryBuehne einblendet: nur
 * Oberzeile und Satz. Der Button "Bewerte jetzt mit" trägt die Markierung bewusst
 * nicht: er ist ab dem ersten Frame bedienbar.
 */
export async function Auftakt() {
  const w = await holeWoerterbuch();
  const texte = w.start.auftakt;
  // Standbild ist das größte Bild der ersten Ansicht: vor allem anderen anfordern.
  // Die Seite startet hell (lib/thema.ts), also das Standbild des hellen Videos.
  preload("/medien/auftakt-loop-hell-standbild.webp", { as: "image", fetchPriority: "high" });

  return (
    <section
      aria-labelledby="auftakt-titel"
      data-story="auftakt"
      className="buehne-dunkel relative isolate -mt-(--kopf-h,4rem) flex min-h-svh flex-col overflow-hidden pt-[calc(var(--kopf-h,4rem)+4rem)] pb-8"
    >
      <div aria-hidden="true" data-story="auftakt-film" className="pointer-events-none absolute inset-0 -z-10">
        {/* Je Thema ein eigenes Video (Nutzer 2026-09-29); das verborgene lädt nichts. */}
        <Loop id="auftakt-loop" buehne className="nur-dunkel h-full opacity-75" />
        <Loop id="auftakt-loop-hell" buehne className="nur-hell h-full opacity-75" />
        {/* Mitte auf 30 % statt 5 % (Spec 2026-10-08 Auftakt, 7.3): die Oberzeile trägt
            auch auf hellen Frames. Gemessen nach dem Deploy, Ziel 4,5:1. */}
        <div className="absolute inset-0 bg-linear-to-b from-surface/40 via-surface/30 to-surface" />
      </div>

      {/* Wortmarke und Unterzeile als eine Gruppe auf gemeinsamer Achse: die
          Unterzeile in derselben aufrechten Druckschrift wie das Storytelling,
          leicht und deutlich kleiner, damit die Handschrift allein führt. */}
      <div className="flex flex-[2] flex-col items-center justify-center gap-4 px-6 py-8 sm:gap-6 sm:px-8">
        {/* Das Logo schreibt sich wie früher die Wortmarke (.auftakt-marke .marke-pinsel, globals.css)
            und pulsiert wie das Community-Fazit (marke-puls). */}
        <div data-story="titel" className="relative flex justify-center">
          <h1 id="auftakt-titel" className="auftakt-marke marke-puls relative flex justify-center">
            <Logo className="w-[min(40rem,82vw)]" />
          </h1>
        </div>
        <p
          data-story="oberzeile"
          data-story-einstieg=""
          className="mt-6 max-w-[28ch] text-center font-sans sm:mt-12 text-[clamp(1.75rem,1rem+2.4vw,3.25rem)] leading-tight font-light uppercase tracking-gesperrt text-balance text-text/90"
        >
          {texte.oberzeile}
        </p>
        {/* Zentriert und breit unter der Oberzeile; seit 2026-09-26 mit mehr Luft zur Wortmarke und zur Oberzeile (Nutzer). */}
        <p
          data-story="intro"
          data-story-einstieg=""
          className="mt-2 w-full text-center font-sans text-small uppercase sm:mt-4 leading-relaxed tracking-gesperrt text-text text-balance"
        >
          {/* Ab md je Satz eine eigene Zeile, breiter als die übrigen Texte (Nutzer 2026-09-25).
              Der Umbruch bleibt bis xl erlaubt: mit 0,3em Sperrung braucht der zweite Satz
              rund 1200 px, lief also zwischen md und xl rechts aus dem Bild. */}
          <span className="md:block xl:whitespace-nowrap">{texte.intro1}</span>{" "}
          <span className="md:block xl:whitespace-nowrap">{texte.intro2}</span>
        </p>
      </div>

      {/* Im freien Raum unter dem Intro: erst die Zahlenleiste (Spec 2026-10-08 Auftakt),
          dann "Bewerte jetzt mit", Verlaufsrahmen wie "Mein Konto", folgt dem Zeiger wie
          die Storytelling-Videos (Nutzer 2026-09-25). */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8 sm:gap-12 sm:px-8">
        <Suspense fallback={<AuftaktZahlenSkelett ansage={w.start.skelett.zahlen} />}>
          <AuftaktZahlen />
        </Suspense>
        <div data-punkt="" className="p-6">
          <Link prefetch={false}
            href="/blueten"
            data-punkt-tiefe="1"
            className="konto-pille inline-flex h-14 items-center justify-center rounded-full px-8 text-center whitespace-nowrap sm:px-10 font-sans text-small font-medium uppercase tracking-gesperrt text-text"
          >
            {texte.mitmachen}
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-360 px-4 sm:px-8">
        <div className="flex justify-end">
          <div className="flex flex-col items-end gap-4">
            {/* Pause fuer die Videos (WCAG 2.2.2); erscheint erst, wenn loops.ts sie startet. */}
            <LoopSchalter />
            <Unterzeile className="auftakt-unterzeile" />
          </div>
        </div>
      </div>
      {/* Kopfzeile am Fuß der ersten Ansicht: ohne Scrollen sichtbar, über die volle Breite. */}
      <div className="mt-8">
        <Kopfzeile />
      </div>
    </section>
  );
}
