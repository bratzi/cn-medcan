import type { Choreografie } from "./typen";

/**
 * Sektion 1 (Spec TP3 8.1, Redesign 21): eine komponierte Eröffnung. Der
 * Film blendet aus leichter Nähe auf (das <video>, nicht der Container: den
 * zoomt auftaktFilm beim Scrollen, ein Element gehört genau einer
 * Animation). Wortmarke und Unterzeile schreiben sich per CSS; Oberzeile und
 * Satz folgen. Navigation und "Wähl mit" sind nie ausgeblendet.
 */
export const auftakt: Choreografie = ({ gsap }) => {
  const einstieg = gsap.utils.toArray<HTMLElement>("[data-story-einstieg]");
  if (einstieg.length === 0) return;

  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    // Ab hier übernimmt GSAP: der CSS-Notfall wird abgeschaltet, die Flächen stehen.
    .set(einstieg, { animation: "none", opacity: 1 })
    // fromTo statt from: der Zielwert käme sonst aus dem CSS-Einstieg (opacity 0),
    // und die Zeile bliebe unsichtbar, weil die Bühne den Notfall abschaltet.
    // Ziel 0.75 = opacity-75 am Video (Auftakt.tsx); danach übernimmt wieder die Klasse.
    .fromTo(
      '[data-story="auftakt-film"] video',
      { opacity: 0, scale: 1.08 },
      { opacity: 0.75, scale: 1, duration: 1.8, ease: "power2.out", clearProps: "opacity,scale" },
      0,
    )
    .fromTo('[data-story="oberzeile"]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
    .fromTo('[data-story="intro"]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.4);
};

/**
 * Sektion 1 (Spec Redesign 8): beim Hinausscrollen zoomt der Film langsam
 * heran, die Wortmarke gleitet nach oben weg. Nur transform, scrub.
 */
export const auftaktFilm: Choreografie = ({ gsap }) => {
  const film = document.querySelector<HTMLElement>('[data-story="auftakt-film"]');
  const buehne = document.querySelector<HTMLElement>('[data-story="auftakt"]');
  if (!film || !buehne) return;
  const scrub = { trigger: buehne, start: "top top", end: "bottom top", scrub: true };
  gsap.fromTo(film, { scale: 1 }, { scale: 1.15, ease: "none", scrollTrigger: scrub });
  gsap.fromTo('[data-story="titel"]', { yPercent: 0 }, { yPercent: -30, ease: "none", scrollTrigger: { ...scrub } });
};
