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
    // Ohne Vertreiber (Plan 2026-10-22): die Insel liefert die jüngste eigene Bewertung der Sorte samt Vertreiber.
    // Dieselbe Adresse wie BudpicBeitragen, also ein Abruf je Seite.
    vertreiberId: null,
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
  // Vertreiber und Variante vorwählen: die eigene Bewertung, sonst die per ?ware= gewählte Blüte, sonst die
  // einzige; sonst bleibt die Wahl offen und das Formular verlangt sie.
  const ware = new URLSearchParams(window.location.search).get("ware");
  const perWare = ware
    ? formular.waren.find((w) => w.produkte.some((p) => p.slug === ware))
    : undefined;
  const perWareProdukt = perWare?.produkte.find((p) => p.slug === ware)?.id;
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
          vorgewaehlt={
            ich.vorbelegung
              ? { vertreiberId: ich.vorbelegung.vertreiberId, strainId: ich.vorbelegung.strainId }
              : perWare
                ? { vertreiberId: perWare.vertreiberId || null, strainId: perWareProdukt ?? null }
                : vorgewaehlt
          }
        />
      </div>
    </>
  );
}
