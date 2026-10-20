import Link from "next/link";
import type { ReactNode } from "react";

import { Bild } from "@/components/medien/Bild";
import { BudpicDiashow, type DiashowBild } from "@/components/produkt/BudpicDiashow";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { musterBildId } from "@/lib/budpics";
import { formatierePreisProGramm, formatiereZahl, formatiereZahlSpanne } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
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
  /** Ganzes Wörterbuch für TerpenChips und die Diashow-Texte (Abweichung vom Plan, siehe Meldung). */
  w: Woerterbuch;
};

function Bildflaeche({ name, bild, budpics, w }: { name: string; bild: string | null; budpics: readonly DiashowBild[]; w: Woerterbuch }) {
  if (budpics.length > 0) {
    return (
      <div className="relative z-10 p-4 pt-6">
        <BudpicDiashow bilder={budpics} name={name} texte={w.budpic} rahmen={BILDFLAECHE} einpassen />
      </div>
    );
  }
  return (
    <div className="p-4 pt-6">
      {bild ? (
        <figure title={w.budpic.muster} className="flex flex-col gap-2">
          <div className={`relative flex items-center justify-center overflow-hidden bg-surface-sunken p-4 ring-1 ring-border ring-inset ${BILDFLAECHE}`}>
            <Bild
              id={bild}
              dekorativ
              sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 90vw"
              className="h-full! min-h-0 w-full object-contain"
            />
          </div>
          <figcaption className="text-caption text-text-muted">{w.katalog.karte.symbolbild}</figcaption>
        </figure>
      ) : (
        <div aria-hidden="true" className={`bg-surface-sunken ring-1 ring-border ring-inset ${BILDFLAECHE}`} />
      )}
    </div>
  );
}

/**
 * Community-Zeile, der Blickfang der Karte (Von-Restorff): die Note als einziges Element in
 * Handschrift (Ausnahme Regel 3 wie AuftaktZahlen), daneben die Blätter, die Stimmen gedruckt.
 * Ohne Stimmen ein gedruckter Hinweis und ein eigenes Ziel zur Bewertungsmaske (#bewerten).
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
      <span className="numeric ml-auto text-caption text-text-muted">{t(texte.buchNote, { note: formatiereZahl(eigeneNote, 1, sprache) })}</span>
    ) : null;

  if (!community || community.stimmen === 0) {
    return (
      <div data-community className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-4">
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
    <div data-community className="flex flex-col gap-2 border-b border-border pb-4">
      {zusatz ? <p className="text-caption text-text-muted">{zusatz}</p> : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span aria-hidden="true" className="font-hand text-notiz leading-none text-logo">
          {note}
        </span>
        <span className="sr-only">{mehrzahl(sprache, texte.srNote, community.stimmen, { note })}</span>
        <div aria-hidden="true" className="min-w-0">
          <BlattAnzeige note={community.note} text={mehrzahl(sprache, texte.stimmen, community.stimmen)} />
        </div>
        {buch}
      </div>
    </div>
  );
}

/** Gemeinsames Gerüst: Bild, Community-Zeile, Name, Terpene, Fuß in fester Reihenfolge. */
function KartenRahmen({
  name,
  href,
  bildflaeche,
  community,
  terpene,
  fuss,
}: {
  name: string;
  href: string;
  bildflaeche: ReactNode;
  community: ReactNode;
  terpene: ReactNode;
  fuss: ReactNode;
}) {
  return (
    <article className="kultivar-karte group relative isolate flex h-full w-full flex-col border border-border bg-surface-raised shadow-sm transition-colors duration-fast ease-standard focus-within:border-border-strong hover:border-border-strong">
      <span aria-hidden="true" className="kultivar-band absolute inset-x-0 top-0 h-1 bg-accent" />
      {bildflaeche}
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
        {community}
        <h3 data-name className="font-buch text-sorte text-balance text-text hyphens-none wrap-break-word [font-optical-sizing:auto]">
          <Link
            prefetch={false}
            href={href}
            className="transition-colors duration-fast ease-standard group-hover:text-accent after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </Link>
        </h3>
        {terpene}
        {fuss}
      </div>
    </article>
  );
}

function thcText(min: number, max: number, sprache: Sprache, w: Woerterbuch): string {
  const k = w.katalog.kultivar;
  const s = formatiereZahlSpanne(min, max, 0, sprache);
  return s.gleich ? t(k.thcEinzeln, { wert: s.von }) : t(k.thc, { von: s.von, bis: s.bis });
}

function Fuss({ teile }: { teile: (string | null)[] }) {
  const sichtbar = teile.filter((x): x is string => Boolean(x));
  return (
    <p data-fuss className="numeric mt-auto flex flex-wrap gap-x-2 gap-y-1 border-t border-border pt-4 text-caption text-text-muted">
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
      terpene={
        zeile.terpene.length > 0 ? (
          <TerpenChips terpene={zeile.terpene.slice(0, 3).map((x, i) => ({ ...x, rang: i + 1 }))} w={w} sprache={sprache} />
        ) : null
      }
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
      terpene={
        zeile.tp.length > 0 ? (
          <TerpenChips
            terpene={zeile.tp.slice(0, 3).map((name, i) => ({ name, geschmack: zeile.terpenGeschmack[i] ?? null, rang: i + 1 }))}
            w={w}
            sprache={sprache}
          />
        ) : null
      }
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
