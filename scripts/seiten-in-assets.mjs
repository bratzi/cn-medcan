import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Verschiebt vorgerenderte Leseseiten in die Static Assets (Spec 2026-10-21, Seiten aus Assets, 3.1).
 * Jede Seite wird zu <pfad>/index.html, passend zu lib/seiten-tor.ts; eine Datei je Strain (seit
 * 2026-10-22, ca. 854 statt 3064). Die Seiten fliegen aus dem KV-Vorrat: sonst kostet jeder Deploy Schreibvorgänge.
 */
const FEST = /^(de|en)(\/(blueten(\/[a-z0-9-]+)?|neu|jury(\/[a-z0-9-]+)*|reviews(\/[a-z0-9-]+)*))?\.html$/;

/** Im Workers Build ohne Leseseiten abbrechen: sonst fiele jede Seite auf den teuren Weg. */
export function keineLeseseiten(env, anzahl) {
  return env.WORKERS_CI === "1" && anzahl === 0;
}

export function planeVerschiebung(dateien) {
  const plan = [];
  for (const quelle of dateien) {
    if (FEST.test(quelle)) plan.push({ quelle, ziel: `_seiten/${quelle.replace(/\.html$/, "")}/index.html` });
  }
  return plan;
}

function alleHtml(wurzel) {
  const aus = [];
  const lauf = (ordner) => {
    for (const name of readdirSync(ordner)) {
      const pfad = join(ordner, name);
      if (statSync(pfad).isDirectory()) lauf(pfad);
      else if (name.endsWith(".html")) aus.push(relative(wurzel, pfad).split("\\").join("/"));
    }
  };
  lauf(wurzel);
  return aus;
}

export function verschiebe(projekt) {
  const quelle = join(projekt, ".next/server/app");
  const assets = join(projekt, ".open-next/assets");
  const plan = planeVerschiebung(alleHtml(quelle));
  for (const { quelle: q, ziel } of plan) {
    const nach = join(assets, ziel);
    mkdirSync(dirname(nach), { recursive: true });
    copyFileSync(join(quelle, q), nach);
  }
  entferneAusKvVorrat(projekt, plan);
  return { anzahl: plan.length };
}

function entferneAusKvVorrat(projekt, plan) {
  const cache = join(projekt, ".open-next/cache");
  let builds;
  try {
    builds = readdirSync(cache);
  } catch {
    return;
  }
  for (const build of builds) {
    for (const { quelle } of plan) {
      rmSync(join(cache, build, quelle.replace(/\.html$/, ".cache")), { force: true });
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { anzahl } = verschiebe(process.cwd());
  console.log(`[seiten] ${anzahl} Leseseiten nach .open-next/assets/_seiten`);
  if (keineLeseseiten(process.env, anzahl)) {
    console.error("[seiten] FEHLER: keine Leseseiten, Abbruch, die alte Version bleibt live");
    process.exit(1);
  }
  if (anzahl === 0) console.warn("[seiten] WARNUNG: keine Leseseiten gefunden (lokal ohne Vorrendern ok)");
  if (anzahl > 19000) {
    console.error("[seiten] mehr als 19 000 Dateien, Grenze 20 000 je Version");
    process.exit(1);
  }
}
