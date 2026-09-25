"use client";

import { useEffect, useRef } from "react";

/** Ab wann ein gehaltener Klick röstet (ms) und wie lange bis ganz geröstet. */
const ROESTEN_AB_MS = 350;
const ROESTEN_VOLL_MS = 3000;

/**
 * Der Cursor als kleiner Cannabis-Bud: in Ruhe schwarzweiß, beim Klick grün.
 * Hält man gedrückt, steigen Duftschwaden auf und der Bud röstet langsam.
 * Nur mit feiner Maus; bei reduzierter Bewegung nur der Farbwechsel.
 * Folgt dem Zeiger über transform im rAF, ohne React-Renders je Bewegung.
 */
export function BudCursor() {
  const bud = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bud.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wurzel = document.documentElement;
    wurzel.classList.add("bud-cursor");

    let x = -100;
    let y = -100;
    let rahmen = 0;
    let gedrueckt = 0;
    let schwadenZeit = 0;

    const zeichnen = (jetzt: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (gedrueckt && !ruhig) {
        const dauer = jetzt - gedrueckt;
        const roest = Math.min(Math.max((dauer - ROESTEN_AB_MS) / ROESTEN_VOLL_MS, 0), 1);
        el.style.setProperty("--roest", roest.toFixed(3));
        if (dauer > ROESTEN_AB_MS && jetzt - schwadenZeit > 140) {
          schwadenZeit = jetzt;
          schwade(x, y, roest);
        }
      }
      rahmen = requestAnimationFrame(zeichnen);
    };

    const schwade = (sx: number, sy: number, roest: number) => {
      const s = document.createElement("span");
      s.className = "bud-schwade";
      s.setAttribute("aria-hidden", "true");
      s.style.left = `${sx + (Math.random() - 0.5) * 10}px`;
      s.style.top = `${sy - 6}px`;
      s.style.setProperty("--drift", `${(Math.random() - 0.5) * 30}px`);
      s.style.setProperty("--roest", roest.toFixed(2));
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove(), { once: true });
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
      el.style.setProperty("--roest", "0");
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
      wurzel.classList.remove("bud-cursor");
      window.removeEventListener("pointermove", bewegen);
      window.removeEventListener("pointerdown", runter);
      window.removeEventListener("pointerup", hoch);
      window.removeEventListener("blur", hoch);
      document.removeEventListener("pointerleave", raus);
    };
  }, []);

  return (
    <div ref={bud} aria-hidden="true" className="bud-zeiger">
      <svg viewBox="0 0 24 24" width="18" height="18">
        {/* Blüte: Kelch aus überlappenden Tropfen, Härchen als Punkte. */}
        <g className="bud-koerper">
          <path d="M12 2c3 3 5 6 5 10 0 4-2.2 7-5 9-2.8-2-5-5-5-9 0-4 2-7 5-10z" />
          <path d="M7.5 7C5 9 4.5 12.5 6 15.5c1.3-.4 2.3-1.4 2.8-2.8L7.5 7zM16.5 7c2.5 2 3 5.5 1.5 8.5-1.3-.4-2.3-1.4-2.8-2.8L16.5 7z" opacity="0.8" />
        </g>
        <g className="bud-haerchen">
          <circle cx="10" cy="8" r="0.9" />
          <circle cx="13.5" cy="11" r="0.9" />
          <circle cx="10.5" cy="14" r="0.9" />
          <circle cx="14" cy="16.5" r="0.8" />
        </g>
      </svg>
    </div>
  );
}
