import type { Choreografie } from "./typen";

/**
 * Sektion 1 (Spec TP3 8.1): Wortmarke und Unterzeile schreiben sich per CSS
 * selbst (globals.css, `schreiben`). Hier blenden nur Oberzeile und Satz
 * ein. Navigation und "Wähl mit" sind nie ausgeblendet.
 */
export const auftakt: Choreografie = ({ gsap }) => {
  const einstieg = gsap.utils.toArray<HTMLElement>("[data-story-einstieg]");
  if (einstieg.length === 0) return;

  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    // Ab hier übernimmt GSAP: der CSS-Notfall wird abgeschaltet, die Flächen stehen.
    .set(einstieg, { animation: "none", opacity: 1 })
    // fromTo statt from: der Zielwert käme sonst aus dem CSS-Einstieg (opacity 0),
    // und die Zeile bliebe unsichtbar, weil die Bühne den Notfall abschaltet.
    .fromTo('[data-story="oberzeile"]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
    .fromTo('[data-story="intro"]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.4);
};
