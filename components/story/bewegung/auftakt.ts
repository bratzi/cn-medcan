import type { Choreografie } from "./typen";

/**
 * Sektion 1: Titel Wort fuer Wort, dann das Tag gesprueht, dann der Drip
 * (Spec 5.1). Navigation und "Waehl mit" sind nie ausgeblendet.
 */
export const auftakt: Choreografie = ({ gsap, SplitText }) => {
  const titel = document.querySelector<HTMLElement>('[data-story="titel"]');
  if (!titel) return;

  const einstieg = gsap.utils.toArray<HTMLElement>("[data-story-einstieg]");
  // aria "auto": die h1 behaelt ihren Namen, die Woerter sind aria-hidden.
  const woerter = SplitText.create(titel, { type: "words", tag: "span", aria: "auto" }).words;

  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    // Ab hier uebernimmt GSAP: der CSS-Notfall wird abgeschaltet, die Flaechen stehen.
    .set(einstieg, { animation: "none", opacity: 1 })
    .from(woerter, { yPercent: 40, opacity: 0, duration: 0.9, stagger: 0.14 })
    // fromTo statt from: der Zielwert kaeme sonst aus dem CSS-Einstieg (opacity 0),
    // und die Zeile bliebe unsichtbar, weil die Buehne den Notfall abschaltet.
    .fromTo('[data-story="unterzeile"]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
    .from('[data-story="tag"]', { clipPath: "inset(0 100% 0 0)", duration: 0.6, ease: "power2.inOut" }, ">-0.3")
    .from('[data-story="tag-drip"]', { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "power1.in" })
    .fromTo('[data-story="intro"]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, "<");
};
