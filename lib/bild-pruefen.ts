/**
 * Serverseitige Bildpruefung (T8, gemeinsamer Baustein fuer Avatare und
 * Budpics, Ruling R4, Nutzer 2026-09-29).
 *
 * Rein und ohne Request: der Client (lib/bild-verkleinern.ts) ist nicht
 * vertrauenswuerdig, deshalb entscheidet nur diese Pruefung, was in die
 * Datenbank darf. Der Typ kommt aus den Kennbytes, nie aus Dateiname oder
 * Client-MIME. SVG (aktive Inhalte) und HEIC werden nie angenommen.
 *
 * D1-Grenzen (Skill cloudflare-d1): eine Zeile darf hoechstens 2 MB gross sein,
 * eine SQL-Anweisung hoechstens 100 KB, aber gebundene Werte zaehlen nicht zur
 * Anweisungslaenge; ein BLOB ist ein einzelner Parameter. Unsere Grenzen
 * (30 KB Avatar, 150 KB Bild) liegen weit darunter.
 */
import type { Meldung } from "@/lib/i18n/typen";

export type BildTyp = "webp" | "jpeg" | "png";

export type BildPruefOptionen = {
  maxBytes: number;
  /** Erlaubte Typen; ohne Angabe nur WebP (das Ziel des Browser-Verkleinerns). */
  erlaubt?: readonly BildTyp[];
  /** Genau diese Masse verlangen. */
  breite?: number;
  hoehe?: number;
  /** Hoechstens diese Masse (Budpics: lange Kante 1280 px). */
  maxBreite?: number;
  maxHoehe?: number;
};

export type BildPruefErgebnis =
  | { ok: true; typ: BildTyp; breite: number; hoehe: number }
  | { ok: false; fehler: Meldung };

/**
 * Die RIFF-Laenge (Bytes 4 bis 7, klein-endig) muss die Datei genau umfassen:
 * eine abgeschnittene oder mit Anhang versehene Datei ist kein Bild, das wir
 * speichern (T9, Review T8). Gilt nur fuer WebP; PNG und JPEG kennen keine
 * Gesamtlaenge im Kopf. Beide sind nur auf ausdruecklichen Wunsch des
 * Aufrufers erlaubt (`erlaubt`), heute nutzt niemand das.
 */
function riffLaengeStimmt(b: Uint8Array): boolean {
  if (b.length < 12) return false;
  const laenge = new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(4, true);
  return laenge + 8 === b.length;
}

const ASCII = (bytes: Uint8Array, von: number, text: string): boolean =>
  text.length + von <= bytes.length && [...text].every((z, i) => bytes[von + i] === z.charCodeAt(0));

/** Typ aus den ersten Bytes, oder null. */
export function bildTyp(bytes: Uint8Array): BildTyp | null {
  if (ASCII(bytes, 0, "RIFF") && ASCII(bytes, 8, "WEBP")) return "webp";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    ASCII(bytes, 1, "PNG") &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  return null;
}

type Masse = { breite: number; hoehe: number };

function webpMasse(b: Uint8Array): Masse | null {
  if (ASCII(b, 12, "VP8 ") && b.length >= 30) {
    return { breite: (b[26] | (b[27] << 8)) & 0x3fff, hoehe: (b[28] | (b[29] << 8)) & 0x3fff };
  }
  if (ASCII(b, 12, "VP8L") && b.length >= 25 && b[20] === 0x2f) {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { breite: (bits & 0x3fff) + 1, hoehe: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (ASCII(b, 12, "VP8X") && b.length >= 30) {
    return { breite: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1, hoehe: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1 };
  }
  return null;
}

function pngMasse(b: Uint8Array): Masse | null {
  if (b.length < 24 || !ASCII(b, 12, "IHDR")) return null;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { breite: v.getUint32(16), hoehe: v.getUint32(20) };
}

function jpegMasse(b: Uint8Array): Masse | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    // SOF0 bis SOF15 ohne DHT (C4), JPG (C8) und DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { hoehe: (b[i + 5] << 8) | b[i + 6], breite: (b[i + 7] << 8) | b[i + 8] };
    }
    i += 2 + ((b[i + 2] << 8) | b[i + 3]);
  }
  return null;
}

export function bildPruefen(bytes: Uint8Array, optionen: BildPruefOptionen): BildPruefErgebnis {
  if (bytes.length > optionen.maxBytes) {
    return { ok: false, fehler: { schluessel: "bild.zuGross", parameter: { max: Math.round(optionen.maxBytes / 1024) } } };
  }
  const typ = bildTyp(bytes);
  if (!typ || !(optionen.erlaubt ?? ["webp"]).includes(typ)) {
    return { ok: false, fehler: { schluessel: "bild.keinBild" } };
  }
  if (typ === "webp" && !riffLaengeStimmt(bytes)) return { ok: false, fehler: { schluessel: "bild.keinBild" } };
  const masse = typ === "webp" ? webpMasse(bytes) : typ === "png" ? pngMasse(bytes) : jpegMasse(bytes);
  if (!masse || masse.breite < 1 || masse.hoehe < 1) return { ok: false, fehler: { schluessel: "bild.keinBild" } };
  if ((optionen.breite && masse.breite !== optionen.breite) || (optionen.hoehe && masse.hoehe !== optionen.hoehe)) {
    return { ok: false, fehler: { schluessel: "bild.masse" } };
  }
  if ((optionen.maxBreite && masse.breite > optionen.maxBreite) || (optionen.maxHoehe && masse.hoehe > optionen.maxHoehe)) {
    return { ok: false, fehler: { schluessel: "bild.masse" } };
  }
  return { ok: true, typ, breite: masse.breite, hoehe: masse.hoehe };
}
