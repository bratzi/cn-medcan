# Englisch-Umschalter: Design

**Stand:** 2026-09-26, Session 22 (Welle 1, Block W1-E)
**Auftrag (Nutzer):** Die Oberfläche soll sich auf Englisch umschalten lassen.

**Entschieden vom Nutzer:**
- Die Sprache steckt in einem **Cookie**. Die URLs bleiben gleich: kein `/en`-Präfix, keine Änderung
  an `proxy.ts`.
- Übersetzt wird **nur die Oberfläche**. Was Betreiber oder Mitglieder schreiben (Blütentexte,
  Reviews, Begründungen, Vorschlagsnotizen), bleibt in der Sprache, in der es geschrieben wurde.
- **Deutsch ist Standard.**
- Der Umschalter sitzt neben dem Grow-Zelt-Themaschalter (`components/layout/ThemaSchalter.tsx`).
- **Freigabe 2026-09-27 (Session 23):** Accept-Language-Erkennung ja; `en-GB`; der Umschalter wird
  erst sichtbar, wenn alle Wellen übersetzt sind.

Alle anderen Entscheidungen hier habe ich getroffen; sie sind mit **Entscheidung Claude** markiert,
mit Grund, und können beim Lesen korrigiert werden. Pfade sind schon als `/blueten` geschrieben
(die Umbenennung von `/produkte` kommt in Welle 2 vorher).

---

## 1. Ziel und Erfolg

Wer kein Deutsch liest, soll den Katalog, die Reviews und die Umfragen bedienen können. Erfolg heißt:
1. Ein Klick auf „EN“ schaltet jede öffentliche Seite und den Mitgliederbereich auf Englisch, ohne
   neue URL; der Wechsel bleibt über Besuche erhalten.
2. Ein Erstbesuch mit englischem Browser sieht Englisch, alle anderen Deutsch.
3. `<html lang>` stimmt mit der angezeigten Sprache überein.
4. Kein deutscher Oberflächentext bleibt in einer umgestellten Datei stehen (Test, Abschnitt 8).
5. Der CPU-Rahmen von 10 ms je Anfrage wird nicht spürbar belastet, der Browser lädt kein Wörterbuch
   als eigenes Paket.

Nicht Teil dieses Vorhabens: `/admin`, übersetzte Nutzerinhalte, weitere Sprachen, englische URLs,
Suchmaschinen-Varianten (`hreflang`; die Seite steht ohnehin auf `noindex`).

## 2. Ausgangslage

- Keine i18n-Infrastruktur. Rund 450 Oberflächentexte, verteilt auf Seiten, Komponenten und diese
  Sammelstellen: `lib/labels.ts`, `lib/query/bewertung.ts`, `components/review/BeschaffenheitsLeiste.tsx`,
  `lib/terpen-aromen.ts`, `lib/medien.ts`, `components/auth/fehlertexte.ts`, `lib/navigation.ts`.
- `lib/benachrichtigung.ts` schreibt **fertige deutsche Sätze** in die Datenbank.
- 32 Dateien mit `"use client"`.
- Zahlen- und Datumsformate zentral in `lib/format.ts`, fest `de-DE`.
- Root-Layout rendert `<html lang="de">` und liest heute keine Cookies.
- Fast alle Inhaltsseiten sind bereits `force-dynamic`; `proxy.ts` sperrt die Seite hinter das
  Entwicklungs-Passwort.

## 3. Ansätze

**A. Eigene Wörterbücher ohne Bibliothek (empfohlen, Entscheidung Claude).** Zwei TypeScript-Objekte,
eine Nachschlagefunktion, eine Ersetzung für Platzhalter. Genau das Muster aus dem Next-Leitfaden
(`01-app/02-guides/internationalization.md`, Abschnitt „Localization“: `getDictionary` je Sprache, in
Server Components geladen, deshalb nicht im Browser-Paket). *Grund:* 450 Texte mit wenig
Pluralbildung brauchen keinen ICU-Parser; jede Bibliothek bringt Laufzeitcode in den Worker (10 ms
CPU im Free-Plan) und einen Provider samt Code in den Browser. Die Nachschlage-Kosten sind hier ein
Objektzugriff.

B. `next-intl`. Ausgereift, ICU-Formate, Typen. Aber zusätzliche Abhängigkeit (Regel „keine
Extra-Installationen“), Nachrichten-Parsing zur Laufzeit, und sein Standardaufbau erwartet die
Sprache im Pfad oder in einer Middleware; beides haben wir ausgeschlossen.

C. Routing nach Leitfaden (`app/[lang]/…`, Weiterleitung im Proxy, `next/root-params`). Vom Nutzer
verworfen (gleiche URLs, Proxy unverändert). Folge: `next/root-params` steht uns nicht zur Verfügung,
die Sprache kommt aus `cookies()`.

## 4. Sprache bestimmen und setzen

### 4.1 Erkennung (Entscheidung Claude)

`lib/i18n/sprache.ts` exportiert `holeSprache(): Promise<"de" | "en">`, per React `cache` einmal je
Anfrage ausgewertet:
1. Cookie `sprache` mit Wert `de` oder `en` → dieser Wert.
2. Kein oder ungültiges Cookie → `Accept-Language` aus `headers()`: steht unter den Einträgen mit
   höchster Gewichtung ein `en`/`en-*` vor jedem `de`/`de-*`, dann `en`.
3. Sonst `de`.

*Grund:* Das Cookie ist die ausdrückliche Wahl und gewinnt immer. Der Leitfaden empfiehlt die
Browser-Sprache als Ausgangspunkt; wir lesen sie aber nur, solange niemand gewählt hat, und fallen
bei jeder Unklarheit (auch Französisch, Niederländisch usw.) auf Deutsch zurück. Der Parser ist ein
paar Zeilen eigener Code, keine `negotiator`/`intl-localematcher`-Abhängigkeit.

Laut Doku sind `cookies()` und `headers()` Request-time-APIs und machen die Route dynamisch. Das
Root-Layout liest die Sprache, also wird **jede** Route dynamisch. Das trifft nur noch die wenigen
Seiten ohne `force-dynamic` (z. B. `/anmelden`, `/registrieren`, `/vorschlagen`); sie werden ohnehin
pro Nutzer ausgeliefert. Hinweis dazu in Abschnitt 9.

### 4.2 Setzen (Entscheidung Claude)

Server Action `spracheSetzen(sprache)` in `lib/i18n/aktionen.ts`:
- prüft den Wert gegen `["de", "en"]`,
- setzt `cookies().set("sprache", wert, { path: "/", maxAge: 365 Tage, sameSite: "lax", secure: true,
  httpOnly: true })`,
- ruft `refresh()` aus `next/cache`.

*Grund:* Laut Doku darf ein Cookie nur in einer Server Function oder einem Route Handler gesetzt
werden, nicht beim Rendern; nach dem Setzen in einer Server Action liefert Next die neue Oberfläche
im selben Roundtrip. `httpOnly`, weil nur der Server die Sprache liest. Kein Login nötig: die Wahl
gilt für Gäste wie Mitglieder, ein Profilfeld kommt nicht dazu.

### 4.3 Umschalter

`components/layout/SprachSchalter.tsx`, fest oben links direkt neben dem Grow-Zelt, gleiche Höhe
und Trefferfläche (≥ 44 px). Ein `<form action={spracheSetzen}>` mit zwei Knöpfen „DE“ und „EN“,
die aktuelle Sprache mit `aria-pressed="true"`. Jeder Knopf trägt `lang` seiner Sprache und einen
`sr-only`-Text in dieser Sprache („Deutsch“, „English“). *Entscheidung Claude:* Formular statt
`onClick`, damit es ohne JavaScript und vor dem Hydrieren funktioniert; Gestaltung nach
`ui-design-engine` (Pille, gedruckte Schrift, keine Flaggen, weil Flaggen Länder zeigen, nicht
Sprachen).

## 5. Wörterbücher

### 5.1 Aufbau (Entscheidung Claude)

- `lib/i18n/de.ts`: Quelle der Wahrheit, verschachteltes Objekt `as const`, gegliedert nach Bereich
  (`kopf`, `katalog`, `bluete`, `review`, `umfrage`, `mitglied`, `auth`, `vorschlag`, `meldung`,
  `benachrichtigung`, `format`).
- `lib/i18n/en.ts`: typisiert als `Woerterbuch` (die Form von `de` mit `string`-Werten); fehlende
  oder überzählige Schlüssel sind Compilerfehler.
- `lib/i18n/index.ts`: `holeWoerterbuch()` (server-only, liest `holeSprache()`) und
  `t(text, parameter)` für Platzhalter der Form `{name}`. Mehrzahl über eine `Intl.PluralRules`-
  Modulkonstante je Sprache, Einträge als `{ one, other }`.
- Die heutigen Sammelstellen (`lib/labels.ts`, `lib/terpen-aromen.ts`, `lib/navigation.ts`,
  `components/auth/fehlertexte.ts`, `lib/medien.ts`, `lib/query/bewertung.ts`,
  `BeschaffenheitsLeiste.tsx`) behalten ihre Schlüssel und Logik, ihre Texte wandern ins Wörterbuch.

### 5.2 Client Components (Entscheidung Claude)

Server Components lesen das Wörterbuch direkt. Client Components bekommen **nur ihre Texte als
Props** (ein Ausschnitt wie `woerterbuch.umfrage.stimme`), vom nächsten Server-Elternteil übergeben.
Wo viele Client-Teile denselben Ausschnitt brauchen (Kopf, Formulare), stellt ein kleiner
`TexteProvider` mit React-Context genau diesen Ausschnitt bereit. *Grund:* Das ganze Wörterbuch im
Browser wäre bei jeder Sprache doppelt Last; Props halten die RSC-Nutzlast klein und machen sichtbar,
welche Komponente welche Texte braucht.

### 5.3 Server Actions (Entscheidung Claude)

Server Actions geben keine Sätze mehr zurück, sondern **Meldungsschlüssel** mit Parametern, z. B.
`{ fehler: "vorschlag.schonVorhanden", parameter: { name } }`. Die aufrufende Komponente löst den
Schlüssel mit ihren Texten auf. *Grund:* Die Aktion kennt die Sprache zwar über `cookies()`, aber der
Schlüssel ist testbar, sprachunabhängig und bleibt gültig, falls die Sprache zwischen Absenden und
Anzeigen wechselt.

### 5.4 Benachrichtigungen (Entscheidung Claude)

`lib/benachrichtigung.ts` speichert künftig `art` plus `parameter` (JSON, z. B. `handelsname`,
`begruendung`) statt eines fertigen Satzes; der Satz entsteht beim Anzeigen in der Sprache des
Lesers. Migration: neue Spalte `parameter`, `text` wird optional. Alte Zeilen ohne `parameter`
zeigen ihren gespeicherten deutschen Text. Die `begruendung` ist Betreiberinhalt und bleibt, wie sie
geschrieben wurde. Ein späterer Mailversand rendert an derselben Stelle; welche Sprache eine Mail bekommt
(dafür bräuchte das Mitglied ein Sprachfeld), entscheidet dessen eigene Spec.

### 5.5 Was deutsch bleibt (Entscheidung Claude)

- `/admin` komplett. *Grund:* Ein Betreiber, deutschsprachig; halbiert den Aufwand.
- Nutzer- und Betreiberinhalte (Nutzerentscheid). Handelsnamen, Kultivar- und Herstellernamen sind
  Eigennamen und bleiben ohnehin.
- URLs (`/blueten`, `/umfragen`, `/mitglied` …), Nutzerentscheid.
- Die Wortmarke „Book of Terpz“.

## 6. Formate und Metadaten

- `lib/format.ts` bekommt je Sprache eigene `Intl`-Modulkonstanten (`de-DE` und `en-GB`), weiterhin
  einmal beim Laden erzeugt; jede Funktion nimmt `sprache` als letzten Parameter mit Standard `"de"`,
  bestehende Aufrufe bleiben gültig. *Entscheidung Claude:* `en-GB`, weil Tag-Monat-Jahr, Euro und
  metrische Einheiten näher am Katalog liegen als `en-US`. Feste Wörter wie „k. A.“, „Werktage“ und
  „Preis auf Anfrage“ kommen aus dem Wörterbuch (`format`).
- Root-Layout: `<html lang={sprache}>`. Die Beschreibung in `metadata` wird zu `generateMetadata` im
  Layout, das `holeSprache()` liest; laut Doku ist das Teil des Renderns und hier ohnehin dynamisch.
  Seitentitel mit festem Text folgen demselben Weg.

## 7. Glossar und Ton (Entscheidung Claude)

Ein Glossar in `docs/i18n-glossar.md` hält die Begriffe fest, bevor übersetzt wird:

| Deutsch | Englisch |
|---|---|
| Blüte | flower |
| Sorte / Kultivar | strain / cultivar |
| Charge | batch |
| Bewertung, Review | review |
| Umfrage, Runde | poll, round |
| Mitglied | member |
| Betreiber | operator |
| Hersteller | producer |
| Beschaffenheit | condition |
| Aroma, Geschmack | aroma, flavour |
| Terpen | terpene |
| Vorschlag | suggestion |
| verifiziert | verified |

Britische Schreibweise, passend zu `en-GB`. Ton: sachlich, wie das deutsche Original, Du-Form wird
zu neutralem „you“.

**HWG:** Die englischen Texte unterliegen denselben Grenzen wie die deutschen: kein Werbeton für
verschreibungspflichtige Arzneimittel gegenüber Laien (§ 10 HWG), keine Wirkungsversprechen, keine
Preis-Lockrufe. Übersetzt wird wörtlich-sachlich; kein Text darf im Englischen werblicher klingen als
im Deutschen. Jede Welle prüft ihre neuen Texte darauf, bevor sie live geht.

## 8. Tests

- **Schlüsselgleichheit:** `de` und `en` haben dieselben Schlüssel, keine leeren Werte, dieselben
  Platzhalter je Eintrag (Vitest, zusätzlich zum Typcheck).
- **Wächter gegen deutsche Literale:** ein Quelltext-Test durchsucht die bereits umgestellten Dateien
  unter `app/**` und `components/**` (ohne `app/admin/**`) nach Zeichenketten und JSX-Text mit
  Umlauten, ß oder einer kurzen Liste häufiger deutscher Wörter. Die Liste der umgestellten Dateien
  wächst mit jeder Welle; Ausnahmen (Eigennamen) stehen in einer Erlaubnisliste im Test.
- **Formate:** `formatiereProzent`, `formatiereDatum`, `formatiereRelativ`, `formatiereLieferzeit`
  je Sprache mit festen Erwartungswerten.
- **Erkennung:** `holeSprache`-Kern als reine Funktion (Cookie-Wert, Accept-Language-Zeile) → Sprache,
  inkl. Gewichtungen und ungültiger Werte.
- **Benachrichtigung:** Satz aus `art` + `parameter` in beiden Sprachen; alte Zeile mit `text`.
- Live-Prüfung nach jedem Push per Browser-MCP: umschalten, Seite wechseln, neu laden, `lang` prüfen.

## 9. Caching

Mit gleichen URLs hängt das HTML von der Sprache ab (und schon heute vom Nutzer). Deshalb wird
**kein HTML** zwischengespeichert, nur Daten (Katalog-, Review- und Umfrageabfragen), wie in der
Caching-v2-Spec (W1-F) vorgesehen. Gecachte Daten dürfen keine übersetzten Texte enthalten; die
Übersetzung passiert nach dem Cache beim Rendern.

## 10. Umsetzungsreihenfolge (Wellen)

0. **Gerüst:** `lib/i18n/*`, Erkennung, Server Action, `SprachSchalter`, `<html lang>`,
   `generateMetadata`, `lib/format.ts` je Sprache, Glossar, die Tests aus Abschnitt 8. Wörterbuch
   anfangs nur mit Kopf und Fuß.
1. **Rahmen:** Kopf, Fuß, `lib/navigation.ts`, Themaschalter-Texte, Fehler- und 404-Seite,
   Anmelden/Registrieren samt `components/auth/fehlertexte.ts`.
2. **Katalog:** `/blueten` Liste und Detail, `lib/labels.ts`, `lib/terpen-aromen.ts`, Aroma-Karte,
   `lib/medien.ts`.
3. **Reviews und Bewerten:** `/reviews`, `/bewerten`, `lib/query/bewertung.ts`,
   `BeschaffenheitsLeiste.tsx`.
4. **Umfragen, Startseite, Apotheken-Vorschau.**
5. **Mitgliederbereich, Vorschlagen, Benachrichtigungen** (mit Migration aus 5.4).

Jede Welle: Texte ins Wörterbuch, Dateien in den Literal-Wächter, HWG-Blick, Push, Live-Prüfung.
Bis Welle 5 durch ist, zeigt Englisch Mischseiten. Deshalb sind Schalter **und** die
Accept-Language-Erkennung erst nach Welle 2 aktiv (ein Schalter in `lib/i18n/sprache.ts`); davor
gilt nur ein von Hand gesetztes Cookie, damit englische Browser nicht auf halbfertige Seiten treffen.
