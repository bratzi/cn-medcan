/**
 * Reine Logik des Buchs zum Blättern (Masterplan Bewertung v2, T7, Nutzer
 * 2026-09-29): Reihenfolge der Seiten, Ziel und Richtung eines Umblätterns,
 * Klick, Wischen und Tasten, und wann das Autoplay laufen darf. Die Bühne
 * dazu steht in components/review/Buch.tsx.
 */

/** Autoplay: alle 8 s eine Seite weiter. */
export const AUTO_MS = 8000;

/** Wischen: ab dieser Strecke (px) zählt die Geste immer. */
const WISCH_STRECKE = 48;
/** Ein schneller, kurzer Wisch zählt ab dieser Strecke (px) … */
const WISCH_KURZ = 24;
/** … wenn er mindestens so schnell ist (px/ms; ein Zittern ist langsamer oder kürzer). */
const WISCH_TEMPO = 0.3;

/** 1 = weiter (nach hinten im Buch), -1 = zurück. */
export type Richtung = 1 | -1;

/**
 * Alle freigegebenen Bewertungen einer Sorte als Seiten: erst die des
 * Betreibers (istRedaktionell, Rolle ADMIN), dann die der Community, in
 * jeder Gruppe die neueste zuerst. Die Eingabe bleibt unverändert.
 */
export function buchReihenfolge<T extends { istRedaktionell: boolean; erstelltAm: Date }>(reviews: readonly T[]): T[] {
  return [...reviews].sort(
    (a, b) =>
      Number(b.istRedaktionell) - Number(a.istRedaktionell) || b.erstelltAm.getTime() - a.erstelltAm.getTime(),
  );
}

/** Blättern von Hand: die Nachbarseite, an den Rändern null (das Buch hat einen Anfang und ein Ende). */
export function zielSeite(index: number, anzahl: number, richtung: Richtung): number | null {
  const ziel = index + richtung;
  return ziel >= 0 && ziel < anzahl ? ziel : null;
}

/** Autoplay: eine Seite weiter, nach der letzten wieder die erste. */
export function autoZiel(index: number, anzahl: number): number {
  return (index + 1) % anzahl;
}

/**
 * Liegt die Seite nah an der aufgeschlagenen (sie selbst oder ein Nachbar,
 * über das Ende hinweg, weil das Autoplay von der letzten auf die erste
 * springt)? Nur solche Seiten tragen die teure Aroma-Karte: der Server rendert
 * so höchstens drei statt bis zu zwanzig (CPU-Limit Free 10 ms).
 */
export function nahSeite(seite: number, index: number, anzahl: number): boolean {
  const abstand = Math.abs(seite - index);
  return Math.min(abstand, anzahl - abstand) <= 1;
}

/** Richtung der Drehung aus Start und Ziel; der Sprung von der letzten auf die erste blättert zurück. */
export function drehRichtung(von: number, nach: number): Richtung {
  return nach > von ? 1 : -1;
}

/** Klick links vom Falz (der Mitte des Buchs) heißt zurück, ab der Mitte weiter. */
export function klickRichtung(x: number, links: number, breite: number): Richtung {
  return x < links + breite / 2 ? -1 : 1;
}

/**
 * Wischgeste aus Weg (dx, dy in px) und Dauer (ms): nur waagerecht (die
 * Senkrechte ist höchstens halb so lang), ab 48 px oder als schneller Wisch
 * ab 24 px. Nach links heißt weiter, nach rechts zurück; sonst null.
 */
export function wischRichtung(dx: number, dy: number, ms: number): Richtung | null {
  const weg = Math.abs(dx);
  if (Math.abs(dy) > weg / 2) return null;
  const schnell = weg >= WISCH_KURZ && weg / Math.max(ms, 1) >= WISCH_TEMPO;
  if (weg < WISCH_STRECKE && !schnell) return null;
  return dx < 0 ? 1 : -1;
}

/**
 * Sprungziel aus der Adresse (#eintrag-…, etwa "Ganzen Eintrag lesen" auf
 * /reviews): die Seite, die diesen Anker trägt, sonst null.
 */
export function ankerSeite(hash: string, anker: readonly string[]): number | null {
  if (!hash.startsWith("#")) return null;
  let ziel: string;
  try {
    ziel = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
  const seite = anker.indexOf(ziel);
  return seite >= 0 ? seite : null;
}

/** Pfeil links zurück, Pfeil rechts weiter. */
export function tastenRichtung(taste: string): Richtung | null {
  if (taste === "ArrowLeft") return -1;
  if (taste === "ArrowRight") return 1;
  return null;
}

export type AutoLage = {
  anzahl: number;
  /** Wunsch am Play/Pause-Knopf. */
  laeuft: boolean;
  /** Sparmodus oder prefers-reduced-motion. */
  ruhe: boolean;
  /** Maus über dem Buch. */
  zeiger: boolean;
  /** Fokus im Buch. */
  fokus: boolean;
  /** document.hidden */
  verborgen: boolean;
  /** Das Buch steht im Bild; außerhalb soll es nicht weiterblättern. */
  imBild: boolean;
};

/** Autoplay läuft nur mit mehr als einer Seite, auf Wunsch, in Ruhe gelassen und im Bild. */
export function autoBlaettern(lage: AutoLage): boolean {
  return (
    lage.anzahl > 1 && lage.laeuft && !lage.ruhe && !lage.zeiger && !lage.fokus && !lage.verborgen && lage.imBild
  );
}

export type Haelfte = "links" | "rechts";
/** transform-origin am Falz: die rechte Hälfte dreht um ihre linke Kante, die linke um ihre rechte. */
type Falz = "left" | "right";

const FALZ: Record<Haelfte, Falz> = { links: "right", rechts: "left" };

/**
 * Wie ein Blatt umschlägt, als zwei Viertel einer halben Drehung: erst hebt
 * sich die vordere Hälfte der alten Doppelseite bis hochkant (±90°), dann
 * legt sich die hintere Hälfte der neuen aus der Hochkante auf. Die freie
 * Kante kommt dabei auf den Betrachter zu (rotateY negativ für die rechte,
 * positiv für die linke Hälfte). Rückwärts ist alles gespiegelt.
 */
export function blaetterPlan(richtung: Richtung): {
  hebt: { haelfte: Haelfte; bis: number; falz: Falz };
  legt: { haelfte: Haelfte; von: number; falz: Falz };
} {
  const vorn: Haelfte = richtung === 1 ? "rechts" : "links";
  const hinten: Haelfte = richtung === 1 ? "links" : "rechts";
  return {
    hebt: { haelfte: vorn, bis: -90 * richtung, falz: FALZ[vorn] },
    legt: { haelfte: hinten, von: 90 * richtung, falz: FALZ[hinten] },
  };
}
