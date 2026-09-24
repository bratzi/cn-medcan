"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Button } from "@/components/ui/Button";
import { textLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";

/**
 * Fehlerseite im Buchstil (Spec TP2 3.9, Wortlaut Abschnitt 7). Greift, wenn
 * eine Unterseite beim Laden scheitert, etwa weil die Datenbank nicht
 * antwortet. `retry` laedt das Segment neu (Next 16.3: stabil). Die
 * Startseite behaelt ihre eigenen Fehlersaetze je Sektion.
 */
export default function Fehler({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Seitenkopf
        titel="Diese Seite lässt sich gerade nicht laden."
        satz="Versuch es gleich noch einmal. Klappt es nicht, lade die Seite in ein paar Minuten neu."
      />
      <div className={cn(seitenRahmen(), "flex flex-wrap items-center gap-8 pt-8 pb-24")}>
        <Button onClick={() => retry()}>Erneut versuchen</Button>
        <Link href="/" className={textLinkKlassen("text-small")}>
          Zur Startseite
        </Link>
      </div>
    </>
  );
}
