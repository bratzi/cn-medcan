import type { PubloraZeile } from "@/lib/publora-sync";

/** Admin-Kalender aus dem Publora-Spiegel (Spec 2026-10-16): Liste nach Berliner Tag, kein Monatsraster. Rein. */
export type KalenderTag = { tag: string; posts: PubloraZeile[] };
export type Kalender = { kommend: KalenderTag[]; entwuerfe: PubloraZeile[]; entwuerfeGesamt: number; vergangen: PubloraZeile[]; veraltet: boolean; stand: string | null };

const TAG = 24 * 60 * 60 * 1000;
// Intl einmal je Isolate.
const BERLIN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });

export function berlinTag(iso: string): string {
  return BERLIN.format(new Date(iso));
}

const zeit = (p: PubloraZeile) => Date.parse(p.geplantAm ?? "");

export function kalenderBauen(zeilen: PubloraZeile[], stand: string | null, jetzt: Date = new Date()): Kalender {
  const t = jetzt.getTime();
  const kommendeListe = zeilen
    .filter((p) => p.status !== "published" && p.geplantAm && zeit(p) >= t && zeit(p) < t + 14 * TAG)
    .sort((a, b) => zeit(a) - zeit(b));
  const kommend: KalenderTag[] = [];
  for (const p of kommendeListe) {
    const tag = berlinTag(p.geplantAm!);
    const letzter = kommend.at(-1);
    if (letzter?.tag === tag) letzter.posts.push(p);
    else kommend.push({ tag, posts: [p] });
  }
  const alleEntwuerfe = zeilen.filter((p) => p.status === "draft" && !p.geplantAm);
  const vergangen = zeilen
    .filter((p) => (p.status === "published" || p.status === "failed") && p.geplantAm && zeit(p) < t && zeit(p) >= t - 7 * TAG)
    .sort((a, b) => zeit(b) - zeit(a) || a.id.localeCompare(b.id));
  const veraltet = !stand || Number.isNaN(Date.parse(stand)) || t - Date.parse(stand) > 2 * TAG;
  return { kommend, entwuerfe: alleEntwuerfe.slice(0, 10), entwuerfeGesamt: alleEntwuerfe.length, vergangen, veraltet, stand };
}
