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
  {
    id: "aussehen-loop",
    art: "video",
    pexelsId: 4823275,
    datei: "aussehen-loop",
    breite: 1920,
    hoehe: 1080,
    alt: "",
    urheber: "Creative Jawnboree",
    quelle: "https://www.pexels.com/video/a-spinning-cannabis-bud-4823275/",
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
  // Referenzbilder der Blüten (Nutzer 2026-09-25), freigestellt mit scripts/medien/freistellen.py.
  {
    id: "bluete-01",
    art: "foto",
    pexelsId: 11012827,
    datei: "bluete-01",
    breite: 1313,
    hoehe: 800,
    alt: "Getrocknete Cannabisblüten, freigestellt",
    urheber: "Jonathan Cooper",
    quelle: "https://www.pexels.com/photo/green-kush-on-white-surface-11012827/",
    freigestellt: true,
  },
  {
    id: "bluete-02",
    art: "foto",
    pexelsId: 7773110,
    datei: "bluete-02",
    breite: 995,
    hoehe: 937,
    alt: "Einzelne getrocknete Cannabisblüte mit orangen Härchen, freigestellt",
    urheber: "Kindel Media",
    quelle: "https://www.pexels.com/photo/photo-of-skunk-weed-on-white-background-7773110/",
    freigestellt: true,
  },
  {
    id: "bluete-03",
    art: "foto",
    pexelsId: 8273262,
    datei: "bluete-03",
    breite: 1496,
    hoehe: 1365,
    alt: "Dichte, dunkle Cannabisblüte mit Trichomen, freigestellt",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/close-up-of-smoked-cannabis-8273262/",
    freigestellt: true,
  },
  {
    id: "bluete-04",
    art: "foto",
    pexelsId: 8334638,
    datei: "bluete-04",
    breite: 1933,
    hoehe: 1241,
    alt: "Mehrere getrocknete Cannabisblüten, freigestellt",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/cannabis-weeds-in-close-up-photography-8334638/",
    freigestellt: true,
  },
  {
    id: "bluete-05",
    art: "foto",
    pexelsId: 7773108,
    datei: "bluete-05",
    breite: 876,
    hoehe: 645,
    alt: "Kleine getrocknete Cannabisblüte, freigestellt",
    urheber: "Kindel Media",
    quelle: "https://www.pexels.com/photo/close-up-photo-of-cannabis-flower-on-top-of-wooden-surface-7773108/",
    freigestellt: true,
  },
  {
    id: "bluete-06",
    art: "foto",
    pexelsId: 34246669,
    datei: "bluete-06",
    breite: 1409,
    hoehe: 3073,
    alt: "Lange, getrocknete Cannabisblüte am Stiel, freigestellt",
    urheber: "Diego Barros",
    quelle: "https://www.pexels.com/photo/close-up-of-cannabis-bud-on-dark-background-34246669/",
    freigestellt: true,
  },
  {
    id: "bluete-07",
    art: "foto",
    pexelsId: 9259998,
    datei: "bluete-07",
    breite: 754,
    hoehe: 814,
    alt: "Hellgrüne getrocknete Cannabisblüte, freigestellt",
    urheber: "Jess Loiterton",
    quelle: "https://www.pexels.com/photo/beige-toned-photograph-of-a-marijuana-bud-on-white-background-9259998/",
    freigestellt: true,
  },
  {
    id: "bluete-08",
    art: "foto",
    pexelsId: 12967928,
    datei: "bluete-08",
    breite: 1040,
    hoehe: 950,
    alt: "Kräftig grüne Cannabisblüte mit orangen Härchen, freigestellt",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/gram-of-cannabis-lying-on-white-surface-12967928/",
    freigestellt: true,
  },
  {
    id: "bluete-09",
    art: "foto",
    pexelsId: 12920192,
    datei: "bluete-09",
    breite: 1892,
    hoehe: 891,
    alt: "Reihe getrockneter Cannabisblüten, freigestellt",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/close-up-photo-of-cannabis-12920192/",
    freigestellt: true,
  },
  {
    id: "bluete-10",
    art: "foto",
    pexelsId: 13084376,
    datei: "bluete-10",
    breite: 1564,
    hoehe: 685,
    alt: "Kleine grüne Cannabisblüten nebeneinander, freigestellt",
    urheber: "Terrance Barksdale",
    quelle: "https://www.pexels.com/photo/close-up-of-cannabis-buds-on-table-13084376/",
    freigestellt: true,
  },
];

/**
 * Referenzbild einer Bluete aus `strains.hersteller_bild_pfad`: dort steht die
 * Id eines Fotos aus MEDIEN (z. B. "bluete-03"). Unbekannte Werte ergeben null,
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
