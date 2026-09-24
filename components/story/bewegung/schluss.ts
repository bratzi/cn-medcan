import type { Choreografie } from "./typen";

/**
 * Sektion 9: die Schlusszeile steht als Kontur und fuellt sich Wort fuer
 * Wort scroll-gekoppelt (Referenz); das grosse Tag sprueht einmal.
 * aria "none": beide sichtbaren Ebenen sind aria-hidden, vorgelesen wird
 * die sr-only-Fassung im Fuss.
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

  const tag = document.querySelector<HTMLElement>('[data-story="fuss-tag"]');
  if (tag) {
    gsap.from(tag, {
      clipPath: "inset(0 100% 0 0)",
      duration: 1.2,
      ease: "power2.inOut",
      scrollTrigger: { trigger: tag, start: "top 95%", once: true },
    });
  }
};
