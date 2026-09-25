/**
 * Storytelling-Prüfpunkte (TransparentMachen): Mit der Maus über dem Video
 * folgen Video und die beiden Linien dem Zeiger ein Stück, jede Ebene nach
 * ihrer Tiefe (`data-punkt-tiefe`, 1 = Video, größer = weiter vorn). Beim
 * Verlassen gleiten sie zurück.
 *
 * Nur `translate` (eigene Transform-Eigenschaft: verträgt sich mit `rotate`
 * aus blob-morph und `transform` aus bild-zoom), direkt am Element gesetzt.
 * Nachgezogen per Dämpfung je Frame statt fester Dauer: unterbrechbar, trägt
 * die Richtung beim Wechsel. Nur bei feinem Zeiger mit Hover; bei reduzierter
 * Bewegung lädt die StoryBuehne dieses Modul gar nicht.
 */

/** Weg der Video-Ebene bei Zeiger am Rand, in px. Die Linien laufen mit ihrer Tiefe weiter. */
const WEG_PX = 10;
/** Anteil des Restwegs je Frame: klein = weicher, träger. */
const DAEMPFUNG = 0.12;

type Ebene = { element: HTMLElement; tiefe: number; x: number; y: number };

export function beobachtePunkte(): () => void {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => undefined;

  const aufraeumer: (() => void)[] = [];

  for (const punkt of document.querySelectorAll<HTMLElement>("[data-punkt]")) {
    const ebenen: Ebene[] = Array.from(punkt.querySelectorAll<HTMLElement>("[data-punkt-tiefe]"), (element) => ({
      element,
      tiefe: Number(element.dataset.punktTiefe) || 1,
      x: 0,
      y: 0,
    }));
    let zielX = 0;
    let zielY = 0;
    let frame = 0;

    const schritt = () => {
      let bewegt = false;
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
      const box = punkt.getBoundingClientRect();
      // -1 bis 1 vom Mittelpunkt aus
      zielX = Math.max(-1, Math.min(1, ((ereignis.clientX - box.left) / box.width) * 2 - 1));
      zielY = Math.max(-1, Math.min(1, ((ereignis.clientY - box.top) / box.height) * 2 - 1));
      anstossen();
    };
    const verlassen = () => {
      zielX = 0;
      zielY = 0;
      anstossen();
    };

    punkt.addEventListener("pointermove", bewegen);
    punkt.addEventListener("pointerleave", verlassen);
    aufraeumer.push(() => {
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
