/**
 * Bild im Browser verkleinern (T8, gemeinsamer Baustein fuer Avatare und
 * Budpics, Ruling R4, Nutzer 2026-09-29): Datei -> Canvas -> WebP. Nur im
 * Browser aufrufen. Der Server prueft das Ergebnis trotzdem erneut
 * (lib/bild-pruefen.ts): dieser Schritt spart nur Uebertragung und Speicher.
 */
import { skalierteMasse } from "@/lib/budpics";
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

export type VerkleinernErgebnis = { ok: true; blob: Blob; breite: number; hoehe: number } | { ok: false; fehler: Meldung };

/** Kodiert die Zeichenflaeche als WebP; die Qualitaet sinkt, bis das Ergebnis hoechstens `maxBytes` hat. */
async function alsWebp(canvas: HTMLCanvasElement, maxBytes: number): Promise<{ ok: true; blob: Blob } | { ok: false; fehler: Meldung }> {
  for (const qualitaet of qualitaetsStufen()) {
    const blob = await new Promise<Blob | null>((fertig) => canvas.toBlob(fertig, "image/webp", qualitaet));
    // Ein Browser ohne WebP-Kodierer liefert PNG; das lehnen wir hier schon ab.
    if (!blob || blob.type !== "image/webp") return { ok: false, fehler: { schluessel: "bild.format" } };
    if (blob.size <= maxBytes) return { ok: true, blob };
  }
  return { ok: false, fehler: { schluessel: "bild.zuGross", parameter: { max: Math.round(maxBytes / 1024) } } };
}

/**
 * Liest die Datei, zeichnet sie in eine Flaeche der Masse, die `masse` aus der
 * Bildgroesse bestimmt, und kodiert sie.
 */
async function verkleinern(
  datei: File,
  maxBytes: number,
  plan: (b: number, h: number) => { breite: number; hoehe: number; ausschnitt: ZuschnittRahmen | null },
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
    const p = plan(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = p.breite;
    canvas.height = p.hoehe;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { ok: false, fehler: { schluessel: "bild.format" } };
    ctx.imageSmoothingQuality = "high";
    if (p.ausschnitt) {
      const z = p.ausschnitt;
      ctx.drawImage(bitmap, z.x, z.y, z.seite, z.seite, 0, 0, p.breite, p.hoehe);
    } else {
      ctx.drawImage(bitmap, 0, 0, p.breite, p.hoehe);
    }
    const kodiert = await alsWebp(canvas, maxBytes);
    return kodiert.ok ? { ok: true, blob: kodiert.blob, breite: p.breite, hoehe: p.hoehe } : kodiert;
  } finally {
    bitmap.close();
  }
}

/** Schneidet mittig quadratisch zu, skaliert auf `seite` x `seite` und kodiert als WebP (Avatar). */
export function bildVerkleinern(datei: File, optionen: { seite: number; maxBytes: number }): Promise<VerkleinernErgebnis> {
  return verkleinern(datei, optionen.maxBytes, (b, h) => ({
    breite: optionen.seite,
    hoehe: optionen.seite,
    ausschnitt: zuschnitt(b, h),
  }));
}

/** Behaelt das Seitenverhaeltnis, lange Kante hoechstens `maxKante` (Budpics), kein Zuschnitt. */
export function bildVerkleinernFrei(datei: File, optionen: { maxKante: number; maxBytes: number }): Promise<VerkleinernErgebnis> {
  return verkleinern(datei, optionen.maxBytes, (b, h) => ({ ...skalierteMasse(b, h, optionen.maxKante), ausschnitt: null }));
}
