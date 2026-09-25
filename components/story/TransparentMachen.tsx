import { LoopSchalter } from "@/components/medien/LoopSchalter";
import type { ReactNode } from "react";

import { Loop } from "@/components/medien/Loop";
import { UeberlaufWort, ueberlaufPlatz } from "@/components/story/UeberlaufWort";

/**
 * Die drei Prüfpunkte zwischen den Absätzen (Spec Redesign 9 und 13), seit
 * 2026-09-25 in der Reihenfolge der Bewertung: Gesamteindruck, Terpene,
 * Beschaffenheit (wie die Aroma-Erkundung). Große
 * Bilder in ungleichen, leicht verlaufenen Kreisen (unperfekt mit Absicht),
 * neben denen der Absatz steht (Paar, seit 2026-09-25 nebeneinander statt umflossen).
 */
const PUNKTE = [
  {
    titel: "Gesamteindruck",
    video: "aussehen-loop",
    text: "Aussehen, Geruch, Geschmack und Konsistenz, jeweils von 1 bis 5. Der erste Blick auf die Blüte.",
    seite: "rechts",
    form: "rounded-[62%_38%_55%_45%/48%_60%_40%_52%] rotate-3",
    verzoegerung: "0s",
  },
  {
    titel: "Terpene",
    video: "geruch-loop",
    text: "Jedes Terpen einzeln, neben der Angabe des Herstellers. Die Abweichung steht daneben.",
    seite: "links",
    form: "rounded-[45%_55%_40%_60%/58%_42%_62%_38%] -rotate-2",
    verzoegerung: "-5s",
  },
  {
    titel: "Beschaffenheit",
    video: "feuchte-loop",
    text: "Chlorophyll, Bud-Dichte, Terpendichte, Trichome und Restfeuchte. Zwischen 8 und 13 Prozent Feuchte ist gut.",
    seite: "rechts",
    form: "rounded-[55%_45%_62%_38%/42%_56%_44%_58%] rotate-1",
    verzoegerung: "-9s",
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
function Punkt({ punkt }: { punkt: (typeof PUNKTE)[number] }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col items-center gap-6 text-center md:w-md lg:w-lg">
      <div data-punkt="" className="relative aspect-square w-full">
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
          className={`blob-morph relative h-full w-full overflow-hidden ${punkt.form}`}
          style={{ animationDelay: punkt.verzoegerung }}
        >
          <Loop id={punkt.video} className="bild-zoom h-full" />
        </div>
      </div>
      {/* Pause fuer die Videos (WCAG 2.2.2); sichtbar erst, wenn loops.ts sie startet. */}
      <LoopSchalter />
      <div className="flex flex-col gap-2">
        {/* Logoschrift im Farbverlauf wie die Schlagworte (Nutzer 2026-09-25). */}
        <h3 className="farbverlauf font-hand text-notiz leading-none">{punkt.titel}</h3>
        <p className="text-small text-text-muted text-pretty">{punkt.text}</p>
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
  children,
}: {
  punkt: (typeof PUNKTE)[number];
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
        className={`font-buch text-erzaehlung leading-[1.08] text-text md:max-w-[20ch] ${videoLinks ? "md:order-2" : ""}`}
      >
        {children}
      </p>
      <Punkt punkt={punkt} />
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
      className="farbverlauf font-hand text-erzaehlung not-italic leading-[0.8]"
      style={{ fontSize: "calc(var(--text-kapitel) * 1.35)" }}
    >
      {children}
    </em>
  );
}

/**
 * Sektion 2: das Manifest. Seit 2026-09-25 ohne Chargen (Nutzer: nicht mehr
 * relevant); es trägt, was die Bewertung ausmacht: jedes Terpen einzeln und
 * die Abweichung zwischen Community und Herstellerangabe. Die Kopfzeile mit
 * dem Stand steht jetzt unten im Auftakt (Kopfzeile.tsx).
 */
export function TransparentMachen() {
  return (
    <section
      aria-labelledby="transparent-titel"
      data-story="transparent"
      className="relative isolate overflow-x-clip px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto w-full max-w-360">
        <div data-story="manifest">
          {/* Schlusswort übergroß hinter dem Satz (UeberlaufWort, Nutzer 2026-09-25); das
              Wort-für-Wort-Aufdecken gilt nur dem Satz, nicht den Konturen. */}
          <h2
            id="transparent-titel"
            className="relative isolate mx-auto max-w-4xl text-center font-buch text-erzaehlung text-text text-balance"
            style={ueberlaufPlatz}
          >
            <span data-manifest-zeile="">Wir schreiben auf, was drin ist. Hinter jedem Handelsnamen steckt ein</span>{" "}
            <UeberlaufWort wort="Terpenprofil." />
          </h2>
          <Paar punkt={PUNKTE[0]} erster>
            Der <Buzz>Gesamteindruck.</Buzz> Nicht, was auf der Dose steht, sondern wie sie aussieht, wie sie riecht, wie
            sie schmeckt.
          </Paar>
          <Paar punkt={PUNKTE[1]}>
            Jedes Terpen bekommt seine <Buzz>eigene Note.</Buzz> Daneben
            steht, was der Hersteller angibt, und wie weit die Community davon abweicht.
          </Paar>
          <Paar punkt={PUNKTE[2]}>
            Zum Schluss die <Buzz>Beschaffenheit:</Buzz> Dichte, Trichome, Feuchte. Dann stimmen wir ab, was als Nächstes
            drankommt, und alle wissen danach ein bisschen mehr.
          </Paar>
        </div>
      </div>
    </section>
  );
}
