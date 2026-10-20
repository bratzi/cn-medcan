# Strain-Seite /blueten agenturreif — Design

Stand 2026-10-21 (Session 85). Auftrag Nutzer: „Sortierung und Filter sind ugly af“, ganze Seite auf Agenturniveau.

## Entscheidungen des Nutzers
- Filter am Desktop als schlanke Chipleiste mit Popovern, keine Seitenspalte. Ersetzt die frühere Festlegung
  „Filterspalte offen ab 1536 px“.
- Umfang: Seite komplett neu denken (Kopf, Werkzeugleiste, Filter, Sortierung, Karten). Startseite zieht bei Karten mit.
- Sortierung als Segment-Schalter.
- Seitenkopf (components/layout/Kopf.tsx) volle Breite: Logo links, Menü und Konto rechts. Gilt seitenweit.

## Aufbau
1. **Seitenkopf global:** `max-w-360` entfällt, Raster `auto 1fr auto` wird zu Logo links, Navigation und Konto
   rechtsbündig. Mobil unverändert (Logo mittig, Konto rechts).
2. **Kopf /blueten:** Titel „Strains“, darunter Suchfeld volle Inhaltsbreite. Trefferzahl daneben, Zahl im
   Handschrift-Akzent, Wort normal.
3. **Werkzeugleiste, sticky unter dem Seitenkopf:**
   - Ansicht als Segment „Blüten | Handelsnamen“.
   - Chipleiste: Community-Note, Terpene, Geschmack, Typ, THC/CBD, Vertreiber, Form, Verfügbarkeit, „Mehr“
     (Apotheke, Höchstpreis). Chip zeigt Zahl aktiver Werte. Klick öffnet Popover mit dem bisherigen Feldinhalt
     aus FilterFelder (Gruppen werden zu einzelnen Feld-Komponenten zerlegt).
   - Sortierung als Segment: Community, Stimmen, Neueste, THC. Weitere (Name, THC aufsteigend, Preis, Relevanz)
     im „…“-Menü. Bei Suchtext ist Relevanz Standard.
4. **Aktiv-Zeile:** gesetzte Filter als entfernbare Chips, dazu „Alle zurücksetzen“. Nur sichtbar, wenn Filter aktiv.
5. **Mobil (< lg):** Chipleiste waagerecht scrollbar, Chip öffnet Bottom-Sheet mit demselben Feldinhalt.
   Sortierung als eigener Chip mit Sheet. MobilLeiste und FilterSchublade entfallen.
6. **Raster:** volle Breite, 2/3/4/5 Spalten. Karte neu gewichtet: Name, Community-Note, Terpen-Punkte, THC.
   Startseite nutzt dieselbe Karte und zieht mit.

## Technik
- Reiner Client-Zustand, URL bleibt Quelle (StrainFilter). Keine neue Bibliothek, kein CPU-Mehraufwand im Worker.
- Popover/Sheet: Fokus hinein, Esc schließt, Fokus zurück auf Chip, `aria-expanded`/`aria-controls`, Klick außen schließt.
- Entfernen: `lib/katalog/filterspalte.ts`, `.katalog-filterspalte` und `.katalog-filterknopf` in app/globals.css,
  MobilLeiste, FilterSchublade.
- Wording: Blüte/Strain, Variante. Nie „Ware“, nie „Stärke“ in sichtbaren Texten.
- Touch-Ziele 44 px, 8-px-Raster, Tokens aus ui-design-engine.

## Ablauf
Live per Browser-JS prototypen, Nutzer zeigen, dann Plan mit parallelen Strängen (Kopf global, Werkzeugleiste
und Filter, Karten und Startseite), ein Push, Live-Prüfung als eigener Agent.

## Prüfung
Tests für Chip-Zähler, Aktiv-Zeile, Sortier-Segment und Mehr-Menü. Live: 390/1280/1536/1920 hell/dunkel,
kein waagerechter Überlauf, Tastaturbedienung der Popover.
