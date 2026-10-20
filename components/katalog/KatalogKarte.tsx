import Link from "next/link";
import type { ReactNode } from "react";

import { GeschmackZeile } from "@/components/katalog/GeschmackZeile";
import { Bild } from "@/components/medien/Bild";
import { BudpicDiashow, type DiashowBild } from "@/components/produkt/BudpicDiashow";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import type { GeschmacksKategorie } from "@/db/enums";
import { musterBildId } from "@/lib/budpics";
import { formatierePreisProGramm, formatiereZahl, formatiereZahlSpanne } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { geschmaeckerMitStatus } from "@/lib/katalog/geschmack";
import type { BlueteZeile, StrainZeile } from "@/lib/katalog/typen";
import { blueteBild } from "@/lib/medien";

export type KartenTexte = Woerterbuch["katalog"]["karte"] & {
  kultivarTyp: Woerterbuch["label"]["kultivarTyp"];
  darreichungsform: Woerterbuch["label"]["darreichungsform"];
};

/** Bildfläche wie in KultivarKarte: in jeder Karte gleich hoch, damit das Raster ruhig steht. */
const BILDFLAECHE = "aspect-4/3 w-full";

type Gemeinsam = {
  vertreiberName: (id: string) => string;
  texte: KartenTexte;
  sprache: Sprache;
  /** Ganzes Wörterbuch für Geschmäcker und die Diashow-Texte. */
  w: Woerterbuch;
};

/** Bildfläche in der Rasterkarte: Raster bis 5 Spalten, also kleiner als die halbe Breite (Task 2). */
const BILD_SIZES = "(min-width: 1536px) 18vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw";

function Bildflaeche({ name, bild, budpics, w }: { name: string; bild: string | null; budpics: readonly DiashowBild[]; w: Woerterbuch }) {
  if (budpics.length > 0) {
    return (
      // z-10: Pfeile und Punkte der Diashow liegen über dem Link-Überzug der Karte.
      <div data-bild className="relative z-10">
        <BudpicDiashow bilder={budpics} name={name} texte={w.budpic} rahmen={BILDFLAECHE} einpassen />
      </div>
    );
  }
  if (!bild) return <div data-bild aria-hidden="true" className={`bg-surface-sunken ring-1 ring-border ring-inset ${BILDFLAECHE}`} />;
  return (
    <figure data-bild title={w.budpic.muster} className="flex flex-col gap-2">
      <div className={`relative flex items-center justify-center overflow-hidden bg-surface-sunken p-4 ring-1 ring-border ring-inset ${BILDFLAECHE}`}>
        <Bild id={bild} dekorativ sizes={BILD_SIZES} className="h-full! min-h-0 w-full object-contain" />
      </div>
      <figcaption className="text-caption text-text-muted">{w.katalog.karte.symbolbild}</figcaption>
    </figure>
  );
}

/**
 * Community-Zeile, der Blickfang der Karte (Von-Restorff): die Note als einziges Element in
 * Handschrift (Ausnahme Regel 3 wie AuftaktZahlen), daneben die Blätter, die Stimmen gedruckt.
 * Ohne Stimmen ein gedruckter Hinweis und ein eigenes Ziel zur Bewertungsmaske (#bewerten).
 * Ab 15rem Kartenbreite steht nichts über (Task 2): die Blätter teilen sich die Zeile mit der Note
 * und schrumpfen (flex-1 ab 8rem), der Stimmen-Text bricht unter ihnen um.
 */
function CommunityZeile({
  community,
  eigeneNote,
  bewertenHref,
  zusatz,
  texte,
  sprache,
}: {
  community: { note: number; stimmen: number } | null;
  eigeneNote: number | null;
  bewertenHref: string;
  zusatz?: string;
  texte: KartenTexte;
  sprache: Sprache;
}) {
  const buch =
    eigeneNote !== null ? (
      <span className="numeric ms-auto text-caption text-text-muted">{t(texte.buchNote, { note: formatiereZahl(eigeneNote, 1, sprache) })}</span>
    ) : null;

  if (!community || community.stimmen === 0) {
    return (
      <div data-community className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-small text-text-muted">{texte.keineStimmen}</p>
        <Link prefetch={false} href={bewertenHref} className={`relative z-10 ${einzelLinkKlassen()}`}>
          {texte.alsErsteBewerten}
        </Link>
        {buch}
      </div>
    );
  }

  const note = formatiereZahl(community.note, 1, sprache);
  return (
    <div data-community className="flex flex-col gap-2">
      {zusatz ? <p className="text-caption text-text-muted">{zusatz}</p> : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span aria-hidden="true" className="font-hand text-vermerk leading-none text-logo">
          {note}
        </span>
        <span className="sr-only">{mehrzahl(sprache, texte.srNote, community.stimmen, { note })}</span>
        <div aria-hidden="true" className="min-w-0 flex-1 basis-32">
          <BlattAnzeige note={community.note} text={mehrzahl(sprache, texte.stimmen, community.stimmen)} />
        </div>
        {buch}
      </div>
    </div>
  );
}

/**
 * Gemeinsames Gerüst (Task 2, 2026-10-20): Name, Bild, Community-Zeile, Geschmäcker, Fuß. Die Karte
 * teilt sich per subgrid fünf Zeilen mit den Nachbarn ihrer Rasterzeile (das li darum spannt sie
 * durch): Bilder, Noten und Füße stehen auf einer Linie, auch wenn ein Name umbricht. Ohne
 * subgrid-Unterstützung stapeln sich die Teile wie in einer normalen Karte.
 * Abstände (Law of Proximity): 8 px Zeilenabstand, innerhalb einer Gruppe (Note und Geschmack) nur
 * er, Name zu Bild 16 px, zwischen den Gruppen 24 px; den Fuß trennt zusätzlich eine Linie.
 */
function KartenRahmen({
  name,
  href,
  bildflaeche,
  community,
  geschmack,
  fuss,
}: {
  name: string;
  href: string;
  bildflaeche: ReactNode;
  community: ReactNode;
  geschmack: ReactNode;
  fuss: ReactNode;
}) {
  return (
    <article className="kultivar-karte group relative isolate row-span-5 grid grid-rows-subgrid gap-y-2 border border-border bg-surface-raised shadow-sm transition-colors duration-fast ease-standard focus-within:border-border-strong hover:border-border-strong">
      <span aria-hidden="true" className="kultivar-band absolute inset-x-0 top-0 h-1 bg-accent" />
      <h3 data-name className="px-4 pt-6 font-buch text-sorte text-balance text-text hyphens-none wrap-break-word [font-optical-sizing:auto]">
        <Link
          prefetch={false}
          href={href}
          className="transition-colors duration-fast ease-standard group-hover:text-accent after:absolute after:inset-0 after:content-['']"
        >
          {name}
        </Link>
      </h3>
      <div className="px-4 pt-2">{bildflaeche}</div>
      <div className="px-4 pt-4">{community}</div>
      <div className="px-4">{geschmack}</div>
      <div className="px-4 pt-4 pb-4">{fuss}</div>
    </article>
  );
}

function Geschmaecker({ datenblatt, median, w }: {
  datenblatt: readonly (GeschmacksKategorie | null)[];
  median: Record<string, number> | null;
  w: Woerterbuch;
}) {
  return <GeschmackZeile eintraege={geschmaeckerMitStatus(datenblatt, median)} texte={w.katalog.geschmack} namen={w.label.geschmack} />;
}

function thcText(min: number, max: number, sprache: Sprache, w: Woerterbuch): string {
  const k = w.katalog.kultivar;
  const s = formatiereZahlSpanne(min, max, 0, sprache);
  return s.gleich ? t(k.thcEinzeln, { wert: s.von }) : t(k.thc, { von: s.von, bis: s.bis });
}

function Fuss({ teile }: { teile: (string | null)[] }) {
  const sichtbar = teile.filter((x): x is string => Boolean(x));
  return (
    <p data-fuss className="numeric flex flex-wrap gap-x-2 gap-y-1 border-t border-border pt-4 text-caption text-text-muted">
      {sichtbar.map((teil, i) => (
        <span key={`${i}-${teil}`} className="wrap-break-word">
          {teil}
          {i < sichtbar.length - 1 ? <span aria-hidden="true"> ·</span> : null}
        </span>
      ))}
    </p>
  );
}

function cbdText(max: number, sprache: Sprache, w: Woerterbuch): string | null {
  return max > 0 ? t(w.katalog.kultivar.cbdEinzeln, { wert: formatiereZahl(max, 1, sprache) }) : null;
}

/** Karte je Blüte (Kultivar), Community-Note vorn. */
export function BlueteKarte({
  zeile,
  vertreiberName,
  budpics = [],
  texte,
  sprache,
  w,
}: Gemeinsam & { zeile: BlueteZeile; budpics?: readonly DiashowBild[] }) {
  const href = zeile.slug ? `/blueten/${zeile.slug}` : `/blueten?kultivar=${encodeURIComponent(zeile.id)}&ansicht=ware`;
  const bild = blueteBild(zeile.herstellerBildPfad) ?? (zeile.bildSlug ? musterBildId(zeile.bildSlug) : null);
  const vertreiber = zeile.vertreiberIds.length === 1 ? vertreiberName(zeile.vertreiberIds[0]) : null;
  return (
    <KartenRahmen
      name={zeile.name}
      href={href}
      bildflaeche={<Bildflaeche name={zeile.name} bild={bild} budpics={budpics} w={w} />}
      community={
        <CommunityZeile
          community={zeile.community}
          eigeneNote={zeile.eigeneNote}
          bewertenHref={zeile.slug ? `${href}#bewerten` : href}
          texte={texte}
          sprache={sprache}
        />
      }
      geschmack={<Geschmaecker datenblatt={zeile.terpene.map((x) => x.geschmack)} median={zeile.geschmackMedian} w={w} />}
      fuss={
        <Fuss
          teile={[
            texte.kultivarTyp[zeile.typ],
            thcText(zeile.thcMin, zeile.thcMax, sprache, w),
            cbdText(zeile.cbdMax, sprache, w),
            vertreiber ?? mehrzahl(sprache, texte.varianten, zeile.handelsnamen),
          ]}
        />
      }
    />
  );
}

/** Karte je Strain (Handelsname): Community-Wert gehört der Blüte, deshalb mit Zusatz. */
export function StrainKarte({ zeile, vertreiberName, texte, sprache, fachkreis, w }: Gemeinsam & { zeile: StrainZeile; fachkreis: boolean }) {
  const href = `/blueten/${zeile.s}`;
  const bild = blueteBild(zeile.b) ?? musterBildId(zeile.s);
  const preise = zeile.st.map((x) => x.p).filter((p): p is number => p !== null);
  const preis = fachkreis && preise.length > 0 ? formatierePreisProGramm(Math.min(...preise), sprache) : null;
  return (
    <KartenRahmen
      name={zeile.h}
      href={href}
      bildflaeche={<Bildflaeche name={zeile.h} bild={bild} budpics={[]} w={w} />}
      community={
        <CommunityZeile
          community={zeile.community}
          eigeneNote={zeile.eigeneNote}
          bewertenHref={`${href}#bewerten`}
          zusatz={zeile.community ? texte.wertDerBluete : undefined}
          texte={texte}
          sprache={sprache}
        />
      }
      geschmack={<Geschmaecker datenblatt={zeile.terpenGeschmack} median={zeile.geschmackMedian} w={w} />}
      fuss={
        <Fuss
          teile={[
            texte.kultivarTyp[zeile.y],
            thcText(zeile.t0, zeile.t1, sprache, w),
            cbdText(zeile.c1, sprache, w),
            zeile.v ? vertreiberName(zeile.v) : texte.vertreiberUnbekannt,
            preis,
          ]}
        />
      }
    />
  );
}
