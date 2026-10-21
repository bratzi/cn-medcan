"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";

import type { BlattNoteTexte } from "@/components/review/BlattNote";
import { erkundungsDaten } from "@/components/review/erkundung-daten";
import { NoteUndErkundung } from "@/components/review/NoteUndErkundung";
import { SortenExplorer } from "@/components/story/SortenExplorer";
import { buttonKlassen } from "@/components/ui/Button";
import type { KultivarTyp } from "@/db/enums";
import { cn } from "@/lib/cn";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { AromaTexte, Woerterbuch } from "@/lib/i18n/typen";
import type { ExplorerSorte } from "@/lib/query/sorten-explorer";
import type { AromaVorzeige, KatalogTerpen } from "@/lib/query/strains";

type Karte = { slug: string; name: string; daten: AromaVorzeige | null };

type Props = {
  sorten: ExplorerSorte[];
  explorerTexte: Woerterbuch["start"]["vertreiber"];
  typen: Record<KultivarTyp, string>;
  sprache: Sprache;
  kopf: ReactNode;
  start: Karte;
  blattTexte: BlattNoteTexte;
  aromaTexte: AromaTexte;
  serien: { hersteller: string; community: string };
  katalog: KatalogTerpen[];
  texte: Pick<Woerterbuch["start"]["aroma"], "zurSorte" | "nochNicht" | "bewerten">;
  zwischenruf: ReactNode;
};

/**
 * Katalog steuert Bewertung (Nutzer 2026-10-20): oben der Sorten-Explorer, darunter die
 * Aroma-Karte der gewählten Sorte. Der Startwert kommt statisch vom Server (ohne JS vollständig);
 * jede weitere Sorte holt /api/aroma/[sorte]. Während des Ladens bleibt die alte Karte gedimmt.
 */
export function AromaWechsel(props: Props) {
  const { sprache, start, texte } = props;
  const [karte, setKarte] = useState<Karte>(start);
  const [laedt, setLaedt] = useState(false);
  // Gewählter Vertreiber aus dem Explorer: der Link zum Strain am Ende zeigt auf genau diese Variante.
  const [vertreiber, setVertreiber] = useState<string | null>(
    () => props.sorten.find((s) => s.slug === start.slug)?.waren[0]?.vertreiberId ?? null,
  );
  const gemerkt = useRef(new Map<string, AromaVorzeige | null>([[start.slug, start.daten]]));
  const laufend = useRef<AbortController | null>(null);

  async function wechsle(sorte: ExplorerSorte) {
    laufend.current?.abort();
    setVertreiber(sorte.waren[0]?.vertreiberId ?? null);
    if (gemerkt.current.has(sorte.slug)) {
      setLaedt(false);
      setKarte({ slug: sorte.slug, name: sorte.name, daten: gemerkt.current.get(sorte.slug) ?? null });
      return;
    }
    const ab = new AbortController();
    laufend.current = ab;
    setLaedt(true);
    try {
      const antwort = await fetch(`/api/aroma/${encodeURIComponent(sorte.slug)}`, { signal: ab.signal });
      if (!antwort.ok && antwort.status !== 404) throw new Error(String(antwort.status));
      const daten = antwort.ok ? ((await antwort.json()) as AromaVorzeige) : null;
      gemerkt.current.set(sorte.slug, daten);
      if (ab.signal.aborted) return;
      setKarte({ slug: sorte.slug, name: sorte.name, daten });
      setLaedt(false);
    } catch {
      // Netzfehler: die alte Karte bleibt stehen, ungedimmt; ein Abbruch kommt von der nächsten Wahl.
      if (!ab.signal.aborted) setLaedt(false);
    }
  }

  const sorte = karte.daten;
  return (
    <div className="flex flex-col gap-16">
      {props.sorten.length > 0 ? (
        <SortenExplorer
          sorten={props.sorten}
          texte={props.explorerTexte}
          typen={props.typen}
          sprache={sprache}
          kopf={props.kopf}
          vorwahl={start.slug}
          onSorte={wechsle}
          onWare={setVertreiber}
        />
      ) : (
        <div className="flex flex-col gap-6">{props.kopf}</div>
      )}
      <div
        aria-busy={laedt}
        className={cn("transition-opacity duration-fast ease-standard", laedt && "pointer-events-none opacity-50")}
      >
        {sorte ? (
          <NoteUndErkundung
            key={sorte.slug}
            modus="example"
            blattTexte={props.blattTexte}
            sprache={sprache}
            titel={sorte.handelsname}
            // Kein Sortenkopf mehr (Nutzer 2026-10-20: der Block „Das bewerten wir“ hing allein unter
            // dem Explorer). Name, Typ und Werte stehen schon im Explorer; die Bewertung folgt direkt.
            dicht
            terpene={sorte.terpene}
            katalog={props.katalog}
            {...erkundungsDaten(sorte.terpene, sorte.reviews, props.serien, sorte.kennwerte)}
            texte={props.aromaTexte}
            zwischenruf={props.zwischenruf}
          >
            {/* Einziger Link zum Strain (Nutzer 2026-10-22), zusammengeführt mit dem früheren im Explorer:
                genauer ist Sorte plus gewählter Vertreiber, also die vorgerenderte Variante. */}
            <Link prefetch={false} href={vertreiber ? `/blueten/${karte.slug}?vertreiber=${encodeURIComponent(vertreiber)}` : `/blueten/${sorte.slug}`} className={buttonKlassen("secondary", "md")}>
              {texte.zurSorte}
            </Link>
          </NoteUndErkundung>
        ) : (
          <div className="flex max-w-2xl flex-col gap-6 border-t border-border-strong pt-8 max-md:mx-auto max-md:items-center max-md:text-center">
            <p className="text-body text-text text-pretty">{t(texte.nochNicht, { name: karte.name })}</p>
            <Link prefetch={false} href={`/blueten/${karte.slug}#bewerten`} className={buttonKlassen("primary", "md", "self-start max-md:self-center")}>
              {texte.bewerten}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
