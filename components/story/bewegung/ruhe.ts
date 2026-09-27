/**
 * Story-Sektionen ausserhalb des Bildes ruhen: ein IntersectionObserver
 * (Muster loops.ts, 200 px Vorlauf) setzt `data-ruhend`, globals.css haelt
 * darin alle CSS-Animationen an (Blob-Morph, Glanz, Puls, Konturen). So
 * rechnet der Browser keine Endlosschleifen, die niemand sieht; 200 px vor
 * dem Eintritt laufen sie wieder, ohne dass man den Wechsel sieht.
 *
 * Nur Sektionen mit `data-story`: der Kopf liegt ausserhalb und ruht nie.
 * Ohne JavaScript und bei reduzierter Bewegung (dann laedt die Buehne nicht)
 * setzt niemand das Attribut, und alles laeuft wie bisher.
 */
export function beobachteRuhe(): () => void {
  const sektionen = [...document.querySelectorAll<HTMLElement>("section[data-story]")];
  const beobachter = new IntersectionObserver(
    (eintraege) => {
      for (const eintrag of eintraege) eintrag.target.toggleAttribute("data-ruhend", !eintrag.isIntersecting);
    },
    { rootMargin: "200px 0px" },
  );
  for (const sektion of sektionen) beobachter.observe(sektion);

  return () => {
    beobachter.disconnect();
    for (const sektion of sektionen) sektion.removeAttribute("data-ruhend");
  };
}
