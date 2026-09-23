/**
 * Laeuft nach `opennextjs-cloudflare build` und vor jedem Deploy (siehe
 * package.json: cf-build, preview, deploy).
 *
 * OpenNext (1.20.6) liest beim Build die .env-Dateien des Projekts und legt
 * ihre Werte im Klartext in .open-next/cloudflare/next-env.mjs ab - fuer alle
 * drei Modi, also auch alles aus .env.local. Beim Deploy buendelt wrangler die
 * Datei in den Worker, und zur Laufzeit fuellt sie jede Variable, die nicht als
 * Secret gesetzt ist (`process.env[key] ??= ...` in OpenNexts init.js). Ohne
 * diesen Schritt laegen die lokalen Secrets im hochgeladenen Code, und ein
 * lokal gesetztes FACHKREIS_PASSWORD waere live aktiv. Einen Schalter dafuer
 * hat OpenNext nicht.
 *
 * 1. next-env.mjs neu schreiben, nur mit NEXT_PUBLIC_*. Die sind ohnehin
 *    oeffentlich und von Next beim Build schon eingesetzt.
 * 2. Die gesamte Build-Ausgabe nach jedem Wert aus den lokalen Env-Dateien
 *    durchsuchen. Ein Treffer bricht mit Exit-Code 1 ab - dann darf nicht
 *    deployt werden. Ausgegeben werden nur Dateipfad und Variablenname, nie
 *    ein Wert.
 *
 * Secrets fuer den Worker kommen ausschliesslich ueber `wrangler secret put`.
 * `npm run preview` braucht next-env.mjs nicht: wrangler laedt dort selbst
 * .dev.vars bzw., wenn die fehlt, .env und .env.local - nur lokal, nie beim
 * Deploy.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseEnv } from "node:util";

const AUSGABE = ".open-next";
const NEXT_ENV = join(AUSGABE, "cloudflare", "next-env.mjs");
const OEFFENTLICH = "NEXT_PUBLIC_";

// Kuerzere Werte (leer, "true", Ports) wuerden ueberall zufaellig treffen und
// sind keine Secrets.
const MINDESTLAENGE = 8;

function lokaleEnvDateien() {
  const dateien = readdirSync(".").filter(
    (name) => name.startsWith(".env") && !name.endsWith(".example")
  );
  if (existsSync(".dev.vars")) dateien.push(".dev.vars");
  return dateien;
}

/** Name -> Wert fuer alles, was nicht NEXT_PUBLIC_ ist. */
function geheimeWerte() {
  const werte = new Map();
  for (const datei of lokaleEnvDateien()) {
    const eintraege = parseEnv(readFileSync(datei, "utf8"));
    for (const [name, wert] of Object.entries(eintraege)) {
      if (name.startsWith(OEFFENTLICH) || wert.length < MINDESTLAENGE) continue;
      werte.set(`${datei}:${name}`, wert);
    }
  }
  return werte;
}

async function nextEnvBereinigen() {
  if (!existsSync(NEXT_ENV)) {
    throw new Error(`${NEXT_ENV} fehlt - lief "opennextjs-cloudflare build" durch?`);
  }
  const modul = await import(pathToFileURL(NEXT_ENV).href);
  let inhalt = "// Bereinigt von scripts/bundle-env-bereinigen.mjs: nur NEXT_PUBLIC_*.\n";
  for (const [modus, variablen] of Object.entries(modul)) {
    const oeffentlich = Object.fromEntries(
      Object.entries(variablen).filter(([name]) => name.startsWith(OEFFENTLICH))
    );
    inhalt += `export const ${modus} = ${JSON.stringify(oeffentlich)};\n`;
  }
  writeFileSync(NEXT_ENV, inhalt);
}

// node_modules in der Ausgabe sind unveraenderte Kopien installierter Pakete
// und koennen keine Werte aus .env-Dateien enthalten. Seit der Prisma-Client
// ueber Turbopacks Wasm-Lader rund 30.000 Dateien in die Build-Spur zieht,
// kopiert OpenNext dort Hunderte Pakete samt Binaerdateien hinein; sie
// Byte fuer Byte zu lesen dauerte ueber zehn Minuten. Geprueft wird alles,
// was der Build erzeugt: next-env.mjs, Chunks, handler.mjs, Assets.
function* alleDateien(ordner) {
  for (const name of readdirSync(ordner)) {
    const pfad = join(ordner, name);
    const info = statSync(pfad);
    if (info.isDirectory()) {
      if (name !== "node_modules") yield* alleDateien(pfad);
    } else if (info.isFile()) yield pfad;
  }
}

function ausgabeDurchsuchen(werte) {
  const treffer = [];
  for (const pfad of alleDateien(AUSGABE)) {
    const inhalt = readFileSync(pfad);
    for (const [herkunft, wert] of werte) {
      if (inhalt.includes(wert)) treffer.push(`${pfad}  <-  ${herkunft}`);
    }
  }
  return treffer;
}

await nextEnvBereinigen();

const werte = geheimeWerte();
const treffer = ausgabeDurchsuchen(werte);
if (treffer.length > 0) {
  console.error("Lokale Secrets stehen in der Build-Ausgabe - NICHT deployen:");
  for (const zeile of treffer) console.error(`  ${zeile}`);
  process.exit(1);
}
console.log(
  `Build-Ausgabe geprueft: keiner von ${werte.size} lokalen Secret-Werten gefunden, ` +
    "next-env.mjs enthaelt nur NEXT_PUBLIC_*."
);
