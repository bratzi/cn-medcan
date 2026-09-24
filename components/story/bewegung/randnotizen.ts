import { SCHREIBEN_AB, SCHREIBEN_BIS } from "./schreiben";
import type { Choreografie } from "./typen";

const ZAHL = new Intl.NumberFormat("de-DE");

/**
 * Sektion 3 (Spec TP3 8.3): die Randnotizen werden beim Eintritt
 * geschrieben, die Zahlen zählen dabei einmal hoch. Eigenes Attribut
 * `data-randzahl`: das Zähler-Attribut der Doppelseite gehört den Noten
 * (eintrag.ts, eine Nachkommastelle). Vorgelesen wird die sr-only-Zeile;
 * beim Aufräumen stehen wieder die Endwerte da.
 */
export const randnotizen: Choreografie = ({ gsap }) => {
  const spalte = document.querySelector<HTMLElement>('[data-story="randspalte"]');
  if (!spalte) return;
  const notizen = gsap.utils.toArray<HTMLElement>('[data-story="randnotiz"]', spalte);
  const zahlen = gsap.utils
    .toArray<HTMLElement>("[data-randzahl]", spalte)
    .filter((el) => Number.isFinite(Number(el.dataset.ziel)));

  // Sofort auf 0: die Sektion liegt beim Laden unter dem Falz; der Sprung
  // vom Endwert auf 0 fiele sonst beim Eintritt ins Auge.
  for (const el of zahlen) el.textContent = ZAHL.format(0);

  const ablauf = gsap.timeline({ scrollTrigger: { trigger: spalte, start: "top 80%", once: true } });
  ablauf.fromTo(notizen, SCHREIBEN_AB, { ...SCHREIBEN_BIS, stagger: 0.25 });
  for (const el of zahlen) {
    const stand = { wert: 0 };
    ablauf.to(
      stand,
      {
        wert: Number(el.dataset.ziel),
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = ZAHL.format(Math.round(stand.wert));
        },
      },
      0,
    );
  }

  return () => {
    for (const el of zahlen) el.textContent = ZAHL.format(Number(el.dataset.ziel));
  };
};
