import { SCHREIBEN_AB, SCHREIBEN_BIS } from "./schreiben";
import type { Choreografie } from "./typen";

/**
 * Sektion 9: die Schlusszeile steht zuerst voll gefüllt und invertiert sich
 * Wort für Wort scroll-gekoppelt zur Kontur, ganz erst am Seitenende (Nutzer
 * 2026-09-26, vorher umgekehrt); die Wortmarke unten im Fuß schreibt
 * sich einmal (Spec TP3 8.9). aria "none": beide sichtbaren Ebenen der
 * Schlusszeile sind aria-hidden, vorgelesen wird die sr-only-Fassung.
 */
export const schluss: Choreografie = ({ gsap, SplitText }) => {
  const fuellung = document.querySelector<HTMLElement>(".schlusszeile-fuellung");
  if (fuellung) {
    const woerter = SplitText.create(fuellung, { type: "words", tag: "span", aria: "none" }).words;
    gsap.fromTo(
      woerter,
      { opacity: 1 },
      {
        opacity: 0,
        stagger: 0.15,
        ease: "none",
        // "max": voll invertiert genau am Ende der Seite.
        scrollTrigger: { trigger: fuellung, start: "top 95%", end: "max", scrub: true },
      },
    );
  }

  // Start "top bottom": die Marke läuft unten aus dem Fuß, sichtbar sind nur
  // rund 0,6 em. Bei hohen, schmalen Fenstern erreichte ihre Oberkante 95 %
  // der Höhe nie, und die Marke bliebe für immer geschnitten.
  const marke = document.querySelector<HTMLElement>('[data-story="fuss-marke"]');
  if (marke) {
    gsap.fromTo(marke, SCHREIBEN_AB, {
      ...SCHREIBEN_BIS,
      scrollTrigger: { trigger: marke, start: "top bottom", once: true },
    });
  }
};
