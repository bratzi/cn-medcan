import type { ReactNode } from "react";

import { Schlagwort } from "@/components/story/Schlagwort";
import { Avatar } from "@/components/ui";

type Props = {
  name: string;
  avatarId: string | null;
  /** Name der Seite („Profil“ oder „Konto“): seit 2026-10-09 eigene Seiten statt Reiter (Nutzer). */
  seite: string;
  /** Kleiner Freisteller rechts (ab 1080 px), schon als <Bild> gebaut. */
  bild?: ReactNode;
  schlagwort: string;
  ton: "gruen" | "lila";
  /** Konto: „Abmelden“. */
  aktion?: ReactNode;
};

/**
 * Kapitelkopf (Spec 5): dein Name als Kapitelüberschrift, gedruckt (Namen
 * nie in Handschrift), darunter der Name der Seite. Rechts ab 1080 px ein kleiner
 * Freisteller als Tiefenebene, dahinter ein Schlagwort wie in jeder
 * Startseiten-Sektion. Der Freisteller liegt absolut und bestimmt die Höhe
 * des Kopfs nicht mit: als halbe Kopfhöhe schob er die Felder nach unten
 * und stach zu sehr hervor (Nutzer 2026-10-08). `end-24` hält ihn von der
 * Schalterleiste am rechten Rand fern.
 */
export function Kapitelkopf({ name, avatarId, seite, bild, schlagwort, ton, aktion }: Props) {
  return (
    <header className="relative isolate col-span-4 grid grid-cols-subgrid overflow-x-clip pt-16 min-[1080px]:col-span-10 min-[1080px]:pt-24">
      <Schlagwort satz={schlagwort} ton={ton} oben="top-8 sm:top-12" />
      <div className="col-span-4 flex min-w-0 flex-col gap-8 px-6 min-[1080px]:col-span-6 min-[1080px]:px-8">
        <Avatar name={name} bildId={avatarId} groesse="lg" />
        <h1 className="kapitel-name font-buch text-kapitel text-text text-balance wrap-break-word">{name}</h1>
        {/* „Abmelden“ steht beim Seitennamen: dort sucht man die Bedienung des Kontos. */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <p className="text-h2 text-text-muted">{seite}</p>
          {aktion}
        </div>
      </div>
      {bild ? (
        <div aria-hidden="true" className="pointer-events-none absolute end-24 bottom-0 hidden w-56 min-[1080px]:block">
          <div className="kapitel-tiefe">{bild}</div>
        </div>
      ) : null}
    </header>
  );
}
