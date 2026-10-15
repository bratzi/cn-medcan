# Instagram als Produktmarke – Design

Stand 2026-10-15, freigegeben vom Betreiber.

## Ziel

@bookofterpz wird vom Bewertungs-Ticker zur professionellen Markenpräsenz, die das **Portal** wie ein Produkt bewirbt:
was es tut, für wen, welchen Mehrwert es bietet. Zielgruppe ist breit (Interessierte, nicht nur Patienten mit Rezept).
Präsenz rein als Marke, keine Person, kein Gesicht.

## Rechtlicher Rahmen

Medizinalcannabis ist verschreibungspflichtig, §10 HWG verbietet Publikumswerbung dafür. Beworben wird ausschließlich
das Portal (Transparenz, Community, Wissen über Sensorik). Verboten in Bild und Text: Sortenname als Kaufanreiz, Wirkung,
Beschwerden, Dosierung, Preis, Apotheke, Aufforderung zu Konsum oder Bezug. Jeder Text läuft durch den bestehenden
HWG-Filter (`lib/ig-karte.ts`), jeder Post durchläuft die Checkliste in `docs/instagram/handwerk.md`. Nachtrag 2026-10-15: Der Betreiber hat Claude
beauftragt, Posts selbständig zu planen und zu veröffentlichen (`scripts/ig-planen.ts`); erster Post als Probe.

## Positionierung

„Unabhängige Sortenbewertung für Medizinalcannabis – ehrlich, nach festem Schema, mit einer Community, die Sorten
gemeinsam voranbringt.“

## Säulen

1. **Transparenz**: festes Schema (fünf Noten, Restfeuchte, acht Aroma-Achsen), alle Noten offen. (Nachtrag 2026-10-15: Bewertungen hängen nicht an einer Charge; die Charge ist optional.)
2. **Mitmachen** (Schlüssel `mitbestimmen`): freiwillige Events, bei denen die Community Sorten gemeinsam vorschlägt, pusht und zusammen bewertet. Nie Hauptfokus (Nachtrag 2026-10-15).
3. **Wissen**: Terpene, Aussehen, Trichome, Lagerung, Aromarichtungen. Nur Sensorik und Qualität.
4. **Portal zeigen**: Features als Produkt-Demo (Filter, Geschmacksmatrix, Vergleich, Mitglied werden).

## Rhythmus

Drei Feed-Posts je Woche, unter dem Publora-Free-Limit von 15 im Monat.

| Tag | Format | Säule |
|---|---|---|
| Mo | Karussell Wissen, 5 bis 7 Slides | 3 |
| Mi | Reel 15 bis 30 s, Portal-Demo oder animierte Erklärung, nur Text und Musik | 4 oder 1 |
| Fr | Karussell oder Einzelbild „Wie wir arbeiten“ / „Mitmachen“ | 1 oder 2 |

Bewertungs-Posts nur als Ausnahme, auf ausdrücklichen Wunsch des Betreibers, dann ersetzen sie einen Slot. Der
automatische Bewertungs-Entwurf in der Routine wird abgeschaltet. Stories pflegt der Betreiber manuell in der App.

## Visuelles System

- Pinsel-Logo, Token-Farben aus `app/globals.css`, Handschrift-Kicker (Mr Dafoe), Regeln aus `docs/brand/gruenes-buch.md`.
- Je Säule eine Akzentfarbe, damit das Profilraster ruhig und wiedererkennbar wirkt.
- Drei Slide-Vorlagen, 1080 × 1350: **Cover** (Kicker, Titel, Säulenmarke), **Inhalt** (Titel, Text oder Punkte,
  Seitenzahl), **CTA** („Mitglied werden – Link in Bio“).

## Profil

- Bio mit Nutzenversprechen in einem Satz, Link auf die Landingpage `/ig`.
- Story-Highlights: Was ist das, So bewerten wir, Mitmachen, FAQ.
- Drei gepinnte Posts: Manifest, „So bewerten wir“, „Mach mit“.

## Technik

1. **Karussell-Vorlagen**: `ig-karte` um mehrseitige Karussells erweitern (Route rendert Slide `n` von `m` je Vorlage),
   Screenshot-Skript fotografiert alle Slides, Publora-Entwurf mit mehreren Bildern.
2. **Redaktionsplan**: `docs/instagram/themen.md` wird zum Redaktionsplan nach Säulen und Wochentag.
3. **Routine**: Agent-Anweisung umstellen: Mo und Fr je ein Karussell-Entwurf passend zum Tag, Bewertungsschritt
   entfernt, Bremse bleibt (höchstens 3 offene Entwürfe).
4. **Reel**: Skript nimmt per Playwright eine Portal-Tour auf (Remotion für animierte Erklärungen), schneidet auf
   15 bis 30 s, legt sie als Video-Entwurf in Publora ab. Läuft lokal, nur kostenlose Werkzeuge.
5. **Landingpage `/ig`**: kurze Seite im Portal, drei Einstiege (So bewerten wir, Mitmachen, Mitglied werden).
6. **Profiltexte**: Bio, Highlight-Cover, drei Pin-Posts als Entwürfe.

## Erfolg nach acht Wochen

Profilbesuche, Link-Klicks auf `/ig`, neue Mitgliedsanträge. Follower-Zahl zweitrangig.

## Nicht im Umfang

Bezahlte Werbung, kostenpflichtige Dienste, Gesicht oder Stimme des Betreibers, automatisches Veröffentlichen.
