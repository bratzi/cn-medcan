import type { Choreografie } from "./typen";

/**
 * Sektionswechsel als Vorhang: Sektionen mit data-story-vorhang werden per
 * clip-path von oben aufgedeckt (Spec 4.6), gekoppelt an den Scrollweg beim Eintritt.
 * `will-change: clip-path` nur, solange der Scrollweg im Vorhang liegt: dauerhaft
 * gesetzt hielte es jede Sektion als eigene Ebene im Speicher.
 */
export const vorhang: Choreografie = ({ gsap }) => {
  const sektionen = gsap.utils.toArray<HTMLElement>("[data-story-vorhang]");
  for (const sektion of sektionen) {
    gsap.fromTo(
      sektion,
      { clipPath: "inset(0 0 100% 0)" },
      {
        clipPath: "inset(0 0 0% 0)",
        ease: "none",
        scrollTrigger: {
          trigger: sektion,
          start: "top bottom",
          end: "top 40%",
          scrub: true,
          onToggle: ({ isActive }) => {
            sektion.style.willChange = isActive ? "clip-path" : "";
          },
        },
      },
    );
  }
  return () => {
    for (const sektion of sektionen) sektion.style.willChange = "";
  };
};
