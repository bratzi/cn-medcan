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

/** Blattzeichnung wie components/review/BlattAnzeige.tsx (Kopie, das Paket importiert nichts aus dem Hauptprojekt). */
const BLATT_LINKS =
  "M12 17Q10.4 9.5 12 2ZM12 17Q9.9 10.5 5.2 5.6Q7.3 12.1 12 17ZM12 17Q7.87 13.26 2.5 11.8Q6.63 15.54 12 17ZM12 17Q9.6 18.84 6.6 19.2Q9 17.36 12 17Z";
const BLATT_RECHTS =
  "M12 17Q13.6 9.5 12 2ZM12 17Q14.1 10.5 18.8 5.6Q16.7 12.1 12 17ZM12 17Q16.13 13.26 21.5 11.8Q17.37 15.54 12 17ZM12 17Q14.4 18.84 17.4 19.2Q15 17.36 12 17Z";
const BLATT_KONTUR = BLATT_LINKS + BLATT_RECHTS;

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
            <path d={BLATT_KONTUR} fill="none" stroke={farbe} strokeWidth={0.75} strokeLinejoin="round" />
            <path d="M12 17v4.5" stroke={farbe} strokeWidth={0.75} strokeLinecap="round" />
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
