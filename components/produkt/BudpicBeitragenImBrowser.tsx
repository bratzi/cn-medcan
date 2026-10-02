"use client";

import { BudpicBeitragen, type BudpicBeitragenProps } from "@/components/produkt/BudpicBeitragen";
import { useStartSitzung } from "@/components/story/StartSitzung";

/**
 * „Bild beitragen“ an den Katalogkarten der statischen Startseite (Spec
 * 2026-10-01, statische Seiten, 4.3): Wer schaut, sagt /api/startseite. Bis
 * dahin steht nichts da, damit kein falscher Anmelde-Link aufblitzt.
 */
export function BudpicBeitragenImBrowser(props: Omit<BudpicBeitragenProps, "zugang">) {
  const stand = useStartSitzung()?.stand;
  if (stand?.status !== "fertig") return null;
  return <BudpicBeitragen {...props} zugang={stand.daten.budpicZugang} />;
}
