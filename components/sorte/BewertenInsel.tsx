"use client";

import type { ComponentProps, ReactNode } from "react";

import { BewertungsFormular } from "@/components/review/BewertungsFormular";
import { useIchStrain } from "@/lib/ich-strain-client";

type FormularProps = Omit<
  ComponentProps<typeof BewertungsFormular>,
  "vorbelegung" | "liveNetz" | "istBetreiber" | "vorgewaehlt"
>;

type Props = {
  /** Sektionskopf je Zugang: Gäste und Mitglieder ohne Freigabe, Freigegebene, Freigegebene mit eigener Bewertung. */
  kopfGast: ReactNode;
  kopfFreigegeben: ReactNode;
  kopfVorbelegt: ReactNode;
  gast: ReactNode;
  nichtFreigegeben: ReactNode;
  formular: FormularProps;
  vorgewaehlt: { vertreiberId: string | null; strainId: string | null };
  kultivarId: string;
  strainId: string;
};

/**
 * Tauscht den Gastzustand gegen die Maske, sobald /api/ich/strain eine Freigabe meldet (Spec 2026-10-21,
 * Seiten aus Assets, 3.3). Die statische Datei zeigt immer den Gastzustand; ob jemand bewerten darf,
 * entscheidet der Server, die Aktion prüft es beim Speichern erneut.
 */
export function BewertenInsel({
  kopfGast,
  kopfFreigegeben,
  kopfVorbelegt,
  gast,
  nichtFreigegeben,
  formular,
  vorgewaehlt,
  kultivarId,
  strainId,
}: Props) {
  const ich = useIchStrain({
    kultivarId,
    strainId,
    vertreiberId: vorgewaehlt.vertreiberId,
  });

  if (ich.zugang === "mitglied")
    return (
      <>
        {kopfGast}
        {nichtFreigegeben}
      </>
    );
  if (ich.zugang !== "freigegeben")
    return (
      <>
        {kopfGast}
        {gast}
      </>
    );
  // Variante vorwählen: die eigene, sonst die per ?ware= gewählte, sonst die der Seite; offen bleibt „Weiß ich nicht“.
  const ware = new URLSearchParams(window.location.search).get("ware");
  const perWare = ware
    ? formular.waren.flatMap((w) => w.produkte).find((p) => p.slug === ware)?.id
    : undefined;
  return (
    <>
      {ich.vorbelegung ? kopfVorbelegt : kopfFreigegeben}
      {/* Abstand wie vor dem Umbau: die Maske stand in einem eigenen mt-8-Block. */}
      <div className="mt-8">
        <BewertungsFormular
          {...formular}
          istBetreiber={ich.istBetreiber}
          vorbelegung={ich.vorbelegung}
          liveNetz={ich.liveNetz}
          vorgewaehlt={{
            vertreiberId: vorgewaehlt.vertreiberId,
            strainId: ich.vorbelegung
              ? ich.vorbelegung.strainId
              : (perWare ?? vorgewaehlt.strainId),
          }}
        />
      </div>
    </>
  );
}
