"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { SPRACHEN } from "@/lib/i18n/sprache-kern";

/** Startseite: dort schwebt der Kopf oben durchsichtig über dem Hero (Spec Profil Desktop 2026-10-13). */
export function istStartseite(pfad: string): boolean {
  const teile = pfad.split("/").filter(Boolean);
  return teile.length === 0 || (teile.length === 1 && (SPRACHEN as readonly string[]).includes(teile[0]));
}

/**
 * Zustand des festen Kopfs, ohne React-Renders: misst seine Höhe (--kopf-h,
 * für den Abstand von main), setzt data-gescrollt, sobald die Seite läuft,
 * und leiht sich die dunklen Tokens der Bühne (buehne-dunkel), solange er
 * transparent über dem Auftakt schwebt, und markiert die Startseite (data-start).
 */
export function KopfZustand() {
  // Der Kopf bleibt im Root-Layout stehen: nach einem Seitenwechsel neu prüfen,
  // sonst bliebe er ohne Scroll dunkel (Start → Unterseite) oder hell.
  const pfad = usePathname();
  useEffect(() => {
    const kopf = document.querySelector<HTMLElement>("[data-kopf]");
    if (!kopf) return;
    kopf.toggleAttribute("data-start", istStartseite(pfad));
    const wurzel = document.documentElement;
    let rahmen = 0;

    const messen = () => wurzel.style.setProperty("--kopf-h", `${kopf.offsetHeight}px`);
    const pruefen = () => {
      rahmen = 0;
      const gescrollt = window.scrollY > 8;
      kopf.toggleAttribute("data-gescrollt", gescrollt);
      const buehne = document.querySelector<HTMLElement>(".buehne-dunkel[data-story='auftakt']");
      const kopfH = kopf.offsetHeight;
      // Die erste Buchseite gleitet über den gepinnten Auftakt (bewegung/auftakt.ts):
      // liegt sie schon unter dem Kopf, schwebt er über Papier, nicht über der Bühne.
      const seite = document.querySelector<HTMLElement>("[data-umschlag-seite]");
      const seiteDarueber = !!seite && seite.getBoundingClientRect().top <= kopfH;
      // Hell-Modus: der Kopf ist von Anfang an Papier (globals.css), auch über dem hellen
      // Hero; die dunklen Bühnen-Tokens nur im dunklen Thema (Nutzer 2026-09-30).
      const thema = wurzel.dataset.theme;
      const dunkel = thema === "dark" || (thema !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      const ueberBuehne = dunkel && !!buehne && buehne.getBoundingClientRect().bottom > kopfH && !seiteDarueber;
      // Auch gescrollt dunkel, solange die Bühne unter dem Kopf liegt: sonst stünde im
      // Hell-Modus ein heller Papierstreifen über dem schwarzen Film.
      kopf.classList.toggle("buehne-dunkel", ueberBuehne);
    };
    const planen = () => {
      if (!rahmen) rahmen = requestAnimationFrame(pruefen);
    };

    const beobachter = new ResizeObserver(messen);
    beobachter.observe(kopf);
    messen();
    pruefen();
    window.addEventListener("scroll", planen, { passive: true });
    window.addEventListener("resize", planen);
    return () => {
      cancelAnimationFrame(rahmen);
      beobachter.disconnect();
      window.removeEventListener("scroll", planen);
      window.removeEventListener("resize", planen);
    };
  }, [pfad]);
  return null;
}
