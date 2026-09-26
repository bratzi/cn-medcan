import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

/** Dieselben vier Konturen wie hinter der Hero-Wortmarke (globals.css .marke-kontur-N). */
const KONTUREN = ["marke-kontur-1", "marke-kontur-2", "marke-kontur-3", "marke-kontur-4"] as const;

/** Zweite Zeile glänzt knapp versetzt, wie im Auftakt (2 s und 2,12 s). */
const TERPZ_GLANZ: CSSProperties = { animationDelay: "2.12s" };

/**
 * Das Logo "Book of Terpz" (Nutzer 2026-09-26): die Hero-Wortmarke als Satz aus
 * zwei Zeilen. "Book of" klein obenauf, "Terpz" groß darunter und im Fokus.
 * Schrift, Verlauf Grün–Violett, feine Kopierstift-Kontur und Glanz wie die
 * h1 im Auftakt; dahinter die vier versetzten Umrisse, die ruhig driften.
 *
 * Die Schriftgröße setzt der Aufrufer (sie gilt für "Terpz"); alles andere
 * rechnet in em. Der Name steht einmal als echter Text für Screenreader, das
 * Sichtbare ist Bild (aria-hidden), damit er nicht vier- oder fünffach gelesen wird.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("relative isolate inline-flex font-hand", className)}>
      <span className="sr-only">Book of Terpz</span>
      {KONTUREN.map((klasse) => (
        <span key={klasse} aria-hidden="true" className={`marke-kontur ${klasse}`}>
          <span>
            <LogoSatz />
          </span>
        </span>
      ))}
      <span aria-hidden="true" style={{ WebkitTextStroke: "0.012em var(--color-kopierstift)" }}>
        <LogoSatz glanz />
      </span>
    </span>
  );
}

function LogoSatz({ glanz = false }: { glanz?: boolean }) {
  return (
    // Größe und Versatz sitzen an den Hüllen: .glanz-wort setzt eigene Ränder (Malfläche
    // für die Schwünge), so liegen Konturen und Schriftzug deckungsgleich.
    <span className="flex flex-col items-center leading-none">
      <span className="block text-[0.45em]">
        <span className={cn("inline-block", glanz && "glanz-wort")}>Book of</span>
      </span>
      {/* Rückt unter die Unterlängen von "Book of", damit beides ein Zeichen wird. */}
      <span className="-mt-[0.14em] block">
        <span className={cn("inline-block", glanz && "glanz-wort")} style={glanz ? TERPZ_GLANZ : undefined}>
          Terpz
        </span>
      </span>
    </span>
  );
}
