import type { gsap } from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SplitText } from "gsap/SplitText";

/** Was jede Choreografie bekommt. Nur Typen: die Module laedt start.ts dynamisch. */
export type Werkzeug = {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  SplitText: typeof SplitText;
  /** Ablaeufe nur ab einer Breite (Pin, Schwenk); raeumt beim Verlassen selbst auf. */
  mm: ReturnType<typeof gsap.matchMedia>;
};

/** Eine Sektion: legt ihre Tweens an, gibt bei Bedarf eine Aufraeumfunktion zurueck. */
export type Choreografie = (werkzeug: Werkzeug) => void | (() => void);

/** Ab hier Pin und Schwenk; darunter keine gepinnten Ablaeufe (Spec 5.1, Akzeptanz 7). */
export const AB_TABLET = "(min-width: 768px)";
