# Blüte vorschlagen: Design

**Stand:** 2026-09-25, Session 18
**Auftrag (Nutzer, 2026-09-25):** Fehlt eine Blüte im Katalog, kann jedes angemeldete Mitglied sie
eintragen (Name, Hersteller, Kultivar, THC/CBD, Terpene, Quelle). Der Betreiber prüft sie im Admin,
passt sie an und gibt sie frei oder lehnt ab. Die vorschlagenden Mitglieder werden informiert. Später
kommt eine große JSON mit vielen Blüten zum Import; der Import darf die Vorschläge nicht doppeln.

**Entschieden vom Nutzer:**
- Mailversand kommt **später**. Jetzt nur Benachrichtigungen im Mitgliederbereich. Grund: jeder
  Versandweg kostet (Cloudflare Email Sending nur im Workers-Paid-Plan, dazu eine eigene
  Absenderdomain), und das Projekt muss kostenlos bleiben.

Alle anderen Entscheidungen hier habe ich getroffen; sie sind mit **(E)** markiert und können beim
Lesen korrigiert werden.

---

## 1. Ziel und Erfolg

Das Mitglied soll nicht mehr an einer fehlenden Blüte hängen bleiben: Wer sie sucht und nicht findet,
kann sie mit wenigen Feldern vorschlagen, sieht den Stand seines Vorschlags und erfährt, wann sie im
Katalog steht. Der Betreiber behält die Hoheit über den Katalog: nichts erscheint ohne seine Freigabe.

Erfolg heißt:
1. Ein angemeldetes Mitglied legt einen Vorschlag in unter einer Minute an.
2. Der Betreiber sieht offene Vorschläge im Admin, gleiche Vorschläge gebündelt, und macht mit einem
   Formular daraus eine Blüte im Katalog.
3. Jedes Mitglied, das diese Blüte vorgeschlagen hat, bekommt eine Benachrichtigung mit Link.
4. Ein späterer Import derselben Blüte legt sie nicht doppelt an und schließt offene Vorschläge.

Nicht Teil dieses Vorhabens: Mailversand, der JSON-Import selbst (nur seine Schnittstelle zu den
Vorschlägen), Bilder zum Vorschlag, Bearbeiten bestehender Katalogeinträge durch Mitglieder.

## 2. Ansätze

**A. Eigene Vorschlagstabelle, Freigabe legt die Blüte an (empfohlen, E).** Der Vorschlag lebt
getrennt vom Katalog. Freigabe erzeugt einen `Strain`. Der Katalog bleibt sauber, die Katalogabfragen
ändern sich nicht.

B. Vorschlag direkt als `Strain` mit `aktiv = false`. Weniger Tabellen, aber jede Katalogabfrage muss
unfertige Sätze sicher ausfiltern, Pflichtfelder wie `kultivarTyp` bräuchten Platzhalter, und
abgelehnte Vorschläge liegen als Leichen im Katalog.

C. Nur ein Freitext an den Betreiber (wie ein Kontaktformular). Am billigsten, aber ohne Status,
ohne Dublettenprüfung und ohne Rückmeldung an das Mitglied; erfüllt den Auftrag nicht.

## 3. Datenmodell

### 3.1 `SortenVorschlag` (Tabelle `sorten_vorschlaege`)

Der Name grenzt sich vom bestehenden `UmfrageVorschlag` ab (dort schlagen Mitglieder eine
*vorhandene* Blüte für eine Runde vor).

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | uuid | |
| `mitgliedId` | → Mitglied, Cascade | wer vorgeschlagen hat |
| `handelsname` | String | wie eingegeben |
| `schluessel` | String | Slug aus dem Handelsnamen, gleiche Regel wie `scripts/stamm/sql-erzeugen.py` (`slug()`) |
| `hersteller` | String? | Freitext |
| `kultivarName` | String? | |
| `kultivarTyp` | String? | INDICA/SATIVA/HYBRID/RUDERALIS oder leer („weiß ich nicht“) |
| `thcProzent`, `cbdProzent` | Float? | ein Wert je Cannabinoid, wie auf der Packung |
| `terpene` | String? | JSON-Liste von bis zu 3 Terpennamen aus dem Katalog, in Rangfolge (ohne Prozent) |
| `quelle` | String | Pflicht: URL oder kurzer Text („Packung“, „Apotheke XY“) |
| `notiz` | String? | Freitext für den Betreiber, max. 500 Zeichen |
| `status` | String | OFFEN / FREIGEGEBEN / ABGELEHNT (neue Werteliste `VORSCHLAG_STATUS` in `db/enums.ts`, Trigger in `db/constraints.sql`) |
| `strainId` | → Strain?, SetNull | die Blüte, die daraus wurde |
| `begruendung` | String? | Ablehnungsgrund, sichtbar für das Mitglied |
| `erstelltAm`, `entschiedenAm` | DateTime | |

Indizes: `@@unique([mitgliedId, schluessel])` (ein Mitglied schlägt dieselbe Blüte nur einmal vor,
von der Datenbank erzwungen, nicht von einer Prüfung vorher), `@@index([status, schluessel])`,
`@@index([mitgliedId])`.

**(E)** Mehrere Mitglieder dürfen dieselbe Blüte getrennt vorschlagen. Im Admin werden sie über den
`schluessel` gebündelt („3 Vorschläge“), die Freigabe schließt alle offenen mit diesem Schlüssel und
benachrichtigt alle. So wird niemand übergangen, und die Zahl zeigt dem Betreiber, wie gefragt eine
Blüte ist.

### 3.2 `Benachrichtigung` (Tabelle `benachrichtigungen`)

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | uuid | |
| `mitgliedId` | → Mitglied, Cascade | Empfänger |
| `art` | String | VORSCHLAG_FREIGEGEBEN / VORSCHLAG_ABGELEHNT (Werteliste, erweiterbar) |
| `text` | String | fertiger Satz, z. B. „Deine Blüte Apples & Bananas steht jetzt im Katalog.“ |
| `link` | String? | interner Pfad, z. B. `/produkte/apples-bananas` |
| `gelesenAm` | DateTime? | null = ungelesen |
| `erstelltAm` | DateTime | |

Index `@@index([mitgliedId, gelesenAm])`. **(E)** Allgemein gehalten, damit später auch Umfragen
(„Deine Blüte hat gewonnen“) und der Mailversand dieselbe Tabelle nutzen: ein Mailversand liest
später genau diese Sätze und verschickt sie, eine Stelle in `lib/benachrichtigung.ts`.

### 3.3 Id der neuen Blüte

Der Import vergibt `strains.id = uuid5(NS, "s:" + slug)` und fängt nur Konflikte auf der Id ab
(`ON CONFLICT(id) DO UPDATE`). Würde die Freigabe eine zufällige Id vergeben, bräche ein späterer
Import derselben Blüte am Unique-Index auf `slug` ab. Deshalb **(E)**: Die Freigabe erzeugt dieselbe
Id nach derselben Regel (`lib/stamm-id.ts`, uuid v5 per `crypto.subtle` SHA-1, gleicher Namensraum
`6f1c2b8e-…`). Ein Test prüft die Gleichheit mit einem Wert, den das Python-Skript erzeugt.
Ein späterer Import aktualisiert die Blüte dann einfach mit seinen Daten.

Dasselbe gilt für neu angelegte Hersteller: der Import vergibt `unternehmen.id = uuid5(NS, "u:" + schluessel)`
(Schlüssel = Name kleingeschrieben, ohne Zusätze wie „GmbH“, „Pharma“), und `unternehmen` hat einen
Unique-Index auf `(name, rolle)`. Die Freigabe legt Hersteller deshalb mit derselben Id-Regel an.

## 4. Abläufe

### 4.1 Vorschlagen (Mitglied)

- **Wer (E):** jedes angemeldete Mitglied, auch vor der Freigabe des Kontos (so hat es der Nutzer
  formuliert; die Prüfung macht der Betreiber). Nicht angemeldet → Weiterleitung auf `/anmelden`.
- **Wo (E):** Seite `/vorschlagen`. Einstiege: im Katalog unter der Liste („Blüte fehlt? Schlag sie
  vor.“), im leeren Suchergebnis (mit dem Suchbegriff als vorausgefülltem Handelsnamen), im
  Vorschlagsschritt der Umfrage, und im Mitgliederbereich.
- **Formular:** Handelsname und Quelle Pflicht, alles andere optional. Terpene als Auswahl aus den
  Katalog-Terpenen (kein Freitext, damit die Freigabe sie direkt zuordnen kann).
- **Prüfung beim Absenden, in dieser Reihenfolge:**
  1. Eingaben per zod (`lib/vorschlag-eingabe.ts`), Zahlen 0 bis 40 % THC, 0 bis 30 % CBD.
  2. Blüte existiert schon (Slug oder Handelsname gleich) → kein Vorschlag, stattdessen Hinweis mit
     Link auf die Blüte.
  3. Eigener Vorschlag mit demselben Schlüssel → Unique-Index weist ab, Hinweis „Hast du schon
     vorgeschlagen“, Link auf den Stand.
  4. **(E)** Höchstens 5 offene Vorschläge je Mitglied, gegen Spam. Gezählt vor dem Schreiben; ein
     Überschreiten um eins bei gleichzeitigem Absenden ist hier harmlos.
- Nach dem Absenden: Bestätigung auf der Seite und Eintrag in „Meine Vorschläge“.

### 4.2 Prüfen und freigeben (Betreiber)

- Neuer Abschnitt in `/admin`: „Vorgeschlagene Blüten“, offene Vorschläge nach Schlüssel gebündelt,
  älteste zuerst, mit Anzahl, allen Quellen und Notizen.
- **Freigeben** öffnet ein Formular, vorausgefüllt aus dem ersten Vorschlag, Lücken aus den weiteren:
  Handelsname, Kultivarname, Kultivartyp (Pflicht), THC/CBD von–bis (aus dem Einzelwert vorbelegt),
  Hersteller (Auswahl bestehender Unternehmen oder neu anlegen), Terpene mit Rang, Bestrahlung,
  Anbauland. Pflichtfelder des `Strain` müssen hier gefüllt werden.
- **Schreibfolge ohne Transaktion (D1):**
  1. Unternehmen suchen oder anlegen (Unique `name, rolle` fängt Doppelklicks ab).
  2. `Strain` mit der Id aus 3.3 anlegen. Existiert sie schon (Import dazwischen, Doppelklick), wird
     nicht abgebrochen, sondern mit der vorhandenen Blüte weitergemacht.
  3. Terpene schreiben.
  4. Alle offenen Vorschläge mit diesem Schlüssel auf FREIGEGEBEN setzen, `strainId` setzen.
  5. Je Mitglied eine Benachrichtigung.
  Jeder Schritt ist wiederholbar; bricht einer ab, führt ein zweiter Klick zum selben Ergebnis.
  Kein `$transaction`: Prisma führt es gegen D1 als Einzelabfragen aus (db/README.md), es brächte nichts.
- **Ablehnen:** mit optionaler Begründung (sichtbar für das Mitglied), setzt alle offenen Vorschläge
  des Schlüssels auf ABGELEHNT, Benachrichtigung an alle.
- **Zusammenführen (E):** Wurde die Blüte unter anderem Namen vorgeschlagen, als sie im Katalog
  steht (Schreibvariante), kann der Betreiber statt „Freigeben“ eine vorhandene Blüte auswählen:
  Vorschläge werden FREIGEGEBEN mit dieser `strainId`, Benachrichtigung wie bei der Freigabe.

### 4.3 Benachrichtigen (Mitglied)

- Im Kopf trägt die Konto-Pille einen Zähler ungelesener Benachrichtigungen (Zahl in `numeric`, mit
  `sr-only`-Text „3 ungelesene Benachrichtigungen“). Der Kopf liest bewusst keine Sitzung (sonst wäre
  jede Seite dynamisch); der Zähler holt die Zahl deshalb im Browser von `GET /api/benachrichtigungen`
  (ein `count` auf dem Index, 0 ohne Anmeldung) und merkt sie sich 60 Sekunden in `sessionStorage`.
- In `/mitglied`: Abschnitt „Benachrichtigungen“ (neueste zuerst, 20 Stück) und „Meine Vorschläge“
  mit Status-Badge (Klartext plus Formmarker: offen, im Katalog, abgelehnt mit Begründung).
- **(E)** Gelesen wird beim Öffnen von `/mitglied` für alle angezeigten gesetzt (eine Server Action,
  die der Abschnitt nach dem Anzeigen einmal aufruft), kein einzelnes Wegklicken.

### 4.4 Späterer JSON-Import

`scripts/stamm/sql-erzeugen.py` hängt je importierter Blüte zwei Anweisungen an:
`UPDATE sorten_vorschlaege SET status='FREIGEGEBEN', strain_id=…, entschieden_am=… WHERE schluessel=… AND status='OFFEN'`
und ein `INSERT … SELECT` für die Benachrichtigungen dieser Vorschläge (vor dem UPDATE). Damit
schließt der Import passende Vorschläge und informiert die Mitglieder; doppelt angelegt wird nichts,
weil die Id gleich ist. Umgesetzt wird das zusammen mit dem Import, hier nur festgelegt.

## 5. Oberfläche

- Regelwerk `ui-design-engine`: Formular und Listen gedruckt (`font-sans`), keine Handschrift außer
  einer kurzen Randnotiz auf `/vorschlagen` (Community spricht, ≥ 32 px). Handelsnamen nie in
  Handschrift. Eine gefüllte Primäraktion je Ansicht, Pillen für Buttons und Badges.
- Wortwahl im Auftritt „Blüte“ (seit Session 17), im Code `SortenVorschlag`.
- HWG: Vorschläge enthalten keine Preise und keine Wirkungsangaben; das Formular fragt nicht danach.

## 6. Sicherheit

- Jede Server Action beginnt mit `mitgliedErforderlich()` bzw. `adminErforderlich()`.
- Mitglieder lesen nur eigene Vorschläge und Benachrichtigungen (Filter `mitgliedId` in der Abfrage,
  nie aus dem Formular übernommen).
- `quelle` als URL wird nur als Text mit `rel="noopener noreferrer nofollow"` verlinkt, und nur
  `http(s)`.
- `link` in Benachrichtigungen ist immer ein interner Pfad, den der Server setzt.

## 7. Tests

- `lib/vorschlag-eingabe.ts`: Pflichtfelder, Grenzen, Terpene nur aus der Liste, Schlüssel = Slug.
- `lib/stamm-id.ts`: gleiche Id wie das Python-Skript für zwei feste Namen (mit Umlaut).
- Bündelung der offenen Vorschläge nach Schlüssel und Vorbelegung des Freigabeformulars (reine
  Funktionen).
- Quelltext-Tests wie bisher für die Admin-Gates.
- Live-Prüfung nach dem Push per Browser-MCP: Vorschlag anlegen, im Admin freigeben, Zähler und
  Benachrichtigung sehen, Blüte im Katalog.

## 8. Umsetzungsreihenfolge

1. Migration 0006 (zwei Tabellen, Trigger), Schema, Wertelisten.
2. `lib/stamm-id.ts`, `lib/vorschlag-eingabe.ts` mit Tests.
3. `/vorschlagen` mit Server Action und Einstiegen.
4. Admin-Abschnitt: Liste, Freigabe, Ablehnung, Zusammenführen.
5. Benachrichtigungen: Zähler im Kopf, Abschnitte in `/mitglied`.
6. Live-Prüfung, HANDOFF.
