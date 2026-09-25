/**
 * Qualm und Funken des Joint-Cursors auf einem Canvas (Nutzer 2026-09-25:
 * "besser animierter Qualm"). Ansatz wie die bekannten Canvas-Rauchpartikel
 * (weiche, klumpige Rauchwolken statt Kreisen): jede Wolke steigt mit
 * Auftrieb, wächst, dreht sich, kräuselt sich seitlich und blendet weich aus.
 * Die Wolkenbilder entstehen einmal im Speicher aus überlagerten Verläufen, ohne
 * Bilddatei, und werden bei Hell/Dunkel neu eingefärbt.
 *
 * Kein WebGL und keine Flüssigkeitssimulation: das kostete auf jeder Seite
 * GPU und Akku für einen Zeiger. Obergrenze der Teilchen hält die Last klein.
 */

type Art = "rauch" | "spur" | "funke";

type Teilchen = {
  art: Art;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alter: number;
  dauer: number;
  von: number;
  bis: number;
  drehung: number;
  drall: number;
  deckkraft: number;
  phase: number;
  form: number;
};

const MAX_TEILCHEN = 220;
const WOLKEN = 5;
const WOLKE_PX = 96;

const zufall = (von: number, bis: number) => von + Math.random() * (bis - von);

/** Weiche Kurve: schnell da, langsam weg. */
function verlauf(t: number): number {
  const rein = Math.min(t / 0.12, 1);
  const raus = 1 - Math.max((t - 0.12) / 0.88, 0);
  return rein * raus * raus;
}

/** Eine klumpige Wolke: viele schwache, versetzte Verläufe übereinander. */
function wolke(farbe: string): HTMLCanvasElement {
  const leinwand = document.createElement("canvas");
  leinwand.width = WOLKE_PX;
  leinwand.height = WOLKE_PX;
  const ctx = leinwand.getContext("2d")!;
  const mitte = WOLKE_PX / 2;
  for (let i = 0; i < 14; i++) {
    const winkel = Math.random() * Math.PI * 2;
    const abstand = Math.random() * WOLKE_PX * 0.18;
    const x = mitte + Math.cos(winkel) * abstand;
    const y = mitte + Math.sin(winkel) * abstand;
    const r = WOLKE_PX * zufall(0.16, 0.34);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.22)");
    g.addColorStop(0.6, "rgba(255,255,255,0.08)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WOLKE_PX, WOLKE_PX);
  }
  // Einfärben: die Form bleibt, die Farbe kommt aus dem Thema.
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = farbe;
  ctx.fillRect(0, 0, WOLKE_PX, WOLKE_PX);
  return leinwand;
}

/** Ist die Seite gerade dunkel? Gemessen an der echten Hintergrundfarbe. */
function istDunkel(): boolean {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return false;
  probe.fillStyle = getComputedStyle(document.body).backgroundColor || "#fff";
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

export type RauchMaschine = {
  /** Qualm von der Glut; staerke 0..1 (Haltedauer). */
  qualm: (x: number, y: number, staerke: number, vx: number, vy: number) => void;
  /** Feine Duftspur beim Bewegen. */
  spur: (x: number, y: number) => void;
  /** Funken beim Glimmen. */
  funken: (x: number, y: number, staerke: number) => void;
  /** Beim Loslassen: ein letzter, voller Zug. */
  ausatmen: (x: number, y: number, staerke: number) => void;
  /** Ein Frame; dt in Sekunden. */
  schritt: (dt: number, zeit: number) => void;
  stoppen: () => void;
};

export function starteRauch(): RauchMaschine {
  const leinwand = document.createElement("canvas");
  leinwand.setAttribute("aria-hidden", "true");
  leinwand.className = "joint-rauch-leinwand";
  document.body.appendChild(leinwand);
  const ctx = leinwand.getContext("2d")!;
  let dpr = 1;

  const groesse = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    leinwand.width = Math.round(window.innerWidth * dpr);
    leinwand.height = Math.round(window.innerHeight * dpr);
  };
  groesse();
  window.addEventListener("resize", groesse);

  let rauchWolken: HTMLCanvasElement[] = [];
  let spurWolken: HTMLCanvasElement[] = [];
  const einfaerben = () => {
    const dunkel = istDunkel();
    rauchWolken = Array.from({ length: WOLKEN }, () => wolke(dunkel ? "rgb(226,224,230)" : "rgb(104,100,106)"));
    spurWolken = Array.from({ length: 2 }, () => wolke(dunkel ? "rgb(170,225,180)" : "rgb(96,150,108)"));
  };
  einfaerben();
  const themaBeobachter = new MutationObserver(einfaerben);
  themaBeobachter.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  const dunkelAbfrage = window.matchMedia("(prefers-color-scheme: dark)");
  dunkelAbfrage.addEventListener("change", einfaerben);

  const teilchen: Teilchen[] = [];
  let hatteTeilchen = false;

  const neu = (t: Omit<Teilchen, "alter" | "phase" | "drehung" | "form"> & Partial<Teilchen>) => {
    if (teilchen.length >= MAX_TEILCHEN) teilchen.shift();
    teilchen.push({
      alter: 0,
      phase: Math.random() * Math.PI * 2,
      drehung: Math.random() * Math.PI * 2,
      form: Math.floor(Math.random() * WOLKEN),
      ...t,
    });
  };

  const maschine: RauchMaschine = {
    qualm(x, y, staerke, vx, vy) {
      neu({
        art: "rauch",
        x: x + zufall(-1.5, 1.5),
        y: y + zufall(-1.5, 1.5),
        vx: vx * 0.08 + zufall(-8, 8),
        vy: vy * 0.08 - zufall(28, 46),
        dauer: zufall(2.2, 3.4),
        von: zufall(6, 10),
        bis: zufall(54, 86) * (0.8 + staerke * 0.5),
        drall: zufall(-0.6, 0.6),
        deckkraft: 0.34 + staerke * 0.3,
      });
    },
    spur(x, y) {
      neu({
        art: "spur",
        x,
        y,
        vx: zufall(-6, 6),
        vy: -zufall(8, 16),
        dauer: zufall(0.9, 1.3),
        von: 5,
        bis: zufall(20, 30),
        drall: zufall(-0.8, 0.8),
        deckkraft: 0.2,
        form: Math.floor(Math.random() * 2),
      });
    },
    funken(x, y, staerke) {
      neu({
        art: "funke",
        x,
        y,
        vx: zufall(-45, 45),
        vy: -zufall(60, 120) * (0.7 + staerke * 0.6),
        dauer: zufall(0.45, 0.9),
        von: zufall(0.8, 1.6),
        bis: 0.3,
        drall: 0,
        deckkraft: 1,
      });
    },
    ausatmen(x, y, staerke) {
      for (let i = 0; i < 5 + Math.round(staerke * 5); i++) {
        neu({
          art: "rauch",
          x: x + zufall(-4, 4),
          y: y + zufall(-4, 4),
          vx: zufall(-26, 26),
          vy: -zufall(14, 40),
          dauer: zufall(2.4, 3.6),
          von: zufall(10, 16),
          bis: zufall(70, 110),
          drall: zufall(-0.5, 0.5),
          deckkraft: 0.3 + staerke * 0.25,
        });
      }
    },
    schritt(dt, zeit) {
      if (teilchen.length === 0) {
        if (hatteTeilchen) ctx.clearRect(0, 0, leinwand.width, leinwand.height);
        hatteTeilchen = false;
        return;
      }
      hatteTeilchen = true;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, leinwand.width, leinwand.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      for (let i = teilchen.length - 1; i >= 0; i--) {
        const p = teilchen[i];
        p.alter += dt;
        const t = p.alter / p.dauer;
        if (t >= 1) {
          teilchen.splice(i, 1);
          continue;
        }

        if (p.art === "funke") {
          p.vy += 70 * dt; // Schwerkraft holt die Funken zurück
          p.vx *= 1 - 1.5 * dt;
        } else {
          // Auftrieb, Luftwiderstand und ein Kräuseln quer zur Steigrichtung.
          p.vy -= 10 * dt;
          p.vx *= 1 - 0.9 * dt;
          p.vy *= 1 - 0.35 * dt;
          p.vx += Math.sin(zeit * 1.7 + p.phase + p.y * 0.035) * 26 * dt;
          p.drehung += p.drall * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.art === "funke") {
          const flackern = 0.6 + 0.4 * Math.sin(zeit * 40 + p.phase);
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = (1 - t) * flackern;
          ctx.fillStyle = t < 0.4 ? "rgb(255,214,120)" : "rgb(255,140,50)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.von + (p.bis - p.von) * t, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        const r = p.von + (p.bis - p.von) * (1 - (1 - t) * (1 - t));
        const bild = (p.art === "spur" ? spurWolken : rauchWolken)[p.form % (p.art === "spur" ? 2 : WOLKEN)];
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = p.deckkraft * verlauf(t);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.drehung);
        ctx.drawImage(bild, -r, -r, r * 2, r * 2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    },
    stoppen() {
      window.removeEventListener("resize", groesse);
      themaBeobachter.disconnect();
      dunkelAbfrage.removeEventListener("change", einfaerben);
      leinwand.remove();
    },
  };
  return maschine;
}
