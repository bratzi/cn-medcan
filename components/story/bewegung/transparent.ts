import type { Choreografie } from "./typen";

/**
 * Sektion 2 (Spec Redesign 9): das Manifest läuft über die ganze Sektion
 * und deckt sich Wort für Wort auf, scroll-gekoppelt. Jedes Wort kommt aus
 * blassem Rand-Grau und leicht versetzt, bis es in Tinte steht; betonte
 * Wörter behalten ihre Farbe (die Farbe sitzt am em, nicht am Wort).
 */
export const transparent: Choreografie = ({ gsap, SplitText }) => {
  const zeilen = gsap.utils.toArray<HTMLElement>('[data-story="manifest"] [data-manifest-zeile]');
  for (const zeile of zeilen) {
    const woerter = SplitText.create(zeile, { type: "words", tag: "span", aria: "auto" }).words;
    gsap.fromTo(
      woerter,
      { opacity: 0.12, yPercent: 20 },
      {
        opacity: 1,
        yPercent: 0,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: { trigger: zeile, start: "top 85%", end: "bottom 40%", scrub: 0.6 },
      },
    );
  }
};
