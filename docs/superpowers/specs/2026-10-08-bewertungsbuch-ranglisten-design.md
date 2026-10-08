# Bewertungen: ein Buch für alle Einträge, Ranglisten für Mitglieder

**Stand:** 2026-10-08 (Session 51), Entwurf zur Durchsicht
**Seite:** `/reviews` (Navigation „Bewertungen“)

## 1. Auftrag (Nutzer, wörtlich zusammengefasst)

- Die Sektion Bewertungen bekommt **ein Buch mit allen Bewertungen zum Umblättern**, unabhängig von
  der Sorte, jede Doppelseite **mit Bild** wie im Buch auf der Blütenseite. Die alte Doppelseite mit
  Aroma-Karte ohne Bild verschwindet von `/reviews`.
- **Unten paginiert:** alle Einträge zum Anklicken.
- Darunter ein **Menü statt einer bloßen Auflistung:** Sortierung nach üblichen Kriterien (am
  höchsten bewertet, am niedrigsten bewertet, meistbewertet und so weiter), mit **Bild und kleinen
  Metadaten** (Anzahl Bewertungen, Durchschnitt), damit man auf einen Blick sieht, was oben und unten
  steht.
- Texte der Sektionen mittig wie auf der Startseite.

**Entscheidungen des Nutzers (2026-10-08):**
1. Ins Buch kommen **alle freigegebenen Bewertungen**, **Betreiber zuerst**, dann die Community,
   jeweils neueste zuerst (`buchReihenfolge` aus `lib/buch.ts`).
2. Ranglisten gelten **je Sorte**, nicht je Einzelbewertung.
3. Ranglisten sieht **nur, wer angemeldet ist** (§10 HWG: keine Publikumswerbung). Gäste sehen das
   Buch und an Stelle der Ranglisten einen Hinweis mit Anmelden.

Alles Weitere unten habe ich selbst entschieden; mit **(E)** markiert, damit es beim Lesen
korrigiert werden kann.

## 2. Was übliche Seiten machen (Recherche)

- Untappd: „Top Rated“ nach **Bayes-Mittel**, damit wenige 5er nicht alles schlagen, mit
  Mindestanzahl (150 Bewertungen). Vivino: Mindestanzahl 50 in 12 Monaten für Auszeichnungen.
- Letterboxd und Leafly: Sortierung nach Durchschnitt, Beliebtheit (Anzahl), neu, dazu Filter.
- Übernommen: gewichteter Durchschnitt statt rohem Mittel, Anzahl sichtbar neben jeder Note,
  „neu bewertet“ als eigene Ordnung. Nicht übernommen: feste Mindestanzahl (bei 26 Bewertungen
  bliebe die Liste leer), Beliebtheit aus Klicks (wir messen keine).

## 3. Aufbau der Seite (E)

1. **Seitenkopf** mittig: Titel, Satz (bestehende Texte), Schlagwort.
2. **Das Buch** (`components/review/Buch.tsx`, unverändert in der Mechanik) mit
   `BuchDoppelseite` je Eintrag, so wie auf der Blütenseite: Bild, Aroma-Karte, Noten, Notiz.
   Neu je Doppelseite der Handelsname als Link zur Blütenseite, weil die Sorte hier wechselt.
3. **Seitenleiste unter dem Buch (Paginierung):** nummerierte Pillen je Eintrag, die aktuelle
   gefüllt, dazwischen Auslassung bei vielen Einträgen (1 2 3 … 12 13 14 … 26). Klick schlägt die
   Doppelseite auf. Daneben bleiben Zurück, Weiter und „Seite x von n“ des Buchs.
4. **Ranglisten** (Mitglieder): Reiter-Leiste im Stil der Profil-Reiter, darunter ein Raster aus
   Sortenkarten, darunter Seitenzahlen der Rangliste.

## 4. Das Buch über alle Sorten

- **Bände (E):** ein Band hat höchstens **24 Einträge**. `/reviews` ist Band 1,
  `/reviews/band/[n]` die weiteren. Grund: jede Doppelseite trägt eine Aroma-Karte; ein Buch mit
  hunderten Seiten würde das HTML und die Renderzeit auf dem Free-Tier sprengen. Bei heute 26
  Bewertungen gibt es zwei Bände.
- Die Seitenleiste zählt **über alle Bände**: Nummern im aktuellen Band blättern, Nummern in einem
  anderen Band sind Links auf `/reviews/band/[n]#eintrag-…` (das Buch schlägt den Anker schon heute
  auf, `ankerSeite`).
- Beide Routen bleiben **statisch je Sprache, alle 300 s neu** (`force-static`, `revalidate = 300`),
  wie `/reviews` heute. Sie sind nicht nutzerbezogen.
- **Abfrage:** neue Funktion in `lib/query/reviews.ts`, alle freigegebenen Bewertungen mit Sorte
  (Handelsname, Slug, Terpene, Herstellerbild) in Buchreihenfolge, `skip`/`take` je Band, dazu die
  Gesamtzahl. Felder wie `ReviewEintrag` der Blütenseite, damit `alsEintrag` und
  `BuchDoppelseite` unverändert passen.
- Ohne Bewertung bleibt der bestehende Leerzustand.
- „Der neueste Eintrag“ und das Inhaltsverzeichnis entfallen auf `/reviews`; das Buch beginnt mit
  dem neuesten Eintrag des Betreibers. `Inhaltsverzeichnis.tsx` wird gelöscht, wenn nichts anderes
  es nutzt. Die Startseite (`NeuesterEintrag`, alte `Doppelseite`) bleibt in diesem Schritt
  unverändert.

## 5. Ranglisten je Sorte

**Reiter (E), Beschriftung sachlich nach §10 HWG** (kein „beste“, kein „Top“, keine Empfehlung):

| Reiter | Ordnung | Bedingung |
|---|---|---|
| Am höchsten bewertet | gewichteter Durchschnitt absteigend | mindestens 1 Bewertung |
| Am niedrigsten bewertet | gewichteter Durchschnitt aufsteigend | mindestens 1 Bewertung |
| Meistbewertet | Anzahl absteigend, dann Durchschnitt | mindestens 1 Bewertung |
| Neu bewertet | jüngste Bewertung absteigend | mindestens 1 Bewertung |
| Wir und ihr uneins | Abstand Betreiber-Note zu Community-Durchschnitt absteigend | Betreiber-Bewertung und mindestens 1 Community-Bewertung |

- **Gewichteter Durchschnitt (E):** `(C · m + Summe der Noten) / (C + n)`, `m` = Durchschnitt aller
  Bewertungen, `C = 3`. Angezeigt wird trotzdem der **echte** Durchschnitt; der gewichtete Wert
  ordnet nur. Ein Satz unter den Reitern erklärt das in Klartext.
- „Wir und ihr uneins“ zahlt auf den Kern ein (Betreiber-Review gegen Community-Zweitstimme).
- Grundlage sind alle freigegebenen Bewertungen mit `gesamtnote` (Betreiber und Community).
- **Karte je Sorte:** Bild (Herstellerbild, sonst Musterbild, über `components/medien/Bild`),
  Handelsname (gedruckt, nie gekürzt), Hersteller, Durchschnitt als Zahl plus Blätter (`BlattNote`),
  Anzahl Bewertungen, Betreiber-Note falls vorhanden, Datum der letzten Bewertung, Rang als Zahl.
  Die ganze Karte ist Klickfläche, der Name der eine Link zur Blütenseite.
- Raster: 1 Spalte bis 640 px, 2 bis 1080 px, 4 darüber. **12 Karten je Seite**, Seitenzahlen
  darunter.
- **Technik (E):** `/reviews` bleibt statisch. Die Ranglisten sind eine Client-Insel, die
  `/api/ranglisten?nach=…&seite=…` lädt. Der Route Handler prüft die Sitzung
  (`aktuellesMitglied()`), Gäste bekommen 401 und die Insel zeigt den Anmelde-Hinweis. Ohne
  JavaScript steht der Anmelde-Hinweis mit Link da. Die Antwort ist klein (12 Karten), die Rechnung
  ist eine `GROUP BY`-Abfrage in D1, nicht im Worker. Antwort mit `Cache-Control: private`.
- Reiterwahl und Seite stehen im Hash der Adresse (`#ranglisten-hoechste-2`), damit Zurück
  funktioniert, ohne die statische Seite dynamisch zu machen.

## 6. Gestaltung

- Sektionsköpfe mittig im Kapitelgrad mit Schlagwort, wie seit Session 51 auf der Blütenseite.
- Reiter wie `ProfilReiter` (gedruckt, Strich darunter), Pillen für Seitenzahlen (`rounded-full`,
  44 px), genau eine gefüllte Primäraktion je Ansicht (Anmelden für Gäste; sonst keine).
- Zahlen in `numeric`, Daten über `Intl` de-DE, Karten eckig, kein Schatten.
- Bewegung: Reiterwechsel per Deckkraft 180 ms, aus bei reduzierter Bewegung. Keine neue GSAP-Datei.

## 7. Fehler und Grenzfälle

- Rangliste lädt nicht: Satz „lässt sich gerade nicht laden“ mit Neu-laden-Knopf, kein Absturz.
- Leere Reiter (etwa „uneins“ ohne Community): erklärender Satz statt leerem Raster.
- Band außerhalb des Bereichs: 404.
- Sorte ohne Bild: Musterbild.

## 8. Tests

- Abfrage-Logik als reine Funktionen: Bayes-Mittel, Ordnungen je Reiter, Bandgrenzen,
  Seitenleiste mit Auslassung (`tests/ranglisten.test.ts`, `tests/buch.test.ts` erweitert).
- Route Handler: 401 ohne Sitzung, Parameterprüfung (`nach` aus fester Liste, `seite` ≥ 1).
- Quelltext-Tests wie bisher: `/reviews` bleibt `force-static`, nutzt `BuchDoppelseite`, keine
  `Doppelseite` mehr.
- Live: hell und dunkel, 390 px und 1418 px, Gast und Mitglied.

## 9. Außerhalb

- Startseite `NeuesterEintrag` auf das neue Bild umstellen (eigener Schritt, wenn gewünscht).
- Filter nach Kultivartyp oder Hersteller in den Ranglisten.
- Apotheken und Preise (zurückgestellt).
