import { AB_TABLET, type Choreografie } from "./typen";
import { zahlFormat } from "./zahlformat";

/** Gleich dem Einsatz von `einstieg-notfall` in globals.css (8 s). */
const NOTFALL_MS = 8000;

/** Die Zahlenleiste folgt dem Intro (3,4 s), wenn es halb steht (Spec 2026-10-08 Auftakt, 6). */
const ZAHLEN_AB = 4.2;

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

  // Eigenes Merkmal, nicht das der Noten: eintrag.ts greift jenes seitenweit ab.
  // Bei jedem Aufruf neu gesucht: die Leiste kann nach dem Start nachstreamen.
  const zaehlerSuchen = () =>
    gsap.utils
      .toArray<HTMLElement>("[data-auftakt-zaehler]")
      .filter((el) => Number.isFinite(Number(el.dataset.ziel)));
  const ganz = (wert: number) => zahlFormat(document.documentElement.lang, 0).format(wert);
  const endwerte = () => {
    for (const el of zaehlerSuchen()) el.textContent = ganz(Number(el.dataset.ziel));
  };

  // Leiste einblenden und hochzählen, ab `ab` Sekunden in `zeitleiste`.
  const zahlenEinplanen = (zeitleiste: ReturnType<typeof gsap.timeline>, zaehler: HTMLElement[], ab: number) => {
    zeitleiste.fromTo(
      '[data-story="zahlen"]',
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power2.out",
        // Erst hier auf 0: vorher steht der Endwert aus dem HTML, nie eine falsche Null.
        onStart: () => {
          for (const el of zaehler) el.textContent = ganz(0);
        },
      },
      ab,
    );
    // Leicht versetzt (80 ms je Zahl), damit die drei nicht als Block anlaufen.
    zaehler.forEach((el, index) => {
      const stand = { wert: 0 };
      zeitleiste.to(
        stand,
        {
          wert: Number(el.dataset.ziel),
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = ganz(Math.round(stand.wert));
          },
        },
        ab + index * 0.08,
      );
    });
  };

  let ablauf: ReturnType<typeof gsap.timeline> | null = null;
  let spaet: ReturnType<typeof gsap.timeline> | null = null;
  let spaetStopp: (() => void) | null = null;

  /**
   * Streamt die Leiste erst nach dem Start (erster Render je Sprache nach einem
   * Deploy, Review M1), stand sonst der CSS-Notfall an: 8 s nach dem Einfügen
   * und ohne Zählen. Darum auf sie warten und sie in einer eigenen Zeitleiste
   * nachholen, zum geplanten Zeitpunkt oder sofort, wenn der vorbei ist. Erst
   * im Leerlauf: React hydriert sie kurz nach dem Tausch, Inline-Styles davor
   * meldeten Abweichungen (wie wennInhaltGeladen in start.ts).
   */
  const aufLeisteWarten = (zeitleiste: ReturnType<typeof gsap.timeline>) => {
    const buehne = document.querySelector('[data-story="auftakt"]');
    if (!buehne?.querySelector("[data-skelett]")) return;
    let leerlaufStopp: (() => void) | null = null;
    const holen = () => {
      const zaehler = zaehlerSuchen();
      if (zaehler.length === 0) return;
      spaet = gsap.timeline({
        defaults: { ease: "power3.out" },
        onStart: () => {
          gsap.set('[data-story="zahlen"]', { animation: "none" });
        },
      });
      zahlenEinplanen(spaet, zaehler, Math.max(0, ZAHLEN_AB - zeitleiste.time()));
    };
    const beobachter = new MutationObserver(() => {
      if (!buehne.querySelector('[data-story="zahlen"]')) {
        // Kein Skelett und keine Leiste: Abfrage scheiterte oder alles 0.
        if (!buehne.querySelector("[data-skelett]")) beobachter.disconnect();
        return;
      }
      beobachter.disconnect();
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(holen, { timeout: 1000 });
        leerlaufStopp = () => window.cancelIdleCallback(id);
      } else {
        const id = window.setTimeout(holen, 200);
        leerlaufStopp = () => window.clearTimeout(id);
      }
    });
    beobachter.observe(buehne, { childList: true, subtree: true });
    spaetStopp = () => {
      beobachter.disconnect();
      leerlaufStopp?.();
    };
  };

  const eroeffnen = () => {
    const zeitleiste = gsap
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
    ablauf = zeitleiste;

    // Die Leiste fehlt, wenn die Abfrage scheiterte oder alles 0 ist, oder sie streamt noch.
    const zaehler = zaehlerSuchen();
    if (zaehler.length > 0) zahlenEinplanen(zeitleiste, zaehler, ZAHLEN_AB);
    else aufLeisteWarten(zeitleiste);
  };

  const aufraeumen = () => {
    spaetStopp?.();
    spaet?.revert();
    ablauf?.revert();
    endwerte();
  };

  if (document.visibilityState === "visible") {
    eroeffnen();
    return aufraeumen;
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
    aufraeumen();
  };
};

/**
 * Sektion 1 (Spec Redesign 8): beim Hinausscrollen zoomt der Film langsam
 * heran, das Logo wächst an seinem Platz. Nur transform, scrub.
 */
export const auftaktFilm: Choreografie = ({ gsap }) => {
  const film = document.querySelector<HTMLElement>('[data-story="auftakt-film"]');
  const buehne = document.querySelector<HTMLElement>('[data-story="auftakt"]');
  if (!film || !buehne) return;
  const scrub = { trigger: buehne, start: "top top", end: "bottom top", scrub: true };
  // 1.05 statt 1.15 (Nutzer 2026-09-26: zu stark eingezoomt).
  gsap.fromTo(film, { scale: 1 }, { scale: 1.05, ease: "none", scrollTrigger: scrub });
  // Das Logo bleibt stehen und wächst (Nutzer 2026-10-07): nach oben geschoben hing es zu
  // nah am Rand. Das ruhige Pulsieren (marke-puls an der h1) läuft dabei weiter.
  gsap.fromTo('[data-story="titel"]', { scale: 1 }, { scale: 1.15, ease: "none", scrollTrigger: { ...scrub } });
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
