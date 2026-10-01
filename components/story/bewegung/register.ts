import type { Choreografie } from "./typen";

/**
 * Register "Terpene und Geschmäcker" (T12, Nutzer 2026-09-29). Zwei Momente,
 * beide mit Grund: beim Eintritt legen sich die Pillen wie Karteireiter
 * nacheinander hin (Reihenfolge = Lesereihenfolge), und beim Wechsel der Tafel
 * baut sich die neue Zeile für Zeile auf, die Anteilsbalken wachsen von links
 * (zeigt, dass sich der Inhalt geändert hat). Nur transform und opacity; ohne
 * JavaScript, bei reduzierter Bewegung und im Sparmodus steht alles sofort da
 * (StoryBuehne lädt dieses Modul dann nicht).
 */
export const register: Choreografie = ({ gsap }) => {
  const sektion = document.querySelector<HTMLElement>('[data-story="register"]');
  if (!sektion) return;
  const knoepfe = gsap.utils.toArray<HTMLElement>("[data-register-knopf]", sektion);
  const tafeln = gsap.utils.toArray<HTMLElement>("[data-register-tafel]", sektion);
  if (knoepfe.length === 0 && tafeln.length === 0) return;

  const eintritt = gsap.timeline({ scrollTrigger: { trigger: sektion, start: "top 70%", once: true } });
  if (knoepfe.length > 0) {
    eintritt.from(knoepfe, { autoAlpha: 0, y: 16, duration: 0.5, ease: "power3.out", stagger: 0.03, clearProps: "all" }, 0);
  }
  const erste = tafeln.find((tafel) => tafel.hasAttribute("data-aktiv"));
  if (erste) eintritt.from(erste, { autoAlpha: 0, y: 24, duration: 0.7, ease: "power3.out", clearProps: "all" }, 0.15);

  // Tafelwechsel: RegisterAuswahl setzt data-aktiv; wir reagieren auf das Attribut,
  // damit die Insel selbst kein GSAP kennt. Beobachtet wird die ganze Sektion, weil
  // die Insel die übrigen Tafeln erst nach dem Hydrieren einhängt (nur die Starttafel
  // steht im Server-HTML).
  const laufend = new Set<gsap.core.Tween>();
  const aufbauen = (tafel: HTMLElement) => {
    const zeilen = tafel.querySelectorAll<HTMLElement>("[data-register-zeile]");
    const balken = tafel.querySelectorAll<HTMLElement>("[data-register-balken]");
    const merke = (tween: gsap.core.Tween) => {
      laufend.add(tween);
      tween.eventCallback("onComplete", () => laufend.delete(tween));
    };
    if (zeilen.length > 0) {
      merke(gsap.fromTo(zeilen, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.04, clearProps: "all" }));
    }
    if (balken.length > 0) {
      merke(gsap.fromTo(balken, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out", stagger: 0.05, delay: 0.1, clearProps: "transform" }));
    }
  };
  const beobachter = new MutationObserver((wechsel) => {
    for (const eintrag of wechsel) {
      const tafel = eintrag.target as HTMLElement;
      if (tafel.hasAttribute("data-register-tafel") && tafel.hasAttribute("data-aktiv")) aufbauen(tafel);
    }
  });
  beobachter.observe(sektion, { attributes: true, attributeFilter: ["data-aktiv"], subtree: true });

  return () => {
    beobachter.disconnect();
    for (const tween of laufend) tween.revert();
    laufend.clear();
  };
};
