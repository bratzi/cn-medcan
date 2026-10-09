import Link from "next/link";

import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { Avatar, buttonKlassen, namenLinkKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereZahl } from "@/lib/format";
import { kapitelNotizen, type KapitelDaten } from "@/lib/kapitel-start";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { netzTexte } from "@/lib/profil-oeffentlich";

/** Nur die Texte, die das Kapitel braucht: die Insel serialisiert sie ins HTML, nicht das ganze Wörterbuch. */
export type KapitelTexte = {
  kapitel: Woerterbuch["start"]["kapitel"];
  profil: Woerterbuch["profil"];
  profilOeffentlich: Woerterbuch["profil"];
  achsen: Woerterbuch["label"]["geschmack"];
};

export function kapitelTexte(w: Woerterbuch): KapitelTexte {
  return { kapitel: w.start.kapitel, profil: w.profil, profilOeffentlich: netzTexte(w), achsen: w.label.geschmack };
}

/**
 * Der Aufschlag eines Kapitels auf der Startseite (Spec Dein Kapitel 3): Name als Titel, Zahlen als
 * Randnotizen (Zahl gedruckt, Wort von Hand), das Aroma-Netz als einziges Bild, darunter „Zuletzt
 * bewertet“ und genau eine Aktion. Schaufenster (Betreiber, Gast) und eigenes Kapitel teilen die
 * Komposition, damit beim Umblättern nichts springt. Nur Aroma, nie Wirkung (HWG).
 */
export function KapitelAufschlag({
  daten,
  art,
  texte: alle,
  sprache,
}: {
  daten: KapitelDaten;
  art: "schaufenster" | "eigen";
  texte: KapitelTexte;
  sprache: Sprache;
}) {
  const texte = alle.kapitel;
  const notizen = kapitelNotizen(daten, texte, sprache);
  const leer = daten.bewertet === 0;
  const aktion =
    art === "schaufenster"
      ? { href: "/registrieren", text: texte.kontoAnlegen }
      : leer
        ? { href: "/blueten", text: texte.ersteBewertung }
        : { href: "/profil", text: texte.zumKapitel };

  return (
    <div className="grid grid-cols-1 gap-12 min-[1080px]:grid-cols-10 min-[1080px]:gap-x-16">
      <div className="flex min-w-0 flex-col gap-8 min-[1080px]:col-span-6">
        {art === "schaufenster" ? (
          <p className="font-hand text-vermerk text-kopierstift">{texte.vermerk}</p>
        ) : null}
        <div className="flex min-w-0 flex-col gap-6 min-[640px]:flex-row min-[640px]:items-center">
          {/* ring-offset-4 = 4px: optische Korrektur wie im Buch, der Ring liegt wie ein Stempel. */}
          <Avatar
            name={daten.anzeigename}
            bildId={daten.avatarId}
            groesse="lg"
            className="ring-1 ring-border-strong ring-offset-4 ring-offset-surface max-[639px]:size-20"
          />
          <p data-story="kapitel-name" className="min-w-0 font-buch text-kapitel text-text wrap-break-word">
            {daten.anzeigename}
          </p>
        </div>
        <ul aria-label={texte.notizen} className="grid grid-cols-2 gap-8 min-[640px]:grid-cols-3">
          {notizen.map((n) => (
            <li key={n.wort} className="flex min-w-0 flex-col gap-2">
              <span className="sr-only">{n.satz}</span>
              <span aria-hidden="true" className="numeric text-display text-text">
                {n.zahl}
              </span>
              <span aria-hidden="true" data-story="kapitel-wort" className="font-hand text-notiz text-logo wrap-break-word">
                {n.wort}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 min-[1080px]:col-span-4">
        {daten.netz ? (
          <div data-netz-erscheinen="" className="mx-auto w-full max-w-96">
            <ProfilNetz
              werte={daten.netz}
              texte={art === "schaufenster" ? alle.profilOeffentlich : alle.profil}
              achsen={alle.achsen}
              sprache={sprache}
              verlauf={daten.verlauf}
              className="w-full max-w-96"
            />
          </div>
        ) : art === "schaufenster" || leer ? (
          // Ohne gespeichertes Profil, aber mit Bewertungen, stimmt „entsteht mit deiner ersten
          // Bewertung“ nicht; dann bleibt die Spalte leer, bis das Profil nachgerechnet ist.
          <p className="max-w-[48ch] text-body text-text-muted text-pretty">
            {art === "schaufenster" ? texte.satzGast : texte.leerNetz}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 border-t border-border pt-8 min-[1080px]:col-span-10 min-[1080px]:flex-row min-[1080px]:items-center min-[1080px]:justify-between">
        {daten.zuletzt ? (
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-small text-text-muted">{texte.zuletzt}</p>
            <p className="font-buch text-h3 wrap-break-word">
              <Link prefetch={false} href={`/blueten/${daten.zuletzt.slug}`} className={namenLinkKlassen()}>
                {daten.zuletzt.handelsname}
              </Link>
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {daten.zuletzt.gesamtnote !== null ? (
                <BlattAnzeige
                  note={daten.zuletzt.gesamtnote}
                  text={t(texte.schnittText, { zahl: formatiereZahl(daten.zuletzt.gesamtnote, 1, sprache) })}
                />
              ) : null}
              <span className="numeric text-small text-text-muted">{formatiereDatum(daten.zuletzt.datum, sprache)}</span>
            </div>
          </div>
        ) : null}
        <Link prefetch={false} href={aktion.href} className={cn(buttonKlassen("primary"), "min-[1080px]:ms-auto")}>
          {aktion.text}
        </Link>
      </div>
    </div>
  );
}
