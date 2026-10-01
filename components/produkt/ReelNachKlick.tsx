"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type Ref } from "react";

import { buttonKlassen } from "@/components/ui/Button";
import { textLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";
import type { Woerterbuch } from "@/lib/i18n/typen";

/**
 * Zwei-Klick-Loesung fuer das Instagram-Reel (§ 25 Abs. 1 TDDDG, Art. 6
 * Abs. 1 lit. a DSGVO): Bis zum Klick laedt nichts von instagram.com, Meta
 * bekommt also weder IP-Adresse noch Browserdaten. Erst der Klick ist die
 * Einwilligung, dann erscheint der iframe. Gemerkt wird die Wahl nicht.
 *
 * Bewusst die kleinste Insel: nur der Umschalter ist Client-Code, die
 * URL-Pruefung (`baueEmbedUrl`) laeuft in `InstagramEmbed.tsx` auf dem Server.
 */

/** Gleiche Flaeche fuer Platzhalter und iframe, damit beim Laden nichts springt. */
const RAHMEN = "aspect-[9/16] w-full rounded-md border border-border bg-surface-raised";

export type ReelNachKlickProps = {
  /** Bereits gepruefte Embed-URL aus `baueEmbedUrl`. */
  embedUrl: string;
  titel: string;
  className?: string;
};

export function ReelRahmen({
  embedUrl,
  titel,
  className,
  ref,
}: ReelNachKlickProps & { ref?: Ref<HTMLIFrameElement> }) {
  return (
    <iframe
      ref={ref}
      src={embedUrl}
      title={titel}
      referrerPolicy="no-referrer"
      allow="encrypted-media"
      className={cn(RAHMEN, className)}
    />
  );
}

export function ReelNachKlick({ embedUrl, titel, className, texte }: ReelNachKlickProps & { texte: Woerterbuch["reel"] }) {
  const [geladen, setGeladen] = useState(false);
  const rahmen = useRef<HTMLIFrameElement>(null);

  // Der Button verschwindet mit dem Klick; der Fokus wandert auf das Reel,
  // statt auf den Seitenanfang zurueckzufallen.
  useEffect(() => {
    if (geladen) rahmen.current?.focus();
  }, [geladen]);

  if (geladen) {
    return <ReelRahmen ref={rahmen} embedUrl={embedUrl} titel={titel} className={className} />;
  }

  return (
    <div className={cn(RAHMEN, "flex flex-col justify-end gap-4 p-4", className)}>
      <button
        type="button"
        onClick={() => setGeladen(true)}
        className={buttonKlassen("secondary", "md", "self-start")}
      >
        {texte.laden}
      </button>
      <p className="text-caption text-pretty text-text">
        {texte.datenschutz}{" "}
        <Link prefetch={false} href="/datenschutz#ds-instagram" className={textLinkKlassen()}>
          {texte.mehr}
        </Link>
      </p>
    </div>
  );
}
