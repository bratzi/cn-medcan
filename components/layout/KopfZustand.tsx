"use client";

import { useEffect } from "react";

/**
 * Zustand des festen Kopfs, ohne React-Renders: misst seine Höhe (--kopf-h,
 * für den Abstand von main), setzt data-gescrollt, sobald die Seite läuft,
 * und leiht sich die dunklen Tokens der Bühne (buehne-dunkel), solange er
 * transparent über dem Auftakt schwebt.
 */
export function KopfZustand() {
  useEffect(() => {
    const kopf = document.querySelector<HTMLElement>("[data-kopf]");
    if (!kopf) return;
    const wurzel = document.documentElement;
    let rahmen = 0;

    const messen = () => wurzel.style.setProperty("--kopf-h", `${kopf.offsetHeight}px`);
    const pruefen = () => {
      rahmen = 0;
      const gescrollt = window.scrollY > 8;
      kopf.toggleAttribute("data-gescrollt", gescrollt);
      const buehne = document.querySelector<HTMLElement>(".buehne-dunkel[data-story='auftakt']");
      const ueberBuehne = !!buehne && buehne.getBoundingClientRect().bottom > kopf.offsetHeight;
      kopf.classList.toggle("buehne-dunkel", ueberBuehne && !gescrollt);
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
  }, []);
  return null;
}
