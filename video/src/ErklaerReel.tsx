import { loadFont as ladeDafoe } from "@remotion/google-fonts/MrDafoe";
import { loadFont as ladeNewsreader } from "@remotion/google-fonts/Newsreader";
import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { AromaIcon } from "./AromaIcon";

/** Spiegelt IgReel aus lib/ig-reel.ts; das Paket bleibt bewusst ohne Import aus dem Hauptprojekt. */
export type ErklaerSzene = { kicker?: string; titel: string; text?: string; icons?: string[]; blaetter?: number; sekunden: number };
export type ErklaerReelProps = {
  saeule: string;
  schluessel: string;
  szenen: ErklaerSzene[];
  farbe: string;
};

const { fontFamily: newsreader } = ladeNewsreader("normal", { weights: ["200", "400"], subsets: ["latin"] });
const { fontFamily: dafoe } = ladeDafoe("normal", { subsets: ["latin"] });

const GRUEN = "#3fbf94";
const VIOLETT = "#b48cf0";
const TEXT = "#e9efec";
const LEISE = "#93a39b";
const AUSBLENDEN = 12;

/**
 * Blattzeichnung aus components/review/BlattAnzeige.tsx (LINKS, RECHTS, KONTUR,
 * ADERN, STIEL; feine Form seit Session 76). Kopie, weil das Video-Paket keine
 * Imports aus dem Hauptprojekt auflöst (BlattAnzeige zieht @/lib/cn, video/ kennt
 * den Alias nicht). Bei Änderungen dort hier mitziehen.
 */
const BLATT_LINKS =
  "M12 18.2L11.54 17.45L11.43 17L10.92 16.25L11.06 15.8L10.49 15.05L10.81 14.6L10.21 13.85L10.66 13.4L10.07 12.65L10.6 12.2L10.05 11.45L10.63 11L10.13 10.25L10.72 9.8L10.31 9.05L10.88 8.6L10.56 7.85L11.07 7.4L10.86 6.65L11.3 6.2L11.19 5.45L11.54 5L11.53 4.25L11.79 3.8L11.86 3.05L12 2.6ZM12 18.2L11.2 17.83L10.86 17.51L10.03 17.15L9.92 16.69L9.05 16.36L9.08 15.8L8.22 15.47L8.35 14.85L7.52 14.49L7.71 13.83L6.94 13.44L7.14 12.77L6.45 12.33L6.63 11.67L6.02 11.17L6.16 10.55L5.65 9.98L5.71 9.41L5.29 8.78L5.27 8.26L4.93 7.59L4.81 7.13L5.18 7.43L5.66 8.01L6.13 8.24L6.52 8.88L7.08 9.05L7.39 9.75L8.01 9.88L8.22 10.64L8.89 10.74L9.02 11.55L9.71 11.64L9.76 12.5L10.43 12.6L10.42 13.5L11.04 13.64L11 14.56L11.52 14.76L11.47 15.68L11.84 15.98L11.83 16.88L11.98 17.32ZM12 18.2L11.16 18.29L10.74 18.18L9.89 18.28L9.59 17.95L8.74 18.05L8.51 17.56L7.68 17.63L7.49 17.06L6.7 17.06L6.53 16.45L5.78 16.36L5.61 15.77L4.91 15.57L4.7 15.04L4.07 14.74L3.81 14.3L3.22 13.9L2.91 13.57L3.36 13.62L4.03 13.87L4.54 13.82L5.16 14.15L5.71 14.01L6.28 14.45L6.85 14.26L7.37 14.8L7.96 14.59L8.43 15.23L9 15.04L9.43 15.75L9.96 15.65L10.38 16.4L10.83 16.45L11.24 17.19L11.58 17.47ZM12 18.2L11.39 18.73L11 18.85L10.37 19.32L9.96 19.16L9.33 19.55L8.89 19.25L8.25 19.51L7.81 19.18L7.15 19.29L6.72 19.03L6.05 19L5.64 18.87L6.01 18.65L6.67 18.49L7.03 18.14L7.7 18.11L8.06 17.7L8.74 17.82L9.1 17.44L9.8 17.68L10.18 17.44L10.88 17.78L11.29 17.81Z";
const BLATT_RECHTS =
  "M12 18.2L12.46 17.45L12.57 17L13.08 16.25L12.94 15.8L13.51 15.05L13.19 14.6L13.79 13.85L13.34 13.4L13.93 12.65L13.4 12.2L13.95 11.45L13.37 11L13.87 10.25L13.28 9.8L13.69 9.05L13.12 8.6L13.44 7.85L12.93 7.4L13.14 6.65L12.7 6.2L12.81 5.45L12.46 5L12.47 4.25L12.21 3.8L12.14 3.05L12 2.6ZM12 18.2L12.02 17.32L12.17 16.88L12.16 15.98L12.53 15.68L12.48 14.76L13 14.56L12.96 13.64L13.58 13.5L13.57 12.6L14.24 12.5L14.29 11.64L14.98 11.55L15.11 10.74L15.78 10.64L15.99 9.88L16.61 9.75L16.92 9.05L17.48 8.88L17.87 8.24L18.34 8.01L18.82 7.43L19.19 7.13L19.07 7.59L18.73 8.26L18.71 8.78L18.29 9.41L18.35 9.98L17.84 10.55L17.98 11.17L17.37 11.67L17.55 12.33L16.86 12.77L17.06 13.44L16.29 13.83L16.48 14.49L15.65 14.85L15.78 15.47L14.92 15.8L14.95 16.36L14.08 16.69L13.97 17.15L13.14 17.51L12.8 17.83ZM12 18.2L12.42 17.47L12.76 17.19L13.17 16.45L13.62 16.4L14.04 15.65L14.57 15.75L15 15.04L15.57 15.23L16.04 14.59L16.63 14.8L17.15 14.26L17.72 14.45L18.29 14.01L18.84 14.15L19.46 13.82L19.97 13.87L20.64 13.62L21.09 13.57L20.78 13.9L20.19 14.3L19.93 14.74L19.3 15.04L19.09 15.57L18.39 15.77L18.22 16.36L17.47 16.45L17.3 17.06L16.51 17.06L16.32 17.63L15.49 17.56L15.26 18.05L14.41 17.95L14.11 18.28L13.26 18.18L12.84 18.29ZM12 18.2L12.71 17.81L13.12 17.78L13.82 17.44L14.2 17.68L14.9 17.44L15.26 17.82L15.94 17.7L16.3 18.11L16.97 18.14L17.33 18.49L17.99 18.65L18.36 18.87L17.95 19L17.28 19.03L16.85 19.29L16.19 19.18L15.75 19.51L15.11 19.25L14.67 19.55L14.04 19.16L13.63 19.32L13 18.85L12.61 18.73Z";
const BLATT_KONTUR =
  "M12 18.2L11.54 17.45L11.43 17L10.92 16.25L11.06 15.8L10.49 15.05L10.81 14.6L10.21 13.85L10.66 13.4L10.07 12.65L10.6 12.2L10.05 11.45L10.63 11L10.13 10.25L10.72 9.8L10.31 9.05L10.88 8.6L10.56 7.85L11.07 7.4L10.86 6.65L11.3 6.2L11.19 5.45L11.54 5L11.53 4.25L11.79 3.8L11.86 3.05L12 2.6L12.14 3.05L12.21 3.8L12.47 4.25L12.46 5L12.81 5.45L12.7 6.2L13.14 6.65L12.93 7.4L13.44 7.85L13.12 8.6L13.69 9.05L13.28 9.8L13.87 10.25L13.37 11L13.95 11.45L13.4 12.2L13.93 12.65L13.34 13.4L13.79 13.85L13.19 14.6L13.51 15.05L12.94 15.8L13.08 16.25L12.57 17L12.46 17.45ZM12 18.2L11.2 17.83L10.86 17.51L10.03 17.15L9.92 16.69L9.05 16.36L9.08 15.8L8.22 15.47L8.35 14.85L7.52 14.49L7.71 13.83L6.94 13.44L7.14 12.77L6.45 12.33L6.63 11.67L6.02 11.17L6.16 10.55L5.65 9.98L5.71 9.41L5.29 8.78L5.27 8.26L4.93 7.59L4.81 7.13L5.18 7.43L5.66 8.01L6.13 8.24L6.52 8.88L7.08 9.05L7.39 9.75L8.01 9.88L8.22 10.64L8.89 10.74L9.02 11.55L9.71 11.64L9.76 12.5L10.43 12.6L10.42 13.5L11.04 13.64L11 14.56L11.52 14.76L11.47 15.68L11.84 15.98L11.83 16.88L11.98 17.32ZM12 18.2L12.02 17.32L12.17 16.88L12.16 15.98L12.53 15.68L12.48 14.76L13 14.56L12.96 13.64L13.58 13.5L13.57 12.6L14.24 12.5L14.29 11.64L14.98 11.55L15.11 10.74L15.78 10.64L15.99 9.88L16.61 9.75L16.92 9.05L17.48 8.88L17.87 8.24L18.34 8.01L18.82 7.43L19.19 7.13L19.07 7.59L18.73 8.26L18.71 8.78L18.29 9.41L18.35 9.98L17.84 10.55L17.98 11.17L17.37 11.67L17.55 12.33L16.86 12.77L17.06 13.44L16.29 13.83L16.48 14.49L15.65 14.85L15.78 15.47L14.92 15.8L14.95 16.36L14.08 16.69L13.97 17.15L13.14 17.51L12.8 17.83ZM12 18.2L11.16 18.29L10.74 18.18L9.89 18.28L9.59 17.95L8.74 18.05L8.51 17.56L7.68 17.63L7.49 17.06L6.7 17.06L6.53 16.45L5.78 16.36L5.61 15.77L4.91 15.57L4.7 15.04L4.07 14.74L3.81 14.3L3.22 13.9L2.91 13.57L3.36 13.62L4.03 13.87L4.54 13.82L5.16 14.15L5.71 14.01L6.28 14.45L6.85 14.26L7.37 14.8L7.96 14.59L8.43 15.23L9 15.04L9.43 15.75L9.96 15.65L10.38 16.4L10.83 16.45L11.24 17.19L11.58 17.47ZM12 18.2L12.42 17.47L12.76 17.19L13.17 16.45L13.62 16.4L14.04 15.65L14.57 15.75L15 15.04L15.57 15.23L16.04 14.59L16.63 14.8L17.15 14.26L17.72 14.45L18.29 14.01L18.84 14.15L19.46 13.82L19.97 13.87L20.64 13.62L21.09 13.57L20.78 13.9L20.19 14.3L19.93 14.74L19.3 15.04L19.09 15.57L18.39 15.77L18.22 16.36L17.47 16.45L17.3 17.06L16.51 17.06L16.32 17.63L15.49 17.56L15.26 18.05L14.41 17.95L14.11 18.28L13.26 18.18L12.84 18.29ZM12 18.2L11.39 18.73L11 18.85L10.37 19.32L9.96 19.16L9.33 19.55L8.89 19.25L8.25 19.51L7.81 19.18L7.15 19.29L6.72 19.03L6.05 19L5.64 18.87L6.01 18.65L6.67 18.49L7.03 18.14L7.7 18.11L8.06 17.7L8.74 17.82L9.1 17.44L9.8 17.68L10.18 17.44L10.88 17.78L11.29 17.81ZM12 18.2L12.71 17.81L13.12 17.78L13.82 17.44L14.2 17.68L14.9 17.44L15.26 17.82L15.94 17.7L16.3 18.11L16.97 18.14L17.33 18.49L17.99 18.65L18.36 18.87L17.95 19L17.28 19.03L16.85 19.29L16.19 19.18L15.75 19.51L15.11 19.25L14.67 19.55L14.04 19.16L13.63 19.32L13 18.85L12.61 18.73Z";
const BLATT_ADERN =
  "M12 17.58L12 3.69M12 14.25L10.88 13.16M12 14.25L13.12 13.16M12 12.17L10.86 11.08M12 12.17L13.14 11.08M12 10.09L11.03 9M12 10.09L12.97 9M12 8.01L11.31 6.92M12 8.01L12.69 6.92M12 5.93L11.65 4.84M12 5.93L12.35 4.84M11.71 17.76L5.31 7.9M9.96 15.06L8.61 14.84M9.96 15.06L10.31 13.73M8.78 13.25L7.48 12.99M8.78 13.25L9.08 11.95M7.61 11.44L6.52 11.04M7.61 11.44L7.69 10.28M6.43 9.63L5.65 9.03M6.43 9.63L6.21 8.67M12.29 17.76L18.69 7.9M14.04 15.06L13.69 13.73M14.04 15.06L15.39 14.84M15.22 13.25L14.92 11.95M15.22 13.25L16.52 12.99M16.39 11.44L16.31 10.28M16.39 11.44L17.48 11.04M17.57 9.63L17.79 8.67M17.57 9.63L18.35 9.03M11.64 18.01L3.55 13.89M9.42 16.89L8.4 17.32M9.42 16.89L9.17 15.81M7.94 16.13L6.93 16.52M7.94 16.13L7.66 15.09M6.45 15.37L5.55 15.57M6.45 15.37L6.08 14.52M4.96 14.61L4.2 14.54M4.96 14.61L4.45 14.04M12.36 18.01L20.45 13.89M14.58 16.89L14.83 15.81M14.58 16.89L15.6 17.32M16.06 16.13L16.34 15.09M16.06 16.13L17.07 16.52M17.55 15.37L17.92 14.52M17.55 15.37L18.45 15.57M19.04 14.61L19.55 14.04M19.04 14.61L19.8 14.54M11.75 18.23L6.08 18.82M9.33 18.48L8.94 19.13M9.33 18.48L8.82 17.93M7.42 18.68L7 19.01M7.42 18.68L6.94 18.45M12.25 18.23L17.92 18.82M14.67 18.48L15.18 17.93M14.67 18.48L15.06 19.13M16.58 18.68L17.06 18.45M16.58 18.68L17 19.01";
const BLATT_STIEL = "M12 18.2V22.6";
const BLATT_STRICH = 0.32;
const BLATT_ADER = 0.18;
/** Seitenfarbe für die Adern auf vollem Blatt (wie graviert), Hintergrundton der Szene. */
const BLATT_SEITE = "#0d1210";

/** Fünf Blätter; jedes springt nacheinander auf (4 Frames Versatz), gefüllte füllen sich danach. */
function Blaetter({ note, farbe }: { note: number; farbe: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 56 }}>
      {[1, 2, 3, 4, 5].map((b, i) => {
        const auf = spring({ fps, frame: frame - 4 - i * 4, config: { damping: 14, stiffness: 160 } });
        const fuellen = spring({ fps, frame: frame - 18 - i * 4, config: { damping: 200 } });
        return (
          <svg key={b} viewBox="0 0 24 24" width={160} height={160} style={{ transform: `scale(${0.6 + 0.4 * auf})`, opacity: auf }}>
            <path d={BLATT_LINKS} fill={farbe} opacity={note >= b - 0.5 ? fuellen : 0} />
            <path d={BLATT_RECHTS} fill={farbe} opacity={note >= b ? fuellen : 0} />
            <path d={BLATT_ADERN} fill="none" stroke={note >= b ? BLATT_SEITE : farbe} strokeWidth={BLATT_ADER} strokeLinecap="round" />
            <path d={BLATT_KONTUR} fill="none" stroke={farbe} strokeWidth={BLATT_STRICH} strokeLinejoin="round" strokeLinecap="round" />
            <path d={BLATT_STIEL} fill="none" stroke={farbe} strokeWidth={BLATT_STRICH} strokeLinecap="round" />
          </svg>
        );
      })}
    </div>
  );
}

/** Zwei maskierte Ebenen wie logoHtml in lib/ig-karte.ts. */
function Logo() {
  const ebene = (bild: string, farbe: string): CSSProperties => {
    const maske = `url(${staticFile(`marke/${bild}`)}) center/contain no-repeat`;
    return { position: "absolute", inset: 0, background: farbe, WebkitMask: maske, mask: maske };
  };
  return (
    <div style={{ position: "relative", width: 320, aspectRatio: "1726 / 1242" }} aria-label="Book of Terpz">
      <i style={ebene("pinsel.webp", GRUEN)} />
      <i style={ebene("pinsel-of.webp", VIOLETT)} />
    </div>
  );
}

function Szene({ szene, farbe }: { szene: ErklaerSzene; farbe: string }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // damping 200: kein Überschwingen, keine Rotation, kein Zoom.
  const ein = spring({ fps, frame, config: { damping: 200 } });
  const textEin = spring({ fps, frame: frame - 6, config: { damping: 200 } });
  const aus = interpolate(frame, [durationInFrames - AUSBLENDEN, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 96px", opacity: aus }}>
      <div style={{ opacity: ein, transform: `translateY(${(1 - ein) * 48}px)` }}>
        {szene.blaetter !== undefined ? <Blaetter note={szene.blaetter} farbe={farbe} /> : null}
        {szene.icons?.length ? (
          <div style={{ display: "flex", justifyContent: "center", gap: 48, marginBottom: 48 }}>
            {szene.icons.map((n) => (
              <AromaIcon key={n} name={n} farbe={farbe} groesse={szene.icons!.length > 2 ? 120 : 176} />
            ))}
          </div>
        ) : null}
        {szene.kicker ? (
          <p style={{ margin: "0 0 32px", fontSize: 44, letterSpacing: "0.08em", textTransform: "uppercase", color: farbe }}>
            {szene.kicker}
          </p>
        ) : null}
        <h1
          style={{
            margin: 0,
            fontWeight: 200,
            fontSize: 136,
            lineHeight: 1.04,
            letterSpacing: "-0.015em",
            color: TEXT,
            textWrap: "balance",
          }}
        >
          {szene.titel}
        </h1>
      </div>
      {szene.text ? (
        <div style={{ width: 48, height: 4, margin: "48px auto 0", background: farbe, opacity: textEin }} />
      ) : null}
      {szene.text ? (
        <p
          style={{
            margin: "32px auto 0",
            maxWidth: 820,
            fontSize: 52,
            lineHeight: 1.35,
            color: LEISE,
            textWrap: "balance",
            opacity: textEin,
            transform: `translateY(${(1 - textEin) * 48}px)`,
          }}
        >
          {szene.text}
        </p>
      ) : null}
    </AbsoluteFill>
  );
}

export function ErklaerReel({ szenen, farbe }: ErklaerReelProps) {
  const { fps } = useVideoConfig();
  let start = 0;
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(120% 80% at 50% 0%, #17221d 0%, #0d1210 70%)",
        fontFamily: newsreader,
        color: TEXT,
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 16, background: farbe }} />
      <div style={{ position: "absolute", top: 160, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Logo />
      </div>
      {szenen.map((z, i) => {
        const dauer = z.sekunden * fps;
        const von = start;
        start += dauer;
        return (
          <Sequence key={i} from={von} durationInFrames={dauer}>
            <Szene szene={z} farbe={farbe} />
          </Sequence>
        );
      })}
      <p
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 200,
          margin: 0,
          fontSize: 36,
          letterSpacing: "0.08em",
          color: LEISE,
          textAlign: "center",
        }}
      >
        Book of Terpz · <span style={{ fontFamily: dafoe, fontSize: 64, color: farbe, letterSpacing: 0 }}>Vorabzugang per DM</span>
      </p>
    </AbsoluteFill>
  );
}
