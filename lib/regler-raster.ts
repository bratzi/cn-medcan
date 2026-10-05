/**
 * Raster der Regler in der Bewertungsmaske (T5c, Nutzer 2026-09-30): Zeiger und
 * Pfeiltasten müssen den Community-Wert wieder treffen, auch wenn er zwischen zwei
 * Rasterstufen liegt (z. B. 2,37 bei Schritt 0,5). Vorher sprang der Regler drüber.
 */
export type Raster = {
  schritt: number;
  max: number;
  min?: number;
  /** Community-Wert (Ring), auf den der Regler einrastet. */
  ziel?: number;
};

// Drei Nachkommastellen reichen und nehmen Gleitkommareste wie 0,30000000000000004.
const glatt = (wert: number) => Math.round(wert * 1000) / 1000;
const EPS = 1e-9;

function grenzen(wert: number, { min = 0, max }: Raster) {
  return Math.min(Math.max(wert, min), max);
}

/**
 * Wert unter dem Zeiger: die nächste Rasterstufe, oder das Ziel, wenn es näher liegt
 * (höchstens einen halben Schritt entfernt). So bleiben Ziel und beide Nachbarstufen
 * treffbar; ein fester Einrastbereich hätte bei feinem Raster die Nachbarn verschluckt.
 */
export function rasten(roh: number, raster: Raster): number {
  const wert = grenzen(roh, raster);
  const stufe = grenzen(glatt(Math.round(wert / raster.schritt) * raster.schritt), raster);
  const { ziel } = raster;
  if (ziel !== undefined && Math.abs(wert - ziel) < Math.abs(wert - stufe) + EPS) return ziel;
  return stufe;
}

/**
 * Neuer Wert für eine Taste (Pfeile ± eine Stufe, Pos1/Ende an die Grenzen), sonst null.
 * Liegt das Ziel zwischen dem Wert und der nächsten Stufe, landet der Pfeil erst dort.
 */
export function tasteZuWert(taste: string, wert: number, raster: Raster): number | null {
  const { schritt, min = 0, max, ziel } = raster;
  if (taste === "Home") return min;
  if (taste === "End") return max;
  const richtung = taste === "ArrowRight" || taste === "ArrowUp" ? 1 : taste === "ArrowLeft" || taste === "ArrowDown" ? -1 : 0;
  if (richtung === 0) return null;
  const naechste = grenzen(
    glatt(richtung > 0 ? (Math.floor(wert / schritt + EPS) + 1) * schritt : (Math.ceil(wert / schritt - EPS) - 1) * schritt),
    raster,
  );
  if (ziel !== undefined && (ziel - wert) * richtung > EPS && (naechste - ziel) * richtung > EPS) return ziel;
  return naechste;
}
