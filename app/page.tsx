import { Auftakt } from "@/components/story/Auftakt";
import { FeldbuchRaster } from "@/components/story/FeldbuchRaster";

/**
 * Die Startseite als Scroll-Story (Spec 5.1). Sektion 9 ist der Fuß im
 * Layout. Jede Datensektion hat ihre eigene Suspense-Grenze; Bewegung kommt
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
    </div>
  );
}
