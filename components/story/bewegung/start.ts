import { auftakt } from "./auftakt";
import { beobachteLoops } from "./loops";
import type { Choreografie, Werkzeug } from "./typen";

/**
 * Scroll-Ablaeufe der Sektionen 2 bis 9. Sie starten erst, wenn kein
 * Skelett mehr steht: sonst messen sie eine Seite, deren Hoehe sich noch
 * aendert. Tasks 14 und 15 tragen hier ein.
 */
const SCROLL_CHOREOGRAFIEN: readonly Choreografie[] = [];

function wennInhaltGeladen(los: () => void): () => void {
  const fertig = () => document.querySelector("[data-skelett]") === null;
  if (fertig()) {
    los();
    return () => undefined;
  }
  const beobachter = new MutationObserver(() => {
    if (!fertig()) return;
    beobachter.disconnect();
    los();
  });
  beobachter.observe(document.body, { childList: true, subtree: true });
  return () => beobachter.disconnect();
}

/**
 * Laedt GSAP, ScrollTrigger, SplitText und Lenis und startet die Buehne
 * (Spec 6.2). Gibt die Aufraeumfunktion zurueck.
 */
export async function starteBuehne(): Promise<() => void> {
  const [{ gsap }, { ScrollTrigger }, { SplitText }, { default: Lenis }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/SplitText"),
    import("lenis"),
  ]);
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Lenis als einzige Scroll-Glaettung, getaktet ueber den GSAP-Ticker.
  const lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  const takt = (sekunden: number) => lenis.raf(sekunden * 1000);
  gsap.ticker.add(takt);
  gsap.ticker.lagSmoothing(0);

  const mm = gsap.matchMedia();
  const werkzeug: Werkzeug = { gsap, ScrollTrigger, SplitText, mm };
  const aufraeumer: (() => void)[] = [];
  const merke = (ergebnis: void | (() => void)) => {
    if (ergebnis) aufraeumer.push(ergebnis);
  };

  const ctx = gsap.context(() => merke(auftakt(werkzeug)));

  let beendet = false;
  const stoppeWarten = wennInhaltGeladen(() => {
    if (beendet) return;
    ctx.add(() => {
      for (const choreografie of SCROLL_CHOREOGRAFIEN) merke(choreografie(werkzeug));
    });
    ScrollTrigger.refresh();
  });

  const neuMessen = () => ScrollTrigger.refresh();
  void document.fonts.ready.then(() => {
    if (!beendet) neuMessen();
  });
  window.addEventListener("load", neuMessen);
  const loops = beobachteLoops();

  return () => {
    beendet = true;
    stoppeWarten();
    loops.stoppen();
    window.removeEventListener("load", neuMessen);
    for (const aufraeumen of aufraeumer.splice(0)) aufraeumen();
    mm.revert();
    ctx.revert();
    gsap.ticker.remove(takt);
    lenis.destroy();
  };
}
