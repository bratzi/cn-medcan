---
name: ui-design-engine
description: Design-System-Regelwerk "8px-Grid & Premium-Ästhetik" für diesen Medizinalcannabis-Produktkatalog. Greift immer beim Bauen oder Ändern von UI-Komponenten, Seiten, Layouts oder Styles in diesem Projekt (alles unter app/** und components/**, sowie app/globals.css) — also bei jeder Arbeit an Spacing, Typografie, Farbe, Motion, Zuständen, Badges oder Barrierefreiheit. Definiert die verbindlichen Tokens und die Abschluss-Checkliste.
---

# UI Design Engine — 8px-Grid & Premium-Ästhetik

Verbindliches Regelwerk für alle UI-Arbeiten in diesem Projekt. Domäne: Produktkatalog
für den deutschen Medizinalcannabis-Markt (BfArM-Handelsnamen, Apotheken-Bestände).
Anmutung: seriös, klinisch, vertrauenswürdig — wie ein Fachinformationssystem, nicht
wie ein Lifestyle-Shop. Keine Freizeit-/Weed-Ästhetik, kein Grün als Hauptfarbe.

Für allgemeine Frontend-Qualität (Komponentenstruktur, State-Handling, Semantik,
Performance, Craft) gilt zusätzlich das Skill `frontend-design`. Dessen Inhalt wird
hier nicht dupliziert — er wird vorausgesetzt. Bei Konflikten in Fragen von Spacing,
Farbe, Motion oder Tokens hat dieses Regelwerk Vorrang.

Die Tokens sind in `app/globals.css` (Tailwind v4, CSS-first via `@theme`)
implementiert. Es gibt keine `tailwind.config.js`. Wer ein Token braucht, das dort
fehlt, ergänzt es in `@theme` — und erfindet es nicht in der Komponente.

## 1. 8px-Grid

- Jeder Spacing-Wert (padding, margin, gap, Abstände in Grid/Flex) ist ein
  Vielfaches von 8px. Erlaubte Leiter: 8, 16, 24, 32, 40, 48, 64, 80, 96, 128.
- **4px** ist die einzige erlaubte Ausnahme und ausschließlich als optische
  Korrektur *innerhalb* eines zusammengehörigen Icon/Text-Paares oder
  Label/Wert-Paares zulässig (z. B. `gap-1` zwischen Icon und Badge-Text).
  Begründungspflicht: ein Kommentar im Code oder ein Satz in der Antwort, warum
  8px hier optisch falsch wäre. Ohne Begründung ist 4px ein Fehler.
- Verboten: Ad-hoc-Pixelwerte und arbitrary values wie `p-[13px]`,
  `mt-[7px]`, `w-[327px]`, `gap-[10px]`, inline `style={{ padding: 13 }}`.
  Auch `p-3` (12px) und `p-5` (20px) sind verboten, weil sie das Grid brechen.
- Verwendete Tailwind-Utilities müssen auf die Token-Leiter fallen:
  `p-2` = 8px, `p-4` = 16px, `p-6` = 24px, `p-8` = 32px, `p-12` = 48px,
  `p-16` = 64px. (Basis: `--spacing: 4px`, also durchgehend gerade Zahlen.)
- Hairlines (Border 1px) und Fokusring-Breiten sind kein Spacing und vom Grid
  ausgenommen.
- Container-Maxbreite und Sektionsrhythmus ebenfalls aus der Leiter:
  Sektionsabstand vertikal 64px (Desktop) / 40px (Mobil).

## 2. Typografie

Modulare Skala, Ratio **1.25**, Basis 16px. Zeilenhöhen auf die 8px-Baseline
gerundet.

| Stufe | Token | Größe | Zeilenhöhe | Gewicht | Einsatz |
|---|---|---|---|---|---|
| Display | `text-display` | 39px | 48px | 600 | Nur Hero der Startseite, max. 1x pro Seite |
| H1 | `text-h1` | 31px | 40px | 600 | Seitentitel (Produktname, Kategorie) |
| H2 | `text-h2` | 25px | 32px | 600 | Sektionsüberschrift |
| H3 | `text-h3` | 20px | 28px* | 600 | Kartentitel, Untersektion |
| Body | `text-body` | 16px | 24px | 400 | Fließtext, Fachinfo, Tabellenzellen |
| Body-strong | `text-body` + `font-medium` | 16px | 24px | 500 | Werte, betonte Labels |
| Small | `text-small` | 14px | 20px* | 400 | Metadaten, Hilfetexte, Tabellenkopf |
| Caption | `text-caption` | 13px | 16px | 500 | Badges, Einheiten, Rechtshinweise |

\* 28px und 20px sind bewusste Halbschritte (4px-Raster) für kompakte Zeilen;
sie sind Tokens und brauchen keine Extra-Begründung.

Regeln:
- Maximal drei Schriftgrade pro Bildschirm-Sektion. Hierarchie entsteht durch
  Größe und Gewicht, nicht durch Farbwechsel.
- Gewichte nur 400 / 500 / 600. Kein 700+, kein 300.
- Zeilenlänge Fließtext 60–80 Zeichen (`max-w-[68ch]` ist als Lesbarkeitsmaß
  erlaubt, da es kein Spacing-Wert ist).
- Zahlen, Mengen, Cannabinoid-Werte und Preise in `font-mono` mit
  `tabular-nums`, damit Tabellenspalten ausrichten.
- Keine Versalien-Ketten außer bei `text-caption` (Label), dann mit
  `tracking-wide`.

## 3. Farbe

Ein Neutral-Ramp plus **genau ein** Akzent. Alles in OKLCH.

- Neutral: `--color-neutral-0` … `--color-neutral-1000` (kühl-neutral, Hue 250,
  Chroma ≤ 0.02) — trägt 95 % der Fläche.
- Akzent: **klinisches Tiefblau**, `oklch(0.52 0.11 240)`. Begründung:
  Blau ist im deutschen Medizin- und Apothekenkontext die Farbe von Fachinfo und
  Vertrauen, hat keinen Cannabis-Bezug und bleibt neben Zahlen und Tabellen ruhig.
  Grün ist als Haupt- oder Markenfarbe verboten und erscheint nur als
  `success`-Status.
- Status: `danger` (rot), `warning` (amber), `success` (gedämpftes Grün) —
  ausschließlich für Zustände, niemals als Dekor oder Markenfarbe.

**Semantische Tokens.** Komponenten benutzen nur diese, niemals Rohfarben
(`--color-neutral-700`, Hex, direktes `oklch(...)`) und niemals Tailwind-
Standardpaletten (`bg-slate-800`, `text-blue-600`):

| Token | Bedeutung |
|---|---|
| `surface` | Seitenhintergrund |
| `surface-raised` | Karte, Panel, Popover, Tabellenkopf |
| `border` | Hairlines, Trenner, Input-Rahmen |
| `text` | Primärtext |
| `text-muted` | Sekundärtext, Metadaten, Platzhalter |
| `accent` | Interaktive Primärfläche, Links, aktiver Zustand |
| `accent-fg` | Text/Icon auf `accent` |
| `danger` / `warning` / `success` | Statusfarben (+ `-fg` für Text darauf) |

Nutzung in Tailwind: `bg-surface-raised`, `text-text-muted`, `border-border`,
`bg-accent text-accent-fg`.

**Dark Mode** wird in `app/globals.css` zweifach definiert:
`@media (prefers-color-scheme: dark)` — gegated mit `:root:not([data-theme="light"])`
— und `:root[data-theme="dark"]` für die explizite Umschaltung. Komponenten
enthalten deshalb **keine** `dark:`-Varianten für Farben; sie nutzen nur die
semantischen Tokens und funktionieren in beiden Themes automatisch.

## 4. Anti-"AI-Look"

Diese Muster sind in diesem Projekt verboten:

- Kein Purple-Blue-Gradient und kein Gradient als Default-Hintergrund für Hero,
  Button oder Karte. Gradienten nur, wenn sie eine Information tragen (z. B. ein
  Wertebereichs-Balken), und dann aus Tokens.
- Keine dekorativen Emoji in der UI — nicht in Buttons, Headings, Badges,
  leeren Zuständen oder Fließtext. Icons sind SVG.
- Kein Glassmorphism (`backdrop-blur`, halbtransparente Karten) ohne Funktion.
  Erlaubt nur dort, wo tatsächlich Inhalt durchscheint und das Verdecken
  kommuniziert werden muss (Sticky-Header über scrollendem Inhalt).
- Hierarchie über Größe und Gewicht, nicht über Farbe. Farbe markiert
  Interaktion und Status — sonst nichts.
- Border-Radius konsistent aus Token: `--radius-sm` (4px) für Badges/Inputs,
  `--radius-md` (8px) für Karten/Buttons, `--radius-lg` (12px) für Dialoge,
  `--radius-full` nur für Avatare/Punkte. Keine gemischten Radien an einem
  Element, keine `rounded-3xl`-Blobs.
- Schatten sparsam und ausschließlich als Elevation-Signal: `--shadow-sm` für
  ruhende Karten, `--shadow-md` für Popover/Dropdown, `--shadow-lg` für Modal.
  Flächen auf derselben Ebene haben keinen Schatten — sie werden durch
  `border` und `surface-raised` getrennt.
- Keine zentrierten Textwüsten, keine 3-Karten-Feature-Grids ohne Inhalt, keine
  "Trusted by"-Attrappen.

## 5. Motion

- Dauer 150–250 ms. Hover/Fokus 150 ms, Ein-/Ausblenden von Panels 200 ms,
  Layout- und Positionswechsel 250 ms. Nichts darüber, nichts unter 100 ms.
- Easing nur aus Tokens: `--ease-standard` (Standardübergänge),
  `--ease-out` (Einblenden/Eintreten), `--ease-in` (Ausblenden/Verlassen).
- Animiert werden nur `opacity` und `transform`. Kein Animieren von `height`,
  `top` oder Farben großer Flächen.
- Keine Auto-Play-Loops, kein Parallax, kein Scroll-Hijacking.
- `prefers-reduced-motion: reduce` wird global respektiert (Regel steht in
  `app/globals.css`). Eine Komponente, deren Verständlichkeit von einer
  Animation abhängt, ist falsch gebaut.

## 6. Barrierefreiheit (Pflicht, nicht optional)

- Textkontrast ≥ 4.5:1 (Fließtext, Labels, Badge-Text), ≥ 3:1 für
  Grafik/Rahmen und für Text ab 25px/600. `text-muted` darf nur für Text
  verwendet werden, der diesen Wert auf seinem tatsächlichen Untergrund erfüllt.
- Sichtbarer Fokusring über `:focus-visible` — global definiert, wird nie mit
  `outline: none` entfernt. Fokus muss auf `surface` und `surface-raised`
  sichtbar sein.
- Touch-Targets ≥ 44 × 44px. Kleine Icons bekommen Padding aus der 8px-Leiter,
  bis 44px erreicht sind (z. B. 16px Icon + 2 × 16px Padding = 48px).
- Jedes Formularfeld hat ein `<label for>`. `placeholder` ist kein Label.
  Fehlertexte per `aria-describedby`, Fehlerzustand nicht nur farblich.
- Kein Status nur über Farbe. Immer zusätzlich Text oder Icon.
- Interaktive Elemente sind `button` / `a` / `input` — kein `div` mit onClick.
- Tabellen mit `<caption>` und `<th scope>`; Dokumentsprache ist `de`.

## 7. Domänenspezifische Regeln

- **Verfügbarkeits-Badges** ("Auf Lager", "Nicht lieferbar", "Lieferbar in
  2–3 Tagen") tragen immer den Klartext. Der Farbwert (`success` / `warning` /
  `danger`) ist redundante Zusatzinformation. Zusätzlich ein Icon- oder
  Punkt-Marker mit unterscheidbarer Form, nicht nur Farbe. In Graustufen
  gedruckt muss die Aussage erhalten bleiben.
- **Cannabinoid-Wertebereiche** (THC/CBD) werden als Zahlenbereich mit Einheit
  ausgegeben: `18,0–22,0 % THC`. Ein farbiger Balken darf den Bereich
  visualisieren, ersetzt aber nie die Zahl. Keine Farbskala "hoch/niedrig" als
  einzige Information, kein Ampel-Rating für Wirkstärke.
- **Zahlenformatierung immer de-DE**: Dezimalkomma, Tausenderpunkt, Einheit mit
  schmalem Abstand. Über `new Intl.NumberFormat("de-DE", …)` bzw.
  `toLocaleString("de-DE")` — niemals manuelles String-Ersetzen. Preise mit
  `Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })`,
  Datumsangaben mit `Intl.DateTimeFormat("de-DE")`.
- Handelsnamen und Darreichungsformen werden nie gekürzt oder "schöner"
  umbenannt; sie stehen so, wie sie aus den Daten kommen (`title`-Attribut und
  Umbruch statt Ellipse, wo es geht).
- Keine werbliche Sprache, keine Wirkversprechen, keine Anwendungsempfehlungen.
  Neutrale, katalogartige Formulierungen.

## 8. Checkliste vor Abschluss einer UI-Aufgabe

1. Alle Spacing-Werte auf der 8px-Leiter? Jedes 4px begründet?
2. Keine arbitrary values (`[13px]`), kein inline `style` mit Pixeln?
3. Nur Typo-Stufen aus der Tabelle, max. drei pro Sektion, Gewichte 400/500/600?
4. Nur semantische Farbtokens — keine Rohfarben, keine `bg-slate-*`, keine
   `dark:`-Farbvarianten?
5. Light **und** Dark geprüft (`prefers-color-scheme` und `[data-theme="dark"]`)?
6. Textkontrast ≥ 4.5:1 geprüft, insbesondere `text-muted` und Badge-Text?
7. `:focus-visible` an jedem interaktiven Element sichtbar, nirgends
   `outline: none`?
8. Touch-Targets ≥ 44px?
9. Jedes Formularfeld mit `<label>`, Fehler nicht nur farblich?
10. Radius und Schatten aus Tokens, Schatten nur als Elevation?
11. Kein Gradient-Default, keine Emoji, kein funktionsloses Glassmorphism?
12. Transitions 150–250 ms, Easing-Token, `prefers-reduced-motion` ok?
13. Status-Badges und Cannabinoid-Werte ohne Farbe lesbar?
14. Alle Zahlen, Preise und Daten de-DE formatiert?
15. Qualitätskriterien des Skills `frontend-design` ebenfalls erfüllt?
