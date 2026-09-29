/**
 * Bild im Browser verkleinern (T8, gemeinsamer Baustein fuer Avatare und
 * Budpics, Ruling R4, Nutzer 2026-09-29): Datei -> Canvas -> WebP. Nur im
 * Browser aufrufen. Der Server prueft das Ergebnis trotzdem erneut
 * (lib/bild-pruefen.ts): dieser Schritt spart nur Uebertragung und Speicher.
 */
import type { Meldung } from "@/lib/i18n/typen";

/** Groesser lesen wir nichts ein (Kameradateien); ein 12-MB-Foto wird abgelehnt. */
export const EINGABE_MAX_BYTES = 10 * 1024 * 1024;

export type ZuschnittRahmen = { x: number; y: number; seite: number };

/** Mittlere Quadratflaeche (wie object-fit: cover). */
export function zuschnitt(breite: number, hoehe: number): ZuschnittRahmen {
  const seite = Math.min(breite, hoehe);
  return { x: Math.floor((breite - seite) / 2), y: Math.floor((hoehe - seite) / 2), seite };
}

/** WebP-Qualitaeten von hoch nach niedrig; die erste unter dem Limit gewinnt. */
export function qualitaetsStufen(): number[] {
  return [0.85, 0.75, 0.65, 0.5, 0.35, 0.2];
}

/** Vorabpruefung ohne Dekodieren; null heisst: weiter. */
export function eingabeDateiPruefen(datei: { type: string; size: number }): Meldung | null {
  const typ = datei.type.toLowerCase();
  if (typ === "image/heic" || typ === "image/heif") return { schluessel: "bild.format" };
  if (!typ.startsWith("image/") || typ.includes("svg")) return { schluessel: "bild.keinBild" };
  if (datei.size > EINGABE_MAX_BYTES) {
    return { schluessel: "bild.eingabeGross", parameter: { max: Math.round(EINGABE_MAX_BYTES / (1024 * 1024)) } };
  }
  return null;
}

export type VerkleinernErgebnis = { ok: true; blob: Blob } | { ok: false; fehler: Meldung };

/**
 * Schneidet mittig quadratisch zu, skaliert auf `seite` x `seite` und kodiert
 * als WebP; die Qualitaet sinkt, bis das Ergebnis hoechstens `maxBytes` hat.
 */
export async function bildVerkleinern(
  datei: File,
  optionen: { seite: number; maxBytes: number },
): Promise<VerkleinernErgebnis> {
  const vorab = eingabeDateiPruefen(datei);
  if (vorab) return { ok: false, fehler: vorab };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(datei);
  } catch {
    // Nicht dekodierbar (HEIC ohne Browserunterstuetzung, beschaedigt, kein Bild).
    return { ok: false, fehler: { schluessel: "bild.format" } };
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = optionen.seite;
    canvas.height = optionen.seite;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, fehler: { schluessel: "bild.format" } };
    const z = zuschnitt(bitmap.width, bitmap.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, z.x, z.y, z.seite, z.seite, 0, 0, optionen.seite, optionen.seite);

    for (const qualitaet of qualitaetsStufen()) {
      const blob = await new Promise<Blob | null>((fertig) => canvas.toBlob(fertig, "image/webp", qualitaet));
      // Ein Browser ohne WebP-Kodierer liefert PNG; das lehnen wir hier schon ab.
      if (!blob || blob.type !== "image/webp") return { ok: false, fehler: { schluessel: "bild.format" } };
      if (blob.size <= optionen.maxBytes) return { ok: true, blob };
    }
    return { ok: false, fehler: { schluessel: "bild.zuGross", parameter: { max: Math.round(optionen.maxBytes / 1024) } } };
  } finally {
    bitmap.close();
  }
}
