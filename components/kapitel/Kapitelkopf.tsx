import type { ReactNode } from "react";

import { Schlagwort } from "@/components/story/Schlagwort";
import { Avatar } from "@/components/ui";

type Props = {
  name: string;
  avatarId: string | null;
  /** Der ProfilReiter. */
  reiter: ReactNode;
  /** Freisteller rechts (ab 1080 px), schon als <Bild> gebaut. */
  bild?: ReactNode;
  schlagwort: string;
  ton: "gruen" | "lila";
  /** Konto: „Abmelden“. */
  aktion?: ReactNode;
};

/**
 * Kapitelkopf (Spec 5): dein Name als Kapitelüberschrift, gedruckt (Namen
 * nie in Handschrift), darunter die Reiter. Rechts ab 1080 px ein
 * Freisteller als Tiefenebene, dahinter ein Schlagwort wie in jeder
 * Startseiten-Sektion.
 */
export function Kapitelkopf({ name, avatarId, reiter, bild, schlagwort, ton, aktion }: Props) {
  return (
    <header className="relative isolate col-span-4 grid grid-cols-subgrid overflow-x-clip pt-16 min-[1080px]:col-span-10 min-[1080px]:pt-24">
      <Schlagwort satz={schlagwort} ton={ton} oben="top-8 sm:top-12" />
      <div className="col-span-4 flex min-w-0 flex-col gap-8 px-6 min-[1080px]:col-span-6 min-[1080px]:px-8">
        <Avatar name={name} bildId={avatarId} groesse="lg" />
        <h1 className="kapitel-name font-buch text-kapitel text-text text-balance wrap-break-word">{name}</h1>
        {/* „Abmelden“ steht bei den Reitern: dort sucht man die Bedienung des Kontos. */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {reiter}
          {aktion}
        </div>
      </div>
      {bild ? (
        <div aria-hidden="true" className="hidden min-[1080px]:col-span-4 min-[1080px]:flex min-[1080px]:items-end min-[1080px]:px-8">
          <div className="kapitel-tiefe w-full">{bild}</div>
        </div>
      ) : null}
    </header>
  );
}
