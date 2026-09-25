"use client";

import { useEffect, useRef } from "react";

import { starteRauch, type RauchMaschine } from "@/components/layout/joint-rauch";

/** Wie lange gehalten, bis die Glut ganz aufgeglüht ist (ms). */
const GLUEHEN_VOLL_MS = 2500;

/**
 * Der Cursor als Joint, schräg angestellt wie der gewöhnliche Pfeil: die
 * gedrehte Spitze oben links ist der Klickpunkt, der Filter zeigt nach unten
 * rechts. Beim Bewegen zieht er eine dezente Duftspur, beim Klicken glimmt die
 * Spitze und qualmt; je länger gehalten, desto heller die Glut und mehr Asche.
 * Qualm, Funken und Duftspur zeichnet joint-rauch.ts auf einem Canvas; die
 * Glut flackert unregelmäßig (zwei überlagerte Schwingungen), nie im Takt.
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
    let letzteZeit = 0;
    let glutJetzt = 0;
    const rauch: RauchMaschine | null = ruhig ? null : starteRauch();

    const zeichnen = (jetzt: number) => {
      const dt = letzteZeit ? Math.min((jetzt - letzteZeit) / 1000, 0.05) : 0;
      letzteZeit = jetzt;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      // Geschwindigkeit des Zeigers in px/s: der Qualm erbt einen Hauch davon.
      const vx = dt ? (x - letztX) / dt : 0;
      const vy = dt ? (y - letztY) / dt : 0;
      if (gedrueckt) {
        const glut = Math.min((jetzt - gedrueckt) / GLUEHEN_VOLL_MS, 1);
        glutJetzt = glut;
        // Unregelmäßiges Flackern: zwei Schwingungen, die nie gleich takten.
        const flackern = ruhig ? 1 : 0.82 + 0.18 * Math.sin(jetzt * 0.019) * Math.sin(jetzt * 0.0071 + 1.3);
        el.style.setProperty("--glut", (glut * flackern).toFixed(3));
        if (rauch && jetzt - rauchZeit > 70 - glut * 35) {
          rauchZeit = jetzt;
          rauch.qualm(x + 3, y + 3, glut, vx, vy);
        }
        if (rauch && Math.random() < (0.04 + glut * 0.16) * dt * 60) rauch.funken(x + 3, y + 3, glut);
      } else if (rauch && jetzt - spurZeit > 70 && Math.hypot(x - letztX, y - letztY) > 3) {
        spurZeit = jetzt;
        rauch.spur(letztX + 4, letztY + 4);
      }
      rauch?.schritt(dt, jetzt / 1000);
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
      if (gedrueckt && rauch) rauch.ausatmen(x + 3, y + 3, glutJetzt);
      gedrueckt = 0;
      glutJetzt = 0;
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
      rauch?.stoppen();
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
        {/* Papier: Kegel, an der Spitze breiter, zum Filter deutlich schmaler (Nutzer 2026-09-26). */}
        <path className="joint-papier" d="M6.8 2.2 L29 27 L27 29 L2.2 6.8 Z" />
        {/* Gedrehte Spitze. */}
        <path className="joint-papier" d="M6.8 2.2 L1 1 L2.2 6.8 Z" />
        {/* Filter (Crutch). */}
        <path className="joint-filter" d="M24.3 21.7 L29 27 L27 29 L21.7 24.3 Z" />
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
