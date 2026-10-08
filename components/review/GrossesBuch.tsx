import { Buch } from "@/components/review/Buch";
import { BuchDoppelseite } from "@/components/review/BuchDoppelseite";
import { alsEintrag, eintragAnker } from "@/components/review/eintrag";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Band } from "@/lib/query/buch-band";
import type { KatalogTerpen } from "@/lib/query/strains";

/**
 * Ein Band des großen Buchs auf /reviews (Spec Bewertungsbuch 4): alle freigegebenen Bewertungen
 * aller Sorten als Doppelseiten zum Blättern, jede mit dem Namen der Sorte über dem Kopf. Unter dem
 * Buch die Seitenleiste mit allen Einträgen über alle Bände.
 */
export function GrossesBuch({
  band,
  w,
  sprache,
  katalog,
}: {
  band: Band;
  w: Woerterbuch;
  sprache: Sprache;
  katalog: readonly KatalogTerpen[];
}) {
  return (
    <Buch
      bezeichnung={w.buch.grossBereich}
      texte={{
        tastatur: w.buch.tastatur,
        seite: w.buch.seite,
        zurueck: w.buch.zurueck,
        weiter: w.buch.weiter,
        anhalten: w.buch.anhalten,
        abspielen: w.buch.abspielen,
      }}
      leiste={{ basis: band.basis, gesamt: band.gesamt, texte: { leiste: w.buch.leiste, nummer: w.buch.nummer } }}
      seiten={band.eintraege.map(({ review, produkt }) => ({
        anker: eintragAnker(review.id),
        inhalt: (
          <BuchDoppelseite eintrag={alsEintrag(review, produkt)} ueberschrift="h3" w={w} sprache={sprache} katalog={katalog} sorte />
        ),
      }))}
    />
  );
}
