"use client";

import { useEffect, useRef } from "react";

/** Ab wann ein gehaltener Klick röstet (ms) und wie lange bis ganz geröstet. */
const ROESTEN_AB_MS = 0;
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
    let spurZeit = 0;
    let letztX = x;
    let letztY = y;

    const zeichnen = (jetzt: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (gedrueckt && !ruhig) {
        const dauer = jetzt - gedrueckt;
        const roest = Math.min(Math.max((dauer - ROESTEN_AB_MS) / ROESTEN_VOLL_MS, 0), 1);
        el.style.setProperty("--roest", roest.toFixed(3));
        if (jetzt - schwadenZeit > 110) {
          schwadenZeit = jetzt;
          teilchen("bud-rauch", x, y, roest);
        }
      } else if (!ruhig && jetzt - spurZeit > 70 && Math.hypot(x - letztX, y - letztY) > 14) {
        // Beim Bewegen: dezente Duftspur hinter dem Bud.
        spurZeit = jetzt;
        teilchen("bud-spur", letztX, letztY, 0);
      }
      letztX = x;
      letztY = y;
      rahmen = requestAnimationFrame(zeichnen);
    };

    const teilchen = (art: string, sx: number, sy: number, roest: number) => {
      const s = document.createElement("span");
      s.className = art;
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
      <svg viewBox="0 0 32 32" width="28" height="28">
        {/* Blüte: Kelch aus Schuppen, zwei Zuckerblätter, Stiel, orange Härchen. */}
        <path className="bud-stiel" d="M16 26.5v4" strokeWidth="1.6" strokeLinecap="round" />
        <g className="bud-blatt">
          <path d="M9.5 21.5C5 21 2.5 18 2 14.5c3.2.2 6 1.8 8 4.6z" />
          <path d="M22.5 21.5c4.5-.5 7-3.5 7.5-7-3.2.2-6 1.8-8 4.6z" />
        </g>
        <g className="bud-koerper">
          <path d="M16 2c4.2 3.6 6.8 8 6.8 13.2 0 5.6-3 9.8-6.8 12-3.8-2.2-6.8-6.4-6.8-12C9.2 10 11.8 5.6 16 2z" />
        </g>
        <g className="bud-schuppen" fill="none" strokeWidth="1" strokeLinecap="round">
          <path d="M11.5 12.5c2 1.4 3.4 1.6 4.5 1.6s2.5-.2 4.5-1.6" />
          <path d="M10.6 17.5c2.2 1.5 3.8 1.8 5.4 1.8s3.2-.3 5.4-1.8" />
          <path d="M12 22.2c1.6 1 2.8 1.3 4 1.3s2.4-.3 4-1.3" />
        </g>
        <g className="bud-haerchen">
          <circle cx="13.2" cy="8.6" r="1" />
          <circle cx="18.6" cy="10.4" r="1" />
          <circle cx="14.4" cy="15.6" r="1" />
          <circle cx="19.2" cy="16.4" r="0.9" />
          <circle cx="12.6" cy="20.4" r="0.9" />
          <circle cx="17.6" cy="21.6" r="0.9" />
        </g>
      </svg>
    </div>
  );
}
