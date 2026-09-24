import type { Choreografie } from "./typen";

/**
 * Sektionswechsel als Vorhang: Sektionen mit data-story-vorhang werden per
 * clip-path von oben aufgedeckt (Spec 4.6), gekoppelt an den Scrollweg beim Eintritt.
 */
export const vorhang: Choreografie = ({ gsap }) => {
  for (const sektion of gsap.utils.toArray<HTMLElement>("[data-story-vorhang]")) {
    gsap.fromTo(
      sektion,
      { clipPath: "inset(0 0 100% 0)" },
      {
        clipPath: "inset(0 0 0% 0)",
        ease: "none",
        scrollTrigger: { trigger: sektion, start: "top bottom", end: "top 40%", scrub: true },
      },
    );
  }
};
