/**
 * Video-Schleifen erst in der Naehe laden und abspielen, ausserhalb anhalten
 * (Spec 4.5). Laeuft nur, wenn die StoryBuehne laeuft, also nie bei
 * reduzierter Bewegung: dann bleibt das Standbild.
 */
export function beobachteLoops(): { stoppen: () => void } {
  const videos = [...document.querySelectorAll<HTMLVideoElement>("video[data-loop]")];
  const beobachter = new IntersectionObserver(
    (eintraege) => {
      for (const eintrag of eintraege) {
        const video = eintrag.target as HTMLVideoElement;
        if (eintrag.isIntersecting) {
          video.preload = "auto";
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: "200px 0px" },
  );
  for (const video of videos) beobachter.observe(video);

  return {
    stoppen: () => {
      beobachter.disconnect();
      for (const video of videos) video.pause();
    },
  };
}
