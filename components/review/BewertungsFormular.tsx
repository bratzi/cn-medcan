"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { bewertungSpeichern } from "@/app/bewerten/aktionen";
import { AromaErkundung } from "@/components/review/AromaErkundung";
import type { AromaSerie } from "@/components/review/AromaKarte";
import type { BeschaffenheitsWerte } from "@/components/review/BeschaffenheitsLeiste";
import type { Gesamteindruck } from "@/components/review/GesamteindruckLeiste";
import type { SweetSpotZeile } from "@/components/review/SweetSpot";
import type { KatalogEintrag } from "@/components/review/TerpenErgaenzen";
import { Button, Field, Input, Meldung } from "@/components/ui";
import { useHydriert } from "@/components/ui/useHydriert";
import type { KartenTerpen, Treue } from "@/lib/aromakarte";
import { MAX_NOTIZ } from "@/lib/bewertung-eingabe";

type Props = {
  strainId: string;
  handelsname: string;
  terpene: readonly KartenTerpen[];
  chargen: readonly string[];
  istBetreiber: boolean;
  /** Alle bekannten Terpene, zum Ergänzen. */
  katalog?: readonly KatalogEintrag[];
  /** Sortenkopf (Server-Teil), ganz oben wie auf der Startseite. */
  kopf: React.ReactNode;
  /** Blütenbild im Kopf der Aroma-Karte. */
  kartenBild?: React.ReactNode;
  /** Daten der Erkundung aus den bisherigen Bewertungen (erkundungsDaten). */
  serien: readonly AromaSerie[];
  treue: Treue | null;
  zeilen: readonly SweetSpotZeile[];
  gesamteindruck: Gesamteindruck;
  beschaffenheit: BeschaffenheitsWerte;
};

/**
 * Bewertungsmaske (Nutzer 2026-09-25): exakt die Aroma-Erkundung der
 * Startseite, in derselben Reihenfolge mit dem Fazit unten. Die Regler der
 * Erkundung sind die Eingabe (Modus `eingabe`), eigene Regler und Pillen gibt
 * es hier nicht mehr. Darunter nur, was die Erkundung nicht abbildet: Charge,
 * Notiz, Reel. Geprüft wird in der Server Action (lib/bewertung-eingabe.ts).
 */
export function BewertungsFormular({
  strainId,
  handelsname,
  terpene,
  chargen,
  istBetreiber,
  katalog = [],
  kopf,
  kartenBild,
  ...daten
}: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ sofortSichtbar: boolean; slug: string } | null>(null);

  async function absenden(ereignis: React.FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const formular = new FormData(ereignis.currentTarget);
    setLaeuft(true);
    setFehler(null);
    const ergebnis = await bewertungSpeichern(formular);
    setLaeuft(false);
    if (!ergebnis.ok) {
      setFehler(ergebnis.fehler);
      return;
    }
    setErfolg({ sofortSichtbar: ergebnis.sofortSichtbar, slug: ergebnis.slug });
    router.refresh();
  }

  if (erfolg) {
    return (
      <div className="flex flex-col items-start gap-6">
        <Meldung art="erfolg">
          {erfolg.sofortSichtbar
            ? "Gespeichert und veröffentlicht."
            : "Danke! Deine Bewertung ist eingegangen und erscheint nach der Freigabe."}
        </Meldung>
        <Link href={`/produkte/${erfolg.slug}`} className="text-small text-accent underline underline-offset-4">
          {`Zurück zu ${handelsname}`}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={absenden} className="flex flex-col gap-16 md:gap-24">
      <input type="hidden" name="strainId" value={strainId} />

      <AromaErkundung titel={handelsname} bild={kopf} kartenBild={kartenBild} terpene={terpene} katalog={katalog} eingabe {...daten} />

      <section className="flex flex-col gap-6 border-t border-border pt-8">
        <h2 className="font-buch text-h2 font-medium text-text">Charge und Notiz</h2>
        <Input
          id="bewertung-charge"
          label="Chargennummer"
          hinweis="Steht auf der Dose. Leer lassen, wenn unbekannt."
          name="chargenNr"
          list="bewertung-chargen"
          maxLength={40}
          autoComplete="off"
        />
        <datalist id="bewertung-chargen">
          {chargen.map((nummer) => (
            <option key={nummer} value={nummer} />
          ))}
        </datalist>
        <Field id="bewertung-notiz" label="Was ist dir aufgefallen?" hinweis={`Höchstens ${MAX_NOTIZ} Zeichen. Optional.`}>
          {(attribute) => (
            <textarea
              {...attribute}
              name="notiz"
              rows={6}
              maxLength={MAX_NOTIZ}
              className="w-full rounded-md border border-border-strong bg-surface p-4 text-body text-text"
            />
          )}
        </Field>
        {istBetreiber ? (
          <Input id="bewertung-reel" label="Instagram-Reel" hinweis="Optional." name="instagramReelUrl" type="url" inputMode="url" />
        ) : null}
      </section>

      {fehler ? <Meldung art="fehler">{fehler}</Meldung> : null}
      <div>
        <Button type="submit" disabled={!hydriert || laeuft}>
          {laeuft ? "Wird gespeichert" : istBetreiber ? "Veröffentlichen" : "Bewertung einreichen"}
        </Button>
      </div>
    </form>
  );
}
