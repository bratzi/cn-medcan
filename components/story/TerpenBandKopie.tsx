"use client";

import { useEffect, useRef } from "react";

/**
 * Zweite, stumme Kopie des Terpen-Bands (TerpenBand.tsx) für den nahtlosen
 * Lauf. Der Server rendert die Liste nur einmal (CPU-Limit der Startseite,
 * Fehler 1102); diese Insel klont nach dem Laden die Einträge der ersten Liste.
 * Die Kopie trägt keine ids und keinen Tabstopp und bleibt per aria-hidden für
 * Screenreader stumm; die Infospalte wird bewusst mitgeklont, denn sie ist der
 * sichtbare Inhalt des Bands (Nutzer 2026-10-03). Ohne JavaScript fehlt sie,
 * das Band steht dann wie bei reduzierter Bewegung (globals.css, Abschnitt
 * „Terpen-Band“).
 *
 * Wie viele Kopien (Befund E0 vom 2026-10-05): eine Kachel des Bands war
 * 1012 px breit, das Fenster 1714 px. Die Verschiebung um eine Kachelbreite ist
 * für sich richtig, aber hinter der Kachel klaffte Leere. Deshalb werden die
 * Einträge so oft hintereinander gesetzt, dass die Kopie mindestens die
 * Fensterbreite erreicht, und die Verschiebung hängt an der gemessenen
 * Kachelbreite `--band-kachel`.
 */
export function TerpenBandKopie() {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const ziel = ref.current;
    const quelle = ziel?.previousElementSibling;
    if (!ziel || !quelle) return;
    const spur = ziel.parentElement;

    const klon = (eintrag: Element) => {
      const kopie = eintrag.cloneNode(true) as HTMLElement;
      kopie.querySelectorAll(".sr-only").forEach((knoten) => knoten.remove());
      kopie.querySelectorAll("[tabindex], [aria-describedby], [id]").forEach((knoten) => {
        knoten.removeAttribute("tabindex");
        knoten.removeAttribute("aria-describedby");
        knoten.removeAttribute("id");
      });
      return kopie;
    };

    let letzteKachel = 0;
    let letzteKacheln = 0;

    const aufbauen = () => {
      const eintraege = Array.from(quelle.children);
      if (eintraege.length === 0) return;
      // Kachelbreite aus den Einträgen rechnen statt messen: solange die Kopie leer ist,
      // umbricht die Spur und die gemessene Breite der Quelle wäre die umbrochene.
      // Der rechte Innenabstand der Liste ist genauso groß wie ihr Abstand zwischen den
      // Einträgen, deshalb ist die Kachel die Summe der Einträge plus ein Abstand je Eintrag.
      const stil = getComputedStyle(quelle);
      const abstand = Number.parseFloat(stil.columnGap) || 0;
      const kachel = eintraege.reduce(
        (summe, eintrag) => summe + eintrag.getBoundingClientRect().width + abstand,
        0,
      );
      // Breite 0 heißt: das Band ist noch nicht sichtbar. Dann nichts bauen, der Beobachter
      // unten ruft erneut, sobald es Platz hat.
      if (kachel <= 0) return;
      const kacheln = Math.max(1, Math.ceil(window.innerWidth / kachel));
      if (Math.round(kachel) === letzteKachel && kacheln === letzteKacheln) return;
      letzteKachel = Math.round(kachel);
      letzteKacheln = kacheln;
      spur?.style.setProperty("--band-kachel", `${letzteKachel}px`);
      // So viele Kacheln in der Kopie, dass hinter der Quelle kein Loch bleibt.
      ziel.replaceChildren(...Array.from({ length: kacheln }, () => eintraege.map(klon)).flat());
    };

    aufbauen();
    // Der Beobachter deckt zwei Fälle: das Band wird erst später sichtbar, und die Einträge
    // ändern ihre Breite (andere Schrift, anderer Umbruch). Das Fenster deckt er nicht ab,
    // denn die Zahl der Kacheln hängt an der Fensterbreite, nicht an der Quellbreite.
    const beobachter = new ResizeObserver(aufbauen);
    beobachter.observe(quelle);
    window.addEventListener("resize", aufbauen);
    return () => {
      beobachter.disconnect();
      window.removeEventListener("resize", aufbauen);
      spur?.style.removeProperty("--band-kachel");
      ziel.replaceChildren();
    };
  }, []);

  return (
    <ul
      ref={ref}
      aria-hidden="true"
      className="terpen-band-liste flex shrink-0 items-start gap-8 pr-8 sm:gap-12 sm:pr-12"
    />
  );
}
