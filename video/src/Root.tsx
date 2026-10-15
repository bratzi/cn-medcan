import { Composition, type CalculateMetadataFunction } from "remotion";
import { ErklaerReel, type ErklaerReelProps } from "./ErklaerReel";

const FPS = 30;

/** Gesamtlänge aus den Szenen der Props (Spec 2026-10-15 Produktmarke). */
const laenge: CalculateMetadataFunction<ErklaerReelProps> = ({ props }) => ({
  durationInFrames: Math.max(1, props.szenen.reduce((s, z) => s + z.sekunden * FPS, 0)),
});

const beispiel: ErklaerReelProps = {
  saeule: "transparenz",
  schluessel: "beispiel",
  farbe: "#3fbf94",
  szenen: [
    { kicker: "So bewerten wir", titel: "Fünf Noten", sekunden: 4 },
    { titel: "An der Charge", text: "Jede Charge gleich geprüft.", sekunden: 5 },
    { titel: "Link in Bio", sekunden: 4 },
  ],
};

export const RemotionRoot = () => (
  <Composition
    id="ErklaerReel"
    component={ErklaerReel}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={FPS * 13}
    defaultProps={beispiel}
    calculateMetadata={laenge}
  />
);
