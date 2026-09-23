/**
 * Verzeichnis aller Medien der Seite (Spec 6.1).
 *
 * Eine Stelle fuer Datei, Masse, Alt-Text und Herkunft: die Komponenten in
 * components/medien lesen hier, scripts/medien/aufbereiten.ts erzeugt die
 * Dateien daraus, der Footer nennt daraus die Bildnachweise. Eine Datei in
 * public/medien ohne Eintrag hier ist ein Fehler (tests/medien.test.ts).
 *
 * Reine Daten, keine Abhaengigkeit: das Modul liegt im Request-Pfad.
 */

export type MedienArt = "foto" | "maske" | "video";

export type Medium = {
  /** Schluessel, unter dem Komponenten das Medium anfordern. */
  id: string;
  art: MedienArt;
  pexelsId: number;
  /** Basisname der Dateien in public/medien, ohne Breite und Endung. */
  datei: string;
  /** Masse des Originals: Seitenverhaeltnis fuer width/height, damit nichts springt. */
  breite: number;
  hoehe: number;
  /** Pflicht bei Fotos. Masken und Videos sind dekorativ und bleiben leer. */
  alt: string;
  urheber: string;
  /** Pexels-Seite des Motivs. */
  quelle: string;
  /** Nur Masken: helle Farbe auf dunklem Grund statt dunkel auf hell. */
  maskeUmkehren?: boolean;
};

export const FOTO_BREITEN = [640, 1280, 1920] as const;
export const MASKEN_BREITE = 960;
export const STANDBILD_BREITE = 1280;

export const MEDIEN: readonly Medium[] = [
  {
    id: "leitobjekt",
    art: "foto",
    pexelsId: 5712437,
    datei: "leitobjekt",
    breite: 4000,
    hoehe: 2670,
    alt: "Aufgeschlagenes Spiralheft mit einem getrockneten Ahornblatt und einem Stift auf hellem Grund",
    urheber: "Arina Krasnikova",
    quelle: "https://www.pexels.com/photo/brown-maple-leaf-on-white-spiral-notebook-5712437/",
  },
  {
    id: "blatt",
    art: "foto",
    pexelsId: 7668040,
    datei: "blatt",
    breite: 5184,
    hoehe: 3888,
    alt: "Einzelnes Cannabisblatt vor hellem Grund",
    urheber: "Kindel Media",
    quelle: "https://www.pexels.com/photo/photo-of-cannabis-on-white-background-7668040/",
  },
  {
    id: "bluete",
    art: "foto",
    pexelsId: 20288575,
    datei: "bluete",
    breite: 3116,
    hoehe: 2078,
    alt: "Zwei getrocknete Cannabisblüten vor hellem Grund",
    urheber: "Jonathan Cooper",
    quelle: "https://www.pexels.com/photo/dry-buds-of-marijuana-20288575/",
  },
  {
    id: "trichom",
    art: "foto",
    pexelsId: 30439065,
    datei: "trichom",
    breite: 6720,
    hoehe: 4480,
    alt: "Nahaufnahme einer Cannabisblüte mit Trichomen",
    urheber: "Stephen Leonardi",
    quelle: "https://www.pexels.com/photo/close-up-of-frosty-cannabis-bud-30439065/",
  },
  {
    id: "drip",
    art: "maske",
    pexelsId: 4862581,
    datei: "drip",
    breite: 3750,
    hoehe: 2500,
    alt: "",
    urheber: "Aleksandar Pasaric",
    quelle: "https://www.pexels.com/photo/yellow-paint-dripping-on-orange-surface-4862581/",
    // Gelbe Farbe laeuft ueber orangem Grund: die Farbe ist heller als der Grund.
    maskeUmkehren: true,
  },
  {
    id: "nebel",
    art: "maske",
    pexelsId: 1193879,
    datei: "nebel",
    breite: 5184,
    hoehe: 3456,
    alt: "",
    urheber: "Dan Cristian Pădureț",
    quelle: "https://www.pexels.com/photo/yellow-green-and-red-abstract-painting-1193879/",
  },
  {
    id: "marmor",
    art: "maske",
    pexelsId: 33199141,
    datei: "marmor",
    breite: 3648,
    hoehe: 5472,
    alt: "",
    urheber: "Landiva Weber",
    quelle: "https://www.pexels.com/photo/abstract-marble-texture-in-purple-and-gray-hues-33199141/",
  },
  {
    id: "pflanze-loop",
    art: "video",
    pexelsId: 12361112,
    datei: "pflanze-loop",
    breite: 3840,
    hoehe: 2160,
    alt: "",
    urheber: "Nicky Pe",
    quelle: "https://www.pexels.com/video/cannabis-plants-swaying-in-the-wind-12361112/",
  },
];

export function medium(id: string): Medium {
  const gefunden = MEDIEN.find((m) => m.id === id);
  if (!gefunden) throw new Error(`Medium "${id}" fehlt in lib/medien.ts`);
  return gefunden;
}

/** Breiten, in denen ein Foto vorliegt: nie breiter als das Original. */
export function fotoBreiten(m: Medium): number[] {
  const breiten = FOTO_BREITEN.filter((breite) => breite <= m.breite);
  return breiten.length > 0 ? breiten : [m.breite];
}

/** Die Dateinamen, die zu einem Medium in public/medien liegen muessen. */
export function dateienVon(m: Medium): string[] {
  switch (m.art) {
    case "foto":
      return fotoBreiten(m).map((breite) => `${m.datei}-${breite}.webp`);
    case "maske":
      return [`${m.datei}-maske.png`];
    case "video":
      return [`${m.datei}.mp4`, `${m.datei}-standbild.webp`];
  }
}

export type BildQuelle = { src: string; srcSet: string };

/** src und srcSet eines Fotos; src ist die 1280er-Fassung als Rueckfall. */
export function bildQuelle(id: string): BildQuelle {
  const m = medium(id);
  if (m.art !== "foto") throw new Error(`Medium "${id}" ist kein Foto`);
  const breiten = fotoBreiten(m);
  const rueckfall = breiten.find((breite) => breite >= 1280) ?? breiten[breiten.length - 1];
  return {
    src: `/medien/${m.datei}-${rueckfall}.webp`,
    srcSet: breiten.map((breite) => `/medien/${m.datei}-${breite}.webp ${breite}w`).join(", "),
  };
}
