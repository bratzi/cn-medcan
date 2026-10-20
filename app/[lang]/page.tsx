import { DeinKapitel } from "@/components/story/DeinKapitel";
import { AromaSektion } from "@/components/story/AromaSektion";
import { Empfehlungen } from "@/components/story/Empfehlungen";
import { SotmSektion } from "@/components/sotm/SotmSektion";
import { Auftakt } from "@/components/story/Auftakt";
import { FeldbuchRaster } from "@/components/story/FeldbuchRaster";
import { GemeinsamLernen } from "@/components/story/GemeinsamLernen";
import { NeuesterEintrag } from "@/components/story/NeuesterEintrag";
import { StartSitzung } from "@/components/story/StartSitzung";
import { StoryBuehne } from "@/components/story/StoryBuehne";
import { TerpenBand } from "@/components/story/TerpenBand";
import { TerpenRegister } from "@/components/story/TerpenRegister";
import { TransparentMachen } from "@/components/story/TransparentMachen";
import { WissenBuendeln } from "@/components/story/WissenBuendeln";
import { sprachParameter } from "@/lib/i18n/vorrendern";

/**
 * Die Startseite als Scroll-Story (Spec 5.1). Sektion 9 ist der Fuß im
 * Layout. Apotheken seit 2026-09-26 nicht mehr auf der Startseite (Nutzer:
 * noch fehl am Platz, nur in Aussicht). Jede Datensektion hat ihre eigene Suspense-Grenze; Bewegung kommt
 * allein aus der StoryBuehne am Ende.
 *
 * Statisch je Sprache (Spec 2026-10-01, statische Seiten, 4.3). Neu gebaut, wenn
 * eine Aktion revalidiereSprachen("/") ruft (D1-Tag-Cache, Session 54), sonst
 * einmal am Tag: ein Neubau kostete live 700 bis 1300 ms CPU. Was vom Betrachter abhängt (Stimmzettel, Empfehlungen, Budpic-Zugang),
 * holt StartSitzung im Browser. force-static macht cookies und headers
 * leer: eine vergessene Sitzungsabfrage zeigt hier die Gastansicht, statt die
 * Seite dynamisch zu machen.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

/** Beide Sprachen im Build vorrendern, wenn die lokale D1 den Live-Abzug trägt (scripts/cf-build.mjs). */
export function generateStaticParams() {
  return sprachParameter();
}

export default function StartPage() {
  return (
    <StartSitzung>
      <div className="relative isolate bg-surface">
        <FeldbuchRaster />
        <Auftakt />
        {/* Band der Terpene zwischen Hero und Story (Nutzer 2026-09-30). */}
        <TerpenBand />
        {/* Nutzer 2026-10-20: erst das komplette Storytelling (Manifest, Overall, Terpz, Qualität),
            dann Dein Kapitel, dann Bewertung und Katalog in einer Sektion (Katalog steuert die Aroma-Karte), dann der Rest. */}
        <TransparentMachen />
        <DeinKapitel />
        <AromaSektion />
        <NeuesterEintrag />
        <TerpenRegister />
        <WissenBuendeln />
        <GemeinsamLernen />
        <Empfehlungen />
        {/* Abstimmungen sind freiwillige Events, nicht im Fokus (Nutzer 2026-10-15): ans Ende, kompakt. */}
        <SotmSektion />
        <StoryBuehne />
      </div>
    </StartSitzung>
  );
}
