import { AB_TABLET, type Choreografie } from "./typen";

/**
 * Sektion 3: Tags spruehen beim Eintritt auf; ab Tablet pinnt die Wand und
 * vertikales Scrollen schwenkt sie seitlich (Spec 5.1). Darunter bleibt
 * sie gestapelt, ohne Pin.
 */
export const wand: Choreografie = ({ gsap, mm }) => {
  const sektion = document.querySelector<HTMLElement>('[data-story="wand"]');
  const reihe = document.querySelector<HTMLElement>('[data-story="wand-reihe"]');
  if (!sektion || !reihe) return;

  gsap.from(gsap.utils.toArray<HTMLElement>('[data-story="wand-tag"]'), {
    clipPath: "inset(0 100% 0 0)",
    duration: 0.7,
    stagger: 0.2,
    ease: "power2.inOut",
    scrollTrigger: { trigger: reihe, start: "top 80%", once: true },
  });

  mm.add(AB_TABLET, () => {
    sektion.classList.add("ist-schwenk");
    // offsetLeft statt getBoundingClientRect: unabhaengig vom laufenden Versatz.
    const strecke = () => Math.max(0, reihe.offsetLeft + reihe.scrollWidth - sektion.clientWidth);
    gsap.to(reihe, {
      x: () => -strecke(),
      ease: "none",
      scrollTrigger: {
        trigger: sektion,
        start: "top top",
        end: () => `+=${strecke()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    return () => sektion.classList.remove("ist-schwenk");
  });
};
