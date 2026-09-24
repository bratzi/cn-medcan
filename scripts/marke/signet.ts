/**
 * Erzeugt das Signet "gB" aus der Schriftdatei (Spec TP3 6): Glyphen der
 * Inspiration in violett-500 auf neutral-100, quadratisch, nicht gezeichnet.
 * Einmal zur Entwicklungszeit, nie im Request-Pfad.
 *
 *   npx tsx scripts/marke/signet.ts
 *
 * Satori (über next/og) setzt die Glyphen, sharp skaliert. Ergebnis:
 * app/icon.png (512), app/apple-icon.png (180), app/favicon.ico (32 und 16)
 * und assets/marke/signet-1080.png für das Instagram-Profilbild.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { createElement } from "react";
import sharp from "sharp";

import { linearZuHex, oklchZuLinearSrgb } from "../farben/oklch.mjs";
import { icoAusPngs } from "./ico";

const KANTE = 1080;
/** Schriftgröße relativ zur Kante: "gB" mit Luft rundum. Nur diesen Wert und VERSATZ anpassen. */
const SCHRIFTGROESSE = Math.round(KANTE * 0.62);
/** Senkrechte Korrektur in px: die Schreibschrift sitzt in ihrer Zeilenbox oft zu hoch. */
const VERSATZ = 0;

/** Farben aus denselben OKLCH-Werten wie globals.css (Primitive violett-500, neutral-100). */
const VIOLETT_500 = linearZuHex(oklchZuLinearSrgb(0.52, 0.2, 305));
const NEUTRAL_100 = linearZuHex(oklchZuLinearSrgb(0.935, 0.006, 165));

function schreibe(pfad: string, inhalt: Buffer) {
  writeFileSync(join(process.cwd(), pfad), inhalt);
  console.log(`${pfad.padEnd(32)} ${Math.round(inhalt.length / 1024)} KB`);
}

async function main() {
  const schrift = readFileSync(join(process.cwd(), "assets/marke/Inspiration-Regular.ttf"));
  const antwort = new ImageResponse(
    createElement(
      "div",
      {
        style: {
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: NEUTRAL_100,
          color: VIOLETT_500,
          fontFamily: "Inspiration",
          fontSize: SCHRIFTGROESSE,
          lineHeight: 1,
          paddingTop: VERSATZ,
        },
      },
      "gB",
    ),
    { width: KANTE, height: KANTE, fonts: [{ name: "Inspiration", data: schrift, weight: 400, style: "normal" }] },
  );
  const gross = Buffer.from(await antwort.arrayBuffer());
  const png = (kante: number) => sharp(gross).resize(kante, kante).png({ compressionLevel: 9 }).toBuffer();

  schreibe("assets/marke/signet-1080.png", gross);
  schreibe("app/icon.png", await png(512));
  schreibe("app/apple-icon.png", await png(180));
  schreibe(
    "app/favicon.ico",
    icoAusPngs([
      { kante: 32, png: await png(32) },
      { kante: 16, png: await png(16) },
    ]),
  );
}

main().catch((fehler) => {
  console.error(fehler);
  process.exit(1);
});
