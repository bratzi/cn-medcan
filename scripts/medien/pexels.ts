/**
 * Zugriff auf die Pexels-API, nur Entwicklungszeit (Spec 6.3).
 *
 * Jede Anfrage genau einmal: bei einem Fehler Abbruch mit Meldung, keine
 * Wiederholung (Memory netzwerk-schonen). Der Key kommt aus .env.local,
 * wird nie ausgegeben, nie gebuendelt und nie als Worker-Secret gesetzt.
 */

export function pexelsKey(): string {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Kein .env.local: der Key kann auch in der Umgebung stehen.
  }
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    console.error("PEXELS_API_KEY fehlt in .env.local.");
    process.exit(1);
  }
  return key;
}

export async function pexelsJson<T>(url: string, key: string): Promise<T> {
  const antwort = await fetch(url, { headers: { Authorization: key } });
  if (!antwort.ok) {
    console.error(`Pexels antwortet ${antwort.status} auf ${url}. Keine Wiederholung, Abbruch.`);
    process.exit(1);
  }
  return (await antwort.json()) as T;
}

export async function ladeDatei(url: string): Promise<Buffer> {
  const antwort = await fetch(url);
  if (!antwort.ok) {
    console.error(`Download ${antwort.status}: ${url}. Keine Wiederholung, Abbruch.`);
    process.exit(1);
  }
  return Buffer.from(await antwort.arrayBuffer());
}
