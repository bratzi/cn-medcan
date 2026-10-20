import { SPRACHEN, type Sprache } from "./sprache-kern";

/**
 * generateStaticParams der statischen Seiten (Plan 2026-10-20 Vorrendern, Task 1).
 *
 * Mit VORRENDERN=1 rendert der Build beide Sprachen vor, und `opennextjs-cloudflare deploy`
 * legt sie in KV: nach einem Deploy baut kein Besucher-Request eine Seite (Free-Plan,
 * 10 ms CPU je Anfrage). scripts/cf-build.mjs setzt VORRENDERN nur, wenn die lokale D1
 * den Live-Abzug trägt. Ohne Daten bleibt es wie bisher: keine Pfade, die Seite entsteht
 * beim ersten Aufruf. Eine Seite mit leerer Datenbank wird nie vorgerendert.
 */
export function sprachParameter(): { lang: Sprache }[] {
  return process.env.VORRENDERN === "1" ? SPRACHEN.map((lang) => ({ lang })) : [];
}
