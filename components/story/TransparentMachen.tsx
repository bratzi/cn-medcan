import { LoopSchalter } from "@/components/medien/LoopSchalter";
import type { ReactNode } from "react";

import { Loop } from "@/components/medien/Loop";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";

const ERLAEUTERUNG: Record<string, string> = Object.fromEntries(
  BEWERTUNGS_ACHSEN.map((achse) => [achse.key, achse.erlaeuterung]),
);

/**
 * Die drei Prüfpunkte zwischen den Absätzen (Spec Redesign 9 und 13): große
 * Bilder in ungleichen, leicht verlaufenen Kreisen (unperfekt mit Absicht),
 * um die der Manifest-Text fließt (float mit shape-outside: ellipse).
 */
const PUNKTE = [
  {
    titel: "Aussehen",
    video: "aussehen-loop",
    text: ERLAEUTERUNG.aussehen,
    seite: "rechts",
    form: "rounded-[62%_38%_55%_45%/48%_60%_40%_52%] rotate-3",
    verzoegerung: "0s",
  },
  {
    titel: "Geruch",
    video: "geruch-loop",
    text: ERLAEUTERUNG.geruch,
    seite: "links",
    form: "rounded-[45%_55%_40%_60%/58%_42%_62%_38%] -rotate-2",
    verzoegerung: "-5s",
  },
  {
    titel: "Restfeuchte",
    video: "feuchte-loop",
    text: "Zwischen 8 und 13 Prozent ist gut. Darunter wird es staubig, darüber droht Schimmel.",
    seite: "rechts",
    form: "rounded-[55%_45%_62%_38%/42%_56%_44%_58%] rotate-1",
    verzoegerung: "-9s",
  },
] as const;

/**
 * Ein Prüfpunkt: je ein Video zum Thema füllt den Blob randlos; der Blob
 * morpht langsam (blob-morph), das Video zoomt leicht (bild-zoom). Zwei
 * Linien in Grün und Violett morphen im eigenen Takt um die Kante mit
 * (blob-linie). Mit der Maus über dem Video folgen Video und Linien dem
 * Zeiger in drei Tiefen (bewegung/punkte.ts, data-punkt-tiefe).
 * Reduzierte Bewegung: alles steht, das Standbild bleibt (globals.css).
 */
function Punkt({ punkt }: { punkt: (typeof PUNKTE)[number] }) {
  const seite = punkt.seite === "rechts" ? "float-right ml-10 md:ml-16" : "float-left mr-10 md:mr-16";
  return (
    <aside
      className={`${seite} my-16 flex w-56 flex-col items-center gap-6 text-center md:my-24 md:w-sm [shape-margin:2.5rem] [shape-outside:ellipse(50%_45%)]`}
    >
      <div data-punkt="" className="relative aspect-square w-full">
        <span
          aria-hidden="true"
          data-punkt-tiefe="1.6"
          className="blob-linie blob-linie-gruen pointer-events-none absolute -inset-4"
          style={{ animationDelay: punkt.verzoegerung }}
        />
        <span
          aria-hidden="true"
          data-punkt-tiefe="2.4"
          className="blob-linie blob-linie-lila pointer-events-none absolute -inset-8"
          style={{ animationDelay: punkt.verzoegerung }}
        />
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
        <h3 className="font-buch text-h3 font-medium text-text">{punkt.titel}</h3>
        <p className="text-small text-text-muted text-pretty">{punkt.text}</p>
      </div>
    </aside>
  );
}

/** Ein Absatz des Manifests: scroll-gekoppelt Wort für Wort sichtbar (transparent.ts). */
function Zeile({ children }: { children: ReactNode }) {
  return (
    <p data-manifest-zeile="" className="mt-24 font-buch text-erzaehlung text-text md:mt-32">
      {children}
    </p>
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
        <div data-story="manifest" className="flow-root">
          <h2 id="transparent-titel" data-manifest-zeile="" className="font-buch text-erzaehlung text-text text-balance">
            Hinter jedem Handelsnamen steckt ein <em className="farbverlauf font-hand text-erzaehlung not-italic">Terpenprofil.</em> Wir
            schreiben auf, was drin ist.
          </h2>
          <Punkt punkt={PUNKTE[0]} />
          <Zeile>
            Nicht nur, was auf der Dose steht. Sondern wie sie aussieht, wie sie riecht, wie feucht sie ist und
            welches Terpen wie stark durchkommt.
          </Zeile>
          <Punkt punkt={PUNKTE[1]} />
          <Zeile>
            Jedes Terpen bekommt seine <em className="farbverlauf font-hand text-erzaehlung not-italic">eigene Note.</em> Daneben
            steht, was der Hersteller angibt, und wie weit die Community davon abweicht.
          </Zeile>
          <Punkt punkt={PUNKTE[2]} />
          <Zeile>
            Wir bewerten, was wir gefunden haben. Wir stimmen ab, was als Nächstes drankommt. Und alle wissen
            danach ein bisschen mehr.
          </Zeile>
        </div>
      </div>
    </section>
  );
}
