import { cn } from "@/lib/cn";
import { medium } from "@/lib/medien";

type Props = {
  id: string;
  className?: string;
  /** Bühnenvideo (Auftakt): in Farbe, kein Mischmodus, Metadaten sofort. */
  buehne?: boolean;
};

/**
 * Stummes Video als Schleife (Spec 4.5). `preload="none"`: es laedt nichts,
 * bis die StoryBuehne es in der Naehe startet. Ohne JavaScript und bei
 * reduzierter Bewegung bleibt das Standbild stehen. Keine Hoehe in den
 * Klassen: Preflight setzt height:auto, Aufrufer duerfen h-full setzen.
 */
export function Loop({ id, className, buehne = false }: Props) {
  const m = medium(id);
  if (m.art !== "video") throw new Error(`Medium "${id}" ist kein Video`);
  return (
    <video
      aria-hidden="true"
      data-loop=""
      width={m.breite}
      height={m.hoehe}
      poster={`/medien/${m.datei}-standbild.webp`}
      muted
      loop
      playsInline
      preload={buehne ? "metadata" : "none"}
      className={cn(buehne ? "block w-full object-cover" : "medien-video block w-full object-cover", className)}
    >
      <source src={`/medien/${m.datei}.mp4`} type="video/mp4" />
    </video>
  );
}
