"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Button } from "@/components/ui/Button";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";

/**
 * Fehlerseite im Buchstil (Spec TP2 3.9, Wortlaut Abschnitt 7). Greift, wenn
 * eine Unterseite beim Laden scheitert, etwa weil die Datenbank nicht
 * antwortet. `retry` laedt das Segment neu (Next 16.3: stabil). Die
 * Startseite behaelt ihre eigenen Fehlersaetze je Sektion.
 *
 * Zweisprachig in der Datei selbst (Plan Englisch, Task 6): eine Fehlergrenze
 * hat keinen Server-Elternteil, der ihr Texte geben koennte. Die Sprache steht
 * in <html lang>, das das Root-Layout setzt.
 */
const TEXTE = {
  de: {
    titel: "Diese Seite lässt sich gerade nicht laden.",
    satz: "Versuch es gleich noch einmal. Klappt es nicht, lade die Seite in ein paar Minuten neu.",
    erneut: "Erneut versuchen",
    start: "Zur Startseite",
  },
  en: {
    titel: "This page cannot be loaded right now.",
    satz: "Try again in a moment. If that does not work, reload the page in a few minutes.",
    erneut: "Try again",
    start: "To the home page",
  },
} as const;
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

  const texte = typeof document !== "undefined" && document.documentElement.lang === "en" ? TEXTE.en : TEXTE.de;

  return (
    <>
      <Seitenkopf
        titel={texte.titel}
        satz={texte.satz}
      />
      <div className={cn(seitenRahmen(), "flex flex-wrap items-center gap-8 pt-8 pb-24")}>
        <Button onClick={() => retry()}>{texte.erneut}</Button>
        <Link href="/" className={einzelLinkKlassen()}>
          {texte.start}
        </Link>
      </div>
    </>
  );
}
