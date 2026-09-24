import { AB_TABLET, type Choreografie } from "./typen";

/**
 * Sektion 2: Manifest Wort fuer Wort scroll-gekoppelt (Referenz, ueber
 * Deckkraft statt Farbe, Spec 13), dann ab Tablet der Zoom Blatt, Bluete,
 * Trichom an den Scrollweg der Notizen gekoppelt. Die Buehne klebt per CSS.
 */
export const transparent: Choreografie = ({ gsap, SplitText, mm }) => {
  const manifest = document.querySelector<HTMLElement>('[data-story="manifest"]');
  if (manifest) {
    const woerter = SplitText.create(manifest, { type: "words", tag: "span", aria: "auto" }).words;
    gsap.fromTo(
      woerter,
      { opacity: 0.25 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: manifest, start: "top 80%", end: "bottom 45%", scrub: true },
      },
    );
  }

  mm.add(AB_TABLET, () => {
    const notizen = document.querySelector('[data-story="notizen"]');
    const stufen = gsap.utils.toArray<HTMLElement>('[data-story="buehne-bild"]');
    if (!notizen || stufen.length === 0) return;

    const ablauf = gsap.timeline({
      scrollTrigger: { trigger: notizen, start: "top center", end: "bottom center", scrub: true },
    });
    // Ausgangslage: nur das erste Bild. Die Bilder mischen per multiply, ein
    // oberes verdeckt ein unteres also nicht: der Vorgaenger muss weichen.
    gsap.set(stufen, { opacity: (index: number) => (index === 0 ? 1 : 0) });
    stufen.forEach((stufe, index) => {
      const bild = stufe.querySelector("img");
      if (index > 0) {
        ablauf.to(stufe, { opacity: 1, duration: 0.4, ease: "none" });
        ablauf.to(stufen[index - 1], { opacity: 0, duration: 0.4, ease: "none" }, "<");
      }
      if (bild) ablauf.fromTo(bild, { scale: 1 }, { scale: 1.3, duration: 1, ease: "none" }, "<");
    });
  });
};
