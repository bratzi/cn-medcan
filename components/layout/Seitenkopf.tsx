import Link from "next/link";
import type { ReactNode } from "react";

import { einzelLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";

/** Seitenrahmen der Unterseiten: breit fuer Inhalt, schmal fuer Konto und Formulare. */
export function seitenRahmen(schmal = false): string {
  return cn("mx-auto w-full px-4 sm:px-8", schmal ? "max-w-120" : "max-w-360");
}

/** Abschnittsueberschrift (h2) der Unterseiten: Cormorant 500, weil 300 erst ab 40 px traegt. */
export const ABSCHNITT_TITEL = "font-buch text-h1 font-medium text-balance text-text";

export type SeitenkopfProps = {
  titel: string;
  satz?: string;
  zurueck?: { href: string; text: string };
  /** Kontoseiten: Spalte 480 px statt 1440 px. */
  schmal?: boolean;
  /** Zusatz unter dem Satz, z. B. die E-Mail auf /mitglied. */
  children?: ReactNode;
};

/**
 * Kopf jeder Unterseite (Spec TP2 3.2): Titel in Cormorant 300, ein Satz in
 * Du und Ich, keine Oberzeile. Linksbuendig, auf allen Seiten gleich.
 */
export function Seitenkopf({ titel, satz, zurueck, schmal = false, children }: SeitenkopfProps) {
  return (
    <header className={cn(seitenRahmen(schmal), "pt-16 sm:pt-24")}>
      {zurueck ? (
        <p className="mb-8">
          <Link href={zurueck.href} className={einzelLinkKlassen()}>
            {zurueck.text}
          </Link>
        </p>
      ) : null}
      <h1 className="font-buch text-kapitel font-light text-balance text-text wrap-break-word">{titel}</h1>
      {satz ? <p className="mt-4 max-w-[56ch] text-body text-pretty text-text-muted">{satz}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
