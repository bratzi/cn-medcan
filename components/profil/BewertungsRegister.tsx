import Link from "next/link";

import { Bild, BudpicBild } from "@/components/medien/Bild";
import { textLinkKlassen } from "@/components/ui";
import { SORTIERUNGEN, type registerAnsicht, type Sortierung } from "@/lib/bewertungs-register";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  ansicht: ReturnType<typeof registerAnsicht>;
  sortierung: Sortierung;
  alle: boolean;
  texte: Woerterbuch["profil"];
  sprache: Sprache;
};

const ziel = (sortierung: Sortierung, alle: boolean) => {
  const p = new URLSearchParams();
  if (sortierung !== "datum") p.set("sortierung", sortierung);
  if (alle) p.set("alle", "1");
  const q = p.toString();
  // Sprungziel ist die Überschrift des Felds (Feld id="bewertungen").
  return `/profil${q ? `?${q}` : ""}#bewertungen-titel`;
};

/** Vorzeichen erst nach der Rundung auf 0,1, damit nie „+0,0“ oder „−0,0“ entsteht. */
export function abstandText(abstand: number, sprache: Sprache): string {
  const gerundet = Math.round(Math.abs(abstand) * 10) / 10;
  const betrag = formatiereZahl(gerundet, 1, sprache);
  return gerundet === 0 ? betrag : abstand > 0 ? `+${betrag}` : `−${betrag}`;
}

/**
 * Deine Bewertungen als Register mit Bildern (Spec 6): je Eintrag dein Bild
 * oder das der Sorte, die Note groß, darunter Community und Abstand.
 * Sortiert wird über Links, ohne JavaScript. Ab 1080 px fünf je Reihe.
 */
export function BewertungsRegister({ ansicht, sortierung, alle, texte, sprache }: Props) {
  if (ansicht.gesamt === 0) return <p className="max-w-[68ch] text-body text-text-muted">{texte.registerLeer}</p>;
  return (
    <div className="flex flex-col gap-8">
      <nav aria-label={texte.registerSortierung} className="flex flex-wrap items-center gap-2">
        <span className="text-small text-text-muted">{texte.registerSortierung}</span>
        {SORTIERUNGEN.map((s) => (
          <Link
            key={s}
            prefetch={false}
            scroll={false}
            href={ziel(s, alle)}
            aria-current={s === sortierung ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-small transition-colors duration-fast ease-standard",
              s === sortierung ? "border-text bg-text text-surface" : "border-border text-text hover:border-border-strong",
            )}
          >
            {texte.sortierung[s]}
          </Link>
        ))}
      </nav>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 min-[1080px]:grid-cols-5">
        {ansicht.eintraege.map((e) => (
          <li key={e.slug} className="group flex min-w-0 flex-col gap-4">
            <div className="aspect-4/5 overflow-hidden bg-surface-sunken">
              {e.bild.art === "eigen" ? (
                <BudpicBild
                  id={e.bild.id}
                  breite={e.bild.breite}
                  hoehe={e.bild.hoehe}
                  offen={e.bild.offen}
                  alt={e.handelsname}
                  className="size-full object-contain transition-transform duration-normal ease-standard group-hover:scale-103"
                />
              ) : (
                <Bild
                  id={e.bild.id}
                  sizes="(min-width: 1080px) 20vw, (min-width: 640px) 33vw, 50vw"
                  dekorativ
                  className="size-full object-contain transition-transform duration-normal ease-standard group-hover:scale-103"
                />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Link prefetch={false} href={`/blueten/${e.slug}`} className={cn(textLinkKlassen(), "font-buch text-body wrap-break-word")}>
                {e.handelsname}
              </Link>
              <p className="flex items-baseline gap-2">
                <span className="sr-only">{t(texte.registerNote, { note: formatiereZahl(e.note, 1, sprache) })}</span>
                <span aria-hidden="true" className="numeric text-h2 text-text">
                  {formatiereZahl(e.note, 1, sprache)}
                </span>
                <span className="text-caption text-text-muted numeric">{formatiereDatum(e.datum, sprache)}</span>
              </p>
              <p className="text-small text-text-muted">
                {e.community
                  ? t(texte.registerCommunity, { note: formatiereZahl(e.community.mittel, 1, sprache), anzahl: e.community.anzahl })
                  : texte.registerOhneCommunity}
              </p>
              {e.abstand !== null ? (
                <p className="text-small text-text numeric">
                  {t(texte.registerAbstand, { wert: abstandText(e.abstand, sprache) })}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {!alle && ansicht.gesamt > ansicht.eintraege.length ? (
        <Link prefetch={false} scroll={false} href={ziel(sortierung, true)} className={cn(textLinkKlassen(), "self-start")}>
          {t(texte.registerAlle, { anzahl: ansicht.gesamt })}
        </Link>
      ) : null}
    </div>
  );
}
