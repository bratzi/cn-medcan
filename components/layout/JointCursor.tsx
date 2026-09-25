"use client";

import { useEffect, useRef } from "react";

/** Wie lange gehalten, bis die Glut ganz aufgeglüht ist (ms). */
const GLUEHEN_VOLL_MS = 2500;

/**
 * Der Cursor als Joint, schräg angestellt wie der gewöhnliche Pfeil: die
 * gedrehte Spitze oben links ist der Klickpunkt, der Filter zeigt nach unten
 * rechts. Beim Bewegen zieht er eine dezente Duftspur, beim Klicken glimmt die
 * Spitze und qualmt; je länger gehalten, desto heller die Glut und mehr Asche.
 * Nur mit feiner Maus; bei reduzierter Bewegung ohne Spur und Rauch.
 * Folgt dem Zeiger über transform im rAF, ohne React-Renders je Bewegung.
 */
export function JointCursor() {
  const joint = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = joint.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wurzel = document.documentElement;
    wurzel.classList.add("joint-cursor");

    let x = -100;
    let y = -100;
    let letztX = x;
    let letztY = y;
    let rahmen = 0;
    let gedrueckt = 0;
    let rauchZeit = 0;
    let spurZeit = 0;

    const teilchen = (art: string, tx: number, ty: number, glut: number) => {
      const s = document.createElement("span");
      s.className = art;
      s.setAttribute("aria-hidden", "true");
      s.style.left = `${tx + (Math.random() - 0.5) * 6}px`;
      s.style.top = `${ty + (Math.random() - 0.5) * 6}px`;
      s.style.setProperty("--drift", `${(Math.random() - 0.5) * 30}px`);
      s.style.setProperty("--glut", glut.toFixed(2));
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove(), { once: true });
    };

    const zeichnen = (jetzt: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (gedrueckt) {
        const glut = Math.min((jetzt - gedrueckt) / GLUEHEN_VOLL_MS, 1);
        el.style.setProperty("--glut", glut.toFixed(3));
        if (!ruhig && jetzt - rauchZeit > 110) {
          rauchZeit = jetzt;
          teilchen("joint-rauch", x + 2, y + 2, glut);
        }
      } else if (!ruhig && jetzt - spurZeit > 70 && Math.hypot(x - letztX, y - letztY) > 14) {
        spurZeit = jetzt;
        teilchen("joint-spur", letztX + 4, letztY + 4, 0);
      }
      letztX = x;
      letztY = y;
      rahmen = requestAnimationFrame(zeichnen);
    };

    const bewegen = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      el.dataset.sichtbar = "";
    };
    const runter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      gedrueckt = performance.now();
      el.dataset.gedrueckt = "";
    };
    const hoch = () => {
      gedrueckt = 0;
      delete el.dataset.gedrueckt;
      el.style.setProperty("--glut", "0");
    };
    const raus = () => delete el.dataset.sichtbar;

    window.addEventListener("pointermove", bewegen, { passive: true });
    window.addEventListener("pointerdown", runter, { passive: true });
    window.addEventListener("pointerup", hoch, { passive: true });
    window.addEventListener("blur", hoch);
    document.addEventListener("pointerleave", raus);
    rahmen = requestAnimationFrame(zeichnen);

    return () => {
      cancelAnimationFrame(rahmen);
      wurzel.classList.remove("joint-cursor");
      window.removeEventListener("pointermove", bewegen);
      window.removeEventListener("pointerdown", runter);
      window.removeEventListener("pointerup", hoch);
      window.removeEventListener("blur", hoch);
      document.removeEventListener("pointerleave", raus);
    };
  }, []);

  return (
    <div ref={joint} aria-hidden="true" className="joint-zeiger">
      {/* Diagonal von der Spitze (1,1) zum Filter (29,29); die Spitze ist der Klickpunkt. */}
      <svg viewBox="0 0 32 32" width="30" height="30">
        {/* Papier: Kegel, an der Spitze breiter, zum Filter schmaler. */}
        <path className="joint-papier" d="M6.8 2.2 L29.4 26.6 L26.6 29.4 L2.2 6.8 Z" />
        {/* Gedrehte Spitze. */}
        <path className="joint-papier" d="M6.8 2.2 L1 1 L2.2 6.8 Z" />
        {/* Filter (Crutch). */}
        <path className="joint-filter" d="M24.6 21.4 L29.4 26.6 L26.6 29.4 L21.4 24.6 Z" />
        {/* Naht und Filterlinie. */}
        <path className="joint-linie" d="M5 5 L22.5 22.5" />
        <path className="joint-linie" d="M22.4 23.6 L23.6 22.4" />
        {/* Asche und Glut an der Spitze, sichtbar beim Klicken. */}
        <path className="joint-asche" d="M6.8 2.2 L1 1 L2.2 6.8 L5.6 8.2 L8.2 5.6 Z" />
        <circle className="joint-glut" cx="3.6" cy="3.6" r="2.6" />
      </svg>
    </div>
  );
}
