/**
 * 3D-Blätter (Spec Redesign 3 und 4): getrocknete Cannabisblätter segeln
 * über der Startseite, scroll-gekoppelt. Three.js wird erst hier geladen,
 * nur ab Tablet und nur, wenn die StoryBuehne läuft (also nie bei
 * reduzierter Bewegung). Die Blattform entsteht als Zeichnung auf einem
 * Canvas (sieben Finger, Mittelrippe), kein Bild-Download. Die Leinwand
 * liegt fest über allem und fängt keine Klicks.
 */
const ANZAHL = 22;
const FINGER = [-78, -52, -26, 0, 26, 52, 78] as const;

type Blatt = {
  x: number;
  y: number;
  z: number;
  fall: number;
  pendel: number;
  phase: number;
  dreh: [number, number, number];
  drehTempo: [number, number, number];
};

/** Zeichnet ein Cannabisblatt: sieben schmale, gesägte Finger aus einem Stielpunkt. */
function blattLeinwand(farbe: string, ader: string): HTMLCanvasElement {
  const leinwand = document.createElement("canvas");
  leinwand.width = 256;
  leinwand.height = 256;
  const ctx = leinwand.getContext("2d");
  if (!ctx) return leinwand;
  ctx.translate(128, 210);
  for (const winkel of FINGER) {
    const laenge = 150 - Math.abs(winkel) * 0.9;
    ctx.save();
    ctx.rotate((winkel * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Gesägter Rand: kleine Zacken entlang beider Seiten.
    const zacken = 9;
    for (let i = 1; i <= zacken; i++) {
      const t = i / zacken;
      const breite = Math.sin(t * Math.PI) * laenge * 0.11;
      ctx.lineTo(breite * (i % 2 === 0 ? 1 : 1.25), -laenge * t);
    }
    for (let i = zacken; i >= 1; i--) {
      const t = i / zacken;
      const breite = Math.sin(t * Math.PI) * laenge * 0.11;
      ctx.lineTo(-breite * (i % 2 === 0 ? 1 : 1.25), -laenge * t);
    }
    ctx.closePath();
    ctx.fillStyle = farbe;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -laenge * 0.95);
    ctx.strokeStyle = ader;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 40);
  ctx.strokeStyle = ader;
  ctx.lineWidth = 4;
  ctx.stroke();
  return leinwand;
}

function zufall(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Startet die Blätter. Gibt das Aufräumen zurück; `scrollTempo` liefert die aktuelle Scrollgeschwindigkeit. */
export async function starteBlaetter(scrollTempo: () => number): Promise<() => void> {
  const THREE = await import("three");
  const stil = getComputedStyle(document.documentElement);
  const gruen = stil.getPropertyValue("--color-accent").trim() || "#2f7d4f";
  const lila = stil.getPropertyValue("--color-kopierstift").trim() || "#7a4cc2";
  const ader = stil.getPropertyValue("--color-accent-hover").trim() || gruen;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  const leinwand = renderer.domElement;
  leinwand.setAttribute("aria-hidden", "true");
  leinwand.dataset.story = "blaetter";
  leinwand.className = "pointer-events-none fixed inset-0 z-40";
  document.body.appendChild(leinwand);

  const szene = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  kamera.position.z = 12;

  const bildmaps = [gruen, lila].map((farbe) => {
    const bildmap = new THREE.CanvasTexture(blattLeinwand(farbe, ader));
    bildmap.colorSpace = THREE.SRGBColorSpace;
    return bildmap;
  });
  const geometrie = new THREE.PlaneGeometry(1.6, 1.6, 6, 6);
  // Leichte Wölbung: getrocknete Blätter liegen nie flach.
  const lage = geometrie.attributes.position;
  for (let i = 0; i < lage.count; i++) {
    const x = lage.getX(i);
    lage.setZ(i, -0.25 * x * x);
  }
  lage.needsUpdate = true;
  const materialien = bildmaps.map(
    (map) => new THREE.MeshBasicMaterial({ map, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.85 }),
  );

  const hoehe = 2 * Math.tan((kamera.fov * Math.PI) / 360) * kamera.position.z;
  const breite = hoehe * kamera.aspect;
  const blaetter: Blatt[] = [];
  const netze = Array.from({ length: ANZAHL }, (_, index) => {
    const netz = new THREE.Mesh(geometrie, materialien[index % 2]);
    const skala = zufall(0.5, 1.2);
    netz.scale.set(skala, skala, skala);
    szene.add(netz);
    blaetter.push({
      x: zufall(-breite / 2, breite / 2),
      y: zufall(-hoehe / 2, hoehe / 2 + hoehe),
      z: zufall(-6, 3),
      fall: zufall(0.25, 0.6),
      pendel: zufall(0.4, 1.2),
      phase: zufall(0, Math.PI * 2),
      dreh: [zufall(0, 6), zufall(0, 6), zufall(0, 6)],
      drehTempo: [zufall(-0.6, 0.6), zufall(-0.8, 0.8), zufall(-0.4, 0.4)],
    });
    return netz;
  });

  const beiGroesse = () => {
    kamera.aspect = window.innerWidth / window.innerHeight;
    kamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", beiGroesse);

  let rahmen = 0;
  let zuletzt = performance.now();
  let wind = 0;
  const schritt = (jetzt: number) => {
    const dt = Math.min((jetzt - zuletzt) / 1000, 0.05);
    zuletzt = jetzt;
    // Scrollen treibt die Blätter an: nach unten gescrollt steigen sie, federnd gedämpft.
    wind += (scrollTempo() * 0.004 - wind) * 0.08;
    const zeit = jetzt / 1000;
    blaetter.forEach((blatt, index) => {
      blatt.y -= (blatt.fall - wind) * dt;
      blatt.x += Math.sin(zeit * blatt.pendel + blatt.phase) * 0.4 * dt;
      for (let achse = 0; achse < 3; achse++) blatt.dreh[achse] += blatt.drehTempo[achse] * dt * (1 + Math.abs(wind) * 4);
      if (blatt.y < -hoehe / 2 - 2) blatt.y = hoehe / 2 + 2;
      if (blatt.y > hoehe / 2 + 3) blatt.y = -hoehe / 2 - 1.5;
      const netz = netze[index];
      netz.position.set(blatt.x, blatt.y, blatt.z);
      netz.rotation.set(blatt.dreh[0], blatt.dreh[1], blatt.dreh[2]);
    });
    renderer.render(szene, kamera);
    rahmen = requestAnimationFrame(schritt);
  };
  rahmen = requestAnimationFrame(schritt);

  return () => {
    cancelAnimationFrame(rahmen);
    window.removeEventListener("resize", beiGroesse);
    geometrie.dispose();
    for (const material of materialien) material.dispose();
    for (const bildmap of bildmaps) bildmap.dispose();
    renderer.dispose();
    leinwand.remove();
  };
}
