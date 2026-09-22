import { cn } from "@/lib/cn";

/**
 * Instagram-Reel-Einbettung ohne Drittanbieter-Skript.
 *
 * Bewusst KEIN Laden von `https://www.instagram.com/embed.js`:
 * 1. Das Skript ist ein zusaetzlicher Request und kostet Parse- und CPU-Zeit.
 *    Auf Cloudflare Workers ist die CPU-Zeit im Free-Tier auf 10 ms pro
 *    Request begrenzt - fremde Skripte sind dort kein tragbares Budget.
 * 2. Es setzt Tracking-Cookies und uebertraegt Nutzungsdaten an Meta, bevor
 *    eine Einwilligung vorliegt. Nach Art. 6 DSGVO / § 25 TDDDG waere dafuer
 *    ein Consent-Banner noetig, das dieses Projekt nicht hat.
 *
 * Stattdessen ein einfacher `<iframe>` auf die offizielle `/embed`-URL. Die
 * URL wird nicht durchgereicht, sondern aus dem validierten Pfad neu gebaut.
 */

export type InstagramEmbedProps = {
  /** Vollstaendige Reel-URL; ohne Angabe wird die Umgebungsvariable genutzt. */
  url?: string | null;
  /** Ueberschrift des `title`-Attributs, z. B. der Handelsname. */
  bezeichnung?: string;
  className?: string;
};

/** Erlaubte Hosts - nur Instagram selbst, keine Redirect-Dienste. */
function istInstagramHost(host: string): boolean {
  return host === "instagram.com" || host.endsWith(".instagram.com");
}

/**
 * Baut die Embed-URL selbst. Rueckgabe `null`, sobald irgendetwas nicht
 * passt - dann rendert die Komponente den Platzhalter statt eines fremden
 * `src`.
 */
export function baueEmbedUrl(rohUrl: string | null | undefined): string | null {
  if (!rohUrl) return null;

  let zerlegt: URL;
  try {
    zerlegt = new URL(rohUrl);
  } catch {
    return null;
  }

  if (zerlegt.protocol !== "https:") return null;
  if (!istInstagramHost(zerlegt.hostname.toLowerCase())) return null;

  // Erwartet /reel/<code>/, /reels/<code>/ oder /p/<code>/.
  const teile = zerlegt.pathname.split("/").filter(Boolean);
  if (teile.length < 2) return null;

  const art = teile[0].toLowerCase();
  if (art !== "reel" && art !== "reels" && art !== "p") return null;

  const code = teile[1];
  // Instagram-Shortcodes sind base64url-artig; alles andere lehnen wir ab.
  if (!/^[A-Za-z0-9_-]{5,32}$/.test(code)) return null;

  const pfadArt = art === "p" ? "p" : "reel";
  return `https://www.instagram.com/${pfadArt}/${code}/embed`;
}

function Platzhalter({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex aspect-[9/16] w-full flex-col justify-end rounded-md border border-border bg-surface-raised p-4",
        className,
      )}
    >
      <p className="text-small font-medium text-text">Kein Video hinterlegt</p>
      <p className="mt-2 text-caption text-text">
        Die Reel-Einbettung ist fuer dieses Produkt noch nicht konfiguriert.
      </p>
    </div>
  );
}

export function InstagramEmbed({ url, bezeichnung, className }: InstagramEmbedProps) {
  const quelle = url ?? process.env.NEXT_PUBLIC_INSTAGRAM_REEL_URL ?? null;
  const embedUrl = baueEmbedUrl(quelle);

  if (!embedUrl) return <Platzhalter className={className} />;

  return (
    <iframe
      src={embedUrl}
      title={
        bezeichnung
          ? `Instagram-Reel zu ${bezeichnung}`
          : "Instagram-Reel zum Produkt"
      }
      loading="lazy"
      referrerPolicy="no-referrer"
      allow="encrypted-media"
      className={cn(
        "aspect-[9/16] w-full rounded-md border border-border bg-surface-raised",
        className,
      )}
    />
  );
}
