"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { useStartSitzung } from "@/components/story/StartSitzung";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { empfehlungenAnzeige } from "@/lib/startseite-sitzung";

type Props = {
  /** Vom Server vorab gerendert: alles außer der Liste selbst. */
  varianten: { laedt: ReactNode; fehler: ReactNode; gast: ReactNode; leer: ReactNode };
  texte: { startSatz: string; hinweis: string; konto: string };
};

/**
 * „Was dir schmecken könnte“ auf der statischen Startseite (T11; Spec
 * 2026-10-01, statische Seiten, 4.3): Die Liste kommt samt Begründung in der
 * Sprache der Anfrage aus /api/startseite. Nur Aroma, nie Wirkung (HWG).
 */
export function EmpfehlungenImBrowser({ varianten, texte }: Props) {
  const sitzung = useStartSitzung();
  const anzeige = sitzung ? empfehlungenAnzeige(sitzung.stand) : ({ art: "laedt" } as const);
  if (anzeige.art !== "liste") return <>{varianten[anzeige.art]}</>;
  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.startSatz}</p>
      <EmpfehlungsListe eintraege={anzeige.eintraege} />
      <p className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <span className="text-caption text-text-muted">{texte.hinweis}</span>
        <Link prefetch={false} href="/mitglied" className={einzelLinkKlassen()}>
          {texte.konto}
        </Link>
      </p>
    </div>
  );
}
