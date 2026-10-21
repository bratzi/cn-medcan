import { vorbelegungAus, type GespeicherteBewertung } from "./bewertung-vorbelegung";
import { SORTEN_AROMA_SQL, sortenAusZeilen, TERPENE_SQL, type SortenAromaZeile, type TerpenZeile } from "./empfehlung";
import { ichStrain } from "./ich-strain";
import { liveNetzBasis, type LiveNetzBasis } from "./live-netz";
import { noteOderErsatz } from "./profil";
import { parseGeschmacksMatrix, parseTerpenIntensitaet } from "./query/bewertung";

/**
 * Persönliche Insel /api/ich/strain ohne Next (Spec 2026-10-21, 3.3; HANDOFF S87): Next + Prisma kosteten
 * live 623 ms CPU je Anfrage. Hier dieselbe Antwort aus rohen D1-Abfragen. Vertrag: lib/ich-strain.ts
 * und app/api/ich/strain/route.ts. Relative Importe, weil worker.mjs diese Datei über lib/tor.ts bündelt.
 */

type Stmt = {
  bind(...werte: unknown[]): Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
};
export type D1Roh = { prepare(sql: string): Stmt; batch<T = unknown>(liste: Stmt[]): Promise<{ results: T[] }[]> };

export type InselEnv = { DB?: D1Roh; BETTER_AUTH_SECRET?: string };

const KOPF = { "Cache-Control": "private, no-store" };
const ID = /^[A-Za-z0-9-]{1,64}$/;
/** Wie lib/query/profil.ts (BEWERTUNGEN_HOECHSTENS). */
const BEWERTUNGEN_HOECHSTENS = 1000;

// lib/auth.ts: useSecureCookies in Produktion → __Secure-Präfix; lokal ohne. Better Auth liest nur diesen Namen.
const SITZUNGS_COOKIES = ["__Secure-better-auth.session_token", "better-auth.session_token"];

/**
 * Sitzungstoken aus dem signierten Cookie, geprüft wie better-call getSignedCookie:
 * Wert `token.signatur` (URL-kodiert), Signatur = Base64(HMAC-SHA256(secret, token)), 44 Zeichen.
 */
export async function sitzungsToken(cookies: Map<string, string>, secret: string): Promise<string | null> {
  for (const name of SITZUNGS_COOKIES) {
    const roh = cookies.get(name);
    if (!roh) continue;
    let wert: string;
    try {
      wert = decodeURIComponent(roh);
    } catch {
      return null;
    }
    const punkt = wert.lastIndexOf(".");
    if (punkt < 1) return null;
    const token = wert.slice(0, punkt);
    const signatur = wert.slice(punkt + 1);
    if (signatur.length !== 44 || !signatur.endsWith("=")) return null;
    try {
      const bytes = Uint8Array.from(atob(signatur), (c) => c.charCodeAt(0));
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
      // subtle.verify vergleicht in konstanter Zeit.
      return (await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(token))) ? token : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Prisma schreibt DateTime als ISO-Text mit Offset; ältere Zeilen können Millisekunden als Zahl tragen (db/README.md). */
function alsDatum(wert: unknown): Date | null {
  const d = typeof wert === "number" ? new Date(wert) : typeof wert === "string" ? new Date(/^\d+$/.test(wert) ? Number(wert) : wert) : null;
  return d && Number.isFinite(d.getTime()) ? d : null;
}

const istWahr = (w: unknown) => w === 1 || w === true || w === "1";
const zahlOderNull = (w: unknown) => (w === null || w === undefined ? null : Number(w));

type SitzungsZeile = { expiresAt: unknown; mid: string | null; freigegeben: unknown; rolle: string | null };

async function mitgliedAusSitzung(db: D1Roh, token: string) {
  const z = await db
    .prepare(
      `SELECT s.expiresAt AS expiresAt, m.id AS mid, m.freigegeben AS freigegeben, m.rolle AS rolle
       FROM session s JOIN user u ON u.id = s.userId LEFT JOIN mitglied m ON m.user_id = u.id
       WHERE s.token = ? LIMIT 1`,
    )
    .bind(token)
    .first<SitzungsZeile>();
  if (!z) return null;
  const ablauf = alsDatum(z.expiresAt);
  if (!ablauf || ablauf.getTime() <= Date.now()) return null;
  // Ohne Mitgliedssatz legt Next ihn ohne Freigabe an; hier nur lesen, Antwort ist dieselbe („mitglied“).
  if (!z.mid) return { mitgliedId: "", freigegeben: false, rolle: "MITGLIED" };
  return { mitgliedId: z.mid, freigegeben: istWahr(z.freigegeben), rolle: z.rolle ?? "MITGLIED" };
}

const EIGENE_SQL = `SELECT r.strain_id AS strainId, r.ware_genau AS wareGenau, r.aussehen, r.geruch, r.geschmack, r.wirkung,
    r.konsistenz, r.gesamtnote, r.feuchtigkeit_prozent AS feuchtigkeitProzent, r.geschmacks_matrix AS geschmacksMatrix,
    r.terpen_intensitaet AS terpenIntensitaet, r.beschaffenheit, r.notiz, r.instagram_reel_url AS instagramReelUrl,
    r.aktualisiert_am AS aktualisiertAm, c.chargen_nr AS chargenNr
  FROM reviews r LEFT JOIN chargen c ON c.id = r.charge_id
  WHERE r.autor_id = ? AND r.kultivar_id = ? AND r.vertreiber_id = ? ORDER BY r.id ASC LIMIT 1`;
const EIGENE_BILDER_SQL = `SELECT id, breite, hoehe, status FROM budpics WHERE review_id = (
    SELECT id FROM reviews WHERE autor_id = ? AND kultivar_id = ? AND vertreiber_id = ? ORDER BY id ASC LIMIT 1
  ) ORDER BY erstellt_am ASC LIMIT 10`;
const NETZ_SQL = `SELECT strain_id AS strainId, gesamtnote, aussehen, geruch, geschmack, wirkung, konsistenz,
    terpen_intensitaet AS terpenIntensitaet, geschmacks_matrix AS geschmacksMatrix
  FROM reviews WHERE autor_id = ? ORDER BY erstellt_am DESC LIMIT ${BEWERTUNGEN_HOECHSTENS}`;

type EigeneZeile = Record<string, unknown> & { chargenNr: string | null; aktualisiertAm: unknown };
type NetzZeile = {
  strainId: string;
  gesamtnote: number | null;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  terpenIntensitaet: string | null;
  geschmacksMatrix: string | null;
};

function alsGespeichert(z: EigeneZeile, bilder: { id: string; breite: number; hoehe: number; status: string }[]): GespeicherteBewertung {
  return {
    strainId: String(z.strainId),
    wareGenau: istWahr(z.wareGenau),
    aussehen: Number(z.aussehen),
    geruch: Number(z.geruch),
    geschmack: Number(z.geschmack),
    wirkung: Number(z.wirkung),
    konsistenz: Number(z.konsistenz),
    gesamtnote: zahlOderNull(z.gesamtnote),
    feuchtigkeitProzent: zahlOderNull(z.feuchtigkeitProzent),
    geschmacksMatrix: z.geschmacksMatrix,
    terpenIntensitaet: z.terpenIntensitaet,
    beschaffenheit: z.beschaffenheit,
    notiz: (z.notiz as string | null) ?? null,
    instagramReelUrl: (z.instagramReelUrl as string | null) ?? null,
    aktualisiertAm: alsDatum(z.aktualisiertAm) ?? new Date(0),
    charge: z.chargenNr ? { chargenNr: z.chargenNr } : null,
    bilder: bilder.map((b) => ({ id: b.id, breite: Number(b.breite), hoehe: Number(b.hoehe), status: b.status })),
  };
}

async function liveNetzRoh(db: D1Roh, netz: NetzZeile[], terpene: TerpenZeile[], strainId: string): Promise<LiveNetzBasis> {
  if (netz.length >= BEWERTUNGEN_HOECHSTENS) console.warn(JSON.stringify({ insel: "bewertungsgrenze", grenze: BEWERTUNGEN_HOECHSTENS }));
  const bewertungen = netz.map((r) => ({
    strainId: r.strainId,
    gesamtnote: noteOderErsatz(r),
    terpene: parseTerpenIntensitaet(r.terpenIntensitaet),
    geschmack: parseGeschmacksMatrix(r.geschmacksMatrix),
  }));
  const ids = JSON.stringify([...new Set([strainId, ...bewertungen.map((b) => b.strainId)])]);
  const { results } = await db.prepare(SORTEN_AROMA_SQL).bind(ids).all<SortenAromaZeile>();
  return liveNetzBasis(bewertungen, sortenAusZeilen(terpene, results), strainId);
}

/**
 * Antwort für /api/ich/strain mit Sitzungscookie. `null`: Bindings fehlen, Next übernimmt.
 * Gate ist vom Aufrufer (lib/tor.ts) schon geprüft.
 */
export async function inselRoh(url: URL, cookies: Map<string, string>, env: InselEnv): Promise<Response | null> {
  const db = env.DB;
  const secret = env.BETTER_AUTH_SECRET;
  if (!db || !secret) return null;
  const q = url.searchParams;
  const kultivarId = q.get("kultivar") ?? "";
  const strainId = q.get("strain") ?? "";
  const vertreiber = q.get("vertreiber");
  if (!ID.test(kultivarId) || !ID.test(strainId) || (vertreiber && !ID.test(vertreiber))) {
    return Response.json({ fehler: "parameter" }, { status: 400, headers: KOPF });
  }
  const token = await sitzungsToken(cookies, secret);

  // Eigene Bewertung, ihre Bilder, Netz-Bewertungen und Terpene in einem Rundgang; nur bei Bedarf.
  let vorrat: Promise<{ eigene: EigeneZeile | null; bilder: never[]; netz: NetzZeile[]; terpene: TerpenZeile[] }> | null = null;
  const laden = (autorId: string, vertreiberId: string | null) =>
    (vorrat ??= (async () => {
      const stmts = [db.prepare(NETZ_SQL).bind(autorId), db.prepare(TERPENE_SQL)];
      if (vertreiberId) {
        stmts.push(db.prepare(EIGENE_SQL).bind(autorId, kultivarId, vertreiberId));
        stmts.push(db.prepare(EIGENE_BILDER_SQL).bind(autorId, kultivarId, vertreiberId));
      }
      const [netz, terpene, eigene, bilder] = await db.batch(stmts);
      return {
        netz: netz.results as NetzZeile[],
        terpene: terpene.results as TerpenZeile[],
        eigene: ((eigene?.results[0] as EigeneZeile | undefined) ?? null),
        bilder: (bilder?.results ?? []) as never[],
      };
    })());

  const daten = await ichStrain(
    {
      mitglied: async () => (token ? mitgliedAusSitzung(db, token) : null),
      ladeEigeneBewertung: async (autorId, _k, vertreiberId) => {
        const v = await laden(autorId, vertreiberId);
        return v.eigene ? alsGespeichert(v.eigene, v.bilder) : null;
      },
      ladeLiveNetzBasis: async (mitgliedId, sid) => {
        const v = await laden(mitgliedId, vertreiber || null);
        return liveNetzRoh(db, v.netz, v.terpene, sid);
      },
      vorbelegungAus: vorbelegungAus as never,
    },
    { kultivarId, vertreiberId: vertreiber || null, strainId },
  );
  return Response.json(daten, { headers: KOPF });
}
