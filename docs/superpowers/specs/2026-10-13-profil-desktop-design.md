# Profil am Desktop neu anordnen, Kopfleiste mit Fläche

**Datum:** 2026-10-13 (Session 56)
**Status:** Entwurf, Grundsatzentscheidungen vom Nutzer bestätigt
**Teilprojekt B** von zwei (A: `2026-10-13-vertreiber-bewertung-design.md`), parallel umsetzbar.

## Ziel

Der Nutzer (2026-10-13): Der Aufbau des Profils gefällt nicht. Der Kopf mit dem Hintergrund und der
freigestellten Blüte sieht hässlich aus. Das Menü ohne Fläche wirkt verloren und am PC nicht
professionell. Mobil passt es eher. Die einzelnen Elemente sind in Ordnung, die Anordnung sieht
nicht wie ein Profil aus.

## Befund (Kritik der Komposition, live bei 2296 und 1146 px)

- **Balance:** Das blasse Riesenwort „dein Geschmack“ und die Blüte rechts tragen das Gewicht.
  Avatar und Name sind klein links oben, die vier Zahlen verteilen sich mit Lücken über 10 Spalten.
- **Raster:** Kopfleiste in `max-w-360` (1440 px), Profilinhalt von Rand zu Rand. Das Menü liegt
  ohne Fläche auf den Rasterlinien.
- **Gruppierung:** Identität (Avatar, Name, Rolle, Zahlen) bildet keinen Block. Gleich gewichtete
  Felder stapeln sich untereinander.
- **Leerraum:** „Deine Spur“ nimmt die volle Breite für wenige Balken.

## Entscheidungen (Nutzer, 2026-10-13)

1. **Seitenleiste:** links eine feste Identitätsspalte, rechts Inhalt mit Reitern (Muster GitHub,
   Letterboxd). Mobil bleibt einspaltig.
2. **Kopfleiste auf allen Seiten** mit Fläche und Linie, auf derselben Breite wie der Inhalt. Die
   Startseite behält im Hero den durchsichtigen Kopf.

## Kopfleiste (alle Seiten)

- Heute ist der Kopf (`.kopf` in `app/globals.css`) oben durchsichtig und bekommt erst mit
  `data-gescrollt` Fläche und Unschärfe. Neu: die Fläche gilt immer, dazu eine untere Linie
  `border-b border-border`. Breite bleibt `max-w-360`, der Inhalt der Seiten zieht auf dieselbe Breite.
- Ausnahme Startseite: oben über dem Hero bleibt der Kopf durchsichtig wie heute (Attribut am
  `header` nur auf `/`, die bestehende Scroll-Regel schaltet die Fläche zu).
- Die schwebende Symbolleiste rechts rückt in den Inhaltsrahmen statt an den Fensterrand.

## Profil ab 1080 px

Rahmen `max-w-360 mx-auto`, Raster `grid-cols-[20rem_1fr]` mit `gap-12`.

**Seitenleiste** (`components/profil/ProfilSeitenleiste.tsx`, `sticky top-<Kopfhöhe>`):
- Avatar 128 px (Größe `lg`), Name in Buchschrift (`text-h1`), Rolle als Badge, „dabei seit <Monat Jahr>“.
- Die vier Zahlen als 2×2-Raster: Zahl gedruckt, Wort von Hand darunter (bestehende
  `Randnotizen`, neue Variante `kompakt` mit fester Spaltenbreite).
- Zwei liebste Aromen als Chips mit Icon.
- Aktion „Blüte bewerten“ (Primärknopf) und bei eigenem Profil „Profil bearbeiten“ (Link auf
  `/mitglied`).
- Kein Hintergrundwort, keine freigestellte Blüte, kein Rasterhintergrund in der Spalte.

**Reiter** über dem Inhalt, als Links mit `?ansicht=` (Server rendert nur den gewählten Reiter,
spart Abfragen und CPU; ohne JS voll bedienbar; `aria-current="page"` am aktiven Reiter):
- **Übersicht** (Standard): Aroma-Netz (links, 7 von 12 Spalten) neben Top und Flop (5 Spalten);
  darunter Deine Spur kompakt (nur Monate ab der ersten Bewertung, höchstens 12) neben Deine Noten.
- **Aromen:** Aroma-Netz groß mit Zeitleiste, darunter „Ähnlich im Aroma“.
- **Bewertungen:** Bewertungsregister.
- **Vertreiber:** Deine Vertreiber (aus Teilprojekt A, bis dahin „Deine Hersteller“), Deine
  Schnitte, Du und die Community.

Die Feldköpfe bleiben (Vermerk in Versalien, Buchschrift mit Handwort), in Reitern eine Stufe
kleiner (`text-h2` statt `text-display`), damit zwei Felder nebeneinander passen.

## Profil unter 1080 px

Seitenleiste wird zum Kopfblock über den Reitern (Avatar 96 px neben Name, Zahlen in einer Reihe
von vier). Reiter als waagerecht scrollbare Leiste. Felder untereinander wie heute.

## Öffentliches Profil

`/profil/[kurzId]` nutzt dieselbe Seitenleiste und dieselben Reiter. Private Felder (Schnitte mit
Wirkung, Community-Vergleich) entfallen dort wie heute; ein Reiter ohne Inhalt entfällt.

## Was entfällt

- `Kapitelkopf` auf `/profil` und `/profil/[kurzId]` (Hintergrundwort „dein Geschmack“,
  Freisteller-Blüte, Tiefenebene). `/mitglied` nutzt ihn weiter und bleibt unverändert.
- Rasterlinien als Seitenhintergrund im Profil (die Felder sind Flächen).

## Abhängigkeit zu Teilprojekt A

Nur das Feld „Deine Hersteller/Vertreiber“ ist gemeinsam. B setzt die bestehende Komponente in den
Reiter Vertreiber. A benennt Komponente, Texte und Daten um. Wer zuletzt merged, gleicht den Import an.

## Design-Skills (Memory `design-skills-einsatz`)

Umsetzung mit `frontend-design`, `better-layout`, `better-typography`, Regelwerk
`ui-design-engine`. Abschluss mit `critique-composition`, `critique-visual-hierarchy` und
`better-interface` an Live-Screenshots bei 1440 px, 1146 px und 494 px, hell und dunkel.

## Tests

- Komponenten: Seitenleiste (Zahlen, Rolle, Aktionen, eigenes und fremdes Profil), Reiter
  (aktiver Reiter, `aria-current`, nur ein Reiter gerendert, leerer Reiter entfällt).
- Seite: `?ansicht=` unbekannt fällt auf Übersicht zurück.
- Kopf: Fläche und Linie außer im Hero der Startseite.
- Live per Browser-MCP nach dem Push: kein Querscroll, Sticky-Spalte, Reiterwechsel, Fokusreihenfolge.

## Nicht in diesem Teilprojekt

- Neue Inhalte im Profil (Likes, Folgen).
- Umbau der Konto-Seite `/mitglied`, außer dass sie die neue Kopfleiste erbt.
