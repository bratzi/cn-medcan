/**
 * Video-Schleifen erst in der Naehe laden und abspielen, ausserhalb anhalten
 * (Spec 4.5). Laeuft nur, wenn die StoryBuehne laeuft, also nie bei
 * reduzierter Bewegung: dann bleibt das Standbild.
 *
 * Der Schalter `data-loop-schalter` haelt die Schleifen an (WCAG 2.2.2). Er
 * ist im HTML versteckt und erscheint erst hier, weil nur hier etwas laeuft.
 * Hat jemand angehalten, startet auch das erneute Hineinscrollen nichts.
 */
export function beobachteLoops(): { stoppen: () => void } {
  const videos = [...document.querySelectorAll<HTMLVideoElement>("video[data-loop]")];
  const schalter = [...document.querySelectorAll<HTMLButtonElement>("button[data-loop-schalter]")];
  const inDerNaehe = new Set<HTMLVideoElement>();
  let angehalten = false;

  const abspielen = (video: HTMLVideoElement) => void video.play().catch(() => undefined);
  const beschriften = () => {
    for (const knopf of schalter) {
      knopf.setAttribute("aria-label", angehalten ? "Video abspielen" : "Video anhalten");
      knopf.toggleAttribute("data-angehalten", angehalten);
    }
  };
  const umschalten = () => {
    angehalten = !angehalten;
    for (const video of videos) {
      if (angehalten) video.pause();
      else if (inDerNaehe.has(video)) abspielen(video);
    }
    beschriften();
  };

  const beobachter = new IntersectionObserver(
    (eintraege) => {
      for (const eintrag of eintraege) {
        const video = eintrag.target as HTMLVideoElement;
        if (eintrag.isIntersecting) {
          inDerNaehe.add(video);
          video.preload = "auto";
          if (!angehalten) abspielen(video);
        } else {
          inDerNaehe.delete(video);
          video.pause();
        }
      }
    },
    { rootMargin: "200px 0px" },
  );
  for (const video of videos) beobachter.observe(video);
  for (const knopf of schalter) {
    knopf.hidden = false;
    knopf.addEventListener("click", umschalten);
  }
  beschriften();

  return {
    stoppen: () => {
      beobachter.disconnect();
      for (const video of videos) video.pause();
      for (const knopf of schalter) {
        knopf.hidden = true;
        knopf.removeEventListener("click", umschalten);
      }
    },
  };
}
