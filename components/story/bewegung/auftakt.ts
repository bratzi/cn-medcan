import { AB_TABLET, type Choreografie } from "./typen";

/** Gleich dem Einsatz von `einstieg-notfall` in globals.css (8 s). */
const NOTFALL_MS = 8000;

/**
 * Sektion 1 (Spec TP3 8.1, Redesign 21): eine komponierte Eröffnung. Der
 * Film blendet aus leichter Nähe auf (das <video>, nicht der Container: den
 * zoomt auftaktFilm beim Scrollen, ein Element gehört genau einer
 * Animation). Wortmarke und Unterzeile schreiben sich per CSS; Oberzeile und
 * Satz folgen. Navigation und "Bewerte jetzt mit" sind nie ausgeblendet.
 *
 * Der CSS-Notfall (`einstieg-notfall`) wird erst abgeschaltet, wenn die
 * Timeline wirklich läuft (onStart, also im ersten Frame). In einem
 * Hintergrund-Tab gibt es keine Frames: dann bleibt der Notfall an und
 * blendet die Texte nach 8 s ein. Die Timeline entsteht nur in einem
 * sichtbaren Tab; wird er erst nach dem Notfall sichtbar, stehen die Texte
 * schon und blenden kein zweites Mal ein.
 */
export const auftakt: Choreografie = ({ gsap }) => {
  const einstieg = gsap.utils.toArray<HTMLElement>("[data-story-einstieg]");
  if (einstieg.length === 0) return;

  let ablauf: ReturnType<typeof gsap.timeline> | null = null;
  const eroeffnen = () => {
    ablauf = gsap
      .timeline({
        defaults: { ease: "power3.out" },
        // Ab hier übernimmt GSAP: der CSS-Notfall wird abgeschaltet. Die Texte stehen
        // dabei schon auf opacity 0 (fromTo rendert den Anfang sofort), blenden also
        // nur einmal ein (Nutzer 2026-09-25).
        onStart: () => {
          gsap.set(einstieg, { animation: "none" });
        },
      })
      // fromTo statt from: der Zielwert käme sonst aus dem CSS-Einstieg (opacity 0).
      // Ziel 0.75 = opacity-75 am Video (Auftakt.tsx); danach übernimmt wieder die Klasse.
      // Nur noch ein Hauch Nähe (Nutzer 2026-09-26: Video wirkte zu stark eingezoomt, vorher 1.08).
      .fromTo(
        '[data-story="auftakt-film"] video',
        { opacity: 0, scale: 1.02 },
        { opacity: 0.75, scale: 1, duration: 3, ease: "power2.out", clearProps: "opacity,scale" },
        0,
      )
      // Später und länger (Nutzer 2026-09-25): erst die Wortmarke, dann die Zeilen.
      .fromTo(
        '[data-story="oberzeile"]',
        { opacity: 0, y: 24, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.2, ease: "power2.out", clearProps: "filter" },
        1.8,
      )
      .fromTo(
        '[data-story="intro"]',
        { opacity: 0, y: 24, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.2, ease: "power2.out", clearProps: "filter" },
        3.4,
      );
  };

  if (document.visibilityState === "visible") {
    eroeffnen();
    return () => ablauf?.revert();
  }

  // Im Hintergrund geöffnet: erst beim Sichtbarwerden eröffnen, und nur, solange
  // der Notfall die Texte noch nicht gezeigt hat (Puffer für den ersten Frame).
  const sichtbar = () => {
    if (document.visibilityState !== "visible") return;
    document.removeEventListener("visibilitychange", sichtbar);
    if (performance.now() < NOTFALL_MS - 500) eroeffnen();
  };
  document.addEventListener("visibilitychange", sichtbar);
  return () => {
    document.removeEventListener("visibilitychange", sichtbar);
    ablauf?.revert();
  };
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
  // 1.05 statt 1.15 (Nutzer 2026-09-26: zu stark eingezoomt).
  gsap.fromTo(film, { scale: 1 }, { scale: 1.05, ease: "none", scrollTrigger: scrub });
  gsap.fromTo('[data-story="titel"]', { yPercent: 0 }, { yPercent: -30, ease: "none", scrollTrigger: { ...scrub } });
};

/** "Umschlag wird Seite" abschalten: auf false, dann scrollt der Auftakt wie jede Sektion weg. */
export const UMSCHLAG_WIRD_SEITE = true;

/**
 * "Umschlag wird Seite" (Session 22): der Auftakt bleibt stehen, während die
 * erste Buchseite (TransparentMachen, `relative z-10 bg-surface` mit eigenem
 * Feldbuch-Raster) von unten darüber gleitet wie ein umgeblättertes Blatt.
 * Pin ohne Platzhalter: die Seite folgt direkt, die Gesamthöhe bleibt gleich.
 * Film-Zoom und Wortmarke (auftaktFilm) laufen darunter weiter. Nur ab Tablet
 * (keine Pins darunter, Spec 5.1) und nie bei reduzierter Bewegung (dann lädt
 * die Bühne gar nicht). Lenis scrollt das Fenster selbst, der Pin ist also ein
 * gewöhnlicher fixed-Pin; ScrollTrigger hört über start.ts auf Lenis.
 */
export const umschlagWirdSeite: Choreografie = ({ ScrollTrigger, mm }) => {
  if (!UMSCHLAG_WIRD_SEITE) return;
  const buehne = document.querySelector<HTMLElement>('[data-story="auftakt"]');
  const seite = document.querySelector<HTMLElement>('[data-story="transparent"]');
  if (!buehne || !seite) return;
  mm.add(AB_TABLET, () => {
    // Schatten nach oben nur, solange der Pin besteht (globals.css, [data-umschlag-seite]).
    seite.setAttribute("data-umschlag-seite", "");
    const pin = ScrollTrigger.create({
      trigger: buehne,
      start: "top top",
      end: "bottom top",
      pin: true,
      pinSpacing: false,
    });
    return () => {
      pin.kill(true);
      seite.removeAttribute("data-umschlag-seite");
    };
  });
};
