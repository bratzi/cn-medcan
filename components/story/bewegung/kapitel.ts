import { SCHREIBEN_AB, SCHREIBEN_BIS } from "./schreiben";
import type { Choreografie } from "./typen";

/** Gedruckt deckt sich von links auf; geschrieben wird nur die Handschrift. */
const NAME_AB = { clipPath: "inset(-10% 100% -10% 0%)" };
const NAME_BIS = { clipPath: "inset(-10% 0% -10% 0%)", duration: 0.9, ease: "power3.out", clearProps: "clipPath" };

/**
 * Sektion „Dein Kapitel“ (Spec Dein Kapitel 5): der Name deckt sich auf, die Wörter der Randnotizen
 * schreiben sich nacheinander; das Netz zeichnet sich per CSS ein ([data-netz-erscheinen]).
 * Die Insel kann das Schaufenster jederzeit gegen das eigene Kapitel tauschen. Deshalb werden die
 * Ausgangszustände nur an den Knoten gesetzt, die beim Start da sind, und im onEnter nur die
 * animiert, die noch im Dokument hängen. Getauschte Knoten kommen ohne Clip und stehen sofort.
 */
export const kapitel: Choreografie = ({ gsap, ScrollTrigger }) => {
  const sektion = document.querySelector<HTMLElement>('[data-story="kapitel"]');
  if (!sektion) return;
  const name = gsap.utils.toArray<HTMLElement>('[data-story="kapitel-name"]', sektion);
  const woerter = gsap.utils.toArray<HTMLElement>('[data-story="kapitel-wort"]', sektion);
  gsap.set(name, NAME_AB);
  gsap.set(woerter, SCHREIBEN_AB);

  let ablauf: ReturnType<typeof gsap.timeline> | null = null;
  const ausloeser = ScrollTrigger.create({
    trigger: sektion,
    start: "top 70%",
    once: true,
    onEnter: () => {
      const n = name.filter((el) => el.isConnected);
      const w = woerter.filter((el) => el.isConnected);
      ablauf = gsap.timeline();
      if (n.length) ablauf.fromTo(n, NAME_AB, NAME_BIS);
      if (w.length) ablauf.fromTo(w, SCHREIBEN_AB, { ...SCHREIBEN_BIS, stagger: 0.2 }, n.length ? "-=0.4" : 0);
    },
  });

  return () => {
    ausloeser.kill();
    ablauf?.kill();
    gsap.set([...name, ...woerter], { clearProps: "clipPath" });
  };
};
