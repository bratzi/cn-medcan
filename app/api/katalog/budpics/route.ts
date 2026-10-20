import { ladeFreieBudpicsJeKultivar } from "@/lib/query/budpics";

const ID = /^[0-9a-f-]{32,36}$/;
const HOECHSTENS = 24;

/** Freigegebene Budpics je Kultivar für die sichtbaren Karten der Blütenseite, lazy nachgeladen. */
export async function GET(anfrage: Request): Promise<Response> {
  const roh = new URL(anfrage.url).searchParams.get("ids") ?? "";
  const ids = [...new Set(roh.split(",").map((x) => x.trim().toLowerCase()).filter((x) => ID.test(x)))].slice(0, HOECHSTENS);
  const jeKultivar = await ladeFreieBudpicsJeKultivar(ids);
  const antwort: Record<string, { id: string; breite: number; hoehe: number; nutzer: string; erstelltAm: string }[]> = {};
  for (const [id, liste] of jeKultivar) {
    antwort[id] = liste.map((b) => ({ id: b.id, breite: b.breite, hoehe: b.hoehe, nutzer: b.nutzer, erstelltAm: new Date(b.erstelltAm).toISOString() }));
  }
  return Response.json(antwort, { headers: { "cache-control": "public, max-age=300" } });
}
