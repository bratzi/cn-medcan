/* eslint-disable @next/next/no-img-element -- Keine Next-Bildoptimierung: auf
   Workers braeuchte sie Cloudflare Images. Die Breiten entstehen stattdessen in
   scripts/medien/aufbereiten.ts (Spec 6.1). Einzige Stelle mit <img>. */
import { cn } from "@/lib/cn";
import { bildQuelle, medium } from "@/lib/medien";

type Props = {
  id: string;
  /** Wie breit das Bild im Layout wirklich ist, z. B. "(min-width: 768px) 45vw, 100vw". */
  sizes: string;
  className?: string;
  /** Nur fuer das LCP-Bild im Auftakt: sofort und mit hoher Prioritaet laden. */
  prioritaet?: boolean;
  /** Wiederholung desselben Motivs: leerer Alt-Text, damit nichts doppelt vorgelesen wird. */
  dekorativ?: boolean;
};

/** Graustufen-Foto aus der Pipeline, mit Hell/Dunkel-Behandlung (Spec 4.5). */
export function Bild({ id, sizes, className, prioritaet = false, dekorativ = false }: Props) {
  const m = medium(id);
  const { src, srcSet } = bildQuelle(id);
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={m.breite}
      height={m.hoehe}
      alt={dekorativ ? "" : m.alt}
      loading={prioritaet ? "eager" : "lazy"}
      fetchPriority={prioritaet ? "high" : "auto"}
      decoding="async"
      className={cn("medien-buch block h-auto w-full", className)}
    />
  );
}
