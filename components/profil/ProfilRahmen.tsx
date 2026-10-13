import type { ReactNode } from "react";

/**
 * Profil ab 1080 px (Spec Profil Desktop): links die Identität, fest beim Scrollen, rechts Reiter und
 * Inhalt. Gleiche Breite wie die Kopfleiste (max-w-360). Darunter einspaltig.
 */
export function ProfilRahmen({ seitenleiste, reiter, children }: { seitenleiste: ReactNode; reiter: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-8 px-4 py-10 sm:px-8 min-[1080px]:grid-cols-[20rem_minmax(0,1fr)] min-[1080px]:gap-12 min-[1080px]:py-16">
      <div className="min-[1080px]:sticky min-[1080px]:top-[calc(var(--kopf-h,4rem)+2rem)] min-[1080px]:max-h-[calc(100svh-var(--kopf-h,4rem)-4rem)] min-[1080px]:self-start min-[1080px]:overflow-y-auto min-[1080px]:overscroll-contain min-[1080px]:[scrollbar-width:thin] min-[1080px]:[scrollbar-color:var(--color-border)_transparent]">{seitenleiste}</div>
      <div className="flex min-w-0 flex-col gap-8">
        {reiter}
        {children}
      </div>
    </div>
  );
}
