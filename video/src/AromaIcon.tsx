/** Kopie der Icon-Pfade aus components/review/AromaIcon.tsx; das Paket bleibt ohne Import aus dem Hauptprojekt. */
import type { ReactNode } from "react";

const GESCHMACK: Record<string, ReactNode> = {
  // Zitrusscheibe
  ZITRUS: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7" />
    </>
  ),
  // Kirschen
  FRUCHTIG: (
    <>
      <circle cx="8" cy="16.5" r="3.5" />
      <circle cx="16" cy="17" r="3.5" />
      <path d="M8 13c1-4 4-7.5 9-9M16 13.5c-.6-3.5-.6-6.8 1-9.5" />
    </>
  ),
  // Bonbon
  SUESS: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M7.8 10.3 3 8v8l4.8-2.3M16.2 10.3 21 8v8l-4.8-2.3" />
    </>
  ),
  // Blüte
  BLUMIG: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10c-1.8-1.5-2-4.5 0-6.5 2 2 1.8 5 0 6.5zM12 14c-1.8 1.5-2 4.5 0 6.5 2-2 1.8-5 0-6.5zM10 12c-1.5-1.8-4.5-2-6.5 0 2 2 5 1.8 6.5 0zM14 12c1.5-1.8 4.5-2 6.5 0-2 2-5 1.8-6.5 0z" />
    </>
  ),
  // Blatt
  KRAEUTRIG: (
    <>
      <path d="M5 19C5 11 10 5 19 5c0 9-6 14-14 14z" />
      <path d="M5 19l8-8" />
    </>
  ),
  // Frische (Kristall)
  MINZIG: (
    <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5 4.2 16.5M10 4.5 12 6l2-1.5M10 19.5 12 18l2 1.5" />
  ),
  // Nadelbaum
  HOLZIG: (
    <>
      <path d="M12 3 6.5 10.5h3L5 17h14l-4.5-6.5h3z" />
      <path d="M12 17v4" />
    </>
  ),
  // Chili
  WUERZIG: (
    <>
      <path d="M16.5 7.5c2 1.3 2 4.3-.3 7.3C13.5 18.5 8.5 20.5 4 20.5c3-2 5.8-5 7.6-8.8 1.2-2.5 2.6-4.9 4.9-4.2z" />
      <path d="M16.5 7.5c0-2 1-3.3 3-3.5" />
    </>
  ),
  // Hügel über dem Boden
  ERDIG: <path d="M3 19h18M4 19l5-8 3 4 3-6 5 10M6 22h2M11 22h2M16 22h2" />,
  // Tropfen
  DIESEL: (
    <>
      <path d="M12 3c3 4.5 5.5 7.5 5.5 11a5.5 5.5 0 0 1-11 0C6.5 10.5 9 7.5 12 3z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </>
  ),
};

/** Je Terpen seine typische Quelle; unbekannte Terpene zeigen einen Sechseckring. */
const TERPEN: Record<string, ReactNode> = {
  // Mango
  myrcen: (
    <>
      <path d="M8 20.5c-3.5-2.5-4-8.5-.5-12.5 3-3.4 8.5-3.6 11-.5 2.4 3 .6 9-3.5 12-2.3 1.7-5 2-7 1z" />
      <path d="M15 6.5c0-2 1.2-3.3 3.3-3.5" />
    </>
  ),
  // Zitrone
  limonen: (
    <>
      <ellipse cx="12" cy="12" rx="7" ry="5.5" />
      <path d="M3.5 12H5M19 12h1.5M9 10.5c1-1 2.5-1.5 4-1" />
    </>
  ),
  // Pfefferkörner
  "beta-caryophyllen": (
    <>
      <circle cx="8" cy="15.5" r="3" />
      <circle cx="16" cy="15.5" r="3" />
      <circle cx="12" cy="8.5" r="3" />
    </>
  ),
  // Lavendelzweig
  linalool: (
    <>
      <path d="M12 21V9" />
      <ellipse cx="12" cy="4.5" rx="1.2" ry="1.6" />
      <ellipse cx="10.3" cy="7.3" rx="1.2" ry="1.6" />
      <ellipse cx="13.7" cy="7.3" rx="1.2" ry="1.6" />
      <ellipse cx="10.3" cy="10.8" rx="1.2" ry="1.6" />
      <ellipse cx="13.7" cy="10.8" rx="1.2" ry="1.6" />
    </>
  ),
  // Kiefernzapfen
  "alpha-pinen": (
    <>
      <path d="M12 3c-3 2-5 6-5 10a5 5 0 0 0 10 0c0-4-2-8-5-10z" />
      <path d="M8 9.5h8M7.2 13.5h9.6M8.3 17.5h7.4M12 3v18" />
    </>
  ),
  // Zweig mit drei Blättern
  terpinolen: (
    <>
      <path d="M12 21V9" />
      <path d="M12 14c-3 0-5-2-5-5 3 0 5 2 5 5zM12 12c3 0 5-2 5-5-3 0-5 2-5 5zM12 9c-1.6-1.6-1.6-4.2 0-6 1.6 1.8 1.6 4.4 0 6z" />
    </>
  ),
  // Hopfendolde
  humulen: (
    <>
      <path d="M12 4c-3 1-5 4-5 8s2.5 7 5 8c2.5-1 5-4 5-8s-2-7-5-8z" />
      <path d="M7.3 9.5 12 12l4.7-2.5M7 14l5 2.5 5-2.5M12 4V2" />
    </>
  ),
  // Basilikumblatt
  ocimen: (
    <>
      <path d="M12 21c-5-3-7-7-7-11 3-1 5 0 7 2 2-2 4-3 7-2 0 4-2 8-7 11z" />
      <path d="M12 12v9" />
    </>
  ),
  // Apfel
  farnesen: (
    <>
      <path d="M12 7.5c-2-1.5-7-1-7 5 0 5 3 8.5 5 8.5 1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 5-3.5 5-8.5 0-6-5-6.5-7-5z" />
      <path d="M12 7.5c0-2 1-3.5 3-4" />
    </>
  ),
  // Holzscheit
  nerolidol: (
    <>
      <ellipse cx="17" cy="12" rx="3" ry="5" />
      <path d="M17 7H7c-1.7 0-3 2.2-3 5s1.3 5 3 5h10M17 10.5v3" />
    </>
  ),
  // Begleitstoffe: Ester (Kolben), Thiole (Schwefel-S im Sechseck)
  ester: (
    <>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" />
      <path d="M7.5 15h9" />
    </>
  ),
  thiole: (
    <>
      <path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" />
      <path d="M14.5 9.6c-.5-.9-1.4-1.4-2.5-1.4-1.4 0-2.4.8-2.4 1.9 0 2.6 5 1.6 5 4 0 1.2-1 2-2.5 2-1.2 0-2.2-.6-2.7-1.5" />
    </>
  ),
};

const RING = <path d="M12 4l6.9 4v8L12 20l-6.9-4V8z" />;

/** Kopie der Merkmal-Icons aus lib/ig-grafik.tsx (SVG-Innenleben als Text). */
const MERKMAL: Record<string, string> = {
  aussehen: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  geruch: '<path d="M10 3c0 4.5-3.5 8-3.5 11.5A2.5 2.5 0 0 0 9 17h2.5"/><path d="M14.5 9.5c1.3.8 2 2 2 3.5M17.5 7c2.2 1.5 3.5 3.6 3.5 6"/>',
  geschmack: '<path d="M4 9c0 6 3.5 11 8 11s8-5 8-11Z"/><path d="M12 9v6M9 4.5 12 3l3 1.5"/>',
  konsistenz: '<path d="M7 12V5.5a1.5 1.5 0 0 1 3 0V11M10 10V4a1.5 1.5 0 0 1 3 0v7M13 10.5V5.5a1.5 1.5 0 0 1 3 0V12M16 11.5V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L3.5 14a1.5 1.5 0 0 1 2.4-1.8L7 13.5"/>',
  restfeuchte: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/><path d="M9 14a3 3 0 0 0 3 3"/>',
  aromakarte: '<path d="M12 3 20 8v8l-8 5-8-5V8Z"/><path d="M12 7l4 3-1.5 5h-5L8 10Z"/>',
  community: '<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 20c.5-3.5 2.8-5.5 5.5-5.5s5 2 5.5 5.5M14 15c2.8-.6 6 .8 7 5"/>',
  abstimmen: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 3 3 5-6"/>',
  buch: '<path d="M4 5c3-1.5 5.5-1.5 8 0v15c-2.5-1.5-5-1.5-8 0ZM12 5c2.5-1.5 5-1.5 8 0v15c-3-1.5-5.5-1.5-8 0"/>',
};

/** Szenen-Icon: Terpen-Name (myrcen) oder Geschmacksrichtung (DIESEL). */
export function AromaIcon({ name, farbe, groesse }: { name: string; farbe: string; groesse: number }) {
  const merkmal = MERKMAL[name.toLowerCase()];
  const motiv = TERPEN[name.toLowerCase()] ?? GESCHMACK[name.toUpperCase()] ?? RING;
  return (
    <svg
      viewBox="0 0 24 24"
      width={groesse}
      height={groesse}
      fill="none"
      stroke={farbe}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {merkmal ? <g dangerouslySetInnerHTML={{ __html: merkmal }} /> : motiv}
    </svg>
  );
}
