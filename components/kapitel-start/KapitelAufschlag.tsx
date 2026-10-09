import Link from "next/link";

import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { Avatar, Badge, buttonKlassen, namenLinkKlassen } from "@/components/ui";
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

/** Die zwei stärksten Vorlieben im Netz, Namen aus den Achsen; nur „mag ich“ (Wert über 0). */
function lieblinge(daten: KapitelDaten, achsen: KapitelTexte["achsen"]): string[] {
  if (!daten.netz) return [];
  return (Object.entries(daten.netz.geschmack) as [keyof KapitelTexte["achsen"], number][])
    .filter(([, wert]) => wert > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([achse]) => achsen[achse]);
}

/**
 * Der Aufschlag eines Kapitels auf der Startseite (Spec Dein Kapitel 3, umgebaut Nutzer 2026-10-09):
 * eine zentrierte Säule. Oben wer schreibt (Avatar, Name, Rolle, dabei seit, Vorlieben), in der
 * Mitte groß das Aroma-Netz als Blickfang, darunter die Zahlen als Randnotizen (Zahl gedruckt, Wort
 * von Hand), zuletzt „Zuletzt bewertet“ und genau eine Aktion. Schaufenster (Betreiber, Gast) und
 * eigenes Kapitel teilen die Komposition, damit beim Umblättern nichts springt. Nur Aroma, nie
 * Wirkung (HWG).
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
  const mag = lieblinge(daten, alle.achsen);
  const angaben = [
    daten.seit ? t(texte.dabeiSeit, { datum: formatiereDatum(daten.seit, sprache) }) : null,
    mag.length > 0 ? t(texte.mag, { aromen: mag.join(` ${texte.und} `) }) : null,
  ].filter((a): a is string => a !== null);

  return (
    <div className="mx-auto flex w-full max-w-240 flex-col items-center gap-12 text-center">
      <div className="flex w-full min-w-0 flex-col items-center gap-6">
        {art === "schaufenster" ? (
          <p className="font-hand text-vermerk text-kopierstift">{texte.vermerk}</p>
        ) : null}
        {/* ring-offset-4 = 4px: optische Korrektur wie im Buch, der Ring liegt wie ein Stempel. */}
        <Avatar
          name={daten.anzeigename}
          bildId={daten.avatarId}
          groesse="lg"
          className="ring-1 ring-border-strong ring-offset-4 ring-offset-surface"
        />
        <p data-story="kapitel-name" className="w-full min-w-0 font-buch text-kapitel text-text text-balance wrap-break-word">
          {daten.anzeigename}
        </p>
        <div aria-label={texte.ueberDich} role="group" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Badge variante={daten.rolle === "betreiber" ? "accent" : "neutral"} zeichen={false}>
            {daten.rolle === "betreiber" ? texte.betreiber : texte.mitglied}
          </Badge>
          {angaben.map((angabe) => (
            <span key={angabe} className="text-small text-text-muted">
              {angabe}
            </span>
          ))}
        </div>
      </div>

      {daten.netz ? (
        <div data-netz-erscheinen="" className="w-full max-w-160">
          <ProfilNetz
            werte={daten.netz}
            texte={art === "schaufenster" ? alle.profilOeffentlich : alle.profil}
            achsen={alle.achsen}
            sprache={sprache}
            verlauf={daten.verlauf}
            className="w-full"
          />
        </div>
      ) : art === "schaufenster" || leer ? (
        // Ohne gespeichertes Profil, aber mit Bewertungen, stimmt „entsteht mit deiner ersten
        // Bewertung“ nicht; dann bleibt die Stelle leer, bis das Profil nachgerechnet ist.
        <p className="max-w-[48ch] text-body text-text-muted text-pretty">
          {art === "schaufenster" ? texte.satzGast : texte.leerNetz}
        </p>
      ) : null}

      <ul aria-label={texte.notizen} className="flex flex-wrap justify-center gap-x-16 gap-y-8">
        {notizen.map((n) => (
          <li key={n.wort} className="flex min-w-0 flex-col items-center gap-2">
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

      <div className="flex w-full flex-col items-center gap-8 border-t border-border pt-8">
        {daten.zuletzt ? (
          <div className="flex min-w-0 flex-col items-center gap-2">
            <p className="text-small text-text-muted">{texte.zuletzt}</p>
            <p className="font-buch text-h3 wrap-break-word">
              <Link prefetch={false} href={`/blueten/${daten.zuletzt.slug}`} className={namenLinkKlassen()}>
                {daten.zuletzt.handelsname}
              </Link>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
        <Link prefetch={false} href={aktion.href} className={buttonKlassen("primary")}>
          {aktion.text}
        </Link>
      </div>
    </div>
  );
}
