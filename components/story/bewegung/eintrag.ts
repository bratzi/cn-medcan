import type { Choreografie } from "./typen";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Sektion 5: die Doppelseite schlaegt auf (clip-path von der Mitte), die
 * Noten zaehlen einmal hoch (Spec 5.1). Die Ziffern sind aria-hidden, der
 * Endwert steht als sr-only-Text daneben; beim Aufraeumen stehen wieder die
 * Endwerte da.
 */
export const eintrag: Choreografie = ({ gsap }) => {
  const seite = document.querySelector<HTMLElement>('[data-story="doppelseite"]');
  if (!seite) return;
  const zaehler = gsap.utils
    .toArray<HTMLElement>("[data-zaehler]")
    .filter((el) => Number.isFinite(Number(el.dataset.ziel)));

  const ablauf = gsap.timeline({ scrollTrigger: { trigger: seite, start: "top 75%", once: true } });
  ablauf
    .call(() => {
      for (const el of zaehler) el.textContent = NOTE.format(0);
    })
    .from(seite, { clipPath: "inset(0 50% 0 50%)", duration: 1.1, ease: "power3.inOut" });

  for (const el of zaehler) {
    const stand = { wert: 0 };
    ablauf.to(
      stand,
      {
        wert: Number(el.dataset.ziel),
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = NOTE.format(stand.wert);
        },
      },
      "<0.2",
    );
  }

  return () => {
    for (const el of zaehler) el.textContent = NOTE.format(Number(el.dataset.ziel));
  };
};
