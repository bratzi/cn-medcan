# Kartengraph-Überarbeitung — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Kartengraph zeigt nur noch gemessene und bewertete Werte, wird einfacher bedienbar, springt nicht mehr, und die Startseiten-Details (Terpen-Band, Hero-Wortmarke) sind auf Mobil und Web in Ordnung.

**Architecture:** Alle Änderungen bleiben in den bestehenden Komponenten; es entsteht kein zweiter Komponentenbaum. Reine Logik wandert nach `lib/aromakarte.ts` und wird dort zuerst mit Tests festgelegt, die Komponenten konsumieren sie nur. Die Startseite nutzt denselben `AromaErkundung`-Baum wie die Bewertungsmaske, unterschieden allein über einen Modus.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (`@opennextjs/cloudflare`), React 19, Tailwind v4 (`app/globals.css`), Prisma mit D1, Tests über `node:test` plus `tsx` (`npm test`).

**Spec:** [docs/superpowers/specs/2026-10-03-kartengraph-ueberarbeitung-design.md](../specs/2026-10-03-kartengraph-ueberarbeitung-design.md)

## Global Constraints

- Kein `next dev`, kein `next build`, kein `opennextjs-cloudflare preview` lokal. Geprüft wird live nach dem Push, per Browser-MCP. (Dauerregel des Nutzers)
- Push nach `main` ohne Rückfrage; der Push ist der Live-Gang und der Prüfweg.
- Remote-D1 nur durch den Nutzer, und nur als `npx wrangler d1 execute cn-medcan-db --remote --file <datei>`.
- Keine kostenpflichtigen Dienste, keine zusätzlichen npm-Installationen, keine Polling-Schleifen; bei einem Netzfehler sofort stoppen und melden.
- Prosa in Code-Kommentaren, Commits und Dokumenten; Caveman gilt nur im Chat.
- Design-Regelwerk `ui-design-engine` (8px-Raster, Buch-und-Handschrift) gilt für jede UI-Änderung, `edge-stack-master` für alles an Runtime, Caching und Bundle.
- Tests laufen mit `npm test`; Typen mit `npm run typecheck`; Lint mit `npm run lint`.
- Die Startseite stand schon am CPU-Limit (Fehler 1102). Nichts, was je Seitenaufruf mehr Serverarbeit erzeugt.
- Overall bleibt „mehr ist besser". Nur die Geschmacksmatrix ist eine Sweet-Spot-Skala.

## Review Focus

1. **Eine Sorte ohne Herstellerterpene.** Nach dem Wegfall der grünen Serie darf `serien` leer sein; Karte, Legende und `nasenAbweichung` müssen das aushalten, statt auf `serien[0]` zuzugreifen. Test in Task A2.
2. **Eine Sorte ohne Community-Bewertung.** Ohne Median gibt es keinen Ring und keinen Bezug; der Balken darf dann nicht als „zu wenig" einfärben, sondern neutral bleiben. Test in Task A2.
3. **Ein Geschmack, den kein Terpen der Sorte trägt.** `terpenKandidaten` muss „keiner" liefern, und nichts darf pulsieren — sonst leuchtet die Karte ins Leere. Test in Task B1.
4. **Eine alte Bewertung mit Terpenstufe 2.** Nach der Umstellung auf an/aus muss sie als „an" gelesen werden, nicht als 2 von 5 oder als 40 %. Test in Task B2.
5. **Eine Note, die als `3.0` aus der Datenbank kommt.** Nach der Float-Migration darf die Anzeige nicht „3,0 von 5" neben „4 von 5" stellen; die Formatierung muss einheitlich sein. Test in Task C2.

---

## Dateien

| Datei | Verantwortung nach dem Umbau |
|---|---|
| `lib/aromakarte.ts` | Reine Kartenlogik. Neu: `terpenKandidaten`, `terpenAn`. Weg: `kartenHoeheMitReglern`. |
| `lib/regler-raster.ts` | Nur noch das Geschmacks- und Beschaffenheitsraster. Weg: `terpenZeiger`, `terpenTaste`, `TERPEN_STUFEN_MAX`. |
| `lib/bewertung-eingabe.ts` | Noten als Dezimalzahl, Terpene als 0 oder 1. |
| `lib/query/bewertung.ts` | `mittleTerpenIntensitaet` liest alte Stufen als an/aus. |
| `components/review/AromaKarte.tsx` | Karte ohne Soll-Strich, ohne Terpen-Stärkeregler, mit Terpen-Schaltern, überlagerter Infotafel und Hover-Treffflächen. |
| `components/review/AromaErkundung.tsx` | `modus` statt `eingabe`; Terpene als an/aus; Automatik und Kandidaten-Puls. |
| `components/review/GesamteindruckLeiste.tsx` | Overall in 0,1-Schritten. |
| `components/review/SortenKopf.tsx` | Nimmt die Angaben zur Blüte als Slot auf. |
| `components/review/erkundung-daten.ts` | Liefert keine grüne Herstellerserie mehr. |
| `components/story/AromaSektion.tsx` | Startseite im Modus `example`. |
| `components/story/TerpenBand.tsx` | Hohes Band mit Infos im Band statt Tooltip. |
| `components/story/TerpenBandKopie.tsx` | So viele Kacheln, dass der Lauf nahtlos ist. |
| `app/globals.css` | Bandlauf, Bandhöhe, `--text-plakat`. |
| `app/[lang]/blueten/[slug]/page.tsx` | Angaben zur Blüte wandern in den Kopf. |
| `prisma/schema.prisma`, `migrations/0015_noten_als_float.sql` | Noten als `Float`. |

---

# Strang A — Herstellerstriche weg, Hover, kein Sprung

Punkte 1, 3, 7 und 9 der Spec. Ein Push am Ende des Strangs.

### Task A0: Live nachweisen, was bei Hover und Klick heute passiert

**Files:** keine Änderung, nur Befund.

- [ ] **Step 1: Startseite live öffnen**

Browser-MCP auf die Live-Startseite. Ist der Browser nicht verbunden, zuerst die verbundenen Browser auflisten und den Nutzer wählen lassen.

- [ ] **Step 2: Drei Beobachtungen festhalten**

Für die Sektion „Terpene und Geschmäcker":
1. Zeigt die Infobox beim Überfahren einer Geschmachszeile links etwas an? Beim Überfahren eines Terpens rechts?
2. Springt die Sektionshöhe, wenn die Box ihren Inhalt wechselt? Um wie viel?
3. Welche Elemente liegen unter dem Zeiger? Per `javascript_tool`:

```js
const r = document.querySelector('[data-schicht="soll"]')?.getBoundingClientRect();
JSON.stringify({ sollVorhanden: !!r, tafel: getComputedStyle(document.querySelector('.terpen-tafel') ?? document.body).position });
```

- [ ] **Step 3: Befund in den Plan schreiben**

Die Beobachtungen als Abschnitt „Befund A0" unten in dieser Datei ergänzen, mit Datum. Keine Vermutung, nur was zu sehen war. Dann committen:

```bash
git add docs/superpowers/plans/2026-10-03-kartengraph-ueberarbeitung.md
git commit -m "docs: Befund zum Hover- und Sprungverhalten der Aroma-Karte"
```

### Task A1: Die grüne Herstellerserie fällt aus den Erkundungsdaten

**Files:**
- Modify: `components/review/erkundung-daten.ts:46-54`
- Test: `tests/aroma-ebenen.test.ts`

**Interfaces:**
- Produces: `erkundungsDaten(...)` liefert in `serien` höchstens eine Serie, immer mit `ton: "lila"`.

- [ ] **Step 1: Failing test schreiben**

An `tests/aroma-ebenen.test.ts` anhängen:

```ts
test("Erkundungsdaten tragen keine grüne Herstellerserie mehr (Nutzer 2026-10-03)", () => {
  const terpene = [
    { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.8, rang: 1 },
  ] as const;
  const daten = erkundungsDaten(terpene, [], { hersteller: "Hersteller", community: "Community" }, null);
  assert.deepEqual(daten.serien, []);
  assert.equal(daten.serien.every((serie) => serie.ton === "lila"), true);
});
```

Dazu oben in der Datei `import { erkundungsDaten } from "@/components/review/erkundung-daten";` ergänzen, falls nicht vorhanden.

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "keine grüne Herstellerserie"`
Expected: FAIL, weil `serien` die Herstellerserie enthält.

- [ ] **Step 3: Minimal umsetzen**

In `components/review/erkundung-daten.ts` den Hersteller-Eintrag aus `serien` entfernen:

```ts
  const serien: AromaSerie[] = community.anzahlBewertungen > 0
    ? [{ name: namen.community, ton: "lila" as const, matrix: median?.geschmack ?? community.matrix }]
    : [];
```

`namen.hersteller` wird damit nicht mehr gelesen. Der Parameter bleibt in der Signatur, damit die Aufrufer unverändert bleiben; der Kommentar darüber sagt, dass `hersteller` seit 2026-10-03 ungenutzt ist, weil der Betreiber die Geschmacksintensität der Herstellerangaben nicht kennt.

- [ ] **Step 4: Tests laufen lassen**

Run: `npm test`
Expected: der neue Test PASS. Tests, die die grüne Serie erwarten, schlagen fehl und werden in Task A2 mit ihrem Feature entfernt. Schlagen andere fehl, hier stoppen und melden.

- [ ] **Step 5: Commit**

```bash
git add components/review/erkundung-daten.ts tests/aroma-ebenen.test.ts
git commit -m "feat: Herstellerangabe ist keine Serie der Aroma-Karte mehr"
```

### Task A2: Soll-Strich, Legende und `bezug` aus der Karte entfernen

**Files:**
- Modify: `components/review/AromaKarte.tsx` (Props `bezug`, `sollSerie`, `bezugMatrix`, Soll-Strich-Block, Legende, `LegendenMuster`)
- Modify: `components/review/AromaErkundung.tsx` (Übergabe von `bezug`)
- Modify: `components/review/Doppelseite.tsx` (falls `bezug` dort gesetzt ist)
- Test: `tests/aromakarte.test.ts`, `tests/aromakarte-v2.test.ts`

**Interfaces:**
- Produces: `AromaKarte` ohne Prop `bezug`. Der Bezug ist immer `regler?.vergleich`, also der Community-Median.

- [ ] **Step 1: Failing test schreiben**

An `tests/aromakarte.test.ts` anhängen:

```ts
test("Karte zeichnet keinen Soll-Strich und nennt keine Herstellerserie (Nutzer 2026-10-03)", () => {
  const quelle = readFileSync(join(process.cwd(), "components/review/AromaKarte.tsx"), "utf8");
  assert.doesNotMatch(quelle, /data-schicht="soll"/);
  assert.doesNotMatch(quelle, /sollSerie/);
  assert.doesNotMatch(quelle, /bezug\?:\s*"median"\s*\|\s*"serie"/);
  assert.doesNotMatch(quelle, /art=\{?"soll"/);
});

test("Ohne Community-Median färbt kein Balken ein (Review Focus 2)", () => {
  assert.deepEqual(balkenVergleich(3, null), balkenVergleich(3, undefined));
  assert.equal(balkenVergleich(3, null).gruen, 0);
});
```

`readFileSync`, `join` und `balkenVergleich` oben importieren, falls noch nicht vorhanden. Die zweite Zusicherung an `balkenVergleich` gegen die tatsächliche Rückgabeform anpassen: zuerst `lib/aromakarte.ts:501` lesen und die Feldnamen übernehmen.

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "keinen Soll-Strich"`
Expected: FAIL, `data-schicht="soll"` steht noch in der Quelle.

- [ ] **Step 3: Umsetzen**

In `components/review/AromaKarte.tsx`:
1. Prop `bezug` aus dem `Props`-Typ und aus der Destrukturierung entfernen.
2. `sollSerie` entfernen. `bezugMatrix` wird zu `const bezugMatrix = regler?.vergleich ?? null;`.
3. Den Block „Soll-Strich (T5b)" um Zeile 879 bis 900 vollständig löschen.
4. Den Legendeneintrag für `sollSerie` (um Zeile 537) löschen.
5. In `LegendenMuster` den Zweig `art === "soll"` und den Wert `"soll"` aus dem Typ entfernen.
6. Die Kommentare, die den Soll-Strich erklären, durch einen Satz ersetzen: der Bezug ist seit 2026-10-03 immer der Community-Median, weil die Geschmacksintensität der Herstellerangaben unbekannt ist.

In `components/review/AromaErkundung.tsx` die Zeile `bezug={eingabe ? "median" : "serie"}` samt Kommentar entfernen. In `components/review/Doppelseite.tsx` prüfen, ob `bezug` gesetzt wird, und gegebenenfalls entfernen.

- [ ] **Step 4: Alte Tests mit ihrem Feature entfernen**

Alle Tests, die den Soll-Strich oder die grüne Herstellerserie der Karte prüfen, löschen — nicht `skip`. Suchen mit:

```bash
grep -rn "soll\|Soll-Strich\|hersteller.*serie" tests/aromakarte.test.ts tests/aromakarte-v2.test.ts tests/aroma-ebenen.test.ts tests/doppelseite.test.ts
```

- [ ] **Step 5: Tests und Typen laufen lassen**

Run: `npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Soll-Strich der Herstellerangabe fällt aus der Aroma-Karte"
```

### Task A3: Ein Wert über 0 macht den Geschmack aktiv

**Files:**
- Modify: `components/review/AromaKarte.tsx` (`achseFarbig`)
- Test: `tests/aromakarte-v2.test.ts`

**Interfaces:**
- Consumes: `SPUERBAR` aus `lib/aromakarte.ts` bleibt für Linienbreite und Bögen in Gebrauch.
- Produces: nichts Neues; nur das Verhalten der Karte.

- [ ] **Step 1: Failing test schreiben**

```ts
test("Karte: ein Wert über 0 macht die Achse aktiv, nicht erst über der Spürbarkeitsschwelle (Nutzer 2026-10-03)", () => {
  const quelle = readFileSync(join(process.cwd(), "components/review/AromaKarte.tsx"), "utf8");
  // achseFarbig vergleicht gegen 0, nicht gegen SPUERBAR.
  assert.match(quelle, /const achseFarbig = \(index: number\) =>[\s\S]{0,120}wertAuf\(index\) > 0/);
  assert.doesNotMatch(quelle, /wertAuf\(index\) > SPUERBAR/);
});
```

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "über 0 macht die Achse aktiv"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

```ts
  /**
   * Farbig ist nur, was gerade aktiv ist: die hervorgehobene Achse, sonst jede Achse mit
   * einem Wert über 0. Seit 2026-10-03 ist das die ausdrückliche Funktionsweise der Karte
   * (Nutzer): sobald ein Regler über Null geht, ist der Geschmack aktiv und sichtbar, auch
   * wenn der Hersteller ihn nicht nennt.
   */
  const achseFarbig = (index: number) => (aktiv === null ? wertAuf(index) > 0 : aktiv === index);
```

- [ ] **Step 4: Tests laufen lassen**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: ein Geschmackswert über Null macht die Achse aktiv"
```

### Task A4: Infotafel überlagert immer, die Sektion springt nicht mehr

**Files:**
- Modify: `components/review/AromaKarte.tsx:1284-1300`
- Test: `tests/hover.test.ts`

- [ ] **Step 1: Failing test schreiben**

An `tests/hover.test.ts` anhängen:

```ts
test("Infotafel der Karte überlagert bei jeder Breite und hält keine Höhe frei (Nutzer 2026-10-03)", () => {
  const quelle = readFileSync(join(process.cwd(), "components/review/AromaKarte.tsx"), "utf8");
  // Kein reservierter Platz mehr: die Sektion darf nicht mit dem Tafelinhalt wachsen.
  assert.doesNotMatch(quelle, /min-h-80/);
  assert.doesNotMatch(quelle, /sm:min-h-56/);
  // Die Tafel liegt ohne Breakpoint-Präfix absolut am unteren Rand der Karte.
  assert.match(quelle, /"pointer-events-none absolute inset-x-0 bottom-0 z-10/);
  // Langer Text scrollt in der Tafel, statt nach außen zu wachsen.
  assert.match(quelle, /max-h-\S+ overflow-y-auto/);
});
```

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "überlagert bei jeder Breite"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

Den Container der Infotafel umbauen: die `lg:`-Präfixe fallen weg, die Überlagerung gilt immer, der reservierte Platz entfällt, und die Tafel selbst scrollt.

```tsx
      {/* Infotafel unter der Karte (Nutzer 2026-09-26, 2026-09-27; seit 2026-10-03 bei jeder
          Breite eine Überlagerung): sie liegt absolut am unteren Rand der Karte und hält im
          Fluss keine Höhe frei. Vorher reservierte sie min-h-80 und wuchs unter lg darüber
          hinaus — die ganze Sektion sprang, je nachdem welches Terpen man überfuhr (Nutzer
          2026-10-03). Die Tafel erbt keine pointer-events, damit das Überfahren der Karte
          darunter weiterläuft; langer Text scrollt in ihr. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 grid justify-items-center",
          "*:max-h-64 *:overflow-y-auto *:rounded-lg *:border *:border-border *:bg-surface-raised *:p-4 *:shadow-md",
        )}
      >
```

Die bisherigen Klassen `grid min-h-80 justify-items-center sm:min-h-56` und der `lg:`-Zweig entfallen. Der umgebende `figure`-Container braucht `relative`, falls er es nicht schon trägt (Zeile 455 trägt es nur unter `kompakt`) — also `relative` ohne Präfix ergänzen.

- [ ] **Step 4: Tests laufen lassen**

Run: `npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: Infotafel der Aroma-Karte überlagert und die Sektion springt nicht mehr"
```

### Task A5: Die Box wechselt im Web schon beim Überfahren

**Files:**
- Modify: `components/review/AromaKarte.tsx` (Treffflächen für Achsen und Terpene)
- Test: `tests/hover.test.ts`

**Interfaces:**
- Produces: je Geschmacksachse und je Terpen eine Trefffläche, die unabhängig von `regler` und `terpenRegler` im Markup steht.

- [ ] **Step 1: Failing test schreiben**

```ts
test("Jede Achse und jedes Terpen hat eine Trefffläche, auch ohne Regler (Nutzer 2026-10-03)", () => {
  const quelle = readFileSync(join(process.cwd(), "components/review/AromaKarte.tsx"), "utf8");
  // Die Flächen hängen nicht mehr an der Maske.
  assert.match(quelle, /data-treffer="achse"/);
  assert.match(quelle, /data-treffer="terpen"/);
  const achsenBlock = quelle.slice(quelle.indexOf('data-treffer="achse"') - 600, quelle.indexOf('data-treffer="achse"'));
  assert.doesNotMatch(achsenBlock, /regler \?/);
});
```

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "hat eine Trefffläche"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

Im SVG je Geschmacksachse ein unsichtbares, aber treffbares Rechteck über Balken und Knoten legen, und je Terpen eines über Knoten und Namenszeile. Beide tragen `fill="transparent"`, `pointerEvents="all"` und reagieren auf `onPointerEnter` sowie `onFocus`. Sie stehen außerhalb der `regler`- und `terpenRegler`-Bedingungen, also immer im Markup:

```tsx
                {/* Trefffläche der Achse (Nutzer 2026-10-03): die Infobox wechselt im Web schon
                    beim Überfahren, nicht erst beim Klick. Vorher hing ein Teil der Flächen an
                    der Maske (regler, terpenRegler) und fehlte in der Anzeige. Mindestens 44 px
                    hoch, transparent, ohne eigene Bedeutung für Screenreader. */}
                <rect
                  data-treffer="achse"
                  aria-hidden="true"
                  x={balkenEnde(knoten, MAX, 0, balken).x - 8}
                  y={knoten.y - 22}
                  width={balken + 40}
                  height={44}
                  fill="transparent"
                  style={{ pointerEvents: "all" }}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "touch") achseUeberfahren(index);
                  }}
                />
```

Für die Terpene dasselbe mit `data-treffer="terpen"`, `terpenUeberfahren(name)` und der Breite der rechten Spalte.

`e.pointerType !== "touch"` hält Mobil unverändert: dort gibt es kein Überfahren, und der Nutzer hat die heutige Mobilform ausdrücklich als in Ordnung bezeichnet.

- [ ] **Step 4: Tests und Typen laufen lassen**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit und Push**

```bash
git add -A
git commit -m "feat: Infobox der Aroma-Karte wechselt im Web beim Überfahren"
git push origin main
```

- [ ] **Step 6: Live prüfen**

Nach dem Push live im Browser: Startseite und eine Blütenseite. Prüfen: kein vertikaler Strich mehr auf den Achsen, die Box wechselt beim Überfahren links und rechts, die Sektionshöhe bleibt beim Wechsel konstant. Befund kurz melden.

- [ ] **Step 7: Safe 4 Clear**

`HANDOFF.md` auf Strang A fortschreiben, committen, pushen, kurze Info an den Nutzer, Clear freigeben.

---

# Strang B — Terpene per Klick statt Stärkeregler

Punkt 4 der Spec. Baut auf Strang A auf, weil beide `AromaKarte.tsx` anfassen.

### Task B1: `terpenKandidaten` als reine Funktion

**Files:**
- Modify: `lib/aromakarte.ts` (nach `leuchtendeTerpene`, Zeile 581)
- Test: `tests/aroma-ebenen.test.ts`

**Interfaces:**
- Consumes: `terpenBoegen`, `KartenTerpen`, `TerpenEbene` aus derselben Datei.
- Produces:

```ts
export function terpenKandidaten(
  achse: number,
  terpene: readonly KartenTerpen[],
  ebenen?: Readonly<Record<string, TerpenEbene>>,
): string[]
```

Liefert die Namen der Terpene, die diese Achse spürbar tragen (Anteil ab 0,2), nach Anteil absteigend. Geister bleiben drin, denn ein Geist ist gerade das Terpen, das man aktivieren soll. Leeres Array heißt „keiner", ein Element heißt „eindeutig", mehr heißt „der Nutzer wählt".

- [ ] **Step 1: Failing test schreiben**

```ts
test("Terpen-Kandidaten einer Achse: keiner, genau einer, mehrere (Nutzer 2026-10-03)", () => {
  const erdig = achsenIndex("ERDIG");
  const myrcen = { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.9, rang: 1 } as const;
  const limonen = { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 } as const;
  const humulen = { name: "Humulen", geschmack: "ERDIG", konzentrationProzent: 0.2, rang: 3 } as const;

  // Keiner: die Achse trägt kein Terpen der Sorte.
  assert.deepEqual(terpenKandidaten(achsenIndex("ZITRUS"), [myrcen]), []);
  // Genau einer: eindeutig zuzuordnen, die Automatik darf schalten.
  assert.deepEqual(terpenKandidaten(erdig, [myrcen, limonen]), ["Myrcen"]);
  // Mehrere: der Nutzer wählt, nichts schaltet sich selbst.
  const mehrere = terpenKandidaten(erdig, [myrcen, limonen, humulen]);
  assert.equal(mehrere.length, 2);
  assert.deepEqual(new Set(mehrere), new Set(["Myrcen", "Humulen"]));
  // Geister zählen mit: genau sie soll man aktivieren können.
  assert.deepEqual(terpenKandidaten(erdig, [myrcen], { Myrcen: "geist" }), ["Myrcen"]);
});
```

`achsenIndex` und `terpenKandidaten` oben importieren.

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "Terpen-Kandidaten einer Achse"`
Expected: FAIL mit „terpenKandidaten is not a function".

- [ ] **Step 3: Umsetzen**

In `lib/aromakarte.ts` nach `leuchtendeTerpene`:

```ts
/**
 * Terpene, die eine Geschmacksrichtung spürbar tragen (Anteil ab 20 %), stärkste zuerst
 * (Nutzer 2026-10-03). Grundlage der Automatik: zieht man einen Geschmack über 0 und ist
 * genau ein Terpen zuständig, schaltet es sich selbst an. Sind es mehrere, schaltet sich
 * keines, und die Karte lässt die Kandidaten pulsieren, bis der Nutzer eines wählt.
 *
 * Anders als `leuchtendeTerpene` bleiben Geister hier drin: ein Geist ist genau das
 * Terpen, das der Hersteller nicht nennt und das man trotzdem aktivieren können soll.
 */
export function terpenKandidaten(
  achse: number,
  terpene: readonly KartenTerpen[],
  _ebenen?: Readonly<Record<string, TerpenEbene>>,
): string[] {
  return terpene
    .flatMap((terpen) => {
      const bogen = terpenBoegen(terpen).find((b) => b.achse === achse && b.anteil >= 0.2);
      return bogen ? [{ name: terpen.name, anteil: bogen.anteil }] : [];
    })
    .sort((a, b) => b.anteil - a.anteil || a.name.localeCompare(b.name, "de"))
    .map((eintrag) => eintrag.name);
}
```

- [ ] **Step 4: Test laufen lassen**

Run: `npm test -- --test-name-pattern "Terpen-Kandidaten einer Achse"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/aromakarte.ts tests/aroma-ebenen.test.ts
git commit -m "feat: Kandidaten-Terpene einer Geschmacksrichtung als reine Funktion"
```

### Task B2: Terpene sind an oder aus — Eingabe und Mittelwert

**Files:**
- Modify: `lib/bewertung-eingabe.ts:42` (`intensitaet`) und der Kommentar bei Zeile 49-52
- Modify: `lib/query/bewertung.ts` (`mittleTerpenIntensitaet`)
- Test: `tests/bewertung-eingabe.test.ts`, `tests/community.test.ts`

**Interfaces:**
- Produces: `terpenIntensitaet` enthält nur 0 und 1. `mittleTerpenIntensitaet` liefert je Terpen `{ mittel, anzahl }`, wobei `mittel` der Anteil der Bewertenden ist, die das Terpen aktiviert haben (0 bis 1).

- [ ] **Step 1: Failing test schreiben**

An `tests/bewertung-eingabe.test.ts`:

```ts
test("Terpene werden als an oder aus gelesen; alte Stufen gelten als an (Nutzer 2026-10-03)", () => {
  const formular = new Map<string, unknown>([
    ["strainId", "s1"],
    ["note-aussehen", "4"],
    ["note-geruch", "4"],
    ["note-geschmack", "4"],
    ["note-wirkung", "4"],
    ["note-konsistenz", "4"],
    ["terpen-Myrcen", "1"],
    ["terpen-Limonen", "0"],
    ["terpen-Humulen", "3"],
  ]);
  const ergebnis = bewertungPruefen({ get: (name) => formular.get(name) ?? null }, ["Myrcen", "Limonen", "Humulen"]);
  assert.equal(ergebnis.ok, true);
  if (!ergebnis.ok) return;
  // Eine alte Stufe 3 bedeutet "an", also 1 — nie 3 von 5 (Review Focus 4).
  assert.deepEqual(ergebnis.wert.terpenIntensitaet, { Myrcen: 1, Limonen: 0, Humulen: 1 });
});
```

An `tests/community.test.ts`:

```ts
test("Mittlere Terpen-Intensität ist der Anteil der Bewertenden, die das Terpen aktiviert haben", () => {
  const mittel = mittleTerpenIntensitaet([{ Myrcen: 1 }, { Myrcen: 0 }, { Myrcen: 4 }]);
  assert.equal(mittel.Myrcen.anzahl, 3);
  // Zwei von drei haben Myrcen aktiviert; die alte Stufe 4 zählt als an.
  assert.equal(Math.round(mittel.Myrcen.mittel * 100) / 100, 0.67);
});
```

- [ ] **Step 2: Tests laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "an oder aus gelesen|Anteil der Bewertenden"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

In `lib/bewertung-eingabe.ts` das Schema ersetzen:

```ts
/**
 * Terpene sind seit 2026-10-03 an oder aus (Nutzer: die Stärkeregler waren zu komplex).
 * Gespeichert werden 0 und 1. Bewertungen von vor der Umstellung tragen Stufen bis 5;
 * jede Stufe über 0 bedeutet "an" und wird deshalb auf 1 gelesen.
 */
const intensitaet = z.coerce.number().int().min(0).max(5).transform((wert) => (wert > 0 ? 1 : 0));
```

Den Kommentar am Kopf von `bewertungPruefen` nachziehen: `terpen-<Name>` ist 0 oder 1.

In `lib/query/bewertung.ts` in `mittleTerpenIntensitaet` jeden Wert vor dem Mitteln auf 0 oder 1 abbilden, mit demselben Satz als Kommentar.

- [ ] **Step 4: Tests laufen lassen**

Run: `npm test && npm run typecheck`
Expected: PASS. Tests, die Terpenstufen 0 bis 5 als Stufen prüfen, werden mit ihrem Feature entfernt.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Terpene einer Bewertung sind an oder aus"
```

### Task B3: Terpen-Stärkeregler aus Karte und Raster entfernen

**Files:**
- Modify: `components/review/AromaKarte.tsx` (Prop `terpenRegler`, `terpenSpur`, Reglerzeichnung, `kartenHoeheMitReglern`)
- Modify: `lib/regler-raster.ts:55-71`
- Modify: `lib/aromakarte.ts:82` (`kartenHoeheMitReglern`)
- Delete: `tests/terpen-regler-raster.test.ts`
- Test: `tests/aromakarte.test.ts`

- [ ] **Step 1: Failing test schreiben**

```ts
test("Karte hat keine Terpen-Stärkeregler mehr, nur Schalter (Nutzer 2026-10-03)", () => {
  const karte = readFileSync(join(process.cwd(), "components/review/AromaKarte.tsx"), "utf8");
  const raster = readFileSync(join(process.cwd(), "lib/regler-raster.ts"), "utf8");
  assert.doesNotMatch(karte, /terpenRegler/);
  assert.doesNotMatch(karte, /terpenSpur/);
  assert.doesNotMatch(raster, /TERPEN_STUFEN_MAX|terpenZeiger|terpenTaste/);
  // Stattdessen ein Schalter je Terpen.
  assert.match(karte, /aria-pressed/);
});
```

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "keine Terpen-Stärkeregler"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

1. In `components/review/AromaKarte.tsx` die Prop `terpenRegler` durch `terpenSchalter` ersetzen:

```tsx
  /**
   * Terpene an- und abschalten (Nutzer 2026-10-03, vorher Stärkeregler 0 bis 5: zu komplex).
   * `an` ist die Menge der aktiven Terpene, `anteil` je Terpen der Anteil der Bewertenden,
   * die es aktiviert haben (der grüne Ring), `pulsierend` die Kandidaten, unter denen der
   * Nutzer gerade wählen soll. Begleitstoffe haben keinen Schalter.
   */
  terpenSchalter?: {
    an: ReadonlySet<string>;
    anteil?: Readonly<Record<string, number>>;
    pulsierend?: ReadonlySet<string>;
    umschalten: (terpen: string) => void;
  };
```

2. Die Spur je Terpen (`terpenSpur`, Griff, Tastenbehandlung über `terpenTaste`/`terpenZeiger`) löschen. Der Terpenknoten rechts wird zur Schaltfläche: `<g role="button" tabIndex={0} aria-pressed={an.has(name)} onClick={() => umschalten(name)} onKeyDown={…Enter und Space…}>`. Aktive Terpene bleiben in voller Deckkraft, inaktive stehen in `GEIST_DECKKRAFT.blass`.
3. Kandidaten pulsieren: die betroffenen Knoten bekommen `className="terpen-kandidat"`. Dazu in `app/globals.css`:

```css
/* Kandidaten-Terpene (Nutzer 2026-10-03): zieht man einen Geschmack über Null und tragen
   mehrere Terpene ihn, pulsieren sie in Kopierstift-Violett, bis der Nutzer eines wählt.
   Bei reduzierter Bewegung bleibt ein ruhiger Ring statt des Pulses. */
.terpen-kandidat {
  color: var(--color-kopierstift);
}

@media (prefers-reduced-motion: no-preference) {
  .terpen-kandidat {
    animation: terpen-kandidat 1.6s ease-in-out infinite;
  }
}

@keyframes terpen-kandidat {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}
```

4. `kartenHoeheMitReglern` aus `lib/aromakarte.ts` entfernen und `aktHoehe` auf `grundHoehe` zurückführen; `versatz` wird 0 und fällt weg.
5. `terpenZeiger`, `terpenTaste`, `TERPEN_STUFEN_MAX` und `TERPEN_RASTER` aus `lib/regler-raster.ts` entfernen, samt des Kommentarblocks darüber.
6. `tests/terpen-regler-raster.test.ts` löschen, es prüft genau das entfernte Raster.

- [ ] **Step 4: Tests, Typen, Lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Terpene werden in der Karte geschaltet, nicht geregelt"
```

### Task B4: Automatik und Kandidaten-Puls in der Erkundung

**Files:**
- Modify: `components/review/AromaErkundung.tsx`
- Test: `tests/bewertung-maske.test.ts`

**Interfaces:**
- Consumes: `terpenKandidaten` aus Task B1, `terpenSchalter` aus Task B3.
- Produces: versteckte Felder `terpen-<Name>` mit 0 oder 1.

- [ ] **Step 1: Failing test schreiben**

```ts
test("Erkundung schaltet das eindeutige Terpen selbst an und lässt mehrere pulsieren (Nutzer 2026-10-03)", () => {
  const quelle = readFileSync(join(process.cwd(), "components/review/AromaErkundung.tsx"), "utf8");
  assert.match(quelle, /terpenKandidaten/);
  // Genau ein Kandidat: Automatik. Mehrere: nichts schaltet sich, die Karte pulsiert.
  assert.match(quelle, /kandidaten\.length === 1/);
  assert.match(quelle, /pulsierend/);
  // Ein auf 0 zurückgezogener Geschmack schaltet kein Terpen ab (Nutzerentscheid).
  assert.match(quelle, /bleibt an|kein Nebeneffekt/);
});
```

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "eindeutige Terpen selbst an"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

`eigeneIntensitaet` wird zu `aktiveTerpene: Set<string>`. Die Änderung eines Geschmacksreglers geht über eine Funktion, die zusätzlich die Automatik auswertet:

```tsx
  // Kandidaten, unter denen der Nutzer gerade wählen soll (Nutzer 2026-10-03): nur gesetzt,
  // wenn ein Geschmack über 0 steht und mehrere Terpene ihn tragen.
  const [pulsierend, setPulsierend] = useState<ReadonlySet<string>>(new Set());

  const geschmackAendern = (key: keyof GeschmacksMatrix, wert: number) => {
    setEigen((alt) => ({ ...(alt ?? start), [key]: wert }));
    if (wert <= 0) {
      // Zurück auf 0 schaltet kein Terpen ab: das bleibt an, bis der Nutzer es selbst
      // abschaltet (kein Nebeneffekt, Nutzerentscheid 2026-10-03). Nur der Puls endet.
      setPulsierend(new Set());
      return;
    }
    const achse = GESCHMACKS_ACHSEN.findIndex((eintrag) => eintrag.key === key);
    const kandidaten = terpenKandidaten(achse, kartenTerpene).filter((name) => !aktiveTerpene.has(name));
    if (kandidaten.length === 1) {
      setAktiveTerpene((alt) => new Set(alt).add(kandidaten[0]));
      setPulsierend(new Set());
    } else {
      setPulsierend(new Set(kandidaten));
    }
  };
```

Das Umschalten eines Terpens entfernt es aus `pulsierend`, sobald eines der Kandidaten an ist. Die versteckten Felder geben je gezähltes Terpen 0 oder 1; `gezaehlteTerpene` bleibt in Gebrauch, bekommt aber `Object.fromEntries([...aktiveTerpene].map((name) => [name, 1]))` als Eingabe plus die Herstellerterpene mit 0.

- [ ] **Step 4: Tests, Typen, Lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit und Push**

```bash
git add -A
git commit -m "feat: Geschmack über Null schaltet sein Terpen, mehrere Kandidaten pulsieren"
git push origin main
```

- [ ] **Step 6: Live prüfen**

Bewertungsmaske einer Blüte live: einen eindeutigen Geschmack über 0 ziehen und sehen, dass sein Terpen angeht; einen mehrdeutigen ziehen und das violette Pulsieren sehen; ein Terpen per Klick an und aus schalten. Befund kurz melden.

- [ ] **Step 7: Safe 4 Clear**

`HANDOFF.md` fortschreiben, committen, pushen, kurze Info, Clear freigeben.

---

# Strang C — Overall mit derselben Granularität wie die Charge

Punkt 2 der Spec. Enthält eine Migration, die der Nutzer selbst remote einspielt.

### Task C1: Noten als `Float` in Schema und Migration

**Files:**
- Modify: `prisma/schema.prisma:250-254`
- Create: `migrations/0015_noten_als_float.sql`
- Test: `tests/bewertung-v2.test.ts`

- [ ] **Step 1: Failing test schreiben**

```ts
test("Noten liegen als Float im Schema und die Migration kopiert die Tabelle (Nutzer 2026-10-03)", () => {
  const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
  for (const spalte of ["aussehen", "geruch", "geschmack", "wirkung", "konsistenz"]) {
    assert.match(schema, new RegExp(`${spalte}\\s+Float`), spalte);
  }
  const migration = readFileSync(join(process.cwd(), "migrations/0015_noten_als_float.sql"), "utf8");
  // SQLite kennt kein ALTER COLUMN TYPE: Tabellenkopie mit REAL.
  assert.match(migration, /CREATE TABLE/i);
  assert.match(migration, /REAL/);
  assert.match(migration, /INSERT INTO/i);
});
```

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "Noten liegen als Float"`
Expected: FAIL, die Migration fehlt.

- [ ] **Step 3: Umsetzen**

In `prisma/schema.prisma` die fünf Spalten auf `Float` setzen. `migrations/0015_noten_als_float.sql` als Tabellenkopie schreiben: zuerst die bestehende Tabellendefinition aus `migrations/0009_bewertung_v2.sql` und den späteren Migrationen zusammentragen, damit die neue Tabelle Spalten, Fremdschlüssel und Indizes vollständig übernimmt. Dann `PRAGMA foreign_keys=OFF`, `CREATE TABLE … REAL …`, `INSERT INTO … SELECT … FROM bewertung`, `DROP TABLE bewertung`, `ALTER TABLE … RENAME TO bewertung`, Indizes neu anlegen, `PRAGMA foreign_keys=ON`.

Danach `npm run db:generate`, damit der Prisma-Client die neuen Typen kennt.

- [ ] **Step 4: Lokal anwenden und Tests laufen lassen**

Run: `npm run db:migrate:local && npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Noten einer Bewertung als Dezimalzahl im Schema"
```

- [ ] **Step 6: Den Nutzer um das Einspielen bitten**

Die Remote-Migration ist Nutzersache. Genau diesen Befehl nennen und auf die Bestätigung warten, bevor der Strang gepusht wird:

```bash
npx wrangler d1 execute cn-medcan-db --remote --file migrations/0015_noten_als_float.sql
```

### Task C2: Overall-Regler in 0,1-Schritten

**Files:**
- Modify: `components/review/GesamteindruckLeiste.tsx:100-110`
- Modify: `components/review/AromaErkundung.tsx` (verstecktes Feld `note-<achse>`)
- Modify: `lib/bewertung-eingabe.ts:41` (`note`)
- Test: `tests/blatt-note.test.ts`, `tests/bewertung-eingabe.test.ts`

- [ ] **Step 1: Failing test schreiben**

```ts
test("Overall-Regler hat dieselbe Granularität wie die Charge (Nutzer 2026-10-03)", () => {
  const leiste = readFileSync(join(process.cwd(), "components/review/GesamteindruckLeiste.tsx"), "utf8");
  const charge = readFileSync(join(process.cwd(), "components/review/BeschaffenheitsLeiste.tsx"), "utf8");
  assert.match(leiste, /schritt=\{0\.1\}/);
  assert.doesNotMatch(leiste, /schritt=\{1\}/);
  // Dieselbe Stufung wie die Charge, damit die beiden Schritte gleich bedienbar sind.
  assert.equal(/schritt=\{0\.1\}/.test(charge), true);
});

test("Eine Note 3 wird wie eine Note 3,7 formatiert (Review Focus 5)", () => {
  const erkundung = readFileSync(join(process.cwd(), "components/review/AromaErkundung.tsx"), "utf8");
  assert.match(erkundung, /name=\{`note-\$\{key\}`\} value=\{Math\.round\(eigeneNoten\[key\]! \* 10\) \/ 10\}/);
});
```

Dazu in `tests/bewertung-eingabe.test.ts`:

```ts
test("Noten werden in Zehntelschritten angenommen, 0 bleibt keine Note", () => {
  const formular = new Map<string, unknown>([
    ["strainId", "s1"],
    ["note-aussehen", "3.7"],
    ["note-geruch", "4"],
    ["note-geschmack", "4"],
    ["note-wirkung", "4"],
    ["note-konsistenz", "4"],
  ]);
  const ergebnis = bewertungPruefen({ get: (name) => formular.get(name) ?? null }, []);
  assert.equal(ergebnis.ok, true);
  if (!ergebnis.ok) return;
  assert.equal(ergebnis.wert.noten.aussehen, 3.7);
});
```

- [ ] **Step 2: Tests laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "dieselbe Granularität|Zehntelschritten"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

In `components/review/GesamteindruckLeiste.tsx` `schritt={1}` zu `schritt={0.1}` und den Wert mit `formatiereWert` auf eine Nachkommastelle anzeigen, mit einem Kommentar, der den Nutzerentscheid vom 2026-10-03 nennt: Overall und „Diese Charge" sollen gleich granular sein. In `components/review/AromaErkundung.tsx` das versteckte Feld auf `Math.round(eigeneNoten[key]! * 10) / 10` umstellen. In `lib/bewertung-eingabe.ts`:

```ts
/**
 * Overall-Noten 1 bis 5 in Zehntelschritten (Nutzer 2026-10-03: dieselbe Granularität wie
 * "Diese Charge"). 0 heißt weiterhin "keine Note" und wird vom Aufrufer abgewiesen.
 */
const note = z.coerce.number().min(1).max(5).multipleOf(0.1);
```

- [ ] **Step 4: Tests, Typen, Lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit, Push, Live prüfen, Safe 4 Clear**

```bash
git add -A
git commit -m "feat: Overall-Regler in Zehntelschritten wie die Charge"
git push origin main
```

Live prüfen: in der Bewertungsmaske eine Overall-Note auf 3,7 ziehen, speichern, neu laden, und sehen, dass 3,7 zurückkommt. Danach `HANDOFF.md` fortschreiben, pushen, kurze Info, Clear freigeben.

---

# Strang D — Angaben nach oben, Startseite als Example

Punkte 5 und 6 der Spec.

### Task D1: `modus` statt `eingabe`

**Files:**
- Modify: `components/review/AromaErkundung.tsx`
- Modify: `components/review/BewertungsFormular.tsx`
- Modify: `components/review/NoteUndErkundung.tsx`
- Modify: `components/story/AromaSektion.tsx`
- Modify: `app/[lang]/blueten/[slug]/page.tsx:300`
- Test: `tests/startseite-statisch.test.ts`

**Interfaces:**
- Produces: `AromaErkundung` nimmt `modus?: "anzeige" | "example" | "maske"`, Standard `"anzeige"`. `eingabe` fällt als Prop weg.

- [ ] **Step 1: Failing test schreiben**

```ts
test("Startseite nutzt den Rating-Code als Example, nicht als Anzeige (Nutzer 2026-10-03)", () => {
  const sektion = readFileSync(join(process.cwd(), "components/story/AromaSektion.tsx"), "utf8");
  const erkundung = readFileSync(join(process.cwd(), "components/review/AromaErkundung.tsx"), "utf8");
  assert.match(sektion, /modus="example"/);
  // Ein Baum, kein zweiter: der Modus steuert nur die versteckten Felder.
  assert.match(erkundung, /modus\?: "anzeige" \| "example" \| "maske"/);
  assert.match(erkundung, /const eingabe = modus !== "anzeige"/);
  assert.match(erkundung, /modus === "maske"/);
  assert.doesNotMatch(erkundung, /eingabe\?: boolean/);
});
```

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "Rating-Code als Example"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

```tsx
  /**
   * Wie die Erkundung bedient wird (Nutzer 2026-10-03, vorher das boolesche `eingabe`):
   * - "maske": die Bewertungsmaske. Regler sind die Eingabe, versteckte Felder gehen ins Formular.
   * - "example": dieselbe Maske und dieselbe Optik auf der Startseite, aber ohne Formularfelder
   *   und ohne Speichern. Regler starten bei 0 wie in der echten Maske; nichts wird gespeichert.
   * - "anzeige": nur lesen, wie auf der Buchseite (Doppelseite.tsx).
   * Es gibt bewusst nur einen Komponentenbaum: derselbe Code, eine Abweichung.
   */
  modus = "anzeige",
```

Darunter `const eingabe = modus !== "anzeige";`. Der Block mit den versteckten Feldern hängt künftig an `modus === "maske"`. Alle Aufrufer umstellen: `BewertungsFormular` auf `modus="maske"`, `AromaSektion` über `NoteUndErkundung` auf `modus="example"`, die Blütenseite auf den bisherigen Wert.

- [ ] **Step 4: Tests, Typen, Lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: die Erkundung kennt drei Modi, die Startseite läuft als Example"
```

### Task D2: Angaben zur Blüte unter Bild und Überschrift

**Files:**
- Modify: `components/review/SortenKopf.tsx` (neuer Slot `angaben`)
- Modify: `app/[lang]/blueten/[slug]/page.tsx:300-354`
- Test: `tests/produktseite.test.ts`

**Interfaces:**
- Produces: `SortenKopfProps` bekommt `angaben?: React.ReactNode`, gerendert in der rechten Spalte unter den Wirkstoffen.

- [ ] **Step 1: Failing test schreiben**

```ts
test("Angaben zur Blüte stehen im Sortenkopf, nicht nach dem Rating (Nutzer 2026-10-03)", () => {
  const kopf = readFileSync(join(process.cwd(), "components/review/SortenKopf.tsx"), "utf8");
  const seite = readFileSync(join(process.cwd(), "app/[lang]/blueten/[slug]/page.tsx"), "utf8");
  assert.match(kopf, /angaben\?: React\.ReactNode/);
  // Die Angaben gehen in den Kopf hinein; die eigene Sektion nach dem Rating entfällt.
  assert.match(seite, /angaben=\{/);
  const nachErkundung = seite.slice(seite.indexOf("<AromaErkundung"));
  assert.doesNotMatch(nachErkundung, /texte\.angaben/);
  // Terpen-Chips entfallen dort: der Sortenkopf zeigt das Profil schon mit Anteilsbalken.
  assert.doesNotMatch(seite, /<TerpenChips/);
});
```

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "Angaben zur Blüte stehen im Sortenkopf"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

`SortenKopf` bekommt den Slot und rendert ihn unter den Wirkstoffen, mit `border-t border-border pt-6` als ruhige Trennung im 8px-Raster. Auf der Blütenseite wandern `Faktenliste` und `CannabinoidBar` in diesen Slot; die Sektion mit `texte.angaben` nach der Erkundung entfällt, der Import von `TerpenChips` wird entfernt. Die Überschrift `texte.angaben` bleibt als `sr-only`-Beschriftung des Slots erhalten, damit die Seitenstruktur für Screenreader nicht verschwindet.

- [ ] **Step 4: Tests, Typen, Lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit, Push, Live prüfen, Safe 4 Clear**

```bash
git add -A
git commit -m "feat: Angaben zur Blüte stehen unter Bild und Sortennamen"
git push origin main
```

Live prüfen: Blütenseite auf Mobil und Desktop, Startseite als Example mit Reglern bei 0. Danach `HANDOFF.md`, Push, kurze Info, Clear.

---

# Strang E — Terpen-Band der Startseite

Punkt 8 der Spec.

### Task E0: Live nachweisen, warum das Band Lücken hat und nichts zeigt

**Files:** keine Änderung, nur Befund.

- [ ] **Step 1: Live messen**

Auf der Live-Startseite per `javascript_tool`:

```js
const spur = document.querySelector('.terpen-band-spur');
const listen = [...spur.children];
JSON.stringify({
  fenster: innerWidth,
  spur: spur.getBoundingClientRect().width,
  listen: listen.map((l) => ({ breite: l.getBoundingClientRect().width, kinder: l.children.length, ariaHidden: l.getAttribute('aria-hidden') })),
  animation: getComputedStyle(spur).animationName,
});
```

- [ ] **Step 2: Hover und Klick prüfen**

Ein Terpen-Icon überfahren und anklicken. Festhalten, ob der Tooltip erscheint, und falls nicht, was `getComputedStyle` des Tooltips sagt (`visibility`, `opacity`) und ob ein Vorfahr clippt.

- [ ] **Step 3: Befund festhalten und committen**

Als Abschnitt „Befund E0" in diese Datei, mit Datum und Zahlen.

```bash
git add docs/superpowers/plans/2026-10-03-kartengraph-ueberarbeitung.md
git commit -m "docs: Befund zum Lauf und zum Tooltip des Terpen-Bands"
```

### Task E1: Der Lauf wird nahtlos

**Files:**
- Modify: `components/story/TerpenBandKopie.tsx`
- Modify: `app/globals.css:1841-1876`
- Test: `tests/terpen-register.test.ts`

**Interfaces:**
- Produces: die Spur enthält so viele Kacheln, dass eine Kachel breiter ist als das Fenster; die Animation verschiebt um genau eine Kachelbreite.

- [ ] **Step 1: Failing test schreiben**

```ts
test("Terpen-Band läuft nahtlos: genug Kacheln und Verschiebung um eine Kachel (Nutzer 2026-10-03)", () => {
  const kopie = readFileSync(join(process.cwd(), "components/story/TerpenBandKopie.tsx"), "utf8");
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  // So viele Kopien, dass eine Kachel das Fenster überragt; vorher war es genau eine.
  assert.match(kopie, /kacheln|while \(/);
  // Die Verschiebung hängt an der gemessenen Kachelbreite, nicht an 50 % der Spur.
  assert.match(css, /--band-kachel/);
  assert.doesNotMatch(css, /@keyframes terpen-band\s*\{\s*to\s*\{\s*translate: -50% 0;/);
});
```

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "läuft nahtlos"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

`TerpenBandKopie` klont die Quellliste nicht einmal, sondern so oft, dass die Summe der Kachelbreiten mindestens das Doppelte der Fensterbreite erreicht, und setzt `--band-kachel` auf die gemessene Breite einer Kachel. Die Animation verschiebt um `calc(-1 * var(--band-kachel))`:

```css
@keyframes terpen-band {
  to {
    translate: calc(-1 * var(--band-kachel)) 0;
  }
}
```

Der Kommentar nennt den Grund: `-50%` war nur dann nahtlos, wenn genau zwei gleich breite Kacheln standen und eine das Fenster überragte; bei schmalen Katalogen lief sichtbar Leere durch (Nutzer 2026-10-03).

- [ ] **Step 4: Tests laufen lassen**

Run: `npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: das Terpen-Band läuft ohne Lücken durch"
```

### Task E2: Hohes Band mit den Infos im Band

**Files:**
- Modify: `components/story/TerpenBand.tsx`
- Modify: `app/globals.css` (Bandhöhe)
- Test: `tests/terpen-register.test.ts`

- [ ] **Step 1: Failing test schreiben**

```ts
test("Terpen-Band trägt seine Infos im Band, ausgegraut, ohne Tooltip (Nutzer 2026-10-03)", () => {
  const band = readFileSync(join(process.cwd(), "components/story/TerpenBand.tsx"), "utf8");
  // Kein aufklappender Tooltip mehr: die Infos sind sichtbarer Inhalt.
  assert.doesNotMatch(band, /role="tooltip"/);
  assert.doesNotMatch(band, /aria-describedby/);
  // Im Ruhezustand gedämpft, beim Überfahren in voller Lesbarkeit.
  assert.match(band, /text-text-muted[\s\S]{0,200}group-hover:text-text/);
  // Nur Web: mobil bleibt das schmale Icon-Band.
  assert.match(band, /max-sm:hidden/);
});
```

- [ ] **Step 2: Test laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "trägt seine Infos im Band"`
Expected: FAIL.

- [ ] **Step 3: Umsetzen**

Je Terpen steht im `li` neben dem Icon eine Spalte mit Name, Duft und den Geschmacksnoten samt Farbpunkt und Anteilsbalken — derselbe Inhalt wie bisher im Tooltip, nur ohne absolute Tafel. Die Spalte trägt `max-sm:hidden`, damit Mobil unverändert bleibt. Im Ruhezustand `text-text-muted` und gedämpfte Balken (`opacity-60`), beim Überfahren `group-hover:text-text` und volle Deckkraft. Das Band wird 2,5-mal so hoch: aus `py-4` wird eine Höhe um 195 px, der Skelett-Platzhalter wächst entsprechend von `h-20` auf dasselbe Maß, damit beim Laden nichts springt.

- [ ] **Step 4: Tests, Typen, Lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit, Push, Live prüfen, Safe 4 Clear**

```bash
git add -A
git commit -m "feat: das Terpen-Band ist hoch und trägt seine Infos selbst"
git push origin main
```

Live prüfen: Startseite auf dem Desktop (Band hoch, Infos ausgegraut, Hover betont sie, Lauf ohne Lücken) und auf 390 px Breite (unverändert schmal). Danach `HANDOFF.md`, Push, kurze Info, Clear.

---

# Strang F — Wortmarke im Hero mobil

Punkt 10 der Spec.

### Task F1: Untergrenze der Plakatschrift senken, Seitenrand erhöhen

**Files:**
- Modify: `app/globals.css:90`
- Modify: `components/story/Auftakt.tsx:58`
- Test: `tests/marke.test.ts`

- [ ] **Step 1: Failing test schreiben**

```ts
test("Plakatschrift skaliert auf Telefonen mit, statt an der Untergrenze zu kleben (Nutzer 2026-10-03)", () => {
  // Bei 360 px Breite muss die Wortmarke samt Seitenrand in die Zeile passen.
  const treffer = css.match(/--text-plakat:\s*clamp\((\d+(?:\.\d+)?)rem,/);
  assert.ok(treffer, "clamp für --text-plakat gefunden");
  assert.ok(Number(treffer![1]) <= 4, `Untergrenze ${treffer![1]}rem ist für 360 px zu groß`);
});

test("Der Hero hält mobil Abstand zum Displayrand", () => {
  const auftakt = lies("components/story/Auftakt.tsx");
  assert.doesNotMatch(auftakt, /flex-\[2\] flex-col items-center justify-center gap-4 px-4 /);
  assert.match(auftakt, /px-6 /);
});
```

- [ ] **Step 2: Tests laufen lassen, Fehler sehen**

Run: `npm test -- --test-name-pattern "Plakatschrift skaliert|Abstand zum Displayrand"`
Expected: FAIL, die Untergrenze steht auf `6rem`.

- [ ] **Step 3: Umsetzen**

```css
  /* Untergrenze seit 2026-10-03 kleiner (Nutzer: die Wortmarke klebte mobil am Displayrand).
     Bei 390 px Breite ergab 1rem + 15vw rund 74 px, die alte Untergrenze von 6rem griff
     also auf jedem Telefon und machte die Schrift breiter als den Platz. */
  --text-plakat: clamp(3.5rem, 1rem + 15vw, 22rem);
```

Im Auftakt den Seitenrand der Wortmarken-Gruppe von `px-4` auf `px-6` heben, `sm:px-8` bleibt.

- [ ] **Step 4: Tests, Typen, Lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit, Push, Live prüfen, Safe 4 Clear**

```bash
git add -A
git commit -m "fix: die Wortmarke im Hero hält mobil Abstand zum Displayrand"
git push origin main
```

Live prüfen bei 320, 360, 390 und 430 px: links und rechts sichtbarer Abstand, die Wortmarke einzeilig, die Konturen ohne Überstand. Danach `HANDOFF.md`, Push, kurze Info, Clear.

---

## Befunde

### Befund A0 — 2026-10-05, live auf https://cn-medcan.w-helwich.workers.dev/

Gemessen im Browser bei 1714 px und bei 878 px Fensterbreite, hinter dem Seitenpasswort.

1. **Der Soll-Strich ist da.** Die Karte der Startseite trägt `data-schicht`-Elemente in drei
   Schichten: `linie` 7, `balken` 10, **`soll` 10**. Punkt 1 der Spec ist damit belegt: je
   Geschmacksachse ein Strich der Herstellerangabe.
2. **Die Infotafel steht im Fluss.** Ihr Container trägt `grid min-h-80 justify-items-center
   sm:min-h-56`, `position: static`, und reserviert gemessene **224 px**. Bei 1714 px überlagert
   sie bereits (der `lg:`-Zweig greift), dort springt nichts — der Sprung betrifft Breiten unter
   1024 px, wo der reservierte Platz im Fluss liegt und der Inhalt darüber hinauswächst.
3. **Die Treffflächen sind ungleich verteilt.** In der Anzeige gibt es rechts nur **2** echte
   Schaltflächen (die zwei Terpene der Sorte), links für die zehn Geschmacksachsen gar keine
   HTML-Fläche, sondern nur SVG-`rect`s. Der Hover auf eine Achse wechselt die Tafel
   (gelesen: „Geschmacksrichtung Süß, Laut Hersteller 3,4, Laut Community 4,5"), der Hover
   neben die schmale Terpenzeile nicht. Punkt 9 der Spec ist damit belegt: die Flächen hängen
   an `regler` und `terpenRegler` und fehlen dort, wo keine Maske läuft.

### Befund E0 — 2026-10-05, live auf derselben Seite

1. **Die Lücke ist eine Rechenlücke.** Fensterbreite **1714 px**, eine Kachel des Bands
   **1012 px**, zwei Kacheln zusammen 2024 px, Animation `terpen-band` über 60 s mit
   `translate: -50%`. Die Verschiebung um 1012 px ist für sich korrekt, aber die Kachel ist
   schmaler als das Fenster: nach ihr klaffen **1714 − 1012 = 702 px Leere**. Nahtlos wird der
   Lauf erst, wenn eine Kachel mindestens so breit ist wie das Fenster.
2. **Der Hover zeigt nichts, weil er die stumme Kopie trifft.** Beim Überfahren eines Icons
   meldet die Seite `spurGehovert: true` und genau ein gehovertes `li` — dieses `li` liegt aber
   in der Klon-Kachel (`aria-hidden="true"`), und `TerpenBandKopie` entfernt beim Klonen
   `[role="tooltip"]`. Gemessen: `gehovertTooltip: "keiner"`. Die Originalkachel läuft nach
   links aus dem Bild, im sichtbaren Fenster steht über weite Strecken nur die tooltip-freie
   Kopie. Der Tooltip der Originalzeile existiert (288 px breit), bleibt aber `visibility:
   hidden`, weil nie ihr `li` gehovert wird.
3. **Der Klick ist nicht vorgesehen.** Es öffnen nur `:hover` und `:focus-within`, und
   `tabIndex={0}` auf einem `span` bekommt beim Mausklick keinen Fokus.

**Folge für den Plan:** Die neue Form aus Punkt 8 der Spec — die Infos stehen im Band statt in
einer Tafel — behebt 2 und 3 an der Wurzel, weil die Infos dann Teil des geklonten Inhalts
sind. Wichtig dabei: `TerpenBandKopie` darf die Infospalte **nicht** mit entfernen, anders als
heute den Tooltip. Nur `id`, `tabindex` und `aria-describedby` dürfen weiter fallen.
