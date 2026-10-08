import type { ReactNode } from "react";

import { FeldbuchRaster } from "@/components/story/FeldbuchRaster";

/**
 * Dein Kapitel im Grünen Buch (Spec Profil und Konto 4): volle Breite auf dem
 * Feldbuch-Raster der Startseite, 4 Spalten, ab 1080 px 10. Spaltenabstand 0,
 * damit jede Feldkante auf einer Rasterlinie liegt; zwischen den Reihen 64 px,
 * in denen das Raster frei durchläuft.
 */
export function KapitelRaster({ children }: { children?: ReactNode }) {
  return (
    <div className="relative isolate overflow-x-clip bg-surface">
      <FeldbuchRaster />
      <div className="grid grid-cols-4 gap-y-16 pb-24 min-[1080px]:grid-cols-10">{children}</div>
    </div>
  );
}
