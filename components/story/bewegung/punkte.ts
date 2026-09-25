/**
 * Storytelling-Prüfpunkte (TransparentMachen): Mit der Maus über dem Video
 * folgen Video und die beiden Linien dem Zeiger ein Stück, jede Ebene nach
 * ihrer Tiefe (`data-punkt-tiefe`, 1 = Video, größer = weiter vorn). Beim
 * Verlassen gleiten sie zurück.
 *
 * Nur `translate` (eigene Transform-Eigenschaft: verträgt sich mit `rotate`
 * aus blob-morph und `transform` aus bild-zoom), direkt am Element gesetzt.
 * Nachgezogen per Dämpfung je Frame statt fester Dauer: unterbrechbar, trägt
 * die Richtung beim Wechsel. Zeigerfolge nur bei feinem Zeiger mit Hover; bei
 * reduzierter Bewegung lädt die StoryBuehne dieses Modul gar nicht.
 *
 * Eigenbewegung (Nutzer 2026-09-25): im Storytelling bewegen sich die Videos
 * auch ohne Zeiger, im selben Bereich wie mit Zeiger (-1 bis 1), auf einer
 * langsamen Schleifenbahn; der Zeiger übernimmt, solange er darüber ist. Die
 * Schleife läuft nur, solange der Punkt im Bild ist.
 */

/** Weg der Video-Ebene bei Zeiger am Rand, in px. Die Linien laufen mit ihrer Tiefe weiter. */
const WEG_PX = 24; // Nutzer 2026-09-25: mehr Weg (vorher 10)
/** Anteil des Restwegs je Frame: klein = weicher, träger. */
const DAEMPFUNG = 0.12;
/** Eigenbewegung: Kreisfrequenzen je Achse in 1/s (ungleich, damit die Bahn nicht wiederholt wirkt). */
const EIGEN_X = 1.1; // Nutzer 2026-09-25: schneller (vorher 0.45/0.31)
const EIGEN_Y = 0.77;

type Ebene = { element: HTMLElement; tiefe: number; x: number; y: number };

export function beobachtePunkte(): () => void {
  const zeiger = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const aufraeumer: (() => void)[] = [];

  for (const [nummer, punkt] of document.querySelectorAll<HTMLElement>("[data-punkt]").entries()) {
    // Eigenbewegung nur im Storytelling, nicht an der Hero-Wortmarke.
    const eigen = punkt.closest('[data-story="transparent"]') !== null;
    if (!zeiger && !eigen) continue;
    const ebenen: Ebene[] = Array.from(punkt.querySelectorAll<HTMLElement>("[data-punkt-tiefe]"), (element) => ({
      element,
      tiefe: Number(element.dataset.punktTiefe) || 1,
      x: 0,
      y: 0,
    }));
    let zielX = 0;
    let zielY = 0;
    let frame = 0;
    let ueber = false;
    let sichtbar = false;
    // Versatz je Punkt, damit die Videos nicht im Gleichschritt laufen.
    const phase = nummer * 1.7;

    const schritt = (jetzt: number) => {
      const treibt = eigen && sichtbar && !ueber;
      if (treibt) {
        const t = jetzt / 1000;
        zielX = Math.sin(t * EIGEN_X + phase);
        zielY = Math.sin(t * EIGEN_Y + phase * 0.6);
      }
      let bewegt = treibt;
      for (const ebene of ebenen) {
        const sollX = zielX * WEG_PX * ebene.tiefe;
        const sollY = zielY * WEG_PX * ebene.tiefe;
        ebene.x += (sollX - ebene.x) * DAEMPFUNG;
        ebene.y += (sollY - ebene.y) * DAEMPFUNG;
        if (Math.abs(sollX - ebene.x) > 0.05 || Math.abs(sollY - ebene.y) > 0.05) bewegt = true;
        else {
          ebene.x = sollX;
          ebene.y = sollY;
        }
        ebene.element.style.translate = `${ebene.x.toFixed(2)}px ${ebene.y.toFixed(2)}px`;
      }
      frame = bewegt ? requestAnimationFrame(schritt) : 0;
    };
    const anstossen = () => {
      if (!frame) frame = requestAnimationFrame(schritt);
    };

    const bewegen = (ereignis: PointerEvent) => {
      ueber = true;
      const box = punkt.getBoundingClientRect();
      // -1 bis 1 vom Mittelpunkt aus
      zielX = Math.max(-1, Math.min(1, ((ereignis.clientX - box.left) / box.width) * 2 - 1));
      zielY = Math.max(-1, Math.min(1, ((ereignis.clientY - box.top) / box.height) * 2 - 1));
      anstossen();
    };
    const verlassen = () => {
      ueber = false;
      zielX = 0;
      zielY = 0;
      anstossen();
    };

    if (zeiger) {
      punkt.addEventListener("pointermove", bewegen);
      punkt.addEventListener("pointerleave", verlassen);
    }
    const beobachter = eigen
      ? new IntersectionObserver(([eintrag]) => {
          sichtbar = eintrag?.isIntersecting ?? false;
          if (sichtbar) anstossen();
        })
      : null;
    beobachter?.observe(punkt);
    aufraeumer.push(() => {
      beobachter?.disconnect();
      punkt.removeEventListener("pointermove", bewegen);
      punkt.removeEventListener("pointerleave", verlassen);
      cancelAnimationFrame(frame);
      for (const ebene of ebenen) ebene.element.style.translate = "";
    });
  }

  return () => {
    for (const aufraeumen of aufraeumer.splice(0)) aufraeumen();
  };
}
