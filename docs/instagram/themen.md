# Faktenquelle für den Instagram-Agenten

**Dient nur noch als Faktenquelle.** Welches Thema wann drankommt, steht im Redaktionsplan nach Säulen und Wochentag:
`docs/instagram/redaktionsplan.md`. Hier stehen die belegten Fakten zu Terpenen, Features und Schema. Der Agent
darf eigene Ideen ergänzen, solange die Fakten aus diesem Repo stammen. Die `schluessel` der Tabellen stammen aus der
alten Themenkarte (Marke `bot-thema-<art>-<schluessel>`); neue Karussells heißen `bot-k-<saeule>-<schluessel>`.

**HWG gilt für jeden Eintrag:** nur Duft, Geschmack, Aussehen, Vorkommen in Pflanzen, Chemie, Funktionen der Website.
Nie Wirkung, Linderung, Krankheit, Dosierung, Stimmung, Schlaf, Entspannung, Konsum.

## Terpene (`art: "terpen"`)

Quelle der Aromarichtungen: `lib/terpen-aromen.ts`. Farbe für die Karte: Hauptaroma aus `lib/aroma-farben.ts`
(Fruchtig und Blumig haben keine feste Farbe, dann Blattgrün weglassen, also `farbe` leer lassen).
Vorkommen in Pflanzen ist Allgemeinwissen der Aromachemie und frei von Wirkaussagen.

| schluessel | Terpen | Aromarichtungen (Anteil) | Vorkommen | Farbe |
|---|---|---|---|---|
| myrcen | Myrcen | erdig 50 %, fruchtig 30 %, kräutrig 20 % | Hopfen, Mango, Thymian | #7a5536 |
| limonen | Limonen | Zitrus 75 %, fruchtig 15 %, süß 10 % | Zitrusschalen, Wacholder, Pfefferminze | #f2d129 |
| beta-caryophyllen | Beta-Caryophyllen | würzig 60 %, holzig 25 %, erdig 15 % | Schwarzer Pfeffer, Nelke, Zimt | #c98a3e |
| linalool | Linalool | blumig 65 %, süß 20 %, kräutrig 15 % | Lavendel, Koriander, Basilikum | (leer) |
| alpha-pinen | Alpha-Pinen | holzig 60 %, kräutrig 25 %, minzig 15 % | Kiefernnadeln, Rosmarin, Dill | #9b6a3f |
| terpinolen | Terpinolen | kräutrig 35 %, blumig 25 %, Zitrus 20 %, holzig 20 % | Flieder, Apfel, Teebaum | #7d9a3c |
| humulen | Humulen | holzig 40 %, erdig 40 %, würzig 20 % | Hopfen, Salbei, Nelke | #9b6a3f |
| ocimen | Ocimen | süß 35 %, kräutrig 30 %, fruchtig 20 %, holzig 15 % | Basilikum, Minze, Mango | #ff5fa8 |
| farnesen | Farnesen | fruchtig 50 %, süß 20 %, holzig 15 %, kräutrig 15 % | Schale grüner Äpfel, Hopfen | (leer) |
| nerolidol | Nerolidol | holzig 45 %, blumig 35 %, Zitrus 20 % | Jasmin, Ingwer, Teebaum | #9b6a3f |
| ester-thiole | Ester und Thiole | Ester fruchtig, Thiole „Diesel“ (Schwefel); beide keine Terpene | Obst (Ester), Knoblauch, Kaffee (Thiole) | #9aa1a8 |

## Features der Website (`art: "feature"`)

Fakten aus dem Code und `docs/brand/gruenes-buch.md`. Pfad nennen, damit Leser es finden („Link in Bio“).

| schluessel | Feature | Kern |
|---|---|---|
| bewertungsschema | Bewertungsschema | Jede Sorte nach demselben Schema: Aussehen, Geruch, Geschmack, Konsistenz, Gesamtnote in Blättern (1–5). Wirkung wird auf Instagram nie gezeigt. |
| aroma-karte | Aroma-Karte | Zeigt, welche Terpene zu welchen Aromen führen: zehn Aromarichtungen von Zitrus bis Diesel. |
| restfeuchte | Restfeuchte | Hinweis bei zu trockenen Blüten (unter 8 %): Blüten zerfallen leichter, Terpene verfliegen. |
| events | Events | Freiwillige Events: Mitglieder schlagen Sorten vor, pushen sie gemeinsam und bewerten zusammen. Seite `/umfragen`. |
| kommentare-likes | Kommentare und Likes | Bewertungen kommentieren und liken, Blüten merken, Profilen folgen. |
| zahlen-aus-dem-buch | Zahlen aus dem Buch | Statistik auf `/reviews`: meistbewertet, am besten bewertet, meistkommentiert. |
| buch | Das Buch | Bewertungen zum Blättern wie in einem Notizbuch, mit handschriftlicher Notiz. |

## Mission (`art: "mission"`)

| schluessel | Thema | Kern |
|---|---|---|
| ehrlich-nach-schema | Ehrliche Bewertungen | Eine Person bewertet nach festem Schema, alle Noten offen. |
| gemeinsam-nach-vorn | Gemeinsam nach vorn | Bei freiwilligen Events bringt die Community Sorten gemeinsam voran und bewertet zusammen. |
| aroma-statt-hype | Aroma statt Hype | Es geht um Duft, Geschmack, Aussehen und Qualität, nicht um THC-Zahlen. |

## Schema (`art: "schema"`)

| schluessel | Thema | Kern |
|---|---|---|
| fuenf-noten | Fünf Noten | Was hinter Aussehen, Geruch, Geschmack, Konsistenz und Gesamtnote steckt. |
| blaetter-statt-sterne | Blätter statt Sterne | Die Gesamtnote in Blättern von 1 bis 5 und wie sie entsteht. |
| aroma-richtungen | Zehn Aromarichtungen | Zitrus, fruchtig, süß, blumig, kräutrig, minzig, holzig, würzig, erdig, Diesel. |

## Wissen: Faktenblatt (Säule `wissen`, Nutzer-Freigabe 2026-10-15)

Allgemeinwissen der Botanik und Aromachemie, nur Duft, Aussehen, Chemie und Lagerung. Keine Wirkung, keine Dosierung.

### terpene-erklaert
- Terpene sind flüchtige Duftstoffe, die viele Pflanzen bilden, nicht nur Cannabis (Zitrusschale, Kiefer, Lavendel, Hopfen).
- Bei Cannabis entstehen sie vor allem in den Drüsenhaaren (Trichome) der Blüte.
- Man riecht sie, weil sie schon bei Raumtemperatur verdunsten; deshalb verändert sich der Duft mit der Zeit.
- Ein Duftprofil entsteht aus vielen Terpenen zugleich; das Etikett nennt meist nur die mengenmäßig größten.
- Im Book of Terpz zeigen wir je Blüte die Terpene laut Datenblatt und die zehn Aromarichtungen (`lib/terpen-aromen.ts`).

### trichome-aussehen
- Trichome sind feine Drüsenhaare auf Blüte und Blattspitzen; mit bloßem Auge wirken sie wie Raureif oder Zucker.
- Unter der Lupe sieht man Stiel und Köpfchen; im Köpfchen sitzen Harz und Terpene.
- Die Farbe der Köpfchen reicht von klar über milchig bis bernsteinfarben.
- Abgebrochene oder plattgedrückte Trichome sieht man als matte, verschmierte Stellen; das spricht für grobe Behandlung.
- „Aussehen“ ist eine unserer fünf Noten: Trichombesatz, Form, Farbe und Verarbeitung der Blüte (Schema in `docs/instagram/themen.md`, Abschnitt Schema).

### lagerung
- Licht (UV), Wärme und Luftsauerstoff bauen Terpene ab, der Duft wird flacher.
- Zu trockene Blüten zerbröseln, Trichome brechen ab; zu feuchte riskieren Schimmel.
- Unser Schema: Restfeuchte unter 8 % gilt als zu trocken, über 13 % als zu feucht (Feld in der Bewertung).
- Gut ist: dunkel, kühl (nicht im Kühlschrank wegen Kondenswasser), luftdicht, im Originalbehälter oder Glas.
- Häufiges Öffnen lässt Duft entweichen; Feuchtigkeitsbeutel halten die Restfeuchte stabil.
