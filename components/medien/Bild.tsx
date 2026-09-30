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
      className={cn(m.freigestellt ? "block h-auto w-full" : "medien-buch block h-auto w-full", className)}
    />
  );
}

/**
 * Bild eines Mitglieds aus D1 (T8, Avatare, Nutzer 2026-09-29): kommt von
 * /api/bild/<id>, nicht aus der Medien-Pipeline, und bleibt deshalb eine
 * eigene Komponente, aber in dieser Datei, weil hier die einzige Stelle mit
 * <img> ist. Immer dekorativ (alt leer): der Name steht daneben.
 */
export function NutzerBild({ id, seite, className }: { id: string; seite: number; className?: string }) {
  return (
    <img
      src={`/api/bild/${id}`}
      width={seite}
      height={seite}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn("block object-cover", className)}
    />
  );
}

/**
 * Freigegebenes Budpic aus D1 (T9, Nutzer 2026-09-29): kommt von
 * /api/bild/<id> mit den echten Massen (kein Springen beim Laden). Der Alt-Text
 * beschreibt die Sorte; wer das Bild eingereicht hat, steht in der Bildunterschrift.
 */
export function BudpicBild({
  id,
  breite,
  hoehe,
  alt,
  lazy = true,
  offen = false,
  className,
}: {
  id: string;
  breite: number;
  hoehe: number;
  alt: string;
  lazy?: boolean;
  /** Vorschau eines noch nicht freigegebenen Bildes (nur Betreiber, /api/bild/offen/<id>, ohne Cache). */
  offen?: boolean;
  className?: string;
}) {
  return (
    <img
      src={offen ? `/api/bild/offen/${id}` : `/api/bild/${id}`}
      width={breite}
      height={hoehe}
      alt={alt}
      loading={lazy ? "lazy" : "eager"}
      decoding="async"
      className={className}
    />
  );
}
