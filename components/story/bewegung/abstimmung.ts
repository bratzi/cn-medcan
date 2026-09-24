import { SCHREIBEN_AB, SCHREIBEN_BIS } from "./schreiben";
import type { Choreografie } from "./typen";

/**
 * Sektion 6 (Spec TP3 8.6): "Wähl mit." und die Vermerke auf dem
 * Stimmzettel ("von euch", das "x" der eigenen Stimme) werden beim
 * Eintritt geschrieben. Die Stimmabgabe selbst bewegt sich nicht.
 */
export const abstimmung: Choreografie = ({ gsap }) => {
  const notizen = gsap.utils.toArray<HTMLElement>('[data-story="waehl-mit"], [data-story="vermerk"]');
  if (notizen.length === 0) return;
  gsap.fromTo(notizen, SCHREIBEN_AB, {
    ...SCHREIBEN_BIS,
    stagger: 0.15,
    scrollTrigger: { trigger: '[data-story="abstimmung"]', start: "top 70%", once: true },
  });
};
