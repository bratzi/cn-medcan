/**
 * Lage der Terpen-Karte über dem Band (TerpenBandKarte, Nutzer 2026-10-09): die
 * Karte hängt mittig unter dem Symbol, das der Zeiger berührt, und bleibt
 * mindestens `rand` Pixel vom Fensterrand entfernt. Der Pfeil zeigt immer auf
 * die Mitte des Symbols, auch wenn die Karte am Rand geklemmt ist. Nach oben
 * klappt sie nie: über dem Band steht der Hero, darunter ist immer Platz.
 */
export type SymbolRechteck = {
  readonly links: number;
  readonly oben: number;
  readonly breite: number;
  readonly hoehe: number;
};

export type KartenLage = {
  /** Linke Kante der Karte im Fenster. */
  readonly links: number;
  /** Obere Kante der Karte im Fenster. */
  readonly oben: number;
  /** Breite der Karte; schmaler als gewünscht nur in sehr engen Fenstern. */
  readonly breite: number;
  /** Mitte des Pfeils, gemessen von der linken Kante der Karte. */
  readonly pfeil: number;
};

export const KARTE_BREITE = 288;
export const KARTE_RAND = 16;
/** Abstand zwischen Symbol und Kartenkante; der Pfeil ragt in diesen Abstand. */
export const KARTE_ABSTAND = 16;
/** Der Pfeil bleibt so weit von den Kartenecken weg, dass er nie über die Kante steht. */
const PFEIL_RAND = 24;

export function kartenLage(
  symbol: SymbolRechteck,
  fensterBreite: number,
  wunschBreite = KARTE_BREITE,
  rand = KARTE_RAND,
): KartenLage {
  const breite = Math.max(0, Math.min(wunschBreite, fensterBreite - 2 * rand));
  const mitte = symbol.links + symbol.breite / 2;
  const links = Math.min(Math.max(mitte - breite / 2, rand), fensterBreite - rand - breite);
  const pfeil = Math.min(Math.max(mitte - links, PFEIL_RAND), breite - PFEIL_RAND);
  return { links, oben: symbol.oben + symbol.hoehe + KARTE_ABSTAND, breite, pfeil };
}
