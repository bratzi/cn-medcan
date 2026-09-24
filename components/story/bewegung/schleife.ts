import type { Choreografie } from "./typen";

/**
 * Sektion 4: die Schleife zeichnet sich als Linie. Einzige Ausnahme von
 * "nur transform, opacity, clip-path" (Spec 13): eine 1,5-px-Linie in einem
 * kleinen SVG laesst sich nur ueber den Strichversatz zeichnen.
 */
export const schleife: Choreografie = ({ gsap }) => {
  const linie = document.querySelector<SVGCircleElement>('[data-story="schleife-linie"]');
  if (!linie) return;
  gsap.fromTo(
    linie,
    { strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: linie, start: "top 75%", end: "bottom 50%", scrub: true },
    },
  );
};
