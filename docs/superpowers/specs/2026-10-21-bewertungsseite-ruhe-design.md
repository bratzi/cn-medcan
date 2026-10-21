# Bewertungsseite ruhiger, Hersteller-Logos, Strain-Feinschliff — Design

Stand 2026-10-21 (Session 86). Feedback Nutzer nach dem Umbau der Strain-Liste, mit Screenshots.

## 1. Strain-Seite /blueten/[slug] (app/[lang]/blueten/[slug]/page.tsx)

**Reihenfolge neu (Nutzer):**
1. Strain (Titelblatt, Name, Note)
2. Angaben zum Strain (Fakten, Cannabinoide, Terpenprofil)
3. Auswahl Hersteller/Vertreiber als **waagerechte Leiste mit Logo-Karten** (ersetzt WareWahlFeld-Block
   „Deine Blüte ist von …“, der wie eine eigene Sektion wirkte). Karte = Logo + Name, wählbar
   (`aria-pressed`), waagerecht scrollbar, 44-px-Ziele. Unbekanntes Logo: Initialen-Marke.
4. Die Wertung (BewertungsFormular, AromaErkundung)
5. Bereits abgegebene Bewertungen (BewertungsBuch, „das Buch“)
6. Rest (Ähnliche, Chargen)

**Textrauschen:** Lange Erklärtexte im Formular und in der Erkundung (Beispiele: „Nähe zur
Datenblattangabe … Zieh die lila Punkte …“, „Laut Hersteller enthaltene Terpene …“, „Der Score des
Strains fasst …“, „Wird im Browser auf höchstens 1280 Pixel …“, „Erst das Overall, dann die Terpz …“)
wandern hinter **Info-Knöpfe** (ⓘ, 44 px Trefferfläche, Popover per Klick/Tastatur, Esc schließt,
`aria-expanded`). Position: direkt neben der Überschrift oder dem Feldlabel, zu dem der Text gehört.
Sichtbar bleibt höchstens ein kurzer Satz, wo er die Bedienung trägt. Eine gemeinsame Komponente
`components/ui/InfoKnopf.tsx`.

## 2. Hersteller-Logos

- Logos aus dem Netz holen (offizielle Website/Presse-Kit der Hersteller), als SVG/PNG/WebP unter
  `public/marken/hersteller/<id-oder-slug>.<ext>` ablegen, klein (≤ 30 KB, max 256 px). Nur Kennzeichnung
  des Herstellers, keine Bearbeitung des Logos.
- Feld `logoPfad String?` an `Unternehmen` (Prisma + D1-Migration). Leer: Initialen-Marke.
- Kein R2, nichts Kostenpflichtiges.

## 3. Admin

- Neuer Bereich `admin/hersteller`: Liste der Unternehmen, Logo setzen (Pfad aus public oder Upload,
  im Browser auf ≤ 256 px WebP verkleinert, Ablage wie Bewertungsbilder, ohne R2), Name/Website pflegen.
- Neuer Bereich `admin/strains`: Strain-Stammdaten bearbeiten (Handelsname, Kultivar, Vertreiber,
  Typ, THC/CBD, Terpene, Form, aktiv). Nur ADMIN.

## 4. Strain-Liste /blueten

- Sortierung in beide Richtungen: aktiver Segment-Knopf ein zweites Mal geklickt dreht die Richtung
  (Pfeil ↑/↓ am Knopf, `aria-label` nennt Richtung). URL-Parameter `richtung=auf|ab`, Standard je
  Sortierung wie bisher.
- Karte: Note (Handschrift-Zahl) und Blätter auf einer Linie (gemeinsame Grundlinie/Mitte).
- Zahl der Bewertungen je Strain sichtbarer und besser platziert: direkt neben/unter der Note als
  klarer Zähler („12 Stimmen“), nicht klein und abgesetzt. Karte nach Layout und UX weiter optimieren.

## 5. Startseite, Kapitel

Nutzer: Kapitel zeigt nicht die zuletzt bewertete, sondern die zum gegebenen Zeitpunkt bewertete
(„Stand zum Zeitpunkt“, eingefroren). Genaue Stelle vor Umsetzung mit Nutzer am Screenshot klären.

## Regeln

ui-design-engine, Wording Blüte/Strain, Variante; nie „Ware“, nie „Stärke“. Kein CPU-Mehraufwand im
Worker. Live prototypen, zeigen, dann coden; ein Push; Live-Prüfung als eigener Agent.
