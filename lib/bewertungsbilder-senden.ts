/**
 * Vorgemerkte Bilder nach dem Speichern der Bewertung senden (Spec 2026-10-06):
 * eines nach dem anderen, ein Fehler trifft nur diese Datei. Was scheitert,
 * bleibt vorgemerkt, damit ein erneutes Absenden nur das schickt. Der Sender
 * wird hereingereicht (Server Action im Browser, Attrappe im Test).
 */
import { t } from "@/lib/i18n/text";

export type VorgemerktesBild = {
  /** Stabiler Schlüssel für die Liste. */
  schluessel: string;
  /** Dateiname der Auswahl, nur für Meldungen. */
  name: string;
  /** Schon verkleinertes WebP (lib/bild-verkleinern.ts). */
  blob: Blob;
  breite: number;
  hoehe: number;
  /** Object-URL für die Vorschau; wer sie anlegt, gibt sie wieder frei. */
  vorschau: string;
};

type SendeErgebnis = { ok: true; id: string; sofortSichtbar: boolean } | { ok: false; fehler: string };

export async function bilderSenden(
  bilder: readonly VorgemerktesBild[],
  strainId: string,
  senden: (daten: FormData) => Promise<SendeErgebnis>,
  optionen: { fortschritt: (nr: number, gesamt: number) => void; fehlgeschlagen: string; dateiFehler: string },
): Promise<{ gesendet: number; uebrig: VorgemerktesBild[]; fehler: string[] }> {
  let gesendet = 0;
  const uebrig: VorgemerktesBild[] = [];
  const fehler: string[] = [];
  // Strikt nacheinander (await je Bild): die Grenze je Bewertung prüft der Server nicht atomar.
  for (const [i, bild] of bilder.entries()) {
    optionen.fortschritt(i + 1, bilder.length);
    const daten = new FormData();
    daten.set("strainId", strainId);
    daten.set("bild", new File([bild.blob], "bewertungsbild.webp", { type: "image/webp" }));
    let ergebnis: SendeErgebnis;
    try {
      ergebnis = await senden(daten);
    } catch {
      // Geworfener Serverfehler (z. B. abgelaufene Sitzung): weiter mit dem nächsten Bild.
      ergebnis = { ok: false, fehler: optionen.fehlgeschlagen };
    }
    if (ergebnis.ok) {
      gesendet += 1;
    } else {
      uebrig.push(bild);
      fehler.push(t(optionen.dateiFehler, { name: bild.name, grund: ergebnis.fehler }));
    }
  }
  return { gesendet, uebrig, fehler };
}
