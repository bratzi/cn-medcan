import Link from "next/link";
import type { ReactNode } from "react";

import { GlasMaske } from "@/components/medien/GlasMaske";
import { Loop } from "@/components/medien/Loop";
import { LoopSchalter } from "@/components/medien/LoopSchalter";
import { bluetenZeile } from "@/lib/bluete-zeile";
import { beispielWerte } from "@/lib/bewertung-beispiel";
import { formatiereZahl } from "@/lib/format";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { t } from "@/lib/i18n/text";
import { ladeNeuestenBetreiberEintrag } from "@/lib/query/buch-band";
import { sicher } from "@/lib/sicher";

/**
 * Die drei Prüfpunkte zwischen den Absätzen (Spec Redesign 9 und 13), seit
 * 2026-09-25 in der Reihenfolge der Bewertung: Gesamteindruck, Terpene,
 * Beschaffenheit (wie die Aroma-Erkundung). Große
 * Bilder in ungleichen, leicht verlaufenen Kreisen (unperfekt mit Absicht),
 * neben denen der Absatz steht (Paar, seit 2026-09-25 nebeneinander statt umflossen).
 */
const PUNKTE = [
  {
    schluessel: "overall",
    video: "aussehen-loop",
    seite: "rechts",
    form: "rounded-[62%_38%_55%_45%/48%_60%_40%_52%] rotate-3",
    verzoegerung: "0s",
    glas: "lila",
  },
  {
    schluessel: "terpz",
    video: "geruch-loop",
    seite: "links",
    form: "rounded-[45%_55%_40%_60%/58%_42%_62%_38%] -rotate-2",
    verzoegerung: "-5s",
    glas: "gruen",
  },
  {
    schluessel: "qualitaet",
    video: "feuchte-loop",
    seite: "rechts",
    form: "rounded-[55%_45%_62%_38%/42%_56%_44%_58%] rotate-1",
    verzoegerung: "-9s",
    glas: "lila",
  },
] as const;

/**
 * Linien um jedes Video: violett und grün, verschieden weit weg, verschieden
 * schnell und verschieden stark im Morphen; beim Zeiger verschieden tief.
 */
const RINGE = [
  { farbe: "blob-linie-gruen", abstand: "-inset-4", tiefe: "1.6", stil: { "--form": "blob-morph", "--dauer": "13s", "--richtung": "alternate-reverse" } },
  { farbe: "blob-linie-lila", abstand: "-inset-8", tiefe: "2.4", stil: { "--form": "blob-morph-stark", "--dauer": "17s" } },
  { farbe: "blob-linie-lila", abstand: "-inset-2", tiefe: "1.2", stil: { "--form": "blob-morph-stark", "--dauer": "8s", "--richtung": "alternate-reverse" } },
  { farbe: "blob-linie-gruen", abstand: "-inset-12", tiefe: "3.2", stil: { "--form": "blob-morph", "--dauer": "23s" } },
] as const;

/**
 * Ein Prüfpunkt: je ein Video zum Thema füllt den Blob randlos; der Blob
 * morpht langsam (blob-morph), das Video zoomt leicht (bild-zoom). Vier
 * Linien in Grün und Violett morphen im eigenen Takt um die Kante mit
 * (blob-linie). Mit der Maus über dem Video folgen Video und Linien dem
 * Zeiger in drei Tiefen (bewegung/punkte.ts, data-punkt-tiefe).
 * Reduzierte Bewegung: alles steht, das Standbild bleibt (globals.css).
 */
function Punkt({
  punkt,
  text,
  schritt,
  wert,
}: {
  punkt: (typeof PUNKTE)[number];
  text: { titel: string; text: string };
  schritt: string;
  wert: string | null;
}) {
  return (
    <aside className="flex w-64 shrink-0 flex-col items-center gap-6 text-center md:w-md lg:w-lg">
      <div data-punkt="" className="relative isolate aspect-square w-full">
        {RINGE.map((ring, index) => (
          <span
            key={index}
            aria-hidden="true"
            data-punkt-tiefe={ring.tiefe}
            data-takt=""
            className={`blob-linie ${ring.farbe} pointer-events-none absolute ${ring.abstand}`}
            style={{ ...ring.stil, "--verzug": punkt.verzoegerung } as unknown as React.CSSProperties}
          />
        ))}
        <div
          data-punkt-tiefe="1"
          className={`blob-morph relative z-[1] h-full w-full overflow-hidden ${punkt.form}`}
          style={{ animationDelay: punkt.verzoegerung }}
        >
          <Loop id={punkt.video} className="bild-zoom h-full" />
        </div>
        {/* Glas hinter dem Video, zu rund zwei Dritteln verdeckt, im Wechsel Violett und Grün,
            schwingt mit und folgt dem Zeiger (Nutzer 2026-09-26). */}
        <GlasMaske
          tiefe="2"
          ton={punkt.glas}
          className="inset-0"
          versatz={punkt.seite === "links" ? ["22%", "16%"] : ["-22%", "16%"]}
        />
      </div>
      {/* Pause fuer die Videos (WCAG 2.2.2); sichtbar erst, wenn loops.ts sie startet. */}
      <LoopSchalter />
      <div className="flex flex-col gap-2">
        <p className="text-small text-text-muted">{schritt}</p>
        {/* Logoschrift im Farbverlauf wie die Schlagworte (Nutzer 2026-09-25). */}
        <h3 className="farbverlauf font-hand text-notiz leading-none">{text.titel}</h3>
        <p className="text-small text-text-muted text-pretty">{text.text}</p>
        {wert ? <p className="text-body text-text">{wert}</p> : null}
      </div>
    </aside>
  );
}

/**
 * Absatz und Video als Paar (Nutzer 2026-09-25): nebeneinander, vertikal mittig
 * zueinander, das Video im Wechsel rechts und links. Der große Abstand liegt
 * zwischen den Paaren, nie zwischen Video und Text. Der Absatz deckt sich
 * scroll-gekoppelt Wort für Wort auf (transparent.ts).
 */
function Paar({
  punkt,
  erster = false,
  text,
  schritt,
  wert,
  children,
}: {
  punkt: (typeof PUNKTE)[number];
  text: { titel: string; text: string };
  schritt: string;
  wert: string | null;
  erster?: boolean;
  children: ReactNode;
}) {
  const videoLinks = punkt.seite === "links";
  return (
    <div
      className={`${erster ? "mt-32 md:mt-48" : "mt-[18vh] md:mt-[25vh]"} flex flex-col items-center gap-12 md:flex-row md:justify-center md:gap-24`}
    >
      {/* Buchschrift; nur das eine Schlagwort je Absatz (Buzz) steht in der Logoschrift (Nutzer 2026-09-25). */}
      <p
        data-manifest-zeile=""
        className={`font-buch text-erzaehlung leading-[1.08] text-text max-md:text-center md:max-w-[20ch] ${videoLinks ? "md:order-2" : ""}`}
      >
        {children}
      </p>
      <Punkt punkt={punkt} text={text} schritt={schritt} wert={wert} />
    </div>
  );
}

/**
 * Prägnantes Schlagwort im Absatz (Nutzer 2026-09-25: in jedem Absatz eines,
 * koloriert): Farbverlauf der Marke, größer als der Fließgrad.
 */
function Buzz({ children }: { children: ReactNode }) {
  return (
    <em
      className="relative isolate inline-block font-hand text-erzaehlung not-italic leading-[0.8]"
      style={{ fontSize: "calc(var(--text-kapitel) * 1.35)" }}
    >
      {/* Ruhiger Puls ohne Konturen dahinter (Nutzer 2026-10-16). */}
      <span className="fazit-puls farbverlauf block">{children}</span>
    </em>
  );
}

/**
 * Sektion „Bewertung“ (Spec 2026-10-20, Teil A): Overall, Terpz und Qualität als
 * Schritte 1 bis 3, aus dem Storytelling gelöst. Die Werte stammen aus der
 * neuesten Betreiber-Bewertung; ohne sie stehen die Schritte ohne Werte.
 * Die Absätze tragen data-manifest-zeile im Block data-story="manifest", so deckt
 * transparent.ts sie weiter Wort für Wort auf.
 */
export async function BewertungSchritte() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const texte = w.start.transparent;
  const b = w.start.bewertung;
  const beispiel = beispielWerte(await sicher(() => ladeNeuestenBetreiberEintrag(), null, "Bewertung-Beispiel"));
  const werte = {
    overall: beispiel ? t(b.overall, { wert: formatiereZahl(beispiel.overall, 1, sprache) }) : null,
    terpz: beispiel?.terpen ? t(b.terpz, { terpen: beispiel.terpen }) : null,
    qualitaet: beispiel && beispiel.feuchte != null ? t(b.qualitaet, { wert: formatiereZahl(beispiel.feuchte, 0, sprache) }) : null,
  };
  const schritt = (nummer: number) => t(b.schritt, { nummer: String(nummer) });
  return (
    <section
      aria-labelledby="bewertung-titel"
      data-story="bewertung"
      className="feldbuch-raster relative isolate overflow-x-clip bg-surface px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto w-full max-w-360">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 id="bewertung-titel" className="font-buch text-kapitel text-balance text-text">
            {b.titel}
          </h2>
          {beispiel ? (
            <Link prefetch={false} href={`/blueten/${beispiel.slug}`} className="text-body text-text-muted underline underline-offset-4">
              {t(b.beispiel, {
                bluete: bluetenZeile(w.start.bluetenZeile, w.bluete.vertreiber.unbekannt, {
                  handelsname: beispiel.bluete,
                  bluete: beispiel.bluete,
                  vertreiber: beispiel.vertreiber,
                }),
              })}
            </Link>
          ) : null}
        </div>
        <div data-story="manifest">
          <Paar punkt={PUNKTE[0]} text={texte.punkte.overall} schritt={schritt(1)} wert={werte.overall} erster>
            {texte.absatz1.vor} <Buzz>{texte.absatz1.buzz}</Buzz> {texte.absatz1.nach}
          </Paar>
          <Paar punkt={PUNKTE[1]} text={texte.punkte.terpz} schritt={schritt(2)} wert={werte.terpz}>
            {texte.absatz2.vor} <Buzz>{texte.absatz2.buzz}</Buzz> {texte.absatz2.nach}
          </Paar>
          <Paar punkt={PUNKTE[2]} text={texte.punkte.qualitaet} schritt={schritt(3)} wert={werte.qualitaet}>
            {texte.absatz3.vor} <Buzz>{texte.absatz3.buzz}</Buzz> {texte.absatz3.nach}
          </Paar>
        </div>
      </div>
    </section>
  );
}
