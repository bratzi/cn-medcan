/**
 * Vorgebauter öffentlicher Katalog-Text in KV (Spec 2026-10-20, Abschnitt Daten, "CPU-Grenze").
 * Die Route liest nur noch den Text und reicht ihn durch; gebaut wird bei Datenänderung
 * (revalidiereKatalog) oder einmal, wenn der Schlüssel fehlt. Schreibvorgänge also nur bei
 * Änderungen, weit unter der Free-Grenze von 1000/Tag.
 *
 * Das Binding NEXT_INC_CACHE_KV teilt sich der Katalog mit OpenNexts Inkrement-Cache; dessen
 * Schlüssel tragen eigene Präfixe, dieser Schlüssel kollidiert nicht.
 *
 * v2 seit Task 2 (2026-10-20): je Blüte kommt `gm` (Geschmacks-Median) dazu. Ein neuer Schlüssel statt
 * Überschreiben, damit nach dem Deploy kein Text ohne `gm` aus KV kommt; v1 bleibt ungelesen liegen.
 */
export const KATALOG_KV_SCHLUESSEL = "cn-katalog/oeffentlich-v2";

/** Ausschnitt von KVNamespace, den der Katalog braucht (Tests reichen ein Fake). */
export type KatalogKv = {
  get(schluessel: string, typ: "text"): Promise<string | null>;
  put(schluessel: string, wert: string): Promise<void>;
};

export async function schreibeKatalogText(kv: KatalogKv, text: string): Promise<void> {
  await kv.put(KATALOG_KV_SCHLUESSEL, text);
}

/** Liest den Text; fehlt er (oder KV wirft), wird gebaut und einmal geschrieben. */
export async function liesOderBaueKatalog(kv: KatalogKv | null, bauen: () => Promise<string>): Promise<string> {
  if (kv) {
    try {
      const text = await kv.get(KATALOG_KV_SCHLUESSEL, "text");
      if (text) return text;
    } catch (fehler) {
      console.error("Katalog aus KV lesen fehlgeschlagen", fehler);
    }
  }
  const text = await bauen();
  if (kv) {
    try {
      await schreibeKatalogText(kv, text);
    } catch (fehler) {
      console.error("Katalog in KV schreiben fehlgeschlagen", fehler);
    }
  }
  return text;
}

/** Nach Datenänderung: neu bauen und schreiben. Fehler bleiben im Log, die Aktion selbst gilt. */
export async function bauKatalogNeu(kv: KatalogKv | null, bauen: () => Promise<string>): Promise<void> {
  if (!kv) return;
  try {
    await schreibeKatalogText(kv, await bauen());
  } catch (fehler) {
    console.error("Katalog in KV neu bauen fehlgeschlagen", fehler);
  }
}
