import { Abstimmung } from "@/components/story/Abstimmung";
import { AromaSektion } from "@/components/story/AromaSektion";
import { Empfehlungen } from "@/components/story/Empfehlungen";
import { Auftakt } from "@/components/story/Auftakt";
import { FeldbuchRaster } from "@/components/story/FeldbuchRaster";
import { GemeinsamLernen } from "@/components/story/GemeinsamLernen";
import { Katalog } from "@/components/story/Katalog";
import { NeuesterEintrag } from "@/components/story/NeuesterEintrag";
import { StartSitzung } from "@/components/story/StartSitzung";
import { StoryBuehne } from "@/components/story/StoryBuehne";
import { TerpenBand } from "@/components/story/TerpenBand";
import { TerpenRegister } from "@/components/story/TerpenRegister";
import { TransparentMachen } from "@/components/story/TransparentMachen";
import { WissenBuendeln } from "@/components/story/WissenBuendeln";

/**
 * Die Startseite als Scroll-Story (Spec 5.1). Sektion 9 ist der Fuß im
 * Layout. Apotheken seit 2026-09-26 nicht mehr auf der Startseite (Nutzer:
 * noch fehl am Platz, nur in Aussicht). Jede Datensektion hat ihre eigene Suspense-Grenze; Bewegung kommt
 * allein aus der StoryBuehne am Ende.
 *
 * Statisch je Sprache, alle 300 s neu (Spec 2026-10-01, statische Seiten,
 * 4.3): Was vom Betrachter abhängt (Stimmzettel, Empfehlungen, Budpic-Zugang),
 * holt StartSitzung im Browser. force-static macht cookies und headers
 * leer: eine vergessene Sitzungsabfrage zeigt hier die Gastansicht, statt die
 * Seite dynamisch zu machen.
 */
export const dynamic = "force-static";
export const revalidate = 300;

export default function StartPage() {
  return (
    <StartSitzung>
      <div className="relative isolate bg-surface">
        <FeldbuchRaster />
        <Auftakt />
        {/* Band der Terpene zwischen Hero und Story (Nutzer 2026-09-30). */}
        <TerpenBand />
        <TransparentMachen />
        {/* T12: Register der Terpene und Geschmäcker, vor der Aroma-Karte (Nutzer 2026-09-29). */}
        <TerpenRegister />
        <AromaSektion />
        <WissenBuendeln />
        <GemeinsamLernen />
        <NeuesterEintrag />
        <Empfehlungen />
        <Abstimmung />
        <Katalog />
        <StoryBuehne />
      </div>
    </StartSitzung>
  );
}
