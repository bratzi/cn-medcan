"use client";

import type { ComponentProps, ReactNode } from "react";

import { BewertungsFormular } from "@/components/review/BewertungsFormular";
import { useIchStrain } from "@/lib/ich-strain-client";

type FormularProps = Omit<ComponentProps<typeof BewertungsFormular>, "vorbelegung" | "liveNetz" | "istBetreiber" | "vorgewaehlt">;

type Props = {
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
export function BewertenInsel({ gast, nichtFreigegeben, formular, vorgewaehlt, kultivarId, strainId }: Props) {
  const ich = useIchStrain({ kultivarId, strainId, vertreiberId: vorgewaehlt.vertreiberId });

  if (ich.zugang === "mitglied") return nichtFreigegeben;
  if (ich.zugang !== "freigegeben") return gast;
  // Variante vorwählen: die eigene, sonst die per ?ware= gewählte, sonst die der Seite; offen bleibt „Weiß ich nicht“.
  const ware = new URLSearchParams(window.location.search).get("ware");
  const perWare = ware ? formular.waren.flatMap((w) => w.produkte).find((p) => p.slug === ware)?.id : undefined;
  return (
    <BewertungsFormular
      {...formular}
      istBetreiber={ich.istBetreiber}
      vorbelegung={ich.vorbelegung}
      liveNetz={ich.liveNetz}
      vorgewaehlt={{
        vertreiberId: vorgewaehlt.vertreiberId,
        strainId: ich.vorbelegung ? ich.vorbelegung.strainId : (perWare ?? vorgewaehlt.strainId),
      }}
    />
  );
}
