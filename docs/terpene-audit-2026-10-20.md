# Terpen-Audit 2026-10-20

Ziel: das bestehende Terpenmodell verbessern, nicht neu bauen. Nur Aroma, keine Wirkung (HWG). Begriffe: Blüte/Strain, Variante.

## Wo das Modell liegt

Das Modell hat zwei Ebenen. Der Katalog in der Datenbank (`terpene`, Feld `geschmack` als Hauptnote, eingespielt über `data/stamm/import.sql`, erzeugt von `scripts/stamm/sql-erzeugen.py`, Demo in `prisma/seed.ts`) kennt elf Terpene. Die Verteilung auf mehrere Achsen steht in `lib/terpen-aromen.ts` (`TABELLE`), die nur zehn davon kennt. Fehlt ein Name in der Tabelle, fällt `aromaAnteile` auf die Hauptnote mit Anteil 1 zurück. `lib/aromakarte.ts` nutzt diese Anteile für `herstellerProfil` (Gewicht Konzentration, sonst Rang), `terpenBoegen` und `terpenKandidaten` (Schwelle Anteil ab 0,2). `lib/terpen-achsen.ts` legt das Terpen-Netz des Profils auf genau die zehn Tabellen-Terpene fest. Die zehn Geschmacksachsen sind Zitrus, Fruchtig, Süß, Blumig, Kräutrig, Minzig, Holzig, Würzig, Erdig, Diesel.

## Ist-Stand

| Terpen | DB-Hauptnote | Tabelle (Anteile) |
|---|---|---|
| Myrcen | Erdig | Erdig 0,5 · Fruchtig 0,3 · Kräutrig 0,2 |
| Limonen | Zitrus | Zitrus 0,75 · Fruchtig 0,15 · Süß 0,1 |
| beta-Caryophyllen | Würzig | Würzig 0,6 · Holzig 0,25 · Erdig 0,15 |
| Linalool | Blumig | Blumig 0,65 · Süß 0,2 · Kräutrig 0,15 |
| alpha-Pinen | Holzig | Holzig 0,6 · Kräutrig 0,25 · Minzig 0,15 |
| Terpinolen | Kräutrig | Kräutrig 0,35 · Blumig 0,25 · Zitrus 0,2 · Holzig 0,2 |
| Humulen | Holzig | Holzig 0,4 · Erdig 0,4 · Würzig 0,2 |
| Ocimen | Süß | Süß 0,35 · Kräutrig 0,3 · Fruchtig 0,2 · Holzig 0,15 |
| Farnesen | **Süß** | **Fruchtig 0,5** · Süß 0,2 · Holzig 0,15 · Kräutrig 0,15 |
| Nerolidol | Holzig | Holzig 0,45 · Blumig 0,35 · Zitrus 0,2 |
| Bisabolol | Blumig | **fehlt** (Rückfall Blumig 1,0) |

Im Produktstamm (`data/stamm/produktstamm.json`) kommen zusätzlich vor: Bisabolol 50-mal, Ocimen 36-mal, beta-Pinen 4-mal, Terpineol einmal. beta-Pinen und Terpineol stehen nicht im Katalog. `lib/i18n/terpen.ts` kennt schon Guajol und Eukalyptol, der Katalog nicht.

## Befunde im Code

1. **Farnesen widerspricht sich.** Der Kommentar in `terpen-aromen.ts` sagt, der erste Eintrag decke sich mit `terpene.geschmack`. In der Datenbank steht Süß, in der Tabelle Fruchtig vorn. Folge: die Sortierung in `ordneTerpene` (Gleichstand über DB-Hauptnote) und `hauptAroma` (Tabelle) nennen verschiedene Hauptnoten. Vorschlag: DB auf FRUCHTIG ziehen (grüner Apfel ist eine Frucht), Test, der DB-Hauptnote gegen ersten Tabelleneintrag prüft.
2. **Bisabolol ohne Tabelle, aber häufig im Stamm.** Es zahlt zu 100 % auf Blumig ein und fehlt im Terpen-Netz des Profils. Bei 50 Nennungen ist das die größte Lücke.
3. **beta-Pinen und Terpineol gehen beim Import verloren** oder landen ohne Katalogeintrag. Prüfen, ob `sql-erzeugen.py` sie verwirft.
4. **Minzig hat kaum Träger.** Nur alpha-Pinen speist es mit 0,15, damit ist Minzig nie Kandidat (unter 0,2). Wer Minze schmeckt, bekommt keinen Vorschlag. Eukalyptol, Menthol-artige Noten, Borneol und Fenchol würden die Achse tragen.
5. **Diesel zu Recht ohne Terpen.** Die Begründung über Thiole (Oswald u. a., ACS Omega 2021) ist richtig und sollte bleiben.

## Prüfung gegen die Literatur

Grundlagen: Russo 2011 (Br J Pharmacol 163, „Taming THC“, Tabelle der Aromen der Hauptterpene), Oswald u. a. 2021 und 2023 (ACS Omega, flüchtige Schwefelverbindungen und nicht-terpenoide Stoffe als Treiber der Aromaunterschiede), Sommano u. a. 2020 (Plants, Aroma-Deskriptoren von Cannabis), Duftbeschreibungen der Good Scents Company und der Leffingwell-Datenbank, dazu Leafly-Terpenseiten als Laienreferenz. Nur Aroma wird übernommen.

| Terpen | Heute | Vorschlag | Begründung, Quelle |
|---|---|---|---|
| Myrcen | Erdig 0,5 · Fruchtig 0,3 · Kräutrig 0,2 | Erdig 0,45 · Fruchtig 0,3 · Kräutrig 0,25 | Russo: moschusartig, Nelke, Kräuter, Mango; Good Scents: balsamisch, würzig-krautig. Kleine Verschiebung zu Kräutrig, sonst stimmig. |
| Limonen | Zitrus 0,75 · Fruchtig 0,15 · Süß 0,1 | unverändert | Russo, Good Scents: Zitrus, Orangenschale, süß. Korrekt. |
| beta-Caryophyllen | Würzig 0,6 · Holzig 0,25 · Erdig 0,15 | unverändert | Russo: Pfeffer, holzig, Nelke. Korrekt. |
| Linalool | Blumig 0,65 · Süß 0,2 · Kräutrig 0,15 | Blumig 0,6 · Zitrus 0,15 · Süß 0,15 · Kräutrig 0,1 | Russo: blumig, Zitrus, würzig; Good Scents: blumig, Bergamotte-Zitrus, holzig. Zitrusanteil fehlt heute. |
| alpha-Pinen | Holzig 0,6 · Kräutrig 0,25 · Minzig 0,15 | Holzig 0,55 · Kräutrig 0,25 · Minzig 0,2 | Russo: Kiefer; Good Scents: harzig, kampferartig, terpentinartig. Kampfer passt zu Minzig; 0,2 macht es zum Kandidaten. |
| Terpinolen | Kräutrig 0,35 · Blumig 0,25 · Zitrus 0,2 · Holzig 0,2 | Kräutrig 0,3 · Holzig 0,25 · Zitrus 0,25 · Süß 0,2 | Good Scents: frisch, holzig, süß, Kiefer, Zitrus (Limette). Blumig ist schwach belegt; Fruchtig-Süß wird im Strain-Kontext (Jack Herer, Super Lemon Haze) oft genannt. |
| Humulen | Holzig 0,4 · Erdig 0,4 · Würzig 0,2 | Holzig 0,45 · Erdig 0,3 · Würzig 0,25 | Russo: holzig; Good Scents: holzig, würzig. Erdig etwas zu hoch. |
| Ocimen | Süß 0,35 · Kräutrig 0,3 · Fruchtig 0,2 · Holzig 0,15 | Süß 0,3 · Kräutrig 0,3 · Blumig 0,2 · Fruchtig 0,2 | Good Scents: süß, krautig, blumig, warm, tropisch. Holzig kaum belegt, Blumig fehlt. |
| Farnesen | Fruchtig 0,5 · Süß 0,2 · Holzig 0,15 · Kräutrig 0,15 | Fruchtig 0,45 · Kräutrig 0,25 · Holzig 0,15 · Süß 0,15; DB-Hauptnote Fruchtig | (E)-beta-Farnesen: grün, krautig, holzig; alpha-Farnesen: Apfelschale. Grüne Note stärker. |
| Nerolidol | Holzig 0,45 · Blumig 0,35 · Zitrus 0,2 | Holzig 0,45 · Blumig 0,35 · Fruchtig 0,2 | Good Scents: blumig, holzig, grün, wachsig, Apfel/Rose. Zitrus kaum belegt. |
| Bisabolol | fehlt (Blumig 1,0) | Blumig 0,55 · Süß 0,3 · Kräutrig 0,15 | Kamille, mild süß, blumig (Good Scents: schwach blumig, süß). Muss in die Tabelle und ins Terpen-Netz. |

Die Anteile bleiben bei Summe 1 und erster Eintrag gleich DB-Hauptnote.

## Fehlende Terpene mit Vorschlag

Reihenfolge nach Häufigkeit in Laboranalysen von Medizinalcannabis (Myrcen, Caryophyllen, Limonen, Terpinolen, Pinene, Humulen, Linalool, Ocimen sind die Spitze; die übrigen meist unter 0,1 %).

| Terpen (deutsch) | Englisch | Vorschlag | Aroma, Quelle |
|---|---|---|---|
| beta-Pinen | beta-Pinene | Holzig 0,45 · Kräutrig 0,35 · Würzig 0,2 | grün, holzig, harzig, etwas würzig (Good Scents); schon im Stamm. |
| alpha-Terpineol | alpha-Terpineol | Blumig 0,5 · Holzig 0,25 · Zitrus 0,25 | Flieder, Kiefer, leicht Zitrus (Good Scents); schon im Stamm. |
| Eukalyptol (1,8-Cineol) | Eucalyptol | Minzig 0,7 · Kräutrig 0,2 · Würzig 0,1 | kampferartig, kühl, Eukalyptus (Good Scents). Wichtigster Träger für Minzig. |
| Borneol | Borneol | Minzig 0,45 · Holzig 0,35 · Erdig 0,2 | kampferartig, holzig, erdig. |
| Fenchol | Fenchol | Minzig 0,4 · Kräutrig 0,3 · Holzig 0,3 | kampferartig, Kiefer, Zitrus-Kraut; in Analysen häufiger als gedacht. |
| Guajol | Guaiol | Holzig 0,6 · Blumig 0,25 · Süß 0,15 | Holz, Rose, Tee (Guajakholz). |
| Valencen | Valencene | Zitrus 0,55 · Fruchtig 0,3 · Holzig 0,15 | süße Orange, holzig. |
| Geraniol | Geraniol | Blumig 0,6 · Zitrus 0,2 · Fruchtig 0,2 | Rose, Geranie, leichte Zitrusfrucht. |
| Caryophyllenoxid | Caryophyllene oxide | Holzig 0,45 · Würzig 0,35 · Erdig 0,2 | trocken holzig, würzig. |
| Camphen | Camphene | Holzig 0,4 · Minzig 0,35 · Kräutrig 0,25 | kampferartig, Tanne. |
| delta-3-Caren | delta-3-Carene | Holzig 0,5 · Würzig 0,25 · Zitrus 0,25 | süß-harzig, Kiefer, etwas Zitrus. |
| Phellandren | Phellandrene | Kräutrig 0,4 · Würzig 0,3 · Minzig 0,3 | pfeffrig-minzig, Dill. |
| Selinen | Selinene | Kräutrig 0,5 · Holzig 0,3 · Erdig 0,2 | krautig, Sellerie (Hopfenterpen). |

Empfehlung: die ersten sechs zuerst (beta-Pinen, Terpineol, Eukalyptol, Borneol, Fenchol, Guajol), weil sie im Stamm stehen, in der Übersetzung schon vorgesehen sind oder Minzig tragen. Die Englischregel in `terpenAnzeige` passt für alle (-en zu -ene, -ol bleibt); Ausnahmen Guajol, Eukalyptol schon gesetzt.

Hinweis Terpen-Netz: `TERPEN_ACHSEN` ist auf zehn feste Achsen gelegt, damit Netze vergleichbar bleiben. Bisabolol sollte die elfte werden; weitere seltene Terpene besser nur in der Aroma-Karte führen, nicht im Netz.

## Schwelle 20 % für Kandidaten

Die Schwelle ist vernünftig: bei zwei bis vier Noten je Terpen liegt die Hauptnote bei 0,35 bis 0,75, Nebennoten bei 0,1 bis 0,3. Mit 0,2 sind Hauptnote und eine kräftige Nebennote Kandidaten, Spurennoten nicht. Zwei Nachbesserungen: Erstens Minzig hat heute keinen Kandidaten; mit den Vorschlägen (Pinen 0,2, Eukalyptol, Borneol) löst sich das ohne Schwellenänderung. Zweitens gleich 0,2 ist Grenzfall; wer stabile Tests will, prüft `>= 0.2 - 1e-9` oder legt die Werte nie genau auf die Grenze, sonst kippt ein Anteil durch Rundung. Alternative für später: relative Schwelle (Anteil mindestens halb so groß wie die Hauptnote), damit Terpene mit flachem Profil wie Terpinolen nicht alle vier Achsen zugleich besetzen.

## Deutsche Schreibung

Die Datenbank nutzt „beta-Caryophyllen“, „alpha-Pinen“ in ASCII. Fachlich richtig sind β-Caryophyllen, α-Pinen, β-Pinen, α-Terpineol, α-Bisabolol, (E)-β-Ocimen, (E)-β-Farnesen, trans-Nerolidol, 1,8-Cineol (Eukalyptol), Guajol, Valencen, Geraniol, Borneol, Fenchol, δ-3-Caren. Vorschlag: Schlüssel und DB-Namen ASCII lassen (Suche, Abgleich, `terpenSchluessel`), aber eine Anzeige mit griechischen Buchstaben in `terpenAnzeige` ergänzen (alpha- zu α-, beta- zu β-). Das Humulen heißt fachlich α-Humulen, Bisabolol meist α-Bisabolol; die Kurzform ist für Nutzer besser lesbar.

## UX-Ideen für weniger kundige Nutzer (mit den bestehenden Reglern)

1. **Alltagsbild statt Name zuerst.** In der Terpenspalte unter dem Namen ein Wort aus `aromaSatz` zeigen: „Myrcen · Mango“, „Limonen · Zitronenschale“, „Linalool · Lavendel“. Die Sätze gibt es schon.
2. **Rückweg von der Achse zum Terpen sichtbar machen.** Zieht man einen Geschmacksregler, leuchten die Kandidaten aus `terpenKandidaten` kurz auf und ein Hinweis sagt „Zitrus kommt meist von Limonen“. Damit lernt der Nutzer die Zuordnung beim Bewerten, ohne neues Bedienelement.
3. **Herstellerterpene als Startpunkt erklären.** Ein Satz über der Karte: „Vorbelegt mit den Terpenen, die der Hersteller nennt. Schalte aus, was du nicht schmeckst.“
4. **Achsen mit Beispielen beschriften.** Im Tooltip der Achse zwei Alltagsbeispiele: Holzig „Kiefer, Zedernholz“, Minzig „Eukalyptus, Kampfer“, Diesel „Gas, Benzin, kein Terpen“.
5. **Begleitstoffe ehrlich zeigen.** Bei Fruchtig und Diesel kurz „oft keine Terpene, sondern Ester bzw. Thiole“; das verhindert, dass Nutzer eine Diesel-Note einem Terpen zuschreiben.
6. **Seltene Terpene zurückhaltend.** Neue Nebenterpene nur einblenden, wenn der Hersteller sie nennt oder der Nutzer sie über „ergänzen“ wählt; die Auswahl bleibt klein (Hick).

Alle Texte nur Duft und Geschmack, keine Wirkung, keine Heilversprechen.

## Nachweis in Cannabis (online geprüft, 2026-10-20)

Frage: Kommen die 14 neu aufgenommenen Terpene nachweislich in Cannabis sativa vor? Ergebnis: alle 14 belegt, keines wird entfernt. Größenordnung: Haupt (über 1 mg/g bzw. über 5 % des Öls in manchen Sorten), Neben (0,1 bis 1 mg/g bzw. 0,5 bis 5 %), Spur (darunter).

Quellen:
- [F] Fischedick 2017, Identification of Terpenoid Chemotypes Among High (−)-trans-Δ9-THC-Producing Cannabis sativa L. Cultivars, Cannabis Cannabinoid Res 2(1):34–47, doi:10.1089/can.2016.0040, https://pmc.ncbi.nlm.nih.gov/articles/PMC5436332/ (233 Blütenproben, 30 Sorten, GC)
- [M] Micalizzi et al. 2021, Development of a Novel Microwave Distillation Technique for the Isolation of Cannabis sativa L. Essential Oil …, Molecules 26(6):1588, doi:10.3390/molecules26061588, https://pmc.ncbi.nlm.nih.gov/articles/PMC8000122/ (ätherische Öle aus Blütenständen, GC-MS/FID; Werte = relative Flächen-%)
- [B] Booth, Page, Bohlmann 2017, Terpene synthases from Cannabis sativa, PLoS ONE 12(3):e0173911, doi:10.1371/journal.pone.0173911, https://pmc.ncbi.nlm.nih.gov/articles/PMC5371325/
- [C] Costa et al. 2021, Antiseizure Effects of Fully Characterized Non-Psychoactive Cannabis sativa L. Extracts …, Pharmaceuticals 14(12):1259, doi:10.3390/ph14121259, https://pmc.ncbi.nlm.nih.gov/articles/PMC8703309/ (Hanfextrakte, GC-MS)
- [R] Richins et al. 2018, Accumulation of bioactive metabolites in cultivated medical Cannabis, PLoS ONE, doi:10.1371/journal.pone.0201119, https://pmc.ncbi.nlm.nih.gov/articles/PMC6056047/ (72 Blütenproben)

| Terpen (Isomer) | belegt | Nachweis | Größenordnung | Quelle |
|---|---|---|---|---|
| Bisabolol (α-Bisabolol) | ja | Blüten quantifiziert, u. a. Master Kush, Bubba Kush, Sour Diesel; im Öl 0,09–14 % | Neben, selten Haupt | [F], [M] |
| β-Pinen | ja | Blüten bis ca. 2,0 mg/g (Blue Dream); in Finola 8,6 % der Monoterpene, von CsTPS1/5 gebildet | Neben bis Haupt | [F], [B] |
| Terpineol (α-Terpineol) | ja | Blüten bis ca. 0,9 mg/g (Gelato), OG-Kush-Gruppe 0,5–0,7 mg/g; Öl 0,08–0,29 % | Neben | [F], [M] |
| Eukalyptol (1,8-Cineol) | ja | im Blütenöl 0,16–0,61 % | Spur bis Neben | [M] |
| Borneol | ja | im Blütenöl 0,08–0,23 % | Spur | [M] |
| Fenchol (endo-Fenchylalkohol) | ja | Blüten quantifiziert, am höchsten in Gelato; Öl 0,10–0,39 % | Neben | [F], [M] |
| Guajol (Guaiol) | ja | im Blütenöl 0,69–9,25 % | Neben bis Haupt | [M] |
| Valencen | ja | im Blütenöl 0,03–6,68 %; Hauptprodukt von CsTPS8 (19,6 %) | Spur bis Neben | [M], [B] |
| Geraniol | ja (schwächster Beleg) | als Analyt im Blütenpanel von 72 Proben geführt [R]; [B]: Monoterpenalkohole „such as linalool or geraniol, which are common in some cannabis strains“ | Spur | [R], [B] |
| Caryophyllenoxid | ja | im Blütenöl 0,05 % bis hoch (oxidiert bei Lagerung); Hanfextrakt 8,25 µg/ml | Spur bis Neben | [M], [C] |
| Camphen | ja | im Blütenöl 0,10–0,49 %; Nebenprodukt von CsTPS1 | Spur | [M], [B], [C] |
| δ-3-Caren | ja | im Blütenöl 0,09–2,95 %; in Blüten meist unter Bestimmungsgrenze, per GC-MS bestätigt (Jack Herer) | Spur bis Neben | [M], [F] |
| Phellandren (α-Phellandren) | ja | Blüten bis ca. 0,4 mg/g (Trainwreck, Terpinolen-Typ); Öl 0,02–0,23 % | Spur | [F], [M] |
| Selinen (α-/β-Selinen) | ja | im Blütenöl α 0,11–17,9 %, β 0,08–25,5 % | Neben bis Haupt (sortenabhängig) | [M] |

Folge: keine Migration, keine Entfernung. Geraniol hat den dünnsten Primärbeleg (Werte in Supplement S1 von [R] nicht eingesehen); fachlich unstrittig, aber nur in Spuren. Hinweis Abruf: PMC sperrte direkte Abrufe zeitweise, Volltexte über Europe PMC (ebi.ac.uk) gelesen.
