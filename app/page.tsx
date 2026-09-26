import { Abstimmung } from "@/components/story/Abstimmung";
import { AromaSektion } from "@/components/story/AromaSektion";
import { Auftakt } from "@/components/story/Auftakt";
import { FeldbuchRaster } from "@/components/story/FeldbuchRaster";
import { GemeinsamLernen } from "@/components/story/GemeinsamLernen";
import { Katalog } from "@/components/story/Katalog";
import { NeuesterEintrag } from "@/components/story/NeuesterEintrag";
import { StoryBuehne } from "@/components/story/StoryBuehne";
import { TransparentMachen } from "@/components/story/TransparentMachen";
import { WissenBuendeln } from "@/components/story/WissenBuendeln";

/**
 * Die Startseite als Scroll-Story (Spec 5.1). Sektion 9 ist der Fuß im
 * Layout. Apotheken seit 2026-09-26 nicht mehr auf der Startseite (Nutzer:
 * noch fehl am Platz, nur in Aussicht). Jede Datensektion hat ihre eigene Suspense-Grenze; Bewegung kommt
 * allein aus der StoryBuehne am Ende.
 *
 * force-dynamic: die Seite ist nutzerbezogen (eigene Stimme, Preise nur mit
 * Freigabe) und darf nie als Ganzes gecacht werden.
 */
export const dynamic = "force-dynamic";

export default function StartPage() {
  return (
    <div className="relative isolate bg-surface">
      <FeldbuchRaster />
      <Auftakt />
      <TransparentMachen />
      <AromaSektion />
      <WissenBuendeln />
      <GemeinsamLernen />
      <NeuesterEintrag />
      <Abstimmung />
      <Katalog />
      <StoryBuehne />
    </div>
  );
}
