import type { Choreografie } from "./typen";

/**
 * Sektion 6: Spruehmarken und "Waehl mit." spruehen beim Eintritt auf.
 * Die Stimmabgabe selbst bewegt sich nicht (Spec 5.1).
 */
export const abstimmung: Choreografie = ({ gsap }) => {
  const marken = gsap.utils.toArray<HTMLElement>('[data-story="waehl-mit"], [data-story="spruehmarke"]');
  if (marken.length === 0) return;
  gsap.from(marken, {
    clipPath: "inset(0 100% 0 0)",
    duration: 0.7,
    stagger: 0.15,
    ease: "power2.inOut",
    scrollTrigger: { trigger: '[data-story="abstimmung"]', start: "top 70%", once: true },
  });
};
