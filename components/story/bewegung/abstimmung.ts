import { SCHREIBEN_AB, SCHREIBEN_BIS } from "./schreiben";
import type { Choreografie } from "./typen";

import { zahlFormat } from "./zahlformat";

/** In der Sprache der Seite; beim Aufruf gelesen, nicht beim Laden des Moduls. */
const ZAHL = { format: (wert: number) => zahlFormat(document.documentElement.lang, 0).format(wert) };

/** Setzt Zahl und Wort ("Stimme"/"Stimmen") gemeinsam, damit beide denselben Wert zeigen. */
function setze(el: HTMLElement, wert: number) {
  el.textContent = ZAHL.format(wert);
  const wort = el.parentElement?.querySelector<HTMLElement>("[data-stimmwort]");
  if (!wort) return;
  const form = new Intl.PluralRules(document.documentElement.lang || "de").select(wert) === "one" ? "one" : "other";
  wort.textContent = wort.dataset[form] ?? wort.textContent;
}

/**
 * Sektion 6 (Spec TP3 8.6): "Wähl mit." und die Vermerke auf dem
 * Stimmzettel ("von euch", das "x" der eigenen Stimme) werden beim
 * Eintritt geschrieben. Am selben Trigger wachsen die Stimmbalken von links
 * (`data-stimmbalken`, origin-left, nur scaleX) und die Stimmenzahlen zählen
 * hoch (eigenes Attribut `data-stimmzahl`, Muster randnotizen.ts; vorgelesen
 * wird die sr-only-Zeile). Ohne JavaScript steht der Endzustand, beim
 * Aufräumen wieder. Die Stimmabgabe selbst bewegt sich nicht.
 */
export const abstimmung: Choreografie = ({ gsap }) => {
  const sektion = document.querySelector<HTMLElement>('[data-story="abstimmung"]');
  if (!sektion) return;
  const notizen = gsap.utils.toArray<HTMLElement>('[data-story="waehl-mit"], [data-story="vermerk"]', sektion);
  const balken = gsap.utils.toArray<HTMLElement>("[data-stimmbalken]", sektion);
  const zahlen = gsap.utils
    .toArray<HTMLElement>("[data-stimmzahl]", sektion)
    .filter((el) => Number.isFinite(Number(el.dataset.ziel)));
  if (notizen.length === 0 && balken.length === 0 && zahlen.length === 0) return;

  // Sofort auf 0: der Stimmzettel liegt beim Laden unter dem Falz.
  for (const el of zahlen) setze(el, 0);

  const ablauf = gsap.timeline({ scrollTrigger: { trigger: sektion, start: "top 70%", once: true } });
  if (notizen.length > 0) ablauf.fromTo(notizen, SCHREIBEN_AB, { ...SCHREIBEN_BIS, stagger: 0.15 }, 0);
  if (balken.length > 0) {
    ablauf.from(balken, { scaleX: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, clearProps: "transform" }, 0);
  }
  for (const [index, el] of zahlen.entries()) {
    const stand = { wert: 0 };
    ablauf.to(
      stand,
      {
        wert: Number(el.dataset.ziel),
        duration: 0.9,
        ease: "power3.out",
        onUpdate: () => {
          setze(el, Math.round(stand.wert));
        },
      },
      // Im Takt der Balken: jede Zahl startet mit ihrem Balken.
      index * 0.08,
    );
  }

  return () => {
    for (const el of zahlen) setze(el, Number(el.dataset.ziel));
  };
};
