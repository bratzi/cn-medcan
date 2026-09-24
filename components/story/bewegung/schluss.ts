import { SCHREIBEN_AB, SCHREIBEN_BIS } from "./schreiben";
import type { Choreografie } from "./typen";

/**
 * Sektion 9: die Schlusszeile steht als Kontur und füllt sich Wort für
 * Wort scroll-gekoppelt (Referenz); die Wortmarke unten im Fuß schreibt
 * sich einmal (Spec TP3 8.9). aria "none": beide sichtbaren Ebenen der
 * Schlusszeile sind aria-hidden, vorgelesen wird die sr-only-Fassung.
 */
export const schluss: Choreografie = ({ gsap, SplitText }) => {
  const fuellung = document.querySelector<HTMLElement>(".schlusszeile-fuellung");
  if (fuellung) {
    const woerter = SplitText.create(fuellung, { type: "words", tag: "span", aria: "none" }).words;
    gsap.fromTo(
      woerter,
      { opacity: 0 },
      {
        opacity: 1,
        stagger: 0.15,
        ease: "none",
        scrollTrigger: { trigger: fuellung, start: "top 95%", end: "bottom bottom", scrub: true },
      },
    );
  }

  const marke = document.querySelector<HTMLElement>('[data-story="fuss-marke"]');
  if (marke) {
    gsap.fromTo(marke, SCHREIBEN_AB, {
      ...SCHREIBEN_BIS,
      scrollTrigger: { trigger: marke, start: "top 95%", once: true },
    });
  }
};
