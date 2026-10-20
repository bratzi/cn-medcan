# Instagram-Handwerk für Book of Terpz

Pflichtlektüre vor **jedem** Entwurf (Karussell, Reel, Caption, Profil), für Menschen und für die Cloud-Routine.
Verdichtet aus den Skills des Plugins `instagram-skills` (ig-carousel-planner, ig-caption-writer, ig-hook-extractor,
ig-humanizer, ig-hashtag-strategist, ig-profile-optimizer, ig-content-planner, ig-repurposer), angepasst an Deutsch und
an das Heilmittelwerbegesetz. Was hart prüfbar ist, prüfen `karussellPruefen` (`lib/ig-karussell.ts`) und
`igCaptionPruefen` (`lib/ig-caption.ts`); der Rest ist Handwerk und steht in der Checkliste unten.

## Worauf Instagram 2026 achtet

Reichweite kommt von **Weiterleiten (Sends)** und **Speichern**, dann Kommentaren. Likes zählen wenig. Vor jedem Post die
eine Frage: *Würde jemand das einer bestimmten Person schicken oder es speichern, um später nachzuschlagen?*
Herabgestuft werden Köder („Markiere 3 Freunde“, „Doppeltipp, wenn …“), Hashtag-Wände und gemischte Medien in einem
Karussell.

## Nie erfinden

**Veraltet, nie mehr behaupten (Betreiber 2026-10-15):** Eine Bewertung hängt *nicht* an einer Charge; die Charge ist
eine freiwillige Angabe. Abstimmungen und Runden sind **freiwillige Events**, bei denen die Community Strains gemeinsam
voranbringt und zusammen bewertet. Sie stehen nie im Mittelpunkt eines Posts über das Portal.

Keine Zahl, kein Datum, kein Ergebnis, das nicht im Repo belegt ist (`docs/instagram/themen.md`,
`docs/brand/gruenes-buch.md`, Code). Fehlt ein konkretes Detail, Satz weglassen, nicht schmücken. Eine erfundene Zahl ist
eine Richtigstellung; eine fehlende nur ein schwächerer Post.

## Karussell: die Wirbelsäule

| Slide | Aufgabe |
|---|---|
| 1 Cover | **Versprechen plus offene Schleife**, nie bloßer Titel. Eine Idee, große Schrift. Eine Zahl vorne, wenn sie stimmt („4 Regeln, an die wir uns halten“). |
| 2–3 | **Das Stärkste zuerst.** Durchwischen nimmt mit jeder Slide ab. |
| 4 bis vorletzte | Ein Punkt pro Slide, jede für sich verständlich, in 2 Sekunden lesbar. |
| Letzte (CTA) | **Zusammenfassung, die sich zu speichern lohnt, plus genau eine Bitte** (speichern, schicken oder Mitglied werden). „Zugang per DM“ steht fest (Bio-Link in der Caption nennen) auf der Slide, nicht im Text. Seit 2026-10-20 steht die Webseite in der Bio. |

Formen (nach Ziel wählen): **Liste** (Speichern), **Mythos und Wahrheit** (Weiterleiten), **Vorher/Nachher**
(Speichern, Folgen), **Rahmenwerk zum Mitnehmen** (Speichern). 5 bis 8 Slides sind üblich; nie auf eine runde Zahl
auffüllen. Kicker höchstens 30 Zeichen, Titel höchstens 60.

## Layout

Alle Bilder und Reels sind **zentriert**: Logo oben mittig, Inhalt auf der Mittelachse, Fußzeile mittig. Akzente
als kurzer Strich (48 × 4 px) in Säulenfarbe über Punkten oder Absätzen, nie als linke Kante. Großzügiger Weißraum,
eine Idee pro Bild (critique-composition, critique-visual-hierarchy).

## Caption

- **Erste Zeile ist der Hook**, höchstens 125 Zeichen, muss allein funktionieren (danach kommt „mehr“).
- Eine Idee pro Caption. Kurze Absätze mit Leerzeile.
- **Genau eine Bitte:** eine echte Frage *oder* eine Speicher-/Schick-Bitte *oder* „Link in Bio, Zugang per DM“. Nie alles zugleich.
  Tote Schlüsse wie „Was denkt ihr?“ sind verboten.
- 0 bis 3 Emoji, gezielt. Höchstens zwei Gedankenstriche, nie einen Strich durch einen Punkt ersetzen.

## Inhalt (Nutzer 2026-10-16)

- **Nutzer bewerten**, nicht „das Buch“. Wer zuschaut, kann selbst mitbewerten.
- **Blüte und Strain im Fokus**, Chargen nie: „je mehr Blätter, desto besser gefällt uns die Blüte“.
- **Jede Slide zeigt, wovon sie spricht:** Feld `grafik` (`blaetter` mit Note, oder `icons` mit Merkmal-, Geschmacks-
  oder Terpennamen, siehe `lib/ig-grafik.tsx`); `karussellPruefen` lehnt Slides ohne Grafik ab. Gleich viele Punkte wie
  Icons ergeben beschriftete Icons.
- **Webseite in der Bio** (Nutzer 2026-10-20, ersetzt „kein Link“ vom 2026-10-16). Die Seite hat ein Passwort-Gate:
  den Zugang gibt es per DM.
- **Testnutzer gesucht:** sobald das System stabil skaliert, suchen wir engagierte Testnutzer (per DM melden). Gern als
  Schluss eines Portal-Posts oder als eigener Post.

## Nicht generiert klingen (ig-humanizer)

Leser erkennen KI an Wortwahl und Satzbau. Pro Absatz bzw. Slide zählen; ab drei Merkmalen neu schreiben, ein einzelnes
stehen lassen. Immer streichen:
- **Enthüllungsbrücken:** „Das Ergebnis?“, „Spoiler:“, „Hier kommt’s:“.
- **Stakkato für Wirkung:** „Kein X. Kein Y. Nur Z.“, Ein-Wort-Zeilen.
- **Gestapelte Dreier** ohne konkrete Glieder; ein natürlicher Dreier mit echten Dingen darf bleiben.
- **Vorgespielte Offenheit:** „ehrlich gesagt“, „real talk“, „mal ehrlich“.
- **Modewörter:** Gamechanger, next level, eintauchen, „in der heutigen Zeit“, bedeutend, entscheidend, umfassend,
  nahtlos, ganzheitlich.
- Nicht überkorrigieren: kein künstlicher Wechsel kurz/lang, keine Ein-Wort-Zeilen als „Rhythmus“.

## Hashtags (ig-hashtag-strategist)

3 bis 5, nach Größe gemischt: 2–3 Nische (unter 50k Beiträge), 1–2 mittel, höchstens 1 breit. Immer passend zum
Inhalt, am Ende der Caption. **Pro Thema wechseln**, nicht denselben Block auf jeden Post.
Bausteine: Marke `#bookofterpz` (immer), mittel `#medizinalcannabis` `#terpene`, Nische nach Thema (`#terpenprofil`,
`#aromaprofil`, `#strainbewertung`, `#community`, Terpenname wie `#limonen`). Keine Wirk-, Patienten- oder
Krankheits-Tags.

## Reel (Hook in den ersten 1–3 Sekunden)

Szene 1 trägt das Versprechen als großer Text, ohne Vorlauf. Eine Aussage pro Szene, 15–30 s gesamt, letzte Szene
fasst zusammen. Caption stützt das Video und wiederholt den Hook vor dem Falz.

## Profil (ig-profile-optimizer)

NAME-Feld höchstens 30 Zeichen mit Suchwort (es wird durchsucht, nicht das @handle). Bio höchstens 150 Zeichen:
Nutzen, Thema, ein Beleg. Link: die Webseite; Zugang per DM. 4 Highlights in der Reihenfolge der Fragen eines Besuchers. Drei Pins:
Manifest, So bewerten wir, Stimm mit ab. Die ersten neun Kacheln wirken als Ganzes: gleiche Vorlage, Säulenfarben im
Wechsel.

## Wiederverwerten (ig-repurposer)

Ein Thema darf mehrfach laufen, in anderer Form: Karussell → Reel mit denselben Kernsätzen → Story mit Umfrage-Sticker.
Nie denselben Text zweimal posten.

## Checkliste vor jedem Entwurf

1. Würde jemand das schicken oder speichern? Wenn nein: Thema schärfen oder lassen.
2. Cover verspricht etwas und öffnet eine Schleife; Stärkstes auf Slide 2–3.
3. Letzte Slide: Zusammenfassung plus eine Bitte.
4. Hook in der ersten Caption-Zeile, höchstens 125 Zeichen; genau eine Bitte in der Caption.
5. Keine erfundenen Fakten; HWG-frei (Duft, Geschmack, Aussehen, Noten, Portal, nie Wirkung).
6. Humanizer-Durchgang: Brücken, Stakkato, Dreier, Modewörter, Striche.
7. 3–5 Hashtags nach Größe, anders als beim letzten Post.
8. `--probe` rendern und die Slides ansehen: lesbar in 2 Sekunden, nichts abgeschnitten.
