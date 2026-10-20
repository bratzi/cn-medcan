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

export type MedienArt = "foto" | "video";

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
  /** Pflicht bei Fotos. Videos sind dekorativ und bleiben leer. */
  alt: string;
  urheber: string;
  /** Pexels-Seite des Motivs. */
  quelle: string;
  /** Farbige Datei ohne Mischmodus: Freisteller mit Alpha (scripts/medien/freistellen.py) oder Farbfoto im runden Rahmen. */
  freigestellt?: boolean;
};

export const FOTO_BREITEN = [640, 1280, 1920] as const;
/** Kante des quadratischen Video-Standbilds: der Loop steht in einem Fenster bis 288 px, Retina 2x. */
export const STANDBILD_BREITE = 576;

export const MEDIEN: readonly Medium[] = [
  {
    id: "auftakt-loop",
    art: "video",
    pexelsId: 7684711,
    datei: "auftakt-loop",
    breite: 1920,
    hoehe: 1080,
    alt: "",
    urheber: "ArtHouse Studio",
    quelle: "https://www.pexels.com/video/person-hands-cigarette-dried-7684711/",
    freigestellt: true,
  },
  // Hero im hellen Thema (Nutzer 2026-09-29); dunkel bleibt auftakt-loop.
  {
    id: "auftakt-loop-hell",
    art: "video",
    pexelsId: 3153124,
    datei: "auftakt-loop-hell",
    breite: 1920,
    hoehe: 1080,
    alt: "",
    urheber: "Yash Lucid",
    quelle: "https://www.pexels.com/video/stop-motion-video-of-person-rolling-marijuana-joint-3153124/",
  },
  {
    id: "frei-bluete",
    art: "foto",
    pexelsId: 12728515,
    datei: "frei-bluete",
    breite: 1133,
    hoehe: 903,
    alt: "Getrocknete Cannabisblüte, freigestellt",
    urheber: "Brokkelen.nl",
    quelle: "https://www.pexels.com/photo/dried-cannabis-on-white-surface-12728515/",
    freigestellt: true,
  },
  {
    id: "frei-hoch",
    art: "foto",
    pexelsId: 7773105,
    datei: "frei-hoch",
    breite: 1913,
    hoehe: 1942,
    alt: "Cannabisblüte mit Stängel, freigestellt",
    urheber: "Kindel Media",
    quelle: "https://www.pexels.com/photo/close-up-photo-of-kush-on-white-background-7773105/",
    freigestellt: true,
  },
  {
    id: "frei-paar",
    art: "foto",
    pexelsId: 16662341,
    datei: "frei-paar",
    breite: 1606,
    hoehe: 1066,
    alt: "Zwei Cannabisblüten, freigestellt",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/weed-on-white-background-16662341/",
    freigestellt: true,
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
    freigestellt: true,
  },
  {
    id: "pflanze-loop",
    art: "video",
    pexelsId: 7667040,
    datei: "pflanze-loop",
    breite: 3840,
    hoehe: 2160,
    alt: "",
    urheber: "Kindel Media",
    quelle: "https://www.pexels.com/video/lush-green-leaves-of-a-cannabis-tree-7667040/",
  },
  // Nutzer 2026-09-29: ersetzt 4823275 (drehende Blüte).
  {
    id: "aussehen-loop",
    art: "video",
    pexelsId: 7667290,
    datei: "aussehen-loop",
    breite: 3840,
    hoehe: 2160,
    alt: "",
    urheber: "Kindel Media",
    quelle: "https://www.pexels.com/video/holding-cannabis-by-the-palm-7667290/",
  },
  {
    id: "geruch-loop",
    art: "video",
    pexelsId: 7926453,
    datei: "geruch-loop",
    breite: 3840,
    hoehe: 2160,
    alt: "",
    urheber: "Kampus Production",
    quelle: "https://www.pexels.com/video/beaded-man-smelling-a-cannabis-7926453/",
  },
  {
    id: "feuchte-loop",
    art: "video",
    pexelsId: 7684715,
    datei: "feuchte-loop",
    breite: 3840,
    hoehe: 2160,
    alt: "",
    urheber: "ArtHouse Studio",
    quelle: "https://www.pexels.com/video/a-person-holding-a-dried-cannabis-7684715/",
  },
  // Musterbilder der Blüten (Nutzer 2026-10-20): Pexels-Stockfotos in Farbe, 4:3 mittig zugeschnitten,
  // Lizenznachweis in docs/medien/stock-lizenzen.md. Ersetzen die freigestellten bluete-01..10.
  {
    id: "stock-bluete-01",
    art: "foto",
    pexelsId: 34246665,
    datei: "stock-bluete-01",
    breite: 1280,
    hoehe: 960,
    alt: "Einzelne spitze Cannabisblüte vor dunklem Grund",
    urheber: "Diego Barros",
    quelle: "https://www.pexels.com/photo/close-up-shot-of-a-cannabis-bud-with-trichomes-34246665/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-02",
    art: "foto",
    pexelsId: 13084391,
    datei: "stock-bluete-02",
    breite: 1280,
    hoehe: 960,
    alt: "Zwei dunkelviolette Cannabisblüten",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/close-up-shot-of-kush-13084391/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-03",
    art: "foto",
    pexelsId: 5581840,
    datei: "stock-bluete-03",
    breite: 1280,
    hoehe: 960,
    alt: "Getrocknete Cannabisblüte auf hellem Grund",
    urheber: "Eric Broder Van Dyke",
    quelle: "https://www.pexels.com/photo/close-up-photo-of-kush-5581840/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-04",
    art: "foto",
    pexelsId: 7079938,
    datei: "stock-bluete-04",
    breite: 1280,
    hoehe: 960,
    alt: "Hellgrüne getrocknete Cannabisblüte auf hellem Grund",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/green-kush-on-white-surface-7079938/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-05",
    art: "foto",
    pexelsId: 16677968,
    datei: "stock-bluete-05",
    breite: 1280,
    hoehe: 960,
    alt: "Mehrere getrocknete Cannabisblüten auf hellem Grund",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/close-up-of-dried-cannabis-on-white-background-16677968/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-06",
    art: "foto",
    pexelsId: 16677967,
    datei: "stock-bluete-06",
    breite: 1280,
    hoehe: 960,
    alt: "Getrocknete Cannabisblüten, eine scharf im Vordergrund",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/green-dried-plant-substance-16677967/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-07",
    art: "foto",
    pexelsId: 16677998,
    datei: "stock-bluete-07",
    breite: 1280,
    hoehe: 960,
    alt: "Kleine Gruppe getrockneter Cannabisblüten auf hellem Grund",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/cannabis-on-white-background-16677998/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-08",
    art: "foto",
    pexelsId: 6536878,
    datei: "stock-bluete-08",
    breite: 1280,
    hoehe: 960,
    alt: "Gehäufte Cannabisblüten vor dunklem Grund",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/dried-medical-cannabis-6536878/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-09",
    art: "foto",
    pexelsId: 6547532,
    datei: "stock-bluete-09",
    breite: 1280,
    hoehe: 960,
    alt: "Getrocknete Cannabisblüte mit orangen Härchen im Vordergrund",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/shallow-focus-of-green-kush-6547532/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-10",
    art: "foto",
    pexelsId: 6706413,
    datei: "stock-bluete-10",
    breite: 1280,
    hoehe: 960,
    alt: "Einzelne getrocknete Cannabisblüte vor hellblauem Grund",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/close-up-photo-of-green-hemp-6706413/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-11",
    art: "foto",
    pexelsId: 6472169,
    datei: "stock-bluete-11",
    breite: 1280,
    hoehe: 960,
    alt: "Kräftig grüne Cannabisblüten auf hellem Grund",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/close-up-of-hemp-drought-6472169/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-12",
    art: "foto",
    pexelsId: 6462278,
    datei: "stock-bluete-12",
    breite: 1280,
    hoehe: 960,
    alt: "Dunkle Cannabisblüten auf Holz",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/a-close-up-shot-of-green-kush-on-brown-wooden-surface-6462278/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-13",
    art: "foto",
    pexelsId: 16727750,
    datei: "stock-bluete-13",
    breite: 1280,
    hoehe: 960,
    alt: "Hellgrüne Cannabisblüten vor dunklem Grund",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/close-up-of-cannabis-buds-on-black-background-16727750/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-14",
    art: "foto",
    pexelsId: 34246667,
    datei: "stock-bluete-14",
    breite: 1280,
    hoehe: 960,
    alt: "Längliche Cannabisblüte mit orangen Härchen",
    urheber: "Diego Barros",
    quelle: "https://www.pexels.com/photo/close-up-of-trichome-rich-cannabis-bud-on-white-background-34246667/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-15",
    art: "foto",
    pexelsId: 10729431,
    datei: "stock-bluete-15",
    breite: 1280,
    hoehe: 960,
    alt: "Cannabisblüten mit orangen Härchen vor einem Glas",
    urheber: "Brokkelen.nl Netherlands Amsterdam",
    quelle: "https://www.pexels.com/photo/close-up-shot-of-cannabis-10729431/",
    freigestellt: true,
  },
  {
    id: "stock-bluete-16",
    art: "foto",
    pexelsId: 9159315,
    datei: "stock-bluete-16",
    breite: 1280,
    hoehe: 960,
    alt: "Bläulich-grüne Cannabisblüten auf Holz",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/hash-cannabis-in-close-up-shot-9159315/",
    freigestellt: true,
  },
];

/**
 * Referenzbild einer Bluete aus `strains.hersteller_bild_pfad`: dort steht die
 * Id eines Fotos aus MEDIEN (z. B. "stock-bluete-03"). Unbekannte Werte ergeben null,
 * statt die Seite mit einem Fehler abbrechen zu lassen.
 */
export function blueteBild(id: string | null | undefined): string | null {
  if (!id) return null;
  const treffer = MEDIEN.find((m) => m.id === id);
  return treffer && treffer.art === "foto" ? treffer.id : null;
}

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
