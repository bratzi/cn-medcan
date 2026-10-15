# Redaktionsplan @bookofterpz

Stand 2026-10-15. Der Account ist die Produktmarke des Portals, keine Person, kein Gesicht. Spec:
`docs/superpowers/specs/2026-10-15-instagram-produktmarke-design.md`. Fakten stammen nur aus dem Repo
(`docs/instagram/themen.md`, `docs/brand/gruenes-buch.md`, Code). Nichts erfinden, keine Zahlen ohne Beleg.

## Wochenrhythmus

Drei Feed-Posts je Woche, unter dem Publora-Free-Limit von 15 im Monat.

| Tag | Format | Säule | Wer |
|---|---|---|---|
| Mo | Karussell Wissen, 5 bis 7 Slides | 3 Wissen | Agent legt den Entwurf an |
| Mi | Reel 15 bis 30 s, Portal-Demo oder animierte Erklärung, nur Text und Musik | 4 Portal oder 1 Transparenz | Betreiber, lokal; der Agent erinnert nur im Bericht |
| Fr | Karussell „Wie wir arbeiten“ oder „Mitmachen“ | 1 Transparenz und 2 Mitbestimmen im Wechsel | Agent legt den Entwurf an |

Bewertungs-Posts nur als Ausnahme, auf ausdrücklichen Wunsch des Betreibers, dann ersetzen sie einen Slot. Der Agent
legt sie nie an. Stories pflegt der Betreiber manuell in der App.

## Dramaturgie eines Karussells

3 bis 10 Slides, im Regelfall 5 bis 7: Cover, 2 bis 5 Inhaltsslides, CTA.

1. **Cover (Hook):** eine Frage oder eine Behauptung, höchstens 6 Wörter. Der Kicker darüber ist kurz und handschriftlich
   gedacht („Terpen im Porträt“, „So bewerten wir“).
2. **Slide 2:** die wichtigste Aussage. Wer nur zwei Slides sieht, hat das Entscheidende (Serial Position: Anfang
   bleibt haften).
3. **Inhaltsslides:** je ein Gedanke, Titel höchstens 60 Zeichen, Text höchstens 220, höchstens 4 Punkte à 60.
4. **CTA zuletzt:** genau eine Handlung, etwa „Link in Bio“ oder „Mitglied werden“. Der letzte Eindruck bleibt (Peak-End).
   Keine zweite Bitte daneben.

## Caption-Regeln

- Erste Zeile ist der Hook, unter 125 Zeichen, damit sie vor „mehr“ sichtbar ist.
- 2 bis 4 kurze Absätze, je 1 bis 2 Sätze, Leerzeile dazwischen. Deutsch, du-Form, ruhig und sachkundig.
- Schluss mit einer Frage an die Community oder „Link in Bio“.
- 3 bis 5 Hashtags: `#bookofterpz #medizinalcannabis #terpene` plus 0 bis 2 thematische.
- Kein KI-Ton: keine Gedankenstriche als Stilmittel, höchstens 1 Emoji, keine Floskeln („Tauche ein“, „Entdecke die Welt“).

## HWG-Block

Medizinalcannabis ist verschreibungspflichtig, §10 HWG verbietet Publikumswerbung dafür. Beworben wird ausschließlich
das Portal (Transparenz, Community, Wissen über Sensorik). Verboten in Bild und Text: Sortenname als Kaufanreiz, Wirkung,
Beschwerden, Dosierung, Preis, Apotheke, Aufforderung zu Konsum oder Bezug. Jeder Text läuft durch den bestehenden
HWG-Filter (`lib/ig-karte.ts`), jeder Post wird vom Betreiber freigegeben. Nichts wird automatisch veröffentlicht.

## Themenliste

Der `schluessel` wird Teil der Bildmarke `bot-k-<saeule>-<schluessel>`. Er ist a-z, 0-9 und Bindestrich. Ein Thema, das als
Marke schon vorkommt (offen oder veröffentlicht), wird nicht noch einmal genommen. Die Fakten zu Terpenen, Aromarichtungen
und Vorkommen stehen in `docs/instagram/themen.md`.

### Wissen (Mo, Säule `wissen`)

Mindestens acht Wochen, in dieser Reihenfolge, wenn nichts dagegen spricht.

| Woche | schluessel | Thema |
|---|---|---|
| 1 | terpene-erklaert | Was Terpene sind: Duftstoffe der Pflanze, woran man sie riecht |
| 2 | aromarichtungen | Die zehn Aromarichtungen von Zitrus bis Diesel |
| 3 | myrcen | Myrcen im Porträt: erdig, fruchtig, kräutrig; Hopfen, Mango, Thymian |
| 4 | restfeuchte | Restfeuchte: warum zu trockene Blüten leichter zerfallen und Terpene verfliegen |
| 5 | limonen | Limonen im Porträt: Zitrus; Zitrusschalen, Wacholder, Pfefferminze |
| 6 | chargenetikett | Das Chargenetikett lesen: was draufsteht und warum die Charge zählt |
| 7 | trichome-aussehen | Trichome und Aussehen: was man an der Blüte sehen kann |
| 8 | lagerung | Lagerung: warum Licht, Luft und Trockenheit den Duft verändern |
| 9 | beta-caryophyllen | Beta-Caryophyllen: würzig, holzig; Schwarzer Pfeffer, Nelke, Zimt |
| 10 | linalool | Linalool: blumig; Lavendel, Koriander, Basilikum |

Danach weiter mit den übrigen Terpenen aus `themen.md` (alpha-pinen, terpinolen, humulen, ocimen, farnesen, nerolidol,
ester-thiole).

### Transparenz (Fr im Wechsel, Säule `transparenz`)

| schluessel | Thema |
|---|---|
| fuenf-noten | Die fünf Noten: was hinter Aussehen, Geruch, Geschmack, Konsistenz und Gesamtnote steckt |
| blaetter-statt-sterne | Blätter statt Sterne: die Gesamtnote von 1 bis 5 |
| warum-charge | Warum Charge: dieselbe Sorte, andere Charge, andere Bewertung |
| wer-bewertet | Wer bewertet: eine Person, festes Schema, offen gezeigt |
| aroma-statt-hype | Aroma statt Hype: Duft, Geschmack, Aussehen statt Zahlen auf dem Etikett |

Schon als Pin-Posts angelegt: `manifest`, `so-bewerten-wir` (Dateien in `docs/instagram/karussells/`).

### Mitbestimmen (Fr im Wechsel, Säule `mitbestimmen`)

| schluessel | Thema |
|---|---|
| so-laeuft-eine-runde | So läuft eine Runde: Auswahl, Abstimmung, Ergebnis |
| gesetzt-oder-gewaehlt | Gesetzte und gewählte Plätze, offen gekennzeichnet |
| nur-verifiziert | Warum nur verifizierte Mitglieder abstimmen |
| mitglied-werden | Mitglied werden: so kommst du in die Abstimmung |

Schon als Pin-Post angelegt: `stimm-mit-ab`.

### Portal (Mi, Säule `portal`, Reel; als Karussell nur auf Wunsch)

| schluessel | Thema |
|---|---|
| aroma-karte | Aroma-Karte: welche Terpene zu welchen Aromen führen |
| das-buch | Das Buch: Bewertungen zum Blättern mit handschriftlicher Notiz |
| zahlen-aus-dem-buch | Zahlen aus dem Buch: meistbewertet, am besten bewertet, meistkommentiert (`/reviews`) |
| vergleich | Vergleich: Chargen und Bewertungen nebeneinander |

## Reihenfolge der Fr-Posts

Transparenz und Mitbestimmen wechseln sich ab. Maßgeblich ist der jüngste Karussell-Post der Säulen `transparenz` und
`mitbestimmen` aus `veroeffentlichteThemen` und den offenen Entwürfen: folgt auf Transparenz Mitbestimmen und umgekehrt.
Gibt es noch keinen, beginnt der Freitag mit Transparenz.
