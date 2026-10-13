# Profil und Konto vereint

**Stand:** 2026-10-13 (Session 59), Entwurf zur Durchsicht
**Auftrag (Nutzer, Session 58):** ein Knopf statt „Profil“ und „Mein Konto“; beide Menüs vereint, das Profil wird
das erweiterte Menü; Profilseite ohne Reiter, alles auf einem Bildschirm, Profil mit Kennzahlen und Zusatzinfos oben
sticky, Boxen in voller Breite und gut verteilt. Der Anfang aus Session 56 (Profil Desktop) gefällt.
**Antworten in dieser Session:** (1) eine Seite: `/profil` trägt alles, `/mitglied` leitet weiter; (2) die
Konto-Formulare stehen ganz unten als Block „Einstellungen“.

Entscheidungen, die ich ohne Rückfrage getroffen habe, tragen den Vermerk **[eigene Entscheidung]**.

## 1. Ziel und Erfolg

- Ein Einstieg für alles, was „meins“ ist. Niemand muss wissen, ob etwas unter Profil oder Konto steht.
- Erfolg: im Kopf steht genau ein Knopf; `/profil` zeigt Auswertungen, Mitbestimmung, Nachrichten und
  Einstellungen untereinander ohne Reiter; die Identität mit den Kennzahlen bleibt beim Scrollen sichtbar;
  alte Links auf `/mitglied` und `/profil?ansicht=…` landen ohne Fehler auf der neuen Seite.

## 2. Kopf: ein Knopf

- `HAUPTNAVIGATION` verliert den Punkt „Profil“. `KONTO_LINK` wird zu `PROFIL_LINK = { href: "/profil" }`.
- Ohne Anmeldung: Text „Mein Profil“ („My profile“), Symbol Kopf und Schultern wie heute. Ein Klick führt auf
  `/profil`, das ohne Sitzung auf `/anmelden?weiter=%2Fprofil` umleitet (besteht schon).
- Mit Anmeldung: der Anzeigename statt „Mein Profil“, Avatar im Rahmen der heutigen Konto-Pille, Zahl ungelesener
  Nachrichten wie heute.
- Breite: der Text im Knopf ist höchstens so breit wie heute „MEIN KONTO“ in derselben Schrift; längere Namen
  enden mit „…“. Umsetzung **[eigene Entscheidung]**: der Name steht in einem Element mit `truncate` und
  `max-w-[…]` in `ch` passend zur Breite von „Mein Konto“ bei `tracking-gesperrt`; der volle Name steht im
  `title` und als zugänglicher Name des Links. Kein Messen per JavaScript.
- Der Kopf bleibt statisch: Server rendert „Mein Profil“, `KontoZaehler` setzt nach dem Laden den Namen ein (die
  Abfrage `/api/benachrichtigungen` liefert ihn schon). Damit liest das Layout weiterhin keine Sitzung.
- Nach dem Speichern eines neuen Anzeigenamens löst die Seite `ZAEHLER_NEU` aus, damit der Knopf den neuen Namen
  zeigt **[eigene Entscheidung]**.
- Unter lg: Symbol beziehungsweise Avatar wie heute; im Aufklappmenü ein Eintrag „Mein Profil“ statt der zwei
  Einträge „Profil“ und „Mein Konto“.
- Aktiv (Unterstrich, `aria-current`) auf `/profil`, nicht auf fremden Profilen `/profil/<kurz-id>`.

## 3. Profilseite `/profil`

### 3.1 Profilkopf, sticky

Ersetzt die Seitenleiste links. Volle Breite (`max-w-360` wie der Kopf), klebt ab 1080 px direkt unter dem
Seitenkopf (`top: var(--kopf-h)`), Fläche `surface` mit Linie unten wie der Seitenkopf.

- Links: Avatar (64 px), Name als h1 (`font-buch text-h1`), darunter Rolle (Badge), „dabei seit …“ und die
  liebsten Aromen als Chips.
- Mitte: Kennzahlen als Randnotizen in einer Reihe (Zahl gedruckt, Wort von Hand, Regel 1): bewertet, im Schnitt,
  Vertreiber, zuletzt, Stimmen, gewonnen, Vorschläge, ungelesen. Jede Zahl ist ein Sprunglink zu ihrer Box
  (`#bewertungen`, `#topflop`, `#vertreiber`, `#bewertungen`, `#stimmen`, `#stimmen`, `#meine-vorschlaege`,
  `#nachrichten`) **[eigene Entscheidung]**, wie die Kennzahlen im Auftakt. Zahlen ohne Wert (keine Bewertung)
  entfallen wie heute.
- Rechts: „Blüte bewerten“ (einzige gefüllte Primäraktion) und „Profil bearbeiten“ (Sekundär, springt zu
  `#einstellungen`).
- Höhe ab 1080 px höchstens rund 128 px, damit der Inhalt Platz behält. Passen die acht Zahlen nicht in eine Reihe,
  bricht der Block in zwei Zeilen (Identität oben, Zahlen darunter), bleibt aber sticky.
- Unter 1080 px nicht sticky **[eigene Entscheidung]**: auf dem Telefon nähme der Block zu viel Höhe. Er steht als
  Kopfblock oben, Zahlen in zwei Reihen zu vier.
- Sprungziele bekommen `scroll-margin-top` in Höhe von Seitenkopf plus Profilkopf, damit kein Titel darunter
  verschwindet.

### 3.2 Boxen

Alle Boxen als `Feld rahmen="karte" groesse="klein"` mit Feldkopf (Vermerk, Buchschrift mit Handwort), wie
heute im Profil. Raster ab 1280 px 12 Spalten, Abstand 32 px; darunter eine Spalte. Reihenfolge und Breiten
**[eigene Entscheidung]**, vom Profil zur Mitbestimmung zum Konto:

| Reihe | Boxen (Spalten von 12) |
|---|---|
| 1 Was dir schmeckt | Aroma-Netz (7), Top und Flop (5) |
| 2 Verlauf | Deine Spur (7), Deine Noten (5) |
| 3 Bewertungen | Bewertungsregister (12) |
| 4 Ähnliches | Ähnlich im Aroma, bisher Reiter Aromen (12) |
| 5 Vertreiber | Lieblingsvertreiber (12); Schnitte (6), Community (6) |
| 6 Mitbestimmen | Umfrage jetzt als Stimmzettel (7), Meine Vorschläge (5) |
| 7 Rückblick | Deine Stimmen (12) |
| 8 Nachrichten | Benachrichtigungen (7), Status (5) |
| 9 Einstellungen | Angaben (4), Profilbild (4), Öffentliches Profil (4); darunter Abmelden; für Admins Verwaltung |

- Leere Zustände bleiben je Box wie heute (keine Bewertungen: Netz-Box mit Einladung, die anderen
  Auswertungsboxen entfallen). Fällt eine Box einer Reihe weg, nimmt die andere die volle Breite.
- Die Konto-Boxen verlieren das Feldbuch-Raster, den Kapitelkopf „deine Stimme“ und den Freisteller: das Muster aus
  Session 56 (eckige Karten) gilt für die ganze Seite. `KapitelRaster` und `Kapitelkopf` nutzt sonst niemand: sie
  entfallen samt ihren Tests und CSS-Regeln. `Randnotizen` bleibt (kompakt, im Profilkopf); das große Format
  entfällt.
- Ids: die Empfehlungen heißen `aehnliches`, die eigenen Blüten-Vorschläge `meine-vorschlaege` (bisher beide
  `vorschlaege`).
- `GelesenMarkieren` bleibt in der Nachrichten-Box: wer `/profil` öffnet, hat die Nachrichten gesehen.

### 3.3 Alte Adressen

- `/mitglied` und `/{lang}/mitglied` leiten per `redirects()` in `next.config.ts` dauerhaft (308) auf `/profil`
  weiter. Gespeicherte Benachrichtigungen mit `link: "/mitglied"` funktionieren damit weiter.
- Neue Links im Code zeigen auf `/profil#…` (abgelehnter Vorschlag: `/profil#meine-vorschlaege`; Link im
  Blüten-Vorschlagsformular: `/profil#meine-vorschlaege`).
- `?ansicht=` wird ignoriert; die Seite zeigt alles. Die Register-Parameter (Sortierung, alle) bleiben, ihre Links
  tragen `#bewertungen`.
- Die Server-Aktionen bleiben in `app/[lang]/mitglied/aktionen.ts` (nur die Seite entfällt) **[eigene
  Entscheidung]**, damit nicht sechs Importe wandern. `revalidiereSprachen("/mitglied")` wird zu `"/profil"`.

### 3.4 Öffentliches Profil `/profil/[kurzId]`

Gleiches Muster **[eigene Entscheidung]**: Profilkopf (ohne Aktionen, ohne private Zahlen), darunter Netz und
Top/Flop, dann die freigegebenen Bewertungen. Keine Reiter. Nicht sticky-pflichtig, aber dieselbe Komponente.

## 4. CPU (Free-Plan, 10 ms)

Die Reiter gab es auch, um CPU zu sparen: der Server rendert heute nur einen Reiter. Eine Seite mit allem rendert
mehr. Maßnahmen **[eigene Entscheidung]**:

- Jede Reihe in eigenem `Suspense` mit Skelett, Abfragen per `cache()` je Quelle einmal (wie heute).
- Das Register zeigt zuerst die ersten zwölf Einträge, „Alle zeigen“ lädt den Rest über den bestehenden Parameter.
- Deine Stimmen zeigen die letzten sechs.
- Nach dem Deploy CPU je Aufruf in der Workers-Telemetrie messen (Abfrage aus Session 54). Liegt `/profil`
  deutlich über `/reviews` oder kommt 1102, werden die Reihen ab „Mitbestimmen“ erst beim Scrollen
  nachgeladen (eigene Route je Reihe). Das wird nur gebaut, wenn die Messung es verlangt.

## 5. Texte (de/en)

- `kopf.navigation.profil`: „Mein Profil“ / „My profile“; `kopf.navigation.konto` entfällt.
- Titel der Seite: „Mein Profil“. Feldköpfe der Konto-Boxen im Stil der Profil-Feldköpfe (Vermerk plus Wort),
  Texte nach `better-writing`, ohne Geviert- und Gedankenstrich.
- Neue Randnotiz-Wörter für Stimmen, gewonnen, Vorschläge, ungelesen kommen aus `w.mitglied.kapitel`.

## 6. Schnitt in Stränge (für den Plan)

- **Strang A, Kopf:** `lib/navigation.ts`, `components/layout/Kopf.tsx`, `KontoZaehler.tsx`, Kopf-Texte in
  `lib/i18n/de.ts`/`en.ts` (nur Abschnitt `kopf`), `tests/navigation.test.ts`.
- **Strang B, Seite:** `app/[lang]/profil/page.tsx`, `app/[lang]/profil/[kurzId]/page.tsx`, neuer `ProfilKopf`,
  Wegfall von `ProfilRahmen`/`ProfilReiter`/`ProfilSeitenleiste`, `app/[lang]/mitglied/page.tsx` entfällt,
  Redirect in `next.config.ts`, Links und Revalidierung auf `/profil`, Texte in `de.ts`/`en.ts` (nur Abschnitte
  `profil`, `mitglied`), Tests der Profil- und Kontoseite.
- `de.ts`/`en.ts` berühren beide Stränge in getrennten Abschnitten; der Merge gleicht das ab.

## 7. Tests und Prüfung

- Kopf: genau ein Knopf, kein Menüpunkt „Profil“, Text „Mein Profil“ ohne Sitzung, Kürzung per `truncate`,
  Menü unter lg mit einem Eintrag.
- Seite: keine Reiter, Reihenfolge der Boxen, ein Primärknopf, Sprungziele vorhanden, eindeutige Ids,
  `/mitglied` leitet weiter, `?ansicht=` schadet nicht.
- Live per Browser nach dem Push: 1440 und 1124 px (Sticky-Kopf, kein Querscroll, Sprunglinks landen unter dem
  Kopf), 390 px, hell und dunkel, abgemeldet „Mein Profil“ führt zur Anmeldung, langer Name wird gekürzt; CPU in
  der Telemetrie.

## 8. Nicht im Umfang

- Likes und Folgen, Bewerten neu verknüpfen (eigene Durchgänge).
- Aufklappmenü am Knopf (verworfen zugunsten einer Seite).
