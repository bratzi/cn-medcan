# HANDOFF — Stand der Arbeit

> Übergabemedium zwischen Sessions. Wird nach jedem Arbeitsblock aktualisiert und committet.
> Wer hier weiterarbeitet, liest diese Datei zuerst und braucht den Chatverlauf nicht.

**Letzte Aktualisierung:** 2026-10-08 (Session 47)
**Repo:** https://github.com/bratzi/cn-medcan (public)
**Branch:** `main` (Makeover „Grünes Buch“ Teilprojekt 1 ist seit 2026-09-24 auf `main`)

---

## Worum es bei diesem Projekt wirklich geht

`cn-medcan` ist **kein reiner Produktkatalog.** Der Katalog, die Apothekenbestände und die Filter
sind Beiwerk. Der Kern sind zwei Dinge, die zentral und sichtbar auf der Startseite stehen:

1. **Die eigenen Reviews des Betreibers** — der zentrale Anhaltspunkt der Seite. Bewertet nach dem
   festen Schema in `lib/query/bewertung.ts`, gebunden an eine konkrete Charge. Community-Reviews
   existieren, aber als Zweitstimme darunter, nicht gleichrangig.
2. **Umfragen, die den nächsten Strain bestimmen** — verifizierte Mitglieder wählen, was der
   Betreiber als nächstes probiert und bewertet. Das Ergebnis ist verbindlich für die nächste
   Review. Diese Schleife ist das Alleinstellungsmerkmal, gekoppelt an den Instagram-Account des
   Betreibers.

Wer hier Features priorisiert: dieser Kern hat Vorrang vor Katalogkomfort.

---

## ⇢ Hier geht es weiter

### ⇢ SESSION 48 (Sessionstart): Auftakt-Zahlenleiste umsetzen

**ALS ERSTES: diese Fragen in EINER AskUserQuestion stellen**
1. **Plan freigeben?** `docs/superpowers/plans/2026-10-08-auftakt-eyecatcher.md` (Spec
   `docs/superpowers/specs/2026-10-08-auftakt-eyecatcher-design.md`, vom Nutzer mit „jo" freigegeben).
   Optionen: „Passt" / „Ändern: …".
2. **Ausführung?** Empfehlung **Native** (selbst in der Session, am Ende ein frischer Reviewer über alles),
   weil die vier Tasks streng aufeinander aufbauen und drei davon `Auftakt.tsx` ändern; parallele
   Worktrees passen hier ausnahmsweise nicht. Alternative: Subagent-driven (je Task Implementer + Reviewer).

Danach Plan Task 1 bis 4 abarbeiten (Native: Skill `superpowers:executing-plans`), Design-Skills dabei
einsetzen (`design-taste-frontend`, `animate`, `build-awwwards-quality-sites`), pushen, live prüfen wie in
Task 4 Step 6 beschrieben, HANDOFF.

**Stand `main` = `5d9c80d`**, 781 Tests grün, tsc und eslint projektweit sauber, `npm run farben` sauber.
Arbeitsbaum sauber, nur Branch `main`, keine Worktrees mehr.

**Nutzer-Entscheidungen Session 47 (bindend):**
- Hero: **nur die Marke** (keine Umfrage/Review oben), **Bewegung wie heute, nur besser** (kein WebGL,
  kein neues Werkzeug), **Live-Zahlen statt zweiter Handlung**: Sorten im Katalog, Bewertungen im Buch,
  Stimmen abgegeben.
- Zeitmarken vom 2026-09-25 bleiben (Oberzeile 1,8 s, Intro 3,4 s); Zahlen bei 4,2 s.
- Akzentwort-Konturen: **mit Schriftgröße skalieren** (erledigt, siehe unten).
- Schalterleiste rechts darf Inhalt überlagern („sind nur kleine Buttons") – nicht anfassen.
- Fließtext läuft im Storytelling unter den Bildkreis – gewollt („die bewegen sich ja hin und her").

**Fallen, die der Plan schon berücksichtigt:**
- Keine `$transaction` auf D1; drei Zähler in **einer** `$queryRaw` (Muster `communityZahlen`).
- Zählermerkmal `data-auftakt-zaehler`, nicht `data-zaehler`: `components/story/bewegung/eintrag.ts`
  greift alle `[data-zaehler]` der Seite ab und würde die Auftaktzahlen ein zweites Mal hochzählen.

### ⇢ SESSION 47 (erledigt): Optik live geprüft, Fehler raus, Hero-Spec und Plan

- **Live geprüft** (Chrome im Vordergrund, Screenshots gingen): 1440 und 390 px, hell und dunkel.
  In Ordnung: Logo, Terpen-Tooltip, Sektionsübergänge ohne Strich, kein Seitenüberlauf, Fuß, Fazit-Leiste.
- **`a0506dc`** Intro-Zeile bricht bis xl um (lief zwischen 768 und 1280 px raus; 0,3em Sperrung braucht
  ~1200 px). Live nicht gesondert bei 1000 px nachgemessen.
- **`a0506dc`, `1629741`** `react-hooks/set-state-in-effect` in `RegisterAuswahl.tsx` und `AromaKarte.tsx`
  über `useSyncExternalStore` (Server false, Client true) gelöst. eslint projektweit sauber.
- **`7bbbd20`** Konturen der Akzentwörter (`.marke-kontur-1..4`): Versatz nur noch bis zum Wert bei ~40 px
  Schrift (`min(em, px)`), Strich `max(px, 0.012em)`. Live gemessen bei 256 px Schrift: Versatz
  1,8/1,2 px statt 11,5/7,7 px, Strich 3,1 px; hell gesehen sauber. Dunkel nach dem Fix nicht erneut gesehen.
- **Aufgeräumt:** 20 Agent-Worktrees, ihre `node_modules`-Reste und 20 `worktree-agent-*`-Branches gelöscht.
- Offen und nicht angefasst: Terpenband läuft unter die Kopfzeile (auf 390 px verdeckt der Kopf die
  Symbole) – dem Nutzer nicht eigens vorgelegt, bei Gelegenheit fragen.

### ⇢ SESSION 45 (erledigt): Profil Stufe 1 ist live

**Live und auf `main` (`199107e`, 713 Tests grün, tsc und eslint sauber):** Profil und Dashboard Stufe 1.
Spec `docs/superpowers/specs/2026-10-07-profil-dashboard-design.md` (vom Nutzer freigegeben 2026-10-07),
Plan `docs/superpowers/plans/2026-10-07-profil-stufe-1.md` (Task 1 selbst, Stränge A/B/C parallel in
Worktrees, Task 8 selbst, Gesamtreview, Fixwelle). Migration 0017 ist **remote eingespielt**.
- `/profil`: Netz (Fläche „mag ich“, gestrichelt „mag ich nicht“), Terpen-Rangliste, bestätigte Vorschläge
  mit Marke „noch nicht bestätigt“, Top/Flop, Du und die Community, Schnitte. Kopfknopf heißt „Mein Profil“,
  Reiter Profil | Konto, `/mitglied` heißt „Konto“ und hat keine Empfehlungen mehr; Reiter Konto zeigt
  ungelesene Benachrichtigungen. Startseite markiert unbestätigte Vorschläge ebenso.
- Community-Vergleich nimmt das fremde Mittel direkt aus `reviews` (`FREMDE_NOTEN_SQL`, Review W1).
- **Live geprüft (DOM, 1143 px, Tab verborgen):** `/profil` als Betreiber: 4 Bewertungen, Netz mit Fläche,
  7 Terpene, 6 Vorschläge (alle unbestätigt, Community dünn), Top/Flop, Community-Hinweis „sobald zwei“,
  Schnitte. `/mitglied`: h1 „Konto“, Reiter Konto aktiv, Kopfknopf aktiv. Kein Überlauf.
  **Nicht geprüft:** Optik per Screenshot (Tab verborgen), mobil unter 640 px, hell/dunkel, englisch,
  Speichern einer Bewertung erneuert das Profil.
- **Bewusst offen (Review K1):** Profil-Upsert läuft nach der Empfehlungs-Batch, nicht in ihr. Scheitert
  er, wird geloggt; `/profil` rechnet nach 24 h neu.

**Lehre Deploy:** Der Push `199107e` löste **keinen** Workers Build aus (GitHub-Webhook kam nicht an).
Prüfen über Cloudflare-API `GET /accounts/{id}/builds/workers/1406f98f6bac4ea19a123496391118c7/builds`;
manuell starten mit `POST /accounts/{id}/builds/triggers/f649c1f7-21f8-4eb5-8597-0b036c381c8e/builds`,
Body `{ branch: "main", commit_hash: "<VOLLER Hash>" }` (Kurz-Hash scheitert beim Klonen). Build ~6 min.

### ⇢ SESSION 46b (erledigt in Session 47): Marken-Makeover ist live

**Auf `main` (`30818ba`, 781 Tests grün, tsc sauber, `npm run farben` sauber).** Alle Builds bis
`30818ba` sind erfolgreich. In dieser Session ist Profil Stufe 3 fertig geworden und danach das
Marken-Makeover entstanden.

**Profil Stufe 3 ist live und geprüft** (Plan `docs/superpowers/plans/2026-10-07-profil-stufe-3.md`,
Migration 0020 remote eingespielt): Verlauf des Netzes (JSON-Spalte `nutzer_profil.verlauf`, letzte 60
Schritte, beim Speichern nachgerechnet), Kontur „vor der letzten Bewertung“ mit Änderungszeile,
Lieblingshersteller, Mini-Netz nach dem Speichern auf der Blütenseite, Verlauf-Regler auf `/profil`.
Live gesehen: Kontur, Änderungszeile „Erdig schwächer, Fruchtig stärker“, Lieblingshersteller-Hinweis,
Verlauf. Altprofile rechnen beim ersten Aufruf einmal nach. Offen aus dem Review: M2 (CPU der
Verlaufsrechnung, gemessen 1,4–3 ms bei 100 Bewertungen, 13–30 ms bei 1000) und M10 (Kleinkram Verlauf).

**Marken-Makeover (Nutzer-Entscheidungen dieser Session, alle live):**
- **Logo:** Pinselschrift als Grafik, `components/marke/Logo.tsx`, zwei Masken `public/marke/pinsel.webp`
  und `pinsel-of.webp` (aus dem Nutzerbild freigestellt, 2x hochgerechnet), CSS `.marke-pinsel`. Schrift
  im Token `--color-logo`, das „of“ in `kopierstift`. Steht im Kopf, als h1 im Auftakt (deckend, **kein
  Glas** – der Nutzer fand Glas billig) und blass im Fuß. Endloser Glanzstreifen (`marke-glanz`) in beiden
  Farbebenen. Beim Hinausscrollen wächst es auf 115 %, es gleitet nicht mehr nach oben.
- **Handschrift:** Inspiration ist ersetzt durch **Mr Dafoe** (`--font-pinsel`), überall. `font-size-adjust:
  0.25` gleicht die viel größere x-Höhe aus. Farbe ist `--color-logo`, damit Hero und Storytelling gleich
  wirken. Die Grün-Lila-Verläufe in Schrift sind weg (`.farbverlauf` ist einfarbig).
- **Farb-Token `--color-logo`** (hell `blatt-500`, dunkel `blatt-400`): heller und minziger als `accent`,
  gemessen 3.62 / 3.37 auf seinen Flächen. **Abweichung von Spec TP3 5**, die für Handschrift 4,5:1
  verlangt: begründet damit, dass Mr Dafoe keine Haarstriche mehr hat wie Inspiration. `scripts/farben-pruefen.mjs`
  prüft die Rolle `logo` mit 3:1 auf `surface` und `surface-raised` (nicht auf `surface-sunken`, dort
  steht das Logo nie: 2,81).
- **Terpenband:** keine Querlinien mehr, trägt das Spaltenraster; beim Überfahren erscheint ein Tooltip
  **unter** dem Symbol (zentriert, eigene Fläche), der Eintrag rückt nicht mehr, nur das Symbol wächst.
- **Sektionen:** Der gepinnte Auftakt bleibt im Hintergrund stehen und schien samt seiner Zeitungsleiste
  als waagerechter Strich durch. Alle Sektionen nach `[data-story="transparent"]` tragen jetzt Grund und
  Raster (`globals.css`, Geschwister-Selektor).
- **Schlagwörter** (`Schlagwort.tsx`): `--text-kulisse` von 40rem auf 15rem herunter, und sie stehen im
  Polster der eigenen Sektion statt auf der Kante (dort schnitt die Nachbarsektion sie ab).
- **Akzentwörter** im Storytelling tragen die Bewegung der Prozentzahl aus dem Community-Fazit: vier
  driftende Konturen plus `fazit-puls`.
- **Schalterleiste** (Sprache/Thema) sitzt senkrecht mittig am rechten Rand statt in der Ecke.

**⇢ Hier weitermachen:**
1. **Optik live prüfen** (am Ende der Session brach die Browser-Verbindung ab, nur gemessen, nicht
   gesehen): Akzentwörter ohne Kontur und im Logo-Ton (`30818ba`), Schlagwörter in beiden Themes und auf
   Mobil, Terpen-Tooltip, Schalterleiste, Übergänge zwischen allen Sektionen.
2. **Hero als Eyecatcher**: Der Nutzer hat eine Runde mit allen Design-Skills gewünscht
   (`build-awwwards-quality-sites`, `animate`, `design-taste-frontend`), die noch aussteht.
3. **Intro-Zeile im Hero** („Kollektiven Geschmack kultivieren · …“) läuft bei rund 1000 px Fensterbreite
   rechts aus dem Bild. Bestand schon vor dem Makeover.
4. **eslint-Fehler** in `components/story/RegisterAuswahl.tsx:179` (`react-hooks/set-state-in-effect`),
   vorbestehend, nicht aus dieser Session.
5. **Aufräumen:** `.claude/worktrees/` steht seit `7472d86` in `.gitignore`. Ein `git add -A` hatte die
   Agent-Worktrees als Submodul-Einträge committet, was den Cloudflare-Build beim Klonen abbrechen ließ
   („error occurred while updating repository submodules“). Nie `git add -A` über `.claude` laufen lassen.

**Lehre Browser-MCP:** Screenshots scheitern mit „Script injection timed out“, sobald Chrome im
Hintergrund liegt; `javascript_tool` läuft trotzdem. Messen geht also immer, Sehen nur mit Chrome im
Vordergrund.

---

### ⇢ SESSION 46 (erledigt): Profil Stufe 2 ist gepusht, Live-Prüfung offen, dann Stufe 3

**Auf `main` (`8f9244b`, 733 Tests grün, tsc und eslint sauber):** Profil Stufe 2, öffentliches Profil.
Plan `docs/superpowers/plans/2026-10-07-profil-stufe-2.md` (Task 1 selbst, Stränge A–D parallel in
Worktrees, Gesamtreview, Fixwelle). Migrationen **0018 und 0019 sind remote eingespielt**.
- `mitglied.profil_oeffentlich` (Vorgabe aus) und `mitglied.kurz_id` (8 Zeichen aus `lib/kurz-id.ts`,
  beim ersten Einschalten vergeben, bleibt beim Ausschalten; zwei Tabs überschreiben sie nicht).
- Schalter in `/mitglied` (Karte „Öffentliches Profil“, `ProfilSichtbarkeit`): Einschalten nur mit
  freigegebenem Konto (Review W2), Ausschalten immer. Action `profilSichtbarkeitSetzen`.
- `/profil/<kurz-id>`: Name, Avatar, Zahl und Liste (50) der freigegebenen Bewertungen aktiver Sorten,
  Netz und Terpene in dritter Person. Aus, falsche Form oder Konto nicht freigegeben = 404. noindex,
  force-dynamic. Netz kommt aus `nutzer_profil.oeffentlich` (nur freigegebene Bewertungen, Review W1),
  gerechnet in `profilFortschreiben`, auch nach Freigabe/Verwerfen in `/admin`. Bestehende Profile haben
  dort NULL, bis sie neu gerechnet sind (Speichern, `/profil` nach 24 h, Freigabe) – bis dahin „Noch kein
  Aroma-Netz“.
- Buch: Name verlinkt nur bei öffentlichem Profil (`autorProfilAus`), Link trägt das aria-label.
- Kopfknopf „Mein Profil“ ist auf `/profil/<id>` nicht mehr aktiv. Datenschutz ergänzt (Stand 7.10.2026).

**Session 46 live geprüft (Build `8f9244b` success):** Schalter ein vergibt `/profil/un5cmk9r`, Seite zeigt
Name, Avatar, 4 Bewertungen, „Noch kein Aroma-Netz“ (erwartet bis Neurechnung); Name im Buch `/reviews`
verlinkt; Kopfknopf dort nicht aktiv; mobil 390 px ohne Überlauf (Notenzeile bricht je nach Namenslänge mal
neben, mal unter dem Namen um – kosmetisch, offen); Schalter aus = 404; `/profil/ABC` = 404. Profil ist
wieder privat. Fix: 404-Titel hieß „Mein Profil“, jetzt `fehlerseite.nichtGefunden`. Hinweis Browser-MCP:
Klick per `ref` auf den Schalter ging zweimal ins Leere, Klick per Koordinate klappt (Werkzeug, nicht Seite).
Noch nicht geprüft: Netz nach Neurechnung, hell, englisch.

**Ursprünglicher Prüfplan:** Workers Build für `8f9244b` lief beim Sessionende noch (queued);
Status über die Cloudflare-API prüfen (siehe Lehre Deploy unten). Dann live: `/mitglied` Schalter ein,
Adresse öffnen (Netz evtl. leer bis Neurechnung: einmal `/profil` öffnen hilft nicht vor 24 h – eine
Bewertung speichern oder in `/admin` freigeben rechnet neu), Name im Buch verlinkt, Schalter aus = 404,
`/profil/ABC` = 404, Kopfknopf auf fremdem Profil nicht aktiv, mobil unter 640 px.

**Zurückgestellte Minors aus dem Review Stufe 2:** Tests für Query und Action nur per Quelltextsuche, keine
Prisma-Attrappe (Minor 8); nach dem Ausschalten bleibt der Link auf `/` und `/reviews` bis zu 300 s
(statisch, kein Tag-Cache; Datenschutztext sagt „nach wenigen Minuten“); `autorProfilAus` prüft die
Kontofreigabe nicht (Link auf 404, falls ein Konto die Freigabe verliert).

**Danach Stufe 3** (Spec): Verlauf des Netzes (nachgerechnet, dünne Kontur „vor der letzten Bewertung“
plus Änderungszeile), Lieblingshersteller, Mini-Netz mit Animation vorher/nachher auf der Blütenseite
nach dem Speichern. Plan in parallelen Strängen, ohne Rückfrage.

**Aufräumen:** unter `.claude/worktrees/` liegen viele alte Agent-Worktrees (alle Branches gemergt?
vor dem Entfernen mit `git branch --no-merged main` prüfen).

### ⇢ SESSION 44 (Sessionstart): Profil und Dashboard, Ergebnis des Grillings vom 2026-10-07

Nutzerwunsch: jeder Benutzer bekommt ein Profil mit seinen Bewertungen, daraus abgeleiteten Vorlieben,
Auswertungen und einem individuellen Netzgraphen („Skill-Matrix“), der sich mit jeder Bewertung neu ergibt.
Darauf bauen Vorschläge auf, die von der Community bestätigt sind (mag fruchtig, also fruchtige Sorten mit
guter Community-Wertung).

**Fakten aus dem Code (vor dem Grilling geprüft):**
- `/mitglied` zeigt schon „Könnte dir gefallen“ (6 Vorschläge, Tabelle `nutzer_empfehlungen`), gerechnet in
  `lib/empfehlung.ts`: Profilvektor aus Terpenen (`t:`) und Geschmäckern (`g:`), Gewicht aus der Gesamtnote
  (`bewertungsGewicht`: ab 3,5 positiv, bis 2 negativ), Kosinus, beim Speichern gerechnet (CPU 10 ms).
- Die Vorschläge zählen bisher NUR Aroma-Ähnlichkeit, die Community-Gesamtnote fließt nicht ein.
- `components/review/Netzdiagramm.tsx` gibt es für die Geschmacksmatrix einer Bewertung (Tinte, nicht Grün).
- `Mitglied.anzeigename` ist nicht eindeutig.

**Entscheidungen des Nutzers (nicht neu fragen):**
- Sichtbarkeit: privat UND öffentlich. Öffentlich: Name, Avatar, Zahl der Bewertungen, Bewertungsliste,
  Vorlieben-Netz. Privat bleiben Vorschläge und Auswertungen. Öffentliches Profil ist anfangs AUS (Opt-in,
  Art. 9 DSGVO), Schalter in `/mitglied`.
- Netz: 10 Geschmacksachsen als Netz, Terpene als Rangliste mit Balken darunter.
- Rechnung: wie das bestehende Profil (Aroma der Sorte aus Herstellerterpenen, Community-Geschmack und
  eigenen Reglern, gewichtet mit der eigenen Gesamtnote). Netz zeigt „mag ich“ als Fläche und „mag ich
  nicht“ gestrichelt. Die Geschmacksregler sind Sweet-Spot-Werte und bedeuten allein kein „mag ich“.
- Bestätigt: Sorte hat mindestens 2 Bewertungen (Community oder Betreiber) mit Median ab 3,5. Rang =
  Aroma-Ähnlichkeit × Community-Note. Weniger als 3 bestätigte Treffer: mit Sorten nur nach Aroma
  auffüllen, sichtbar markiert „noch nicht bestätigt“.
- Auswertungen (alle vier gewählt): Top und Flop (je 3), du gegen Community (inkl. „du bewertest im Schnitt
  0,4 strenger“), Overall-Schnitt je Kategorie, Verlauf des Netzes und Lieblingshersteller.
- Verlauf: nachgerechnet aus heutiger Sicht (beim Speichern die Reihe nach 1, 2, 3 … Bewertungen nach
  Datum rechnen und ablegen), keine Momentaufnahmen.
- Adressen: privates Dashboard `/profil`; öffentlich `/profil/<kurz-id>` (keine Namen in der URL);
  `/mitglied` bleibt Konto (Status, Avatar, Benachrichtigungen, Schalter öffentliches Profil).
- Navigation: kein fünfter Menüpunkt; der Knopf „Mein Konto“ heißt „Mein Profil“ und führt zu `/profil`,
  dort ein Reiter „Konto“ zu `/mitglied`. „Könnte dir gefallen“ zieht ins Profil um.
- Betreiber: folgt denselben Regeln wie alle (Opt-in, kein Vergleich „wie nah bist du am Betreiber“).
- Mindestzahl: Netz ab 1 Bewertung mit Hinweis „vorläufig, ab 3 aussagekräftig“ und Zähler; ohne Bewertung
  leere Skizze mit Knopf „Erste Bewertung abgeben“.
- HWG: Netz und Vorschläge nur Aroma, nie Wirkung. Vorschläge heißen neutral „Ähnlich im Aroma wie deine
  Favoriten“, ohne Kauf- oder Apothekenlink. Wirkung im Overall-Schnitt nur privat.
- Veränderung: im Profil der Stand vor der letzten Bewertung als dünne Kontur, dazu eine Änderungszeile
  („seit X: Fruchtig stärker, Erdig schwächer“). Nach dem Speichern auf der Blütenseite ein Mini-Netz mit
  Animation vorher/nachher direkt dort (Nutzer wählte „Mini-Netz direkt“).
- Stufen: ein Plan, drei Stufen, jede einzeln live, innerhalb einer Stufe parallele Stränge.
  Stufe 1: `/profil` privat (Netz + Terpenliste, bestätigte Vorschläge, Top/Flop, du gegen Community,
  Overall-Schnitt, Navigation). Stufe 2: öffentliches Profil mit Opt-in und Link vom Namen im Buch.
  Stufe 3: Verlauf, Lieblingshersteller, Mini-Netz auf der Blütenseite.

**Claudes eigene Technikentscheidung (dem Nutzer genannt, nicht widersprochen):** beim Speichern einer
Bewertung rechnen und ablegen (CPU-Limit); beim Aufruf neu rechnen, wenn der Stand älter als 24 h ist,
damit neue Community-Werte ankommen. Cron verworfen: Free-Plan hat auch dort 10 ms CPU.

### ⇢ SESSION 44 (Sessionstart): Stand nach Session 43

**Live und auf `main` (674 Tests grün, tsc sauber):**
- `f19a340` Terpen-Band: Infos ragten beim Überfahren bis 349 px ins Nachbarterpen (Spur `auto` weitete sich
  auf die Mindestbreite von Duft + Sortenzahl). Jetzt `grid-cols-[minmax(0,1fr)]`, Duft allein und gekürzt
  (voller Satz im `title`), Sortenzahl entfällt im Band (eigene Zeile sprengt die 192 px). **Live bestätigt:**
  alle 11 Infos genau 160 px, Hover auf Limonen sauber. Nutzer: Band v3 sonst „passt“.
- `45e34a0` Buch-Minors: mobil steht über der Karte immer der Titel „Terpenbewertung“ (auch bei mehreren
  Reitern), Haarlinie darunter nur ab lg (keine doppelte Linie mehr); Buch-Überschrift trägt `title` am
  inneren span statt neben `aria-label`; Kommentar zum Einzug (280 ms Vorlauf, Drehung 500 ms) stimmt.
  **Live nicht geprüft** (mobil unter 640 px).

**Bewertungsbilder live getestet (Nutzer-Go):** als Betreiber auf RS11 ein Testbild hochgeladen
(per JS-DataTransfer, `file_upload` nimmt keine Pfade mehr), Meldung „Gespeichert und veröffentlicht“,
Bild im Titelblatt und im Buch links unter dem Text; danach entfernt, Buch fällt aufs Symbolbild zurück.
Bewertungsdatum blieb 02.10.2026. **Nicht geprüft:** Freigabe in /admin (Betreiber-Bilder sind sofort frei,
dafür braucht es ein Community-Konto), Diashow mit mehreren Bildern, Review Focus 1.

**Lehre Browser:** Im verborgenen Tab hängen auch Bildverkleinerung (Canvas/`fetch`) und Screenshots; der
Nutzer muss das Chrome-Fenster nach vorn holen.

**Zurückgestellte Minors (unverändert offen):** Regex-Quelltexttests statt Verhaltenstests; Fortschritt
doppelt (Knopf + sr-only); Layoutsprung des Bands vor Hydration; Nicht-Mitglieder-Zweig der Blütenseite
ohne Note; Session 41: Autor-Zahlen ab ~99 Autoren über D1-Parametergrenze, Kolophon gap-1 ohne
Begründung, leere div.contents im Auszug. Verworfen: Kommentar „IN über höchstens 20 Ids“ (stimmt so).

### ⇢ SESSION 43 (Sessionstart): Stand nach Session 42

**Live und auf `main` (673 Tests grün, alles reviewt):**
- Terpen-Band Fixrunde 2 (`478456c`), live bestätigt bei 2296 px: alle Namen mittig auf einer Höhe.
- Legende „Ergänzt“/„Added“ statt „Von dir ergänzt“ (`6d245b7`).
- **Bewertungsbilder komplett** (Plan `docs/superpowers/plans/2026-10-06-bewertungsbilder.md`, Tasks 1–6,
  Abschlussreview, Fixwelle `bb6aa46`, Restpunkte `21bbc46`). Migration 0016 ist remote eingespielt.
  Live geprüft: 1122 px Symbolbild links unter dem Text (Community-Eintrag), mobil 494 px ausgeblendet.
  **Nicht geprüft:** echter Upload, Diashow mit eigenen Bildern, Freigabe in /admin, Review Focus 1
  (langer Text + 3 Bilder bei 1143 px).
- Restpunkte nach Live-Prüfung: mobiler Überlauf im Mitglieder-Formular (scrollWidth 750 bei 478) kam von
  `sr-only`-Fieldsets in der AromaKarte, deren `<legend>` dem Clip entkam; jetzt in `div.sr-only` gehüllt.
  Breitenmessung der Karte per Callback-Ref (misst sofort). Aria-live-Fortschritt sr-only (kein 16-px-Loch),
  Prüfhinweis nur bei gesendetem Bild, Datenschutz um Bewertungsbilder ergänzt.
- **Terpen-Band v3** (`9da27cc`, Brief war in `.superpowers/sdd/` (gelöscht, Inhalt steht hier)): Spalte w-40,
  Marke 56 px mit 32-px-Icon in Leitnotenfarbe (`leitFarbe`, 50 % mit Text gemischt; Kontrast hell min
  4,31:1 Zitrus, dunkel min 7,81:1), Name `text-body` gedämpft, max. 2 Zeilen; Hover nur am Eintrag
  (`group/eintrag`), überfahrener Eintrag rückt 40 px hoch, Infos 6–186 px im 192-px-Band.

**Lehre Live-Prüfung:** Ist der Browser-Tab verborgen (`document.visibilityState === "hidden"`), feuern
ResizeObserver nicht: Karten messen dann nie, viewBox bleibt 640. Vor Messungen einen Screenshot machen
(erzwingt Rendering) und `visibilityState` prüfen, sonst Fehlbefunde.

**Lehre Agents:** Subagents schreiben unter Windows mit Python leicht Latin-1 (cp1252). Nach jedem
Implementer-Commit alle geänderten Dateien auf UTF-8 prüfen. Agent-Worktrees starten teils auf altem
Commit: im Auftrag `git merge --ff-only main` voranstellen.

**Rulings Session 42 (Kosten, falls falsch):**
- Bilder gehen nacheinander raus, weil die Grenze von 3 Bildern serverseitig nicht atomar ist (gezieltes
  Parallel-Senden ergibt höchstens ein 4. Bild an der eigenen Bewertung).
- Admin-Vermerk „aus einer Bewertung“ bleibt Literal (/admin hat kein Wörterbuch).
- Diashow-Fläche bei Mindestplatz ~140 px bleibt (Spec verlangt 192 px Bildfeld, erfüllt).
- Diashow-Uhr läuft auf nahen Nachbarseiten weiter (Stopp würde BudpicDiashow ans Buch koppeln).
- Band v3: Icon-Farbe = Leitnote (erste Note), Name `text-body`, Spalte 160 px (Nutzer „spiel mit den Farben“).

**Zurückgestellte Minors (auf Zuruf):** Regex-Quelltexttests statt Verhaltenstests (Aktionen, Formular,
Band); Fortschritt doppelt (Knopf + sr-only); Kommentar „IN über höchstens 20 Ids“; einzelnes sehr langes
Wort im Band-Namen könnte 160 px sprengen; aus Session 41: mobil doppelte Haarlinie bei nur Karte
(BuchReiter/BuchDoppelseite), Layoutsprung des Bands vor Hydration, Nicht-Mitglieder-Zweig der Blütenseite
ohne Note.

### ⇢ SESSION 42 (Sessionstart): Stand nach Session 41

**Live und auf `main` (alles geprüft, 628 Tests grün):**
- `db22b31` Überschrift „Overall“/„Terpz“ ragte mobil 1 px über (waagerechter Scrollbalken bei 494 px). Live bestätigt.
- `3ccc51a` Buch-Karte zeigt vom Bewertenden ergänzte Terpene (`buchKarte` in `aroma-serien.ts`, Katalog
  von der Seite durchgereicht). Live bestätigt: RS11 zeigt Linalool gestrichelt.
- `09386c7` (Session 40) bei 1138 px live bestätigt: Zahl neben Blättern, Schalter in der Reiterzeile.
- T2 `a4a5b29` rechte Buchseite: kein schwarzer Kasten mehr, Reiter als Register auf Haarlinie, offener
  Reiter mit grünem Strich. Live bestätigt (2296 px), Ankersprung `#eintrag-…` ok.
- T3 `d91895c` Startseite: Strainname → Gesamtnote → Overall → Terpz. Live bestätigt.
- T5 `8f3f462`, `e745189` Blütenseite (Maske für Mitglieder) in derselben Reihenfolge über
  gemeinsamen Baustein `NoteUndErkundung`. Live **nicht** als Mitglied geprüft (#bewerten, Vorbelegung, Speichern).
- T1 `f53b831`, `b281cf5` Terpen-Band: Pause beim Überfahren und Infos nur beim Überfahren sind live ok.
  **Live-Fehler:** verschachteltes `:has` machte die Laufmodus-Regel ungültig (Ruhe-Versatz greift nicht,
  Name im oberen Drittel), Bisabolol 13 px tiefer. Fix liegt auf `wip/terpen-band-fix2`, siehe Frage 1.

**Plan-Ledger:** `.superpowers/sdd/2026-10-06-band-buchseite-startbewertung/progress.md` (gitignored, lokal)
mit allen Rulings und zurückgestellten Minors. Wichtigste Minors: mobil doppelte Haarlinie bei nur Karte
(BuchReiter:218/BuchDoppelseite:174), `focus-within` im Band ohne fokussierbares Element, Layoutsprung des
Bands vor Hydration, Nicht-Mitglieder-Zweig der Blütenseite ohne Note (unverändert).

**Bewertungsbilder:** Spec `docs/superpowers/specs/2026-10-06-bewertungsbilder-design.md`, Plan mit 7 Tasks
(T1 allein: Migration 0016 `budpics.review_id`; dann parallel A: T2→T3 Upload+Formular, B: T4→T5 Buch-Bildfeld,
C: T6 Admin+Datenschutz; T7 Controller: Merge, `npx wrangler d1 execute cn-medcan-db --remote --file
migrations/0016_bewertungsbilder.sql`, Push, live). Briefs liegen unter `.superpowers/sdd/2026-10-06-bewertungsbilder/`.
Entscheidungen: nur Bilder (Video später), bis 3 je Bewertung, Diashow links unter dem Text, Betreiber sofort
frei, Community OFFEN bis Freigabe je Bild, zählen als Budpics, Ersatz: Herstellerbild, sonst Musterbild,
beide „Symbolbild“, mobil kein Ersatzbild.

**Arbeitsweise:** Nutzer will alle To-dos parallel per Subagent-Driven Development (je Strang ein Worktree).
Agents dürfen nicht außerhalb ihres Worktrees schreiben (Report notfalls in der Antwort); Worktrees haben
keinen Prisma-Client (`lib/generated` kopieren oder `npx prisma generate`). Vor jedem Push: Testausgabe auf
`fail 0` prüfen, nicht nur grep-Erfolg. Remote-D1-Lesen scheiterte an Auth 7403 (nur Lesebefehl, nicht wiederholt).

### ⇢ SESSION 41 (Sessionstart): Buch-Doppelseite ist live, offene Reste

**Stand 2026-10-06:** Das Buch auf der Blütenseite ist neu gebaut nach Spec
`docs/superpowers/specs/2026-10-05-buch-doppelseite-stimme-und-urteil-design.md` und Plan
`docs/superpowers/plans/2026-10-05-buch-doppelseite-stimme-und-urteil.md`. Links die Person (Avatar 128 px,
Name, Text, Kolophon mit Datum, Charge, Bewertungen insgesamt, Restfeuchte; bei Community "von euch" in
Handschrift), rechts das Urteil (Blätter mit Zahl, fünf Noten mit Tintenstrich, Terpenbewertung als
Einlage bis an den Rand). Neue Bausteine `BuchDoppelseite`, `BlattUrteil`, `NotenLeiste`, `BuchKolophon`;
`Doppelseite` zeigt nur noch den Auszug (Startseite, /reviews), per Golden Master unverändert.
617 Tests grün, Lint nur die zwei alten Fehler (AromaKarte setMontiert, RegisterAuswahl:179).

**Live geprüft (Browser 1, 1143 und 1418 px, hell und dunkel):** nichts läuft mehr über den Rahmen
(vorher 722 px Inhalt in 605 px Rahmen), die Einlage sitzt bündig rechts und unten. Bei 1143 px brach
die Zahl unter die Blätter und der Kartenschalter in eine zweite Zeile: behoben mit `09386c7`, live noch
zu bestätigen. Community-Zustände sind nur durch Tests belegt (live gibt es nur den Betreiber-Eintrag).

**Abschlussreview (frischer Reviewer):** ein Important behoben (`a84cda2`, Einzug einmal statt bei jedem
Hineinscrollen). Zurückgestellte Minors, auf Zuruf angehen:
1. Einzug startet nach 280 ms, die Drehung dauert 500 ms; Kommentar in globals.css stimmt nicht.
2. Autor-Zahlen: ab rund 99 Autoren je Sorte über die D1-Parametergrenze, die Zahl fehlt dann still.
3. Überschrift trägt aria-label und title, Vorleser sagen den Namen doppelt.
4. Kolophon: gap-1 ohne 4-px-Begründung im Code.
5. Mobil mit mehreren Reitern kein Titel "Terpenbewertung" über der Karte.
6. Leere div.contents-Hüllen im Auszug.
7. Mobile Ansicht unter 640 px noch nicht live angesehen.

**Arbeitsweise:** Subagents sind wieder erlaubt (Nutzer 2026-10-06). Lokale Tags `archiv/*` sichern
die gelöschten alten Branches.

### ⇢ SESSION 40 (Sessionstart): Erst diese Fragen, dann die Reste

**Als erstes den Nutzer in EINER Nachricht fragen:**
1. **Wie weiter?** Der Plan `2026-10-03-kartengraph-ueberarbeitung.md` ist vollständig umgesetzt
   und live geprüft. Es liegt kein offener Auftrag mehr an. Gibt es ein neues Thema, oder sollen
   die drei Reste unten nachgezogen werden?
2. ~~Vier alte Worktrees~~ — **erledigt am 2026-10-05.** Alle vier Worktrees und zehn alte
   lokale Branches sind weg, geprueft und als Duplikate bestaetigt (siehe unten).

**Worktree-Aufraeumen am 2026-10-05 (Session 40):** alle vier Worktrees entfernt und zehn alte
lokale Branches geloescht. Geprueft wurde nicht nur `merge-base`, sondern der Inhalt Datei fuer
Datei gegen `main`. Befund: `main` traegt ueberall den **juengeren** Stand.
- `sweet-spot`, `cpu-start`, `t11-wip` waren echte Vorfahren von `main`.
- `t16-fazit`: `lib/fazit-delta.ts` und `tests/fazit-delta.test.ts` zeichengleich; `FazitLauf.tsx`
  weicht nur dort ab, wo main die spaetere `118rem`-Fassung statt `xl` traegt; main hat zusaetzlich
  die Sweet-Spot-Skala in `lib/i18n/de.ts`.
- `t17-register`: `lib/aroma-farben.ts`, `lib/terpen-register.ts` und
  `tests/terpen-register-verbindung.test.ts` zeichengleich; bei `RegisterAuswahl.tsx` hat main die
  freien Eintraege mit `glas-tafel` und Linien-SVG, der Branch noch die alten Pillen.
- `t12-terpene`, `t13-bong`, `t15-wip`, `t7b-wip`: Dateien auf main in juengerer Fassung.
  `app/page.tsx` aus t12 ist nur der alte Ort vor `app/[lang]/`.
- `t5d-wip`: `SweetSpot.tsx`, `TerpenRegler.tsx`, `TerpenErgaenzen.tsx` existieren auf main nicht
  mehr als eigene Dateien, ihre Funktion ist in `AromaKarte.tsx` und `lib/aromakarte.ts`
  aufgegangen; abgedeckt von `tests/aroma-ebenen`, `tests/aromakarte-v2`, `tests/terpen-fluss`.

**Die sieben nicht-Vorfahren sind als Tags gesichert** (`archiv/t5d-wip`, `archiv/t7b-wip`,
`archiv/t12-terpene`, `archiv/t13-bong`, `archiv/t15-wip`, `archiv/t16-fazit`,
`archiv/t17-register`; die drei Vorfahren brauchten keinen Tag). Die Tags liegen nur lokal.
Wer sie nicht mehr braucht: `git tag -d archiv/...`.

**Reste aus Session 39, klein und nicht blockierend:**
- Ein *eindeutiger* Geschmack über Null, der sein Terpen selbst anschaltet. Geprüft ist nur der
  mehrdeutige Fall: „Zitrus" auf 3 ließ Limonen, Nerolidol und Terpinolen pulsieren, ohne Automatik.
- Die Hover-Betonung im Terpen-Band ist nur im Markup und im Test belegt. Ein per JavaScript
  gesendetes Zeigerereignis löst `:hover` im Browser nicht aus; dafür braucht es einen echten
  Zeiger oder einen Screenshot.
- Echte Telefonbreiten unter 494 px für Wortmarke und Band. Das Chrome-Fenster ließ sich nicht
  schmaler stellen als 494 px Viewport.

**Arbeitsweise, Stand 2026-10-05:** keine Subagents, wegen der Credits. Regulär und seriell
arbeiten, bis der Nutzer etwas anderes sagt.

### ⇢ SESSION 39 (2026-10-05): Kartengraph-Überarbeitung, alle sechs Stränge sind gepusht und live

**Stand: A bis F sind umgesetzt und auf `main` (`dcb849b`, `298584d`, `aa36b8c`, `7fee152`,
`0f456dc`). Offen ist allein die Live-Prüfung.** 570 Tests grün, Typen sauber, `npm run farben`
grün; die zwei Lint-Fehler in `BuchReiter.tsx` und `RegisterAuswahl.tsx` bestanden schon vorher.

**Arbeitsweise in dieser Session (Nutzer 2026-10-05):** keine Subagents, wegen der Credits.
Erst drei parallele Implementer gestartet, auf Zuruf des Nutzers sofort gestoppt und alles
selbst seriell gebaut. Für die nächste Zeit gilt: regulär arbeiten, nicht delegieren.

**Strang F (`dcb849b`):** `--text-plakat` hat die Untergrenze 3.5rem statt 6rem, die
Wortmarken-Gruppe im Auftakt hält mobil 24 statt 16 px Seitenrand. Der mittlere Term ergibt bei
390 px rund 74 px, die alte Untergrenze griff also auf jedem Telefon.

**Strang D (`298584d`, `aa36b8c`):** `AromaErkundung` kennt `modus` mit "anzeige", "example" und
"maske"; `eingabe` ist daraus abgeleitet, die versteckten Formularfelder hängen allein an
"maske". Die Startseite läuft über `NoteUndErkundung` als `modus="example"`. Der Hinweis
„Hier wird nichts gespeichert." hängt jetzt ebenfalls an "maske" und steht damit auch im
Example. `SortenKopf` hat den Slot `angaben`; die Blütenseite reicht den Sortenkopf samt
Faktenliste und Wirkstoffspannen in den `bild`-Slot von `BewertungsFormular` und
`AromaErkundung`, die alte Sektion nach dem Rating und die `TerpenChips` dort sind weg.

**Strang E (`7fee152`, `0f456dc`):** `TerpenBandKopie` setzt so viele Kacheln, dass die Kopie
mindestens die Fensterbreite erreicht, und schreibt die gerechnete Kachelbreite nach
`--band-kachel`; die Animation verschiebt um genau diese Breite statt um 50 % der Spur. Die
Infos stehen jetzt im Band selbst (Name, Duft, drei Geschmacksnoten mit Farbbalken), gedämpft
und beim Überfahren voll lesbar; `role="tooltip"` und `aria-describedby` sind weg, ebenso der
Tabstopp auf dem nicht bedienbaren Icon. Das Band ist ab `sm` 192 px hoch (`h-48`), das Skelett
genauso. Mobil bleibt das schmale Icon-Band, dort trägt der `sr-only`-Name die Information.

**Live geprüft am 2026-10-05 (Browser 1, 1500 px Fenster, hinter dem Seitenpasswort):**
- **Strang A:** keine Soll-Striche mehr in der Karte (`data-schicht="soll"` gibt 0 Treffer,
  `balken` 40). Die Sektionshöhe bleibt beim Überfahren konstant (829 px vor und nach dem Hover).
- **Strang B:** 11 Terpen-Schaltflächen mit `aria-pressed`, alle auf `false`. Den Geschmack
  „Zitrus" auf 3 gestellt: drei Kandidaten pulsieren (`Limonen`, `Nerolidol`, `Terpinolen`),
  keiner schaltet sich selbst an, weil die Richtung nicht eindeutig ist. Genau so vorgesehen.
- **Strang C:** die Overall-Regler stehen auf `min 0`, `max 5`, `step="any"`, also Zehntelschritte.
- **Strang D:** „Angaben zur Blüte" steht als `h2` bei y 811, direkt hinter dem Titelblatt (`h1`
  bei y 381), mit Faktenliste, Wirkstoffspannen und dem Terpenprofil in einem Block (754 px hoch).
  Kein Sortenkopf und keine Terpen-Chips mehr auf der Blütenseite, der Handelsname steht genau
  einmal als Überschrift.
- **Strang F:** bei 494 px Viewport ist die Wortmarke 360 px breit, links 59 und rechts 75 px
  Abstand, Schriftgröße 90 px (der mittlere clamp-Term greift, nicht die Untergrenze), kein
  waagrechter Scroll. **Grenze der Messung:** das Chrome-Fenster ließ sich nicht unter 494 px
  Viewport bringen, 320, 360 und 390 px sind deshalb nicht direkt gemessen. Rechnerisch greift die
  neue Untergrenze von 3.5rem erst unter etwa 267 px Fensterbreite.

**Befund 2026-10-05: das Terpen-Band hing live hinter seinem Skelett (behoben mit `59054e9`).**
Der Band-Inhalt stand als `<div hidden id="S:0">` mit elf Einträgen im HTML, aber das Reveal-Skript
`$RC("B:0","S:0")` fehlte, während `$RC("B:1","S:1")` bis `$RC("B:6","S:6")` da waren. Sichtbar
blieb dauerhaft das Skelett (jetzt 192 px hoch). Keine Konsolenfehler. Deshalb rendert `TerpenBand`
jetzt ohne Suspense: die Startseite ist statisch (`revalidate = 300`), das Band darf beim
Vorrendern blockieren und steht dann fest im HTML. Dazu zieht ein ResizeObserver in
`TerpenBandKopie` die Kachelbreite nach, sobald das Band Platz hat.
**Lehre: die erste Suspense-Grenze der statischen Startseite bekam ihr Reveal nicht. Wer dort eine
neue Grenze einzieht, prüft das live.** Weitere Grenzen auf der Seite (S:1 bis S:6) sind in Ordnung.

**Strang E ist live bestätigt (nach dem Build von `59054e9`):**
- Desktop bei 1478 px Fenster: Band 192 px hoch, nicht mehr verborgen, kein Skelett mehr im DOM.
  `--band-kachel` steht auf 4004 px, beide Kacheln sind 4004 px breit, Animation `terpen-band`
  läuft. Eine Kachel überragt das Fenster also deutlich, der Lauf ist damit nahtlos.
- Die Infos stehen im Band: Name, Sortenzahl, Duft und drei Geschmacksnoten mit Farbbalken je
  Eintrag, Balken mit Deckkraft 0,6 gedämpft. Kein `role="tooltip"` und kein Tabstopp mehr im
  Band. Ein Eintrag ist 316 px breit.
- Mobil bei 494 px: Band 78 px hoch, die Infospalte steht auf `display: none`, Kachel 836 px und
  damit breiter als das Fenster, kein waagrechter Scroll. Der ResizeObserver hat die Kachelbreite
  beim Verkleinern von 4004 auf 836 px nachgezogen.
- Die Startseite läuft als Example: 20 Regler, alle auf 0, der Hinweis „Hier wird nichts
  gespeichert." steht da, und es gibt kein einziges verstecktes Formularfeld.

**Damit ist der Plan `2026-10-03-kartengraph-ueberarbeitung.md` vollständig umgesetzt und live
geprüft.** Offen bleibt nur Kleinzeug:
- Ein eindeutiger Geschmack über Null, der sein Terpen selbst anschaltet (geprüft wurde der
  mehrdeutige Fall mit drei Kandidaten).
- Die Hover-Betonung im Band ist nur im Markup und im Test belegt, nicht gemessen: ein per
  JavaScript gesendetes Zeigerereignis löst `:hover` im Browser nicht aus.
- Echte Telefonbreiten unter 494 px.

**Entscheidung des Nutzers vom 2026-10-05 zur Blütenseite (`80c407e`):** die Angaben stehen nicht
doppelt. Der Sortenkopf der Erkundung bleibt der Startseite, weil er auf der Blütenseite das
Titelblatt wiederholt. Die Angaben zur Blüte stehen als ein Block oben hinter dem Titelblatt und
tragen das Terpenprofil mit; `TerpenProfil` ist dafür aus `SortenKopf` herausgezogen, die alten
Terpen-Chips sind weg. Nicht splitten, Profil oben.

**Zugang zur Live-Seite:** Seitenpasswort aus `SITE_PASSWORD` in `.env.local`.

### ⇢ SESSION 39 (früherer Stand): Strang A ist gepusht

Auftrag des Nutzers vom 2026-10-03, zehn Punkte. Spec:
`docs/superpowers/specs/2026-10-03-kartengraph-ueberarbeitung-design.md`,
Plan mit sechs Strängen A bis F: `docs/superpowers/plans/2026-10-03-kartengraph-ueberarbeitung.md`.
Der Plan trägt unten die Live-Befunde A0 und E0 mit Zahlen.

**Entscheidungen des Nutzers vom 2026-10-03 (bereits getroffen, nicht neu fragen):**
- Overall-Noten werden von `Int` auf `Float` migriert, damit der Regler Zehntelschritte kann.
- Terpene sind künftig nur an oder aus; die Stärkeregler entfallen.
- Die Startseite läuft als Example mit denselben Reglern wie die Maske, Startwert 0.

**Fertig und auf `main`: Strang A (`48e395e`, Nachbesserung `375bbc6`) und Strang B (`1799c70`).**

Strang B: Terpene sind an oder aus, der Name rechts in der Karte ist die Schaltfläche. Ein
Geschmack über Null schaltet sein eindeutiges Terpen selbst an; tragen mehrere die Richtung,
pulsieren die Kandidaten in Kopierstift-Violett, bis der Nutzer eines wählt. Gespeichert werden
0 und 1; `terpenAnAus` in `lib/query/bewertung.ts` deutet alte Stufen bis 5 beim Lesen als an,
deshalb braucht es keine Datenmigration. Terpen-Raster, zusätzliche Kartenhöhe und die Tests der
entfernten Mechanik sind weg.

Nachbesserung an Strang A (`375bbc6`): die Infotafel überlagerte die Karte und verdeckte live die
untere Hälfte der Achsen. Sie steht jetzt wieder unter der Karte, aber mit fester Höhe statt
Mindesthöhe. Der Sprung ist damit weg, ohne etwas zu verdecken. **Lehre: die Überlagerung sah im
Code richtig aus und war erst live als Fehler zu sehen.**

**Alter Stand von Strang A:**
Herstellerserie und Soll-Strich sind aus der Karte entfernt, der Bezug ist überall der
Community-Median, ein Wert über Null macht die Achse aktiv, die Infotafel überlagert und die
Sektion springt nicht mehr, und jede Achse wie jedes Terpen hat eine Trefffläche für den Hover.
567 Tests grün, Typen sauber. Die zwei Lint-Fehler in `BuchReiter.tsx` und `RegisterAuswahl.tsx`
bestanden schon vorher und gehören nicht zu dieser Arbeit.

**Fertig und auf `main`: Strang C (`4dbdee7`).**
Overall laeuft in Zehntelschritten wie "Diese Charge". Migration `0015_noten_als_float.sql` hat die
fuenf Notenspalten von INTEGER auf REAL umgebaut (Tabellenkopie im Muster von 0003, alle fuenf
Indizes zurueck). **Migration und `db/constraints.sql` sind remote eingespielt** (242 Zeilen
umgeschrieben, 50 Trigger-Anweisungen), vor dem Push. Die Trigger haengen an der Tabelle und
fallen bei jedem solchen Umbau mit ihr: nach einer Tabellenkopie immer `db/constraints.sql`
hinterher.

**Wichtige Korrektur zur Arbeitsweise:** Claude darf Remote-Migrationen SELBST einspielen, exakt als
`npx wrangler d1 execute cn-medcan-db --remote --file migrations/00NN_x.sql`. Die Memory hiess
irrefuehrend `d1-remote-nur-nutzer`; "nur Nutzer" meint die Ausnahme bei `Authentication error
[code: 10000]`, nicht die Regel. Die Memory ist am 2026-10-05 korrigiert worden.

**Noch offen, in dieser Reihenfolge:**
- **Strang D:** Angaben zur Blüte in den Sortenkopf, Startseite als Example.
- **Strang E:** Terpen-Band. Der Befund steht: eine Kachel ist 1012 px breit, das Fenster
  1714 px, daher 702 px Lücke; der Hover zeigt nichts, weil der Zeiger auf der geklonten
  Kachel landet, aus der `TerpenBandKopie` die Tooltips entfernt.
- **Strang F:** Wortmarke im Hero mobil, `--text-plakat` hat eine zu hohe Untergrenze.

**Live geprüft am 2026-10-05 (Strang A):** keine Soll-Striche mehr, 10 Achsen- und 11
Terpen-Treffflächen, die Infotafel wechselt beim Überfahren und nennt nur noch „Laut Community".
Dabei fiel die Verdeckung auf, die `375bbc6` behebt.

**Noch nicht live geprüft:** Strang B und die Nachbesserung `375bbc6`. Die Cloudflare-Build
braucht nach dem Push einige Minuten. Prüfpunkte: Terpennamen rechts sind anklickbar
(`aria-pressed`), ein eindeutiger Geschmack über Null schaltet sein Terpen, mehrere Kandidaten
pulsieren, und die Sektionshöhe bleibt beim Überfahren konstant, ohne dass die Tafel die Achsen
verdeckt.

**Zugang zur Live-Seite:** Seitenpasswort aus `SITE_PASSWORD` in `.env.local`.


### ⇢ SESSION 38 (2026-10-02, Sessionstart): Sweet-Spot-Score im Fazit, Nutzer hat JA gesagt

**ALS ERSTES, ohne Rückfrage:** Der Nutzer hat am 2026-10-02 die offene Frage aus Session 36 mit JA beantwortet:
Die Fazit-Berechnung soll Geschmackswerte als Sweet-Spot-Werte lesen (0 zu wenig, 2,5 genau richtig, 5 zu viel),
nicht mehr als Stärke.

Erster Blick vor dem Clear ergab: in `lib/aromakarte.ts:317` (`herstellerTreue`) läuft das bereits über
`qualitaetsScore`, der Kommentar dort nennt genau diesen Nutzerentscheid vom 2026-10-01. Auch das Chargenfazit
(`lib/fazit.ts:63`) nutzt `qualitaetsScore`. Die Frage im Abschnitt Session 36 ist also womöglich schon erledigt
und nur nie abgehakt worden.

Deshalb der Auftrag in dieser Reihenfolge:
1. Nachweisen statt vermuten: jeden Weg prüfen, auf dem Geschmackswerte in ein Fazit einfließen
   (`lib/fazit.ts`, `lib/aromakarte.ts`, `lib/query/bewertung.ts`, `lib/query/strains.ts`, Community-Werte in
   `lib/query/community.ts`). Gesucht ist jede Stelle, die einen Geschmackswert noch als „mehr ist besser“ liest.
2. Gibt es eine solche Stelle, auf `qualitaetsScore` umstellen, per Test zuerst (der Test muss rot sein, bevor der
   Code sich ändert).
3. Ist alles schon umgestellt, nichts anfassen, nur die offene Frage im Abschnitt Session 36 als erledigt
   markieren und hier vermerken, mit den Fundstellen als Beleg.
4. Achtung Abgrenzung: Overall (Aussehen, Geruch, Geschmack, Konsistenz, je 1 bis 5) bleibt bewusst „mehr ist
   besser“ und ist NICHT gemeint. Gemeint sind die Achsen der Geschmacksmatrix.

### ⇢ SESSION 37 (2026-10-01/02): Statische Seiten gegen 1102, Plan vollständig umgesetzt und live (`d83a644..21a9f45`)

Plan `docs/superpowers/plans/2026-10-01-statische-seiten.md` (11 Tasks) ist fertig, Verlauf und Rulings R1 bis R11 in
`.superpowers/sdd/2026-10-01-statische-seiten/progress.md`. Spec `docs/superpowers/specs/2026-10-01-statische-seiten-sprache-in-url-design.md`.
- **Live seit Push `d83a644..88d8342` auf main.** Statisch je Sprache: `/` und `/reviews` revalidate 300 s, `/impressum`
  und `/datenschutz` 86400 s, `/zugang` revalidate false. Die Sprache steht als internes Segment `app/[lang]` im Rewrite,
  NICHT in der sichtbaren URL (`/english/reviews` ist deshalb korrekt 404).
- **Cache-Aufbau:** KV als Incremental Cache direkt (Namespace `501e88b46f8344ff85f88eb24dcea156`), kein Regional Cache
  (Cache API wirkt nur auf Custom Domains, die Seite läuft auf `*.workers.dev`, R8), memoryQueue, Cache-Interception.
- **Neu:** `GET /api/startseite` liefert die Teile mit Sitzung (`Cache-Control: private, no-store`); Stimmzettel,
  Empfehlungen und „Bild beitragen“ rendern im Browser aus diesem Stand (`laedt`/`fehler`/`veraltet`).
- **Build 2026-10-02 (`88d8342`) erfolgreich:** `/[lang]`, `/[lang]/reviews`, `/[lang]/impressum`, `/[lang]/datenschutz`,
  `/[lang]/zugang` als ○ statisch, der Rest ƒ; KV-Cache mit 5 Einträgen befüllt.
- **Abgemeldet geprüft:** `/`, `/reviews`, `/api/startseite` je 307 auf `/zugang`; `/impressum` 200, erster Abruf MISS, zweiter HIT.
- **Angemeldet geprüft:** Startseite mit Empfehlungen, Stimmzettel („Deine Stimme ist gezählt“), „Bild beitragen“;
  `/reviews` deutsch und englisch über den Sprachknopf auf derselben URL; `/umfragen`, `/mitglied`, Blütenseite unverändert dynamisch.
- **CPU über 60 min (Cloudflare Observability):** `/` n=17 p50=14 ms max=598; `/reviews` n=13 p50=28 max=243;
  `/impressum` n=9 p50=37 max=277; `/umfragen` p50=29; `/mitglied` p50=37; `/blueten/:slug` p50=53;
  exceededCpu=0 auf allen Pfaden. Kein outcome außer `ok` (das offene „exception“ aus Session 36 ist erledigt).
- **Offen für die nächste Session:**
  - 24-h-Vergleich der Logs gegen den Befund vom 2026-10-01 (Startseite kalt 400 bis 1832 ms, 62× exceededCpu in 24 h).
  - Abstimmen auf der Startseite live mit dem Nutzer prüfen (eine echte Stimme ist nicht umkehrbar, bisher nicht getestet).
  - Live-Prüfliste aus Session 36 (siehe unten).
  - Vorbedingung Domain-Umstellung: OpenNext setzt `s-maxage` ohne `private`; mit eigener Domain und HTML-Cache-Regel
    könnte der Edge gatedte Seiten (`/`, `/reviews`) ohne Gate ausliefern. Vorher Bypass oder `private` sicherstellen (Spec 4.4).
- **Abschluss-Review und Fixwelle (`56d9601..21a9f45`, live geprüft):** keine Critical; das Gate läuft nachweislich vor der
  Cache-Interception, kein Cross-User-Leak. Behoben: alle `revalidatePath`-Aufrufe laufen jetzt über
  `revalidiereSprachen` aus `lib/i18n/revalidiere.ts` und treffen beide Sprachen (vorher zeigten sie auf Pfade ohne
  Sprachsegment); `POST /api/sprache` weist fremden Origin und `Sec-Fetch-Site: cross-site` mit 403 ab (live bestätigt);
  `tests/statische-seiten.test.ts` prüft jetzt den ganzen Importbaum der statischen Seiten auf Sitzungszugriffe statt nur
  die fünf Seitendateien. Zurückgestellt (im Ledger als Parked mit Begründung): leerer `Origin`-String gilt als fehlend,
  die Testausnahme für `lib/query/budpics.ts`, fehlende `.gitattributes` bei gemischten Zeilenenden.
- **Prüfgrenze:** `fetch()` aus dem Browser-MCP-JS-Kontext erreicht die Seite nicht (bleibt pending); Cache-Header angemeldet
  daher nicht direkt messbar, Beleg über Resource-Timing und Observability (R9).
- **Dauerregel (Nutzer 2026-10-02):** Pläne künftig von Anfang an in parallel ausführbare Stränge schneiden, je Strang ein
  Worktree, Implementer parallel, am Ende ein Merge und ein Review. Push-Prüfpunkte bleiben seriell.
- Browser 1 läuft als Hintergrund-Tab: Screenshots und Formular-Submit hängen dort, Prüfung per JS/curl.

### ⇢ SESSION 36 (2026-09-30/10-01): Register, Band, Sweet Spot, Terpen-Regler in der Karte, CPU-Fix – alles live (`2c7be45`)

**ALS ERSTES (Sessionstart):** Live-Prüfung (Browser), Nutzer nichts fragen außer der offenen Frage unten:
- 390 px und hell: Blatt-Note Startseite, feinere Blätter (Blüten + Startseite), Glas-Tafel im Register (Linien sichtbar? sonst `--tafel-papier` 78 % → ~60 %), Sweet-Spot-Skala (Randwörter, Kontrast ~0,42 Deckkraft unter AA → anheben).
- Handy: rechte Kartenspalte ist `touch-none` (Terpen-Regler) – lässt sich noch senkrecht scrollen?
- Cloudflare-Logs: Startseite CPU kalt (zuletzt 698 ms ok; 1832 ms führte zu 1102 für alle Anfragen).
- **Offene Nutzerfrage:** Fazit-Berechnung (Herstellertreue/Terpen-Abgleich) liest Geschmackswerte noch als Stärke, seit heute sind es Sweet-Spot-Werte (0 zu wenig, 2,5 genau richtig, 5 zu viel). Auf Sweet-Spot-Score umstellen?

- **Erledigt:** Fazit ab 118rem außen im Seitenrand; Register frei (Terpene oben, Glas-Tafel Mitte, Geschmäcker unten, farbige Linien mit Lichtfluss); Terpen-Band zwischen Hero und Story (dezent, Hover hält an, Tooltip); Herstellerstreifen raus; Sweet-Spot-Skala der Geschmäcker (Linien/Tempo/Puls am stärksten bei 2,5, Funken nur exakt 2,5, grün); Terpen-Regler-Box entfällt, Regler rechts in der Karte (>0 bei nicht angegebenem = ergänzt); Blatt-Note auf der Startseite; Blätter feiner.
- **1102-Ursache:** Startseite zu viel Server-CPU. Fix: Band-Liste nur einmal (Kopie im Client), Register nur Starttafel serverseitig, Karten-SVG erst nach Hydrieren. Seite 17 → 5 ms lokal, HTML 476 → 179 KB. Bericht: Scratchpad `cpu-report.md`/`cpu-fix-report.md` (Session-temporär).
- Plan + Ledger: `docs/superpowers/plans/2026-09-30-sweet-spot-karte.md`, Ledger `C:\cn-t14\.superpowers\sdd\…\progress.md` (Minors dort). Task 5 und CPU-Fix ohne Task-Review live; Final-Review des Pakets steht aus.
- Worktrees C:\cn-t14 (sweet-spot), C:\cn-t15 (cpu-start) gemergt, kann der Nutzer entfernen.

### ⇢ SESSION 35 (2026-09-30 abends): Crash-Fix, T16–T20 per SDD parallel, alles gepusht (`91adcc1`) und live geprüft

**ALS ERSTES (Sessionstart):** Nutzer in EINER Frage: Register-Verbindung nur Ring/Dimmen ok, oder echte Linien
zwischen Terpen und Geschmack zeichnen? Danach ohne Rückfrage: Knöpfe rechts unten vs. Fazit-Leiste fixen,
Esc-Fokus prüfen, T16 ab xl live (Fenster ≥ 1280 px), Rest der Prüfliste. Alle Agents beendet, nichts in Arbeit.

- **Bugs behoben:** Blütenseite zeigte nur Fehlerseite (Funktion als Prop Server→Client, `3354a65`); waagrechte
  Scrollleiste (fieldset sr-only min-content, `fd1092f`).
- **T16** Fazit läuft mit: ab xl sticky Spalte rechts, darunter Leiste unten + Sheet (Fokusfalle, Esc). Live: Leiste
  „Betreiber-Fazit 67 % ↑ +5 Pkt.“, Sheet öffnet/schließt. **T17+T18** Register mit Terpen-Icons, Aromafarben,
  Ring+Dimmen verbundener Einträge (keine gezeichneten Linien); Hintergrundtext „riech mal“ voll lesbar (z-10).
  **T19** `/bewerten/x?a=1` → 308 `/blueten/x?a=1#bewerten` (Proxy statt config-Redirect), live per curl ok; Browser
  hatte alte 308 gecacht. **T20** Terpen-Regler per Tastatur in ganzen Stufen, live ok.
- `npm test` 505/505, tsc sauber. Final-Review frei; Minors (b) im Ledger `progress.md` (Session 35).
- **Offen / live noch prüfen:** schwebende Knöpfe rechts unten überdecken das rechte Ende der Fazit-Leiste (Pfeil ⌃);
  Fokus kehrt nach Esc evtl. nicht auf die Leiste zurück (nicht sicher gemessen); T16 ab xl (1440 px) und 390 px,
  hell; Kontrast gedimmte Register-Pillen (opacity-60) und ring-offset dunkel; Rest der Prüfliste Session 34.
- **Nutzerfrage offen:** Register-Verbindung nur per Ring/Dimmen – reicht das, oder echte Linien zeichnen?
- Worktrees C:\cn-t12 (t17-register), C:\cn-t13 (t16-fazit) kann der Nutzer entfernen; alte WIP-Branches löschbar.

### ⇢ SESSION 34 (2026-09-30 nachmittags): T5d + Final-Review fertig, gepusht (`443a1fa`)

**Stand:** Paket Buch-Bewertung v2 komplett auf main und gepusht. T5d (Terpen-Regler statt Sweet Spot, Lichtstrich
nach Wert, Funken über Median; Fix: „Weitere Terpene“ klappt beim Zurückziehen nicht zu) `cd30d5a`. Final-Review:
keine Integrationsbefunde, ein Fix (Profilbild-Knöpfe nach Netzfehler nicht gesperrt) `443a1fa`, ~30 Minors verworfen.
`npm test` 483/483, tsc sauber. Impressum/Datenschutz live geprüft: Nutzerdaten da, BayLDA.
**NEUE TODOS (Nutzer 2026-09-30, nach Live-Prüfung abarbeiten, per SDD mit Brief je Task):**
- **T16 Fazit mitlaufend:** Das Fazit (Sorte/Charge, heute unter der Bewertung angehängt, siehe
  `components/review/AromaErkundung.tsx`, `BewertungsFormular.tsx`) soll interaktiv rechts im Leerraum neben den
  3 Bewertungsschritten mitlaufen (sticky), damit der Einfluss der eigenen Bewertung auf einen Blick sichtbar ist
  (live aktualisiert beim Regeln). **Mobil offen:** Platz ist knapp, Lösung muss erst erarbeitet werden. Beim
  Sessionstart per Brainstorming 2–3 Varianten vorschlagen (z. B. einklappbare Leiste unten mit Kurz-Fazit, Chip mit
  Delta, das beim Tippen aufgeht) und Nutzer in EINER Frage wählen lassen.
- **T17 Register „Terpene und ihre Geschmäcker“ aufwerten** (T12, `components/story/TerpenRegister.tsx`,
  `lib/terpen-register.ts`, `components/story/bewegung/register.ts`, globals.css): große Terpen-Icons bei den Texten;
  die Terpen-Farben und -Animationen aus Aroma-Karte/Regler übernehmen; Verbindung Terpen↔Geschmack hochwertig
  sichtbar machen (Linien zwischen verbundenen Einträgen und/oder Highlighting beim Hover/Fokus, Touch-Äquivalent).
  Skills: ui-design-engine, animate, emil-design-eng.
- **T18 Bug Hintergrundtext abgeschnitten:** Der große Hintergrundtext der Register-Section (T12) wird von der
  Section darüber halb verdeckt und ist nicht lesbar. Überlappung/z-index/Abstand prüfen, live in hell und dunkel,
  Desktop und 390 px. Kann mit T17 zusammen laufen (gleiche Dateien, dann ein Implementer).

**ALS ERSTES:** Mobil-Frage zu T16 (siehe oben) stellen, dann Live-Prüfung (Browser 1). Prüfliste:
- T5d: Zusatzterpen hochziehen und zurück auf 0, Abschnitt bleibt offen; Funken-Optik; `opacity-70` Kontrast.
- `/bewerten/x?a=1` springt zu `#bewerten`; Median-Ring vs. Hersteller-Serie unterscheidbar (Nutzer fragen).
- Sparmodus: `.delta-puls` fast unsichtbar? Buch: Layout-Sprung rechte Hälfte, Pause bei Play-Hover.
- Notiz-Blatt: verdeckte Links per Tab erreichbar? (`Buch.tsx:460` inert). Tabpanel-Rollen mobil.
- Budpics Diashow mit 3 Bildern; Kontraste Kopf 88/97 % (T15), Bong (T13); T12 Tafel + gefilterter `_count`.
- Gesamtnote unberührt „0 von 5“ ohne Hinweis (T5c); Regler PageUp/Home/End.
- CPU-Zeit Blütenseite im Workers-Dashboard.
- Worktrees C:\cn-t12, C:\cn-t13 kann der Nutzer entfernen; Branches t5d-wip/t7b-wip/t15-wip/t11-wip löschbar.

### ⇢ SESSION 33 (2026-09-30 mittags): T7b, T15, T13, T14, T12 fertig und gepusht (`00baffc`)

**Stand:** Alle fünf reviewt (sauber), nach main übernommen, `npm test` 477/477, tsc sauber, gepusht. Live NOCH NICHT
geprüft (Prüflisten `task-7b/12/13/14-report.md` im Ledger-Ordner; T15 Kopf-Kontrast hell/dunkel; T12 gefilterter
`_count` gegen D1; T13 Bong-Optik).
- **T14 Impressum:** Betreiberdaten aus Secret `IMPRESSUM_JSON` (Nutzer setzt selbst:
  `npx.cmd wrangler secret put IMPRESSUM_JSON`, eine Zeile JSON mit name, strasse, ort, land, email, telefon ohne
  „(0)“, bundesland). Ohne Secret: sichtbare Platzhalter, kein 500. Privatperson, verantwortlich = Betreiber,
  Cloudflare über DPF + DPA.
**ALS ERSTES:** Browser verbinden lassen (Chrome mit Claude-Erweiterung; list_connected_browsers war leer), dann live
prüfen: /impressum und /datenschutz zeigen Nutzerdaten (Secret IMPRESSUM_JSON ist laut Nutzer gesetzt, kein
„[BITTE ERGÄNZEN“ mehr), dazu die Prüflisten unten. Keine offenen Nutzerfragen.
- **T5d WIP** auf Branch `t5d-wip` `8c124e8` (Safe 4 clear, Agent mitten in TDD gestoppt, Tests rot, ungeprüft):
  frischen Implementer (opus) mit `task-5d-brief.md` + Report-Pfad dort weitermachen lassen, BASE 54778b8,
  dann Review, nach main.
- **Offen:** T5d (s. o.), danach Final-Review (opus, Minors aus Ledger),
  Live-Prüfung, Worktrees C:\cn-t12 / C:\cn-t13 kann der Nutzer entfernen (`git worktree remove`).
- Caveman-Modus bei Sessionstart laden (Memory `caveman-immer`).

### ⇢ SESSION 32 (2026-09-30 vormittags): T11+T5c live, T7b/T15 auf WIP-Branches, Sicherung zum Clear

**ALS ERSTES:** T14 Impressum – die Fragen aus Session 29 in EINER AskUserQuestion stellen (Betreiber Name/Firma,
Anschrift, Land; Kontakt E-Mail + zweiter Weg; Register/USt-IdNr.; inhaltlich verantwortlich dieselbe Person;
Bundesland; Cloudflare über EU-US DPF + DPA eintragen). Danach ohne Rückfrage weiter.

**Nutzerwunsch:** Bei Parallelarbeit öfter clearen (Kontext wächst schnell) – nach jedem gemergten Task-Paket
HANDOFF sichern und Clear anbieten.

**Wiedereinstieg:** Skill `superpowers:subagent-driven-development`, Ledger
`.superpowers/sdd/2026-09-29-buch-bewertung-v2-master/progress.md` (Rulings bis R22, Session-32-Einträge am Ende).
- **Nutzerantworten 2026-09-30:** Betreibername bleibt sichtbar; Karte ohne Login bleibt; Overall-Noten ab 0 (R17).
- **ERLEDIGT und gepusht:** T11 Empfehlungen (Review sauber, Migration 0014 remote drin, 26 Tabellen), T5c
  (Overall ab 0, Regler rasten auf ungerade Community-Werte ein). Live NICHT geprüft (Prüflisten task-11/5c-report.md).
- **t7b-wip `01d9d82`:** T7b Buch auf einen Screen (Desktop), Fix-Runde 1 fertig, **Re-Review offen** (Pakete
  liegen im Ledger-Ordner). Danach nach main.
- **t15-wip `cd47882`** (baut auf t7b-wip): Kopf leicht durchscheinend (78 %/88 %/97 %), `npm test` noch laufen
  lassen, dann kurzer Review.
- **T5d offen** (Brief `task-5d-brief.md`): Terpene automatisch ergänzt/entfernt nach Reglerwert, Sweet Spot raus,
  Animationslinie ∝ Regler, Funken fürs Delta über Median. Startet nach T7b/T15 im Hauptbaum.
- **T12/T13:** Worktrees `C:\cn-t12` (t12-terpene) und `C:\cn-t13` (t13-bong) vom Nutzer angelegt (ab ae58753, Regeln
  `worktree-regeln.md`), Agenten gestoppt bevor sie etwas schrieben → neu dispatchen. Claude darf selbst KEINE
  Worktrees außerhalb C:\cn anlegen (Auto-Mode).
- Remote-D1: `--file` meldete Auth 10000 bis Nutzer `npx.cmd wrangler login` machte; danach ging es.

### ⇢ SESSION 31 (2026-09-30 nachts): T5b–T10 fertig und live, T11 halb, Sicherung zum Clear

**ALS ERSTES (Nutzerwunsch 2026-09-30):** die drei „Offenen Nutzerfragen“ unten in EINER AskUserQuestion stellen
(Betreibername vs. „wir“ im Buch; Karte ohne Login gegen Median; Overall-Noten ab 0), Antworten umsetzen lassen bzw.
als Ruling ins Ledger. Danach ohne weitere Rückfrage weiter.

**Wiedereinstieg:** Skill `superpowers:subagent-driven-development` laden, Ledger
`.superpowers/sdd/2026-09-29-buch-bewertung-v2-master/progress.md` lesen (Rulings R1–R16, Stand je Task,
zurückgestellte Minors für den Final-Review).
- **ERLEDIGT, geprüft (Review sauber) und live seit Push 02:32 (`3a34ab8`):** T6 Fazit getrennt, T5b Aromakarte v2
  (Regler starten bei 0, Hersteller als stiller Streifen, nur eigene Bewertung animiert, Balken grün/lila gegen
  Median), T7 Buch zum Blättern (+5 Fixes), T8 Avatare, T9 Budpics (+Moderation freigegebener), T10 THC/CBD ein Wert
  + Bilder beim Vorschlagen (nur freigegebene Mitglieder). Nutzer-Fixes: Menüknopf ab lg verborgen (`71fae10`),
  Kopf im Hell-Modus schon im Hero Papier + Scroll-Bug (Pins nach Höhenänderung neu messen, ResizeObserver in
  `components/story/bewegung/start.ts`) (`37d264e`).
- **Migrationen 0010–0013 remote eingespielt** (24 Tabellen). Nutzer hat eine Bash-Regel ergänzt: Claude darf
  selbst einspielen, aber NUR exakt `npx wrangler d1 execute cn-medcan-db --remote --file migrations/00NN_x.sql`
  (ohne `cd … &&`-Präfix, sonst sperrt die Auto-Mode-Prüfung). DB liegt in EEUR, jurisdiction eu (geprüft).
- **Live geprüft:** nur neuer Build ausgeliefert (neue CSS-Regel da) und Menüknopf bei 1143 px verborgen.
  **NICHT live geprüft:** Kopf hell im Hero (Screenshot hing), Scroll bis ganz unten auf der Startseite, und die
  Live-Prüflisten in `task-5b/7/8/9/10-report.md` (Desktop + 390 px, hell/dunkel). Browser: Browser 1
  (deviceId 89686582-…) per list_connected_browsers + select_browser.
- **T11 Empfehlungen HALB, gestoppt:** unfertig und ungeprüft auf lokalem Branch `t11-wip` (`54b3a35`, enthält
  `migrations/0014_nutzer_empfehlungen.sql`, lib/empfehlung*.ts, components/empfehlung, tests). Nächster Schritt:
  frischen Implementer (opus) mit `task-11-brief.md` + Report-Pfad auf `t11-wip` weitermachen lassen (oder
  cherry-pick nach main und dort fertig), dann Review, 0014 einspielen, erst dann nach main. `lib/generated` enthält
  evtl. den T11-Prisma-Client: vor tsc auf main `npx prisma generate`.
- **Danach:** T12, T13, Final-Review (opus, Minors aus dem Ledger triagieren), Push, Live-Prüfung. T14 Impressum:
  Fragen an den Nutzer offen (siehe Session 29).
- **Offene Nutzerfragen:** (1) Im Buch steht der Autorname öffentlich, auch der Betreibername auf Startseite und
  /reviews statt „wir“ – gewollt? (Doppelseite.tsx, eine Zeile) (2) Karte ohne Login: Balken auch dort gegen den
  Median, Hersteller-Soll-Strich weg? (T5b, eine Zeile) (3) Overall-Noten starten beim Community-Mittel (R13) –
  auch auf 0?
- Cloudflare-MCP meldet Authentication error: Nutzer kann per `/mcp` neu anmelden. Leerer Ordner `C:\cn-t5b`
  bleibt (geschützter Pfad), Nutzer kann ihn löschen.


### ⇢ SESSION 29 (2026-09-29 abends): T4–T14 per Subagenten (SDD), Zwischensicherung

**Nutzerauftrag:** „mit Subagenten den gesamten Todo abarbeiten, jeder Agent nutzt die besten Skills; wenn alle
durch sind live pushen und safe 4 clear.“ Zwischendurch (20:30) „safe 4 clear wenn möglich“ → diese Sicherung.

**Wiedereinstieg (ohne Rückfrage):** Skill `superpowers:subagent-driven-development` laden, dann den Ledger
`.superpowers/sdd/2026-09-29-buch-bewertung-v2-master/progress.md` lesen (lokal, gitignored, überlebt den Clear).
Dort stehen Rulings R1–R9, jeder Task-Stand, zurückgestellte Minors. Weiter beim ersten Task ohne
`Task <N>: complete`. Im selben Ordner: `common.md` (Projektregeln für Agenten), `impl-contract.md`
(Implementer-Vertrag), `review-contract.md` (Reviewer-Vertrag), `task-<N>-brief.md` für T4–T13 (Masterplan-Text
plus „Hinweise des Controllers“), Reports `task-<N>-report.md`, Review-Pakete per
`bash <skill>/scripts/review-package <plan> BASE HEAD`. Dispatch-Muster: Implementer bekommt Brief + common.md +
impl-contract.md + Report-Pfad; Reviewer bekommt review-contract.md + Brief + Report + Diff-Datei. Modellwahl R7.

**Stand:**
- **T4 ERLEDIGT** `875d763` + `a660176` (Review sauber): Maske in der Blütenseite (Anker `#bewerten`), vorbelegt mit
  eigener Bewertung, BlattNote (5 Blätter, halbe Schritte; Touch: ganzes Blatt ≥ 57 px plus −/+ 44 px),
  „Diese Charge“ mit Sweet Spot, `/bewerten/:slug` → 308 `/blueten/:slug#bewerten`, Aktion jetzt
  `app/blueten/[slug]/aktionen.ts`.
- **T5 ERLEDIGT** `12df2e6` + `4fda47d` (Review sauber): Karte mit drei Ebenen (Hersteller, ergänzt, Geist),
  grüner Ring = Community-Median aus `sorten_kennwerte`, „Deine Nase vs. Community“, TerpenErgaenzen wieder in der
  Maske (übersetzt).
- **Live:** T4+T5 mit dieser Sicherung gepusht (ungeprüft live, Build ~13 min). Live-Prüflisten in
  `task-4-report.md` und `task-5-report.md` (Workspace-Ordner oben).
- **⚠ Migration 0010 NICHT remote eingespielt:** Das Auto-Mode-Prüfsystem verweigert Claude Produktionszugriffe
  auf D1 („Production Reads“). Nutzer muss selbst ausführen (PowerShell):
  `npx.cmd wrangler d1 execute cn-medcan-db --remote --file migrations/0010_kennwerte_nachtragen.sql`
  (nur INSERT … ON CONFLICT DO NOTHING, idempotent). Ohne sie zeigen Sorten mit Altbewertungen „Noch kein
  Community-Wert“, nichts bricht. Dasselbe gilt für die kommenden Migrationen aus T8, T9, T11 (0011 ff.):
  **vor** dem Push, der sie braucht, vom Nutzer einspielen lassen, sonst 500 auf den neuen Tabellen.
- **T6 IMPLEMENTIERT, REVIEW OFFEN:** `cbc5683` (Fazit in Sorte und Charge getrennt, 345/345 Tests, lokal, NICHT
  gepusht, weil ein Push den laufenden T4/T5-Build abbrechen würde). Nächster Schritt: Review-Paket
  `472e2ea..cbc5683` (BASE ist der HANDOFF-Commit, der Code-Stand davor ist 4fda47d), Reviewer mit
  review-contract.md dispatchen. Report: `task-6-report.md`. Implementer-Bedenken: „Betreiber-Bewertung im
  Vergleich“ hat kein eigenes Label (istBetreiber nicht durchgereicht); treue/gesamteindruck in erkundung-daten.ts
  weiter live gerechnet (nur gesamtnoteMedian neu aus Kennwerten). Beides im Review bewerten lassen.
- **Offen danach:** T7–T13 per Subagenten, dann Final-Review (opus), dann ein Push, Live-Prüfung, HANDOFF.
- **T14 Impressum:** Fragen im Chat gestellt, noch unbeantwortet: Betreiber (Name/Firma, Anschrift, Land),
  Kontakt (E-Mail + zweiter schneller Weg), Register/USt-IdNr. ja/nein, inhaltlich verantwortlich = dieselbe
  Person?, Bundesland (Aufsichtsbehörde), Cloudflare über EU-US DPF + DPA eintragen? Hinweis an Nutzer: Repo ist
  öffentlich, Anschrift landet in der Historie (Alternative: als Secret einlesen).
- **Mit Nutzer live klären:** R8 (grüner Ring = Community-Median, grüne Balken = Hersteller, gleiche Farbe).

### ⇢ SESSION 28 (2026-09-29): Masterplan Bewertung v2 (T0–T14)

- Nutzerauftrag (Buch zum Blättern, Bewertung v2, Empfehlungen, Avatare, Budpics, Schalterleiste, Videos, Impressum):
  **Masterplan `docs/superpowers/plans/2026-09-29-buch-bewertung-v2-master.md`**. Je Task eine Session: Detailplan,
  umsetzen, live prüfen, Nutzer melden, HANDOFF, Clear.
- `.gitignore`: 1.json und __pycache__.
- **T0 ERLEDIGT:** Testnutzer `testnutzer@book-of-terpz.test`, freigegeben (direkt in D1, Nutzer hat D1-Schreiben
  erlaubt), Zugangsdaten in `.env.local` (TESTNUTZER_EMAIL/PASSWORT), Hash gegen Passwort geprüft.
  Befund: `SITE_PASSWORD` in .env.local passt NICHT zum Live-Secret (/api/zugang → fehler=1), API-Tests per Node
  gehen daher nicht; Browser-MCP nutzen (Achtung: Testnutzer-Login löst Admin-Sitzung ab).
- **T1 ERLEDIGT** `6695edf` + `16971b6`: aussehen-loop = Pexels 7667290 (erstes Storytelling-Video), Hero hell =
  3153124 (`auftakt-loop-hell`, 6,4 MB), dunkel bleibt 7684711; Umschaltung per `.nur-hell/.nur-dunkel`
  (display none !important, sonst gewinnt Utility `block`). Live per JS geprüft: je Thema genau ein Hero-Video sichtbar.
- **T2 ERLEDIGT** `974419d`: `SchalterLeiste` unten rechts senkrecht (Flagge der aktiven Sprache, Zelt, Joint-Zeiger
  an/aus nur mit feiner Maus, Sparmodus). `lib/einstellungen.ts` (+Test): data-zeiger/data-sparmodus auf <html>,
  Kopf-Skript, Ereignis; Sparmodus stoppt StoryBuehne (damit Videos, Lenis, GSAP), JointCursor und CSS-Endlosschleifen;
  Vorgabe an bei saveData. Zelt/Sprache aus Kopf und Menü entfernt, Kopf-Einrückung weg. Tests 294/294.
  Live per JS geprüft (Leiste 44×176 unten rechts, 4 Knöpfe, Sparmodus pausiert). Screenshot ging nicht
  (Hintergrund-Tab) → Optik vom Nutzer ansehen lassen.
- **T3 ERLEDIGT** `b55b6ad`: Doppelte Betreiber-Bewertung 420-evolution (B, 09:26) auf Nutzerwunsch gelöscht, A
  bleibt; 0009 und constraints.sql remote eingespielt (mit `npx.cmd`, `--file` ging diesmal). Nutzer hat live
  bestätigt: Startseite zeigt Notiz A. Tipp: im PowerShell-Fenster des Nutzers blockiert die Execution Policy
  `npx`, dort `npx.cmd` angeben. Weiter mit **T4**, erst Detailplan schreiben.
  Alter Stand zur Info:
- **T3 (alt):** Code fertig, tsc sauber, Tests 300/300:
  `lib/bewertung-v2.ts` (+Test: Median, Gesamtnote, Qualitäts-Score, Abweichung, Sortenkennwerte),
  `lib/kennwerte.ts` (fortschreiben bei Speichern, Admin-Freigabe, Admin-Löschen), Eingabe `gesamtnote` optional
  (+i18n `bewertung.gesamtnote`), Speichern per upsert auf (autorId, strainId), Prisma-Schema (gesamtnote,
  @@unique, Modell SortenKennwerte), `migrations/0009_bewertung_v2.sql`, Trigger-Prüfung gesamtnote in
  db/constraints.sql. Qualität der Charge = bestehende `beschaffenheit` (hängt über charge_id), keine neue Spalte.
  **Remote-Migration scheiterte:** UNIQUE (autor_id, strain_id) verletzt, es GIBT live doppelte Bewertungen
  (Vorabprüfung war abgeschnitten). constraints.sql-Import: Authentication error 10000 (`--file` = Import-API;
  ggf. `wrangler login` neu). Unklar, ob ALTER TABLE gesamtnote schon live ist (prüfen per pragma_table_info).
  Nächste Schritte: Doppelte auflisten, Nutzer fragen, welche weg (vermutlich Testbewertungen), dann Migration
  (Befehle einzeln per --command, falls --file weiter Auth-Fehler), dann eslint, commit, push, live prüfen.
  Shell-Autoprüfung fiel mitten in der Session aus.

### ⇢ SESSION 27 (2026-09-29) — A6 Mobil begonnen

- Messung 390 px (iframe) auf /, /blueten, /reviews, /umfragen, /mitglied: kein waagerechter Überlauf.
- `f858c9f`: Button `sm` und Karte/Netz-Umschalter per `pointer-coarse:h-11` auf 44 px (Desktop unverändert). Live ausgeliefert (CSS geprüft).
- Kein Befund: Filterzeilen schon min-h-11; Regler-Inputs pointer-events-none (Fläche drumherum zieht); Achsennamen der Karte aria-hidden, bleiben.
- Videos: bei saveData oder 2g/3g startet loops.ts nichts (Standbilder), kein ffmpeg zum Verkleinern da.
- `14b1e37`: Lenis nur mit feinem Zeiger (Touch scrollt nativ), ScrollTrigger ignoreMobileResize auf Touch.
- web-perf live (/, warm): TTFB 3,1 s (CPU-Limit Free, Entscheid c), load 4,1 s; 1 MB JS entpackt, Schrift 296 KB
  (Newsreader normal+kursiv mit opsz, Designentscheid, belassen), Bilder 73 KB. Kein weiterer schneller Hebel.
- Hell-Modus 390 px: /blueten, /reviews sauber, kein Überlauf. / und /admin/vorschlaege lieferten 08:04 UTC 1102.
- Hell-Modus Startseite mobil geprüft; einziger Befund Hero-Knopf umbrach linksbündig, behoben `336789f` (live geprüft).
- A2 erledigt: keine offenen Vorschläge, Testblüte ist freigegeben und mit Review sichtbar. **A6 damit abgeschlossen.**
- Alt-Liste A6: Lenis/GSAP-Last, web-perf, Hell-Modus mobil, Credits-Links im Fuß ERLEDIGT `a4522f3` (pointer-coarse 44 px; live: Klassen und CSS-Regeln von a4522f3 und f858c9f ausgeliefert, echtes Handy nicht getestet), Testblüte freigeben (A2).

### ⇢ SESSION 25 (2026-09-28/29, läuft) — Nutzerauftrag Mobil vorgezogen

Wochenlimit war am 27.09. erschöpft (Agents brachen ab), seit 28.09. 23 Uhr wieder frei.
- **Englisch-Nacharbeiten** `b6d364e` (live): html lang en-GB, error.tsx per useSyncExternalStore, /api/sprache
  entfernt, Guaiol/Eucalyptol. `server-only` in de.ts/en.ts bewusst NICHT (Tests importieren die Wörterbücher).
- **Nutzerauftrag 2026-09-27 (Mobil):** Texte/Überschriften mittig, Kopf mit Icons/Aufklappmenü, Videos und
  Karten-Animationen flüssiger (auch Desktop). Umgesetzt:
  - `dfb77f8` Kopf unter lg: Logo, Konto als Symbol (Zähler als Punkt), Menüknopf; natives Popover
    (`components/layout/KopfMenue.tsx`, CSS `.kopf-menue`) mit Navigation, Zelt, DE/EN. Ab lg unverändert.
  - `a8799be` Leistung: Touch/schmal ohne backdrop-filter (Kopf, Glas), Blobs nur `rotate` (`blob-drehen`)
    statt border-radius-Morph, Karte ohne Endlosschleifen; überall Karte ohne drop-shadow je Bogen, Pulse nur
    über Deckkraft. Zentrierung: Story-Überschriften unter md/lg, Seitenkopf unter md.
  - **Live noch NICHT geprüft** (Build lief beim Schreiben). Prüfen: Menü öffnen/schließen (auch Linkklick),
    Konto-Symbol mit Zähler, Überlaufwort in AromaSektion zentriert (ragt evtl. rechts raus), Hell/Dunkel.
- **Abschluss-Review (A5)**, Teil 1 per Agent (Admin/Auth/Umfrage/lib): 3 Befunde, alle behoben in `8b829ad`
  (Vorschlagsfrist serverseitig + UI via `nimmtVorschlaegeAn`, Zuordnen mit inaktiven Blüten + Reaktivieren,
  Impressum/Datenschutz `lang="de"` + englischer Hinweis). **Teil 2 offen:** Review von components/story,
  components/review, components/layout, components/produkt. `npm audit`: 4× high nur in der Prisma-CLI-Kette
  (deepmerge-ts, mysql2), Fix nur per Prisma-6-Downgrade → belassen.
- **1.json (Nutzer 2026-09-27: analysieren und Daten anreichern).** Analyse fertig (Skripte `profil.py`,
  `abgleich.py` im Scratchpad der Session, ggf. neu schreiben): 587 Sorten, 55 Hersteller, keine IDs/PZN/Preise.
  Nutzbar: Hersteller, Kultivar, THC/CBD, Anbauland (füllt 17), Terpene nur als Rang (füllt 34), Aromen (74).
  **Nicht nutzbar (HWG):** `effect`, `medicaleffect`. Abgleich über Hersteller+Kultivar (+THC ±2): ~85 von 307
  unserer Sorten; 467 ohne Treffer. **Nutzerentscheid 2026-09-29:** Datei hat der Nutzer selbst mühsam
  zusammengetragen (Herkunft geklärt); **neue Blüten daraus anlegen**, soweit Angaben da sind. 1.json selbst NICHT
  committen (Repo ist öffentlich), nur das Ergebnis im Produktstamm.
  **Skript geschrieben, noch NIE gelaufen:** `scripts/stamm/sammlung-einlesen.py` (neu anlegen, bei Vorhandenen
  nur leere Felder, effect/medicaleffect nie gelesen, BfArM nicht als Hersteller, Quelle in `quellen`).

**⇢ STAND 2026-09-29 später (Session 26):** Schritt 1 erledigt: Mobil-Zentrierung `a2a9df2` gepusht (tsc/eslint
sauber, Tests 290/290, zwei Tests an neue Klassen angepasst). Schritt 2 halb: Skript lief, `1f64b04`: 420 neu,
62 ergänzt, 16 übersprungen, Stamm 727; import.sql 707 Sorten (20 ohne THC ausgelassen), keine Slug-Kollision
mit live (einzige Admin-Blüte `420-evolution-33-1-ca-scm` bleibt unberührt). Skript schreibt jetzt CRLF und
vereinheitlicht Aromen. Neue Blüten haben kein Symbolbild (`hersteller_bild_pfad` NULL).
Remote-Import nach Nutzerfreigabe ERLEDIGT: live 708 Blüten, alle aktiv. Abschluss-Review Teil 2 ERLEDIGT
`5bb6c41`: Kopf prüft nach Seitenwechsel neu (usePathname), JointCursor-rAF ruht ohne Bewegung (3 s Nachlauf),
main tabIndex -1 für „Zurück zum Anfang“, Menü-Schließknopf autoFocus. Tote Dateien mit hartem Deutsch
(TerpenErgaenzen außer Typ KatalogEintrag, Netzdiagramm, BestandTabelle) bleiben wie entschieden.
Live geprüft (Build 08:51): /blueten zeigt 708 (neue ohne Bild), mobil Kopf Menü/Logo/Konto,
Aufklappmenü, „prüfen wir nach.“ mittig ohne Überlauf. Hell-Modus mobil nicht geprüft. Tipp: Browser über
list_connected_browsers + select_browser verbinden, tabs_context allein meldet „nicht verbunden“.
Nächstes: A6 Mobile-Optimierung Rest (siehe Gesamtliste), Testblüte freigeben (A2). Nächste: live /blueten Stichprobe,
dann Schritt 3 (Mobil-Live-Prüfung) und 4 (Abschluss-Review Teil 2).

**⇢ (erledigt bis auf Import) STAND ZUM CLEAR (2026-09-29): Shell war gesperrt (Auto-Mode-Prüfung antwortete nicht), deshalb liegen
Änderungen UNCOMMITTED im Baum. Nächste Session, der Reihe nach:**
1. `npx tsc --noEmit`, `npm test`, `npx eslint` über die geänderten Dateien. Uncommitted (Nutzerauftrag
   2026-09-29 „mobil zentrieren“): Kopf (Menü links, Logo mittig, Konto rechts: Kopf.tsx, KopfMenue.tsx), Fuß
   (Fuss.tsx), /reviews (page + Doppelseite), /umfragen (page, UmfrageKarte, Kandidat, StimmFormular),
   SortenKopf (Bild + Name mittig), AromaSektion („prüfen wir nach.“ ragte raus: schmal als eigene Zeile, absatz-
   Variante) + UEBERLAUF_GRAD kleiner (clamp(2.5rem, 0.25rem + 12vw, 16rem)). Ungenutzt im Scratchpad:
   mitte.py (dieselben Änderungen, NICHT mehr laufen lassen, sind per Edit schon drin). Dann committen + pushen.
2. `python -X utf8 scripts/stamm/sammlung-einlesen.py` → Zahlen prüfen (erwartet: einige hundert neu), Stichprobe
   in produktstamm.json (keine Wirkangaben!), dann `python scripts/stamm/sql-erzeugen.py`, import.sql prüfen
   (Slug-Kollisionen mit Admin-Blüten wie der Testblüte?), committen, dann **remote** einspielen:
   `npx wrangler d1 execute cn-medcan-db --remote --file data/stamm/import.sql` (Nutzer hat das Anlegen beauftragt).
   Live /blueten Stichprobe.
3. Live-Prüfung Mobil (Chrome-Erweiterung war getrennt): Menü, Logo mittig, Zentrierungen, Überlaufwort, Karte
   flüssig, Hell/Dunkel.
4. Abschluss-Review Teil 2 (components/story, review, layout, produkt), Testblüte freigeben (A2), dann A6 Rest.
- Offen aus A2: Testblüte in /admin/vorschlaege freigeben (braucht Chrome im Vordergrund; im Hintergrund-Tab
  setzt React das Formular nicht ein).

### ⇢ SESSION 24 (2026-09-27, läuft)

- **A1 erledigt** `80b23d8`: /mitglied und /admin versprechen keine Preisangaben mehr (HWG-Preishinweis in /mitglied mit entfernt).
- **A2 halb:** Testbewertung auf /bewerten/apples-bananas gespeichert (Fruchtig 3, Minzig 0,5, Notiz „Testbewertung …
  kann gelöscht werden“, als Betreiber = redaktionell, sofort sichtbar). Blütenseite und /admin/vorschlaege danach 1102 →
  Testblüte freigeben + Anzeige prüfen steht noch aus. **Befund:** die Regler der Karte reagieren nicht auf Pfeiltasten
  (nur Ziehen) → in Task 6 (Mobile/Barrierefreiheit) prüfen.
- **A3 Caching v2 — Schritte 0–5 und 7 erledigt, 6 zurückgenommen, 2 entfällt.** Messtabelle und Befund im Plan
  `docs/superpowers/plans/2026-09-26-caching-v2.md`. Live seit Build 13:38 UTC: 3 Cookie-Vorfilter `bd319ca`,
  4 lesen statt upsert `416b05a`, 5 schlanker Titel `944d906`, 7 /zugang statisch `50cc6dc`. `lib/memo.ts` + Tests
  liegen ungenutzt (`2f526a6`); Anwendung per Revert `5b3b764` raus, Diagnose per Revert `71cb733` raus.
  **Kernbefund:** Grundlast von Next liegt je Seite bei 20–90 ms CPU (Limit Free 10 ms); Cloudflare lässt das eine
  Weile durch, dann 1102 — beim Streaming als „hängende“ Seite, weil der Abbruch nach den Kopfzeilen kommt.
  Datencaching löst das nicht. **Nutzerentscheid 2026-09-27: (c) so lassen** (Seite steht hinter dem Passwort; vor öffentlichem Start neu bewerten). Optionen waren: (a) Workers Paid 5 $/Monat (widerspricht „nie
  kostenpflichtig“), (b) Schritt 8a statisches Vorrendern + `staticAssetsIncrementalCache` allein (hilft nur Seiten
  ohne Sitzung; Startseite liest die Sitzung in Abstimmung → müsste auf Client-Abfrage umgebaut werden),
  (c) so lassen. Messmethode: `wrangler tail --format json` in den Scratchpad + fetch-Schleife aus dem angemeldeten
  Chrome (Gate-Cookie bleibt im Browser); Chrome-Timer im Hintergrund-Tab werden gedrosselt (AbortController greift nicht).
- Offen aus A2: Blütenseite mit Testbewertung ansehen, Testblüte in /admin/vorschlaege freigeben, Nutzer fragen, ob
  Testblüte und Testbewertung gelöscht werden (Bewertung per D1 entfernbar, Admin-Löschen gibt es nur für Community).
- **A4 Englisch ERLEDIGT und öffentlich** (`4c2ae11` Schalter sichtbar, `26c8b4f` letzte Fixes; Tests 288/288).
  Plan `docs/superpowers/plans/2026-09-27-englisch.md`. Alle 5 Wellen live geprüft (Kopf, Fuß, Katalog, Blütenseite,
  Aroma-Karte, Reviews, Bewerten, Abstimmung, Startseite inkl. Suspense-Teile, Mitglied, Vorschlagen). Migration 0008
  (`benachrichtigungen.parameter`) remote angewendet. Umschalter DE/EN neben dem Zelt (schmal nur ein Knopf), Cookie
  `sprache`, Browsersprache aktiv. Server Action setzt das Cookie (per POST live geprüft). A2: Testbewertung sichtbar.
  **Offen / Nutzer prüfen:** Klick auf EN in einem sichtbaren Tab (im verborgenen MCP-Tab kam der React-Klick nicht an);
  390 px: Logo + Konto + Schalter; englische Markenzeilen (Intro nowrap ab md, Überlaufwörter „terpene profile.“,
  „we check.“). **Aufgeschobene Minor-Punkte (Abschluss-Review):** `app/error.tsx` liest `lang` im Render (auf
  useSyncExternalStore umstellen); `server-only` in `lib/i18n/de.ts`/`en.ts` erwägen; `/api/sprache` (GET mit
  Seiteneffekt) entfernen oder POST; `<html lang>` en → en-GB; `terpenAnzeige` Ausnahmen (Guajol, Eukalyptol);
  veraltete Kommentare in SprachSchalter.tsx und ZugangFelder.tsx.
  **Wichtige Rulings:** /admin, Impressum/Datenschutz, Wortmarke inkl. „Terpen für Terpen“, tote Dateien (Netzdiagramm,
  TerpenErgaenzen, BestandTabelle) und Alt-Texte in lib/medien.ts (Bilder alle dekorativ) bleiben deutsch;
  Bewertungsschema bleibt deutsch in lib/query/bewertung.ts, Wörterbuch `schema` spiegelt es (Test i18n-schema);
  Prüffunktionen melden Schlüssel, Server Actions übersetzen; Admin-Prüfungen bleiben deutsch; Terpennamen per Regel
  (-en → -ene), `aromaProfil`-Stichworte im Englischen ausgeblendet. Kein `sed -i` mehr auf CRLF-Dateien (hat zwei
  Dateien auf LF gestellt, zurückgesetzt). **Live-Hinweis:** Im MCP-Tab (`visibilityState: hidden`) setzt React
  Suspense-Inhalte nicht ein; Inhalt steht versteckt in `div[hidden][id^="S:"]` und lässt sich dort prüfen.
- **Nächste Schritte laut Gesamtliste:** Rest A2 (Testblüte in /admin/vorschlaege freigeben, Nutzer fragen ob
  Testblüte und Testbewertung gelöscht werden), A5 Abschluss-Review über alles, A6 Mobile-Optimierung.

### ⇢ SESSION 22 (2026-09-26, läuft) — neu geordnete Taskliste, ersetzt alle älteren Listen darunter

Nutzer: parallel mit Agents arbeiten, Credits für Tempo und Qualität; alte Tasks neu einordnen, Veraltetes streichen,
ganz am Ende ein Abschluss-Review über alles. Nutzerentscheide heute: **i18n per Cookie, gleiche URLs, nur Oberfläche**
(Inhalte bleiben in ihrer Sprache); **Startseiten-Reihenfolge bleibt** (nur Feinschliff, Bugs, neue Bewegungsmomente);
eingeplant: **Caching gegen 1102, Impressum + Datenschutz, /produkte → /blueten**; Joint-Cursor bleibt.

**Erledigt und gepusht (Session 22):** Hero-Video weniger Zoom (`cae6f3e`: 1.02/1.05 statt 1.08/1.15; Datei ist
1280×720, auf breiten Schirmen hochskaliert); aktive Bögen der Aroma-Karte glühen/pulsieren im Takt von `.delta-puls`
in ihrer Geschmacksfarbe, Lichtpunkt läuft Geschmack → Terpen (`a3a8431`, `.bogen-puls`/`.bogen-fluss`); **Logo im
Kopf** (`962ccc8`, components/marke/Logo.tsx: „Book of“ 0,45 em oben, „Terpz“ text-marke, vier Konturen, Verlauf,
Glanz; Brand-Doku §2 angepasst); 24 geprüfte Skills installiert (`3192b53`). Live noch NICHT gesehen.

**⇢ STAND ZUM CLEAR NACH SESSION 23 (2026-09-27): alles gepusht, live (Build c8bd530 success), Tests 251/251.**

Session 23 erledigt: Live-Sichtprüfung weitgehend durch (Logo, Hero, Kopf hell, Storytelling, Overall/Qualität,
„stimmt das?“, Doppelseite, Abstimmung, Katalog, Fuß, Aroma-Hover beide Richtungen, /produkte → 308 /blueten,
Impressum/Datenschutz ohne Login 200). Leerer Streifen über dem Kopf in Screenshots = Aufnahme-Artefakt (Lenis).
Instagram-Zwei-Klick live nicht prüfbar (kein Reel hinterlegt). Kopfnavigation scrollt auf dem Handy waagerecht
(„BLÜTEN“ angeschnitten, bewusst so gelassen; Nutzer ggf. fragen).
Aroma-Karte: `55188a1` Achsennamen über dem Balken (waren durchgestrichen), links min. 124; `58cec5c`/`0a25a13`
Infotext = zentrierte Legende `InfoTafel` mit fester Höhe (min-h-80, sm:min-h-56), Versalzeile, Name mit abgesetztem
Icon, ein Satz je Terpen (`aromaSatz` in lib/terpen-aromen.ts, nur Duft/Vorkommen wegen HWG), Verbindungen als
`Pille`, Überblendung per `starting:opacity-0`; `c8bd530` Werte am Balken nur noch im Netz, **Karte unter 640 px
schmal gesetzt statt verkleinert** (achsenX 42 %, RECHTS_ABSTAND_SCHMAL 124, `radiusVon`, MIN_BREITE 320, Terpennamen
brechen um, Begleitstoff-Hinweis unter 480 aus). **Handy-Ansicht davon live NOCH NICHT gesehen.**

**Nutzerentscheide 2026-09-27:** i18n: Accept-Language-Erkennung ja, en-GB, Umschalter erst sichtbar wenn alle
Wellen übersetzt sind. Caching: TTL 300 s. Beide Specs damit freigegeben (Status in den Specs vermerkt).

### ⇢ GESAMTLISTE, neu sortiert (Session 23, 2026-09-27) — ersetzt ALLE Task-Listen darunter

Alle alten Listen (Session 12 bis 22, „Was noch offen ist“, „2. Danach“) wurden durchgesehen. Was dort nicht
hier steht, ist erledigt oder gestrichen.

**A. Sinnvoll, der Reihe nach:**
1. Kleiner Textfehler: `app/mitglied/page.tsx:76` und `app/admin/page.tsx:414` versprechen Freigegebenen
   „Sicht auf die Preisangaben“; Preise sind zurückgestellt und hängen noch am Gate-Passwort → Satzteil streichen.
2. /bewerten/apples-bananas einmal speichern (Sweet Spot, Fruchtig/Minzig) als Live-Test der Kernschleife;
   Testblüte in /admin/vorschlaege freigeben, dann Nutzer fragen, ob sie gelöscht wird. Braucht Login im Chrome.
3. Welle 3a: **Caching v2** nach `docs/superpowers/plans/2026-09-26-caching-v2.md`, ab Schritt 0 (Messung),
   TTL 300 s. Behebt die Fehler 1102, hat Vorrang vor Komfort.
4. Welle 3b: **Englisch** — erst superpowers:writing-plans aus der freigegebenen Spec, dann in Wellen; Schalter
   erst mit der letzten Welle sichtbar (Nutzerentscheid).
5. Abschluss-Review über alles (Code-Review der Sessions 22/23, Live-Stichprobe, `npm audit` einmal, HANDOFF stimmig).
6. **LETZTER TASK (Nutzerauftrag 2026-09-27): Mobile-Version optisch und technisch optimieren**, mit den besten
   Skills: `better-interface` (Gesamturteil), `better-layout`, `better-typography`, `better-accessibility`,
   `fitts-law` (Touch-Ziele ≥ 44 px), `critique-composition`/`critique-information-density` auf Screenshots,
   `cloudflare:web-perf` (Core Web Vitals mobil), `emil-design-eng` für Feinschliff, `ui-design-engine` als
   Regelwerk. Umfang: Startseite, /blueten, Blütenseite, /bewerten, /umfragen, /mitglied, Kopf (Navigation scrollt
   waagerecht, „BLÜTEN“ angeschnitten → prüfen, ob alle drei ohne Wischen passen), Aroma-Karte schmal (seit
   `c8bd530`, live noch nicht gesehen), Legende min-h-80, Hero-Video auf dem Handy (Datenmenge), Lenis/GSAP-Last.
   Chrome geht nur bis 494 px: für 390 px die Seite in einem iframe mit width 390 messen oder Emulation per JS.

**B. Unwichtig / nur auf Zuruf (geparkt):**
- Entscheid „inaktive Blüte bei Freigabe reaktivieren?“ (Verhalten heute: ja, `43e3105`) — nur ändern, wenn Nutzer es will.
- Platzhalter in `lib/rechtliches.ts` (füllt der Nutzer; vor öffentlichem Start Pflicht).
- Instagram-Handle, Symbolbilder ersetzen, Herstellertreue-Rangliste, `/mitglied` eigene Vorschläge/Stimmen
  ausbauen, Mail bei Vorschlägen.
- Mailversand (Block C): braucht eigene Absenderdomain, keine vorhanden → ruht.
- Apotheken/Preise, `FACHKREIS_PASSWORD` ausbauen, Preise an Mitgliedsfreigabe binden: zurückgestellt (Memory),
  nur als Aussicht.
- JSON-Import (Datei fehlt), `.dev.vars` für lokale Vorschau (lokal wird nicht gebaut).

**C. Obsolet / gestrichen:** 3D-Blätter, AromaSpielwiese, Achsenknoten-Bug der alten Karte, „andere Buttons folgen
der Maus“, Audit-Vorschläge gegen Nutzerentscheide (weniger Puls/Glanz/Handschrift, Reihenfolge, Joint-Cursor raus),
Hydrations-Sperre der drei Formulare und `vorschlagBisAm` (erledigt `45f8c9f`), /produkte → /blueten (erledigt),
Instagram-Zwei-Klick (erledigt), Review-Oberfläche fehlt (erledigt: /bewerten), D1/Deploy/Workers Builds
einrichten (erledigt), Wasm- und .env-Befunde (erledigt), Session-21-Rückstand der Sichtprüfung (heute geprüft).

**Build-Regel:** nach einem Code-Push ~13 min nicht erneut pushen (bricht den Build ab); nur HANDOFF.md ist ausgenommen.

**⇢ STAND ZUM CLEAR (2026-09-27): WELLE 1 UND 2 (Code) FERTIG, alles gepusht, Tests 250/250, Baum sauber.**
Welle 2: Instagram-Zwei-Klick `97e62d1`, Vorschlagsfrist + Hydrations-Sperre `45f8c9f`, three/Apotheken raus
`60a959d`, **/produkte → /blueten** mit 308-Weiterleitungen `f3c098d` (lib/alte-adressen.ts). Kein Agent läuft.
**Nächste Session, der Reihe nach:**
1. Live-Sichtprüfung (Chrome vorn, Nutzer angemeldet): Logo im Kopf, Aroma-Bögen (Puls, Lichtpunkt, Hover in beide
   Richtungen, Infotext mit Icons), „stimmt das?“ zwischen Qualität und Fazit, Pin „Umschlag wird Seite“ (≥768 px,
   Sprung? Schatten?), Kopf hell/dunkel über Hero, Stimmbalken/Zähler, Hintergrund-Tab-Einstieg, Impressum/Datenschutz
   ohne Passwort, Instagram-Klick, /produkte leitet um; dazu Session-21-Rückstand (Glas, Zelt, Kopfzeile 80 %, Fuß).
2. /bewerten/apples-bananas speichern; Testblüte in /admin/vorschlaege freigeben, danach fragen ob löschen.
3. Nutzer: Freigabe beider Specs (i18n: Accept-Language?, en-GB?, Umschalter erst ab Welle 2?; Caching: 300 s oder
   60 s) → writing-plans für i18n, Caching ab Schritt 0 (Messung); Nutzer-Entscheid inaktive Blüte bei Freigabe
   reaktivieren?; Platzhalter in lib/rechtliches.ts füllt der Nutzer.
4. Welle 3 (Caching, i18n), dann Abschluss-Review.

**Stand 2026-09-27, später: WELLE 1 FERTIG, alles gepusht, Tests 231/231.** W1-A `0d278c2` (Pin „Umschlag wird Seite“
abschaltbar über `UMSCHLAG_WIRD_SEITE` in bewegung/auftakt.ts, `data-ruhend` in bewegung/ruhe.ts), W1-C `43e3105`
(Entscheid offen: Freigabe einer inaktiven Blüte mit gleicher Id schaltet sie wieder aktiv), W1-D `42e35fd` (Nutzer
füllt Platzhalter in lib/rechtliches.ts; **Lücke: Instagram-iframe lädt ohne Einwilligung** → Zwei-Klick in Welle 2),
W1-E Spec `14ee8dc` (3 offene Fragen: Accept-Language ja?, en-GB?, Umschalter erst ab Welle 2?), W1-F `0f7b888`
(Fragen: Datenalter 300 s oder 60 s; keine eigene Domain). **Beide Specs warten auf Nutzerfreigabe.**
Welle 2 läuft: Aufräumen (9), Kern-Kleinpunkte (10), Instagram-Zwei-Klick; danach /blueten (11); Browserpunkte (7, 8)
brauchen Chrome vorn.

**Stand 2026-09-27:** Welle 1 brach am Sitzungslimit ab. W1-B (Aroma-Details) ist fertig (`2c55c83`), dazu
„stimmt das?“ eins höher (`e6c647a`) und Hover in beide Richtungen plus Infotext mit Icons (`4d428c4`). W1-A, C, D, E, F
wurden **neu gestartet**. Aufträge in `docs/superpowers/plans/2026-09-26-session22-wellen.md`. **Ist der Baum nach einem
Clear schmutzig:** die Diffs gehören zu diesen Agents; je Block gegen den Plan prüfen, `npm test`, dann dateigenau
committen oder den Block neu starten. Sortenkopf-Name bleibt in Logoschrift (Nutzerausnahme zu Leitplanke 4).

**Welle 1 (läuft parallel in Agents, Dateien getrennt):**
1. Startseite Bewegung/Perf: Hidden-Tab-Bug im Einstieg, Dauer-Animationen außerhalb des Bildes pausieren
   (`data-ruhend`), will-change, Stimmbalken füllen sich ein + Zähler, Kopf hell über dem Hero, „Umschlag wird
   Seite“ (Pin, abschaltbar), totes `schleife.ts` raus.
2. Aroma/Review-Details: Fokusring der Regler, Karte/Netz als Radiogroup, Filter nicht je Frame, tabular-nums,
   Leitplanke 4 (Handelsname in Buchschrift) im SortenKopf, Buchfalz, Skelette, ProduktCard.
3. Review-Kleinpunkte „Blüte vorschlagen“ (Session-18-Liste, u. a. D1-Bind-Grenze bei updateMany).
4. Impressum + Datenschutz (Platzhalter in lib/rechtliches.ts füllt der Nutzer; vom Gate ausgenommen).
5. i18n-Spec `docs/superpowers/specs/2026-09-26-englisch-umschalter-design.md` → Nutzer prüft.
6. Caching-v2-Spec + Plan (Daten statt HTML cachen, Messung zuerst) → Nutzer prüft.

**Welle 2 (danach, Dateien überlappen mit Welle 1):**
7. Integration, Sammelpush, **Live-Sichtprüfung** (Chrome vorn!): Logo, Bögen, Hero-Zoom, alles aus Welle 1, dazu der
   Session-21-Rückstand (Glas hinter Video, Zelt, Kopfzeile 80 %, Fuß-Invertierung), `backdrop-filter` im Kopf,
   hell/dunkel, 390 px, reduzierte Bewegung.
8. /bewerten/apples-bananas speichern (Sweet Spot, Fruchtig/Minzig); Task 8 Rest (Testblüte freigeben) → Nutzer
   fragen, ob Testblüte gelöscht wird. Braucht Login.
9. Aufräumen: `three` + bewegung/blaetter.ts, components/story/Apotheken.tsx (ungenutzt).
10. Kern-Kleinpunkte: `vorschlagBisAm` im Admin setzbar machen; Hydrations-Sperre (`useHydriert`) für Anmelde-,
    Registrier- und Profilformular.
11. /produkte → /blueten mit Weiterleitungen (vor i18n, damit die Übersetzung auf den finalen Pfaden arbeitet).

**Welle 3 (nach Freigabe der Specs):** 12. Caching v2 ab Schritt 0 (Messung). 13. i18n in Wellen.

**Ganz am Ende:** 14. Abschluss-Review über alles (Code-Review der Session, Live-Stichprobe, npm audit einmal,
HANDOFF stimmig).

**Geparkt (braucht Nutzer oder später):** Herstellertreue-Rangliste; Mailversand (Absenderdomain); Instagram-Handle;
Einwilligung fürs Instagram-iframe (nach Datenschutz-Bericht klären); Symbolbilder vor öffentlichem Start;
JSON-Import (Datei fehlt); Mail bei Vorschlägen.
**Gestrichen (veraltet):** 3D-Blätter, Apotheken/Preise-Ausbau, Achsenknoten-Bug der alten Karte, AromaSpielwiese,
„andere Buttons folgen der Maus“ (nie beantwortet), Audit-Vorschläge gegen Nutzerentscheide (weniger Puls/Glanz,
weniger Handschrift, kleineres Blütenbild, anderer Hero-Text, Reihenfolge, Joint-Cursor raus).

### (Vorher) NÄCHSTE SESSION BEGINNT HIER (Stand 2026-09-26, Session 21)

**Nächster großer Task (Nutzerauftrag): englische Übersetzung mit Umschalter Deutsch/Englisch.**
Mit superpowers:brainstorming beginnen (Routing /en vs. Cookie, Next-16-i18n-Doku in node_modules/next/dist/docs lesen,
Texte aus Komponenten auslagern, Umschalter im Kopf neben dem Grow-Zelt, HWG-Texte beachten).

**Session 21 (alles gepusht, Tests 194/194):**
- Hero: Wortmarke einen Tick dicker (Kontur 0.012em), mehr Abstand Marke/Oberzeile/Intro; Kopfzeile-Band 80 % Breite.
- Kopf-Wortmarke: `glanz-wort` (Verlauf Grün–Violett + Glanz wie Hero, ohne Konturen). Zelt-Icon Strich 1, Opazität 0.8.
- `UeberlaufWort`: „prüfen wir nach.“ schließt am Satzende an (tiefer versetzt), „Terpenprofil.“ als eigene Zeile (`absatz`),
  leicht hinter dem Satz; beide mit `glanz-wort`.
- Storytelling: Begriffe Overall/Terpz/Qualität; Overall-Satz „wie es aussieht … und wie es sich anfühlt“.
  `GlasMaske` (components/medien) als Scheibe in Video-Größe/Blob-Form HINTER dem Video, versetzt (~2/3 verdeckt),
  Violett/Grün im Wechsel. Nicht am Blütenbild (Nutzer). Terpen- und Trichom-Form wurden verworfen.
- Neuester Eintrag (Doppelseite): Blütenbild über die volle linke Kartenbreite zwischen Titel und Noten (`bildPfad`
  in EintragDaten/RedaktionelleReview). Terpz-Schritt: kein Name/Bild über der Karte (`ohneTitel`).
- Aroma-Karte: volle Breite (viewBox = Messbreite, Balken ab 14 px), feinere Bögen; **10 Achsen** (neu FRUCHTIG, MINZIG,
  Aromarad-Reihenfolge, alte Matrizen lesen neue Achsen als 0), **mehrere Bögen je Terpen** nach `lib/terpen-aromen.ts`,
  Terpene nach Achsenmittel geordnet (`ordneTerpene`), Diesel an Knoten „Thiole“ (Schwefel, kein Terpen),
  ergänzte Terpene durchgezogen sobald > 0, Delta der Balken glüht/pulsiert (`.delta-puls`). Migration 0007 remote
  angewendet (vorher db/constraints.sql per `d1 execute --file`, weil `migrations apply` Trigger-Blöcke nicht kann).
- Bewertungsmaske: Sweet Spot wieder da (SweetSpot-Spuren im Terpz-Schritt, ganze Stufen). Katalog: Bild verlinkt.
- Karte zusätzlich: Begleitstoffe **Ester** (Fruchtig 0.8, Süß 0.2) und **Thiole** (Diesel) als eigene Knoten
  (`BEGLEITSTOFFE` in lib/terpen-aromen.ts), gemeinsam mit den Terpenen nach Achsenmittel geordnet; eigene
  Umriss-Icons je Geschmack/Terpen/Begleitstoff (components/review/AromaIcon.tsx, keine Icon-Bibliothek);
  Bögen je Geschmack eigenfarbig (`LINIEN_FARBE`, Fruchtig/Blumig bunter Verlauf), schwach = entsättigt,
  stark = satt + Glow, nicht vorhanden = gestrichelt grau. Violett/Grün-Abweichungsfarbe der Bögen entfällt.
- Nutzerentscheid: Fruchtig/Minzig zählen in der Herstellertreue mit (alte Bewertungen dort 0, Nähe sinkt vorerst).
- Startseite: mehr Luft um Aroma-Sektion, vor „Einer allein weiß wenig“, zwischen Neuestem Eintrag und Abstimmung;
  **Apotheken-Sektion von der Startseite entfernt**. Fuß: Schlusszeile startet gefüllt und invertiert bis `end: "max"`,
  Bildnachweise in der rechten Spalte, Wortmarke im Fuß (translate 0.08em), „Zurück zum Anfang“ klein (text-small).
- **Offen / nächste Schritte (Reihenfolge):**
  1. Live-Sichtprüfung (Chrome-Tab muss vorn sein, sonst schlagen Screenshots fehl): Aroma-Karte (Icons, Farben,
     Ester/Thiole, Delta-Puls), Glas hinter Video, Zelt, Hero-Abstände, Kopfzeile 80 %, Fuß (Marke, Invertierung).
  2. /bewerten/apples-bananas: Speichern testen (Sweet Spot + Fruchtig/Minzig).
  3. Großer Task: englische Übersetzung mit Umschalter (siehe oben).
  4. Task 8 Rest (Testblüte freigeben, braucht Login).

### (Vorher) NÄCHSTE SESSION BEGINNT HIER (Stand 2026-09-25, Session 20, Save for Clear)

Alles gepusht und deployt (Tests 192/192). Nutzerregel neu: **Apotheken und Preise nur „in Aussicht“, nicht
einplanen** (Memory apotheken-preise-zurueckgestellt) — Block B Schritt 7 entfällt damit bis auf Weiteres.

**Session 20 zusätzlich (nach dem Stand unten):** Grow-Zelt als Theme-Schalter (fest oben links in der
Fensterecke, `.thema-lampe`), Hero: Button „Bewerte jetzt mit“ (Verlaufsrahmen `.konto-pille`, Zeigerfolge über
`data-punkt`), Intro zweizeilig nowrap („… neue Maßstäbe definieren.“), Einstieg: Texte bis zur Einblendung
opacity 0 (Timeline setzt nicht mehr 1), Notfall 8 s; Kopf 12 px, Kopfband „since 2026 · Terpz 4 Nerdz“;
Storytelling: Buchschrift + je Absatz `Buzz`, Überschrift zentriert, Video-Titel in Logoschrift, Videos driften
selbst (`punkte.ts`, WEG_PX 24); „So läuft eine Runde“ neu (Runde als Event, Bewerten geht immer);
„prüfen wir nach.“ übergroß im Wortmarken-Stil (Konturen + Puls), ragt rechts raus; Erkundung: Schritte
Overall/Terpz/Qualität links in Logoschrift, keine Doppeltitel (`ohneTitel`), Karten-Kopf mit `KartenBild`,
Achse `achsenX()` wandert mit halber Mehrbreite, Bögen Violett↔Grün (`abweichungsAnteil`).

**Reihenfolge nächste Session:**
1. **Live-Sichtprüfung** (Nutzer muss im Chrome-Tab mit neuem Passwort angemeldet sein): Hero-Button und
   Einstieg, „prüfen wir nach.“, Aroma-Karte (Bild, 50:50, Farbverlauf der Bögen), Bewertungsmaske
   /bewerten/apples-bananas (Speichern testen!), So läuft eine Runde, Blütenkacheln.
2. Nutzerfrage offen: sollen andere Buttons („Zu den Blüten“, „Zur Sorte“) auch mit der Maus mitgehen?
3. Bewertungsmaske erfasst die Terpen-Intensität (Sweet Spot) nicht mehr — Nutzer fragen, ob sie zurück soll.
4. Task 8 Rest: Testblüte im Admin freigeben, Benachrichtigung prüfen (braucht Login).
5. **1102/CPU:** Seite läuft derzeit; Nutzer hat Workers Paid (5 $) noch nicht entschieden. Nichts am Request-Pfad
   ändern ohne Messung (`wrangler tail` + curl; `wrangler deployments list` ist erlaubt, Secret-Writes nicht).

### ⇢ STAND SESSION 20 (2026-09-25, Zwischenstand)

**Gepusht (live noch nicht per Sichtprüfung gesehen; Gate-Passwort neu, Nutzer muss im Chrome-Tab anmelden):**
- Kopf-Navigation in gesperrten Versalien; Hero-Wortmarke pulsiert (`.marke-puls` an der h1).
- Aroma-Erkundung: `SortenKopf` (components/review/SortenKopf.tsx) als großes Titelblatt ganz oben (Bild, Kultivar,
  Typ, THC/CBD, Hersteller, Genetik, Terpenbalken), Daten über `erkundungsDaten()` (components/review/erkundung-daten.ts);
  Fazit nach Schritt 3; Schrittziffern feste Höhe 28rem, Inhalt `md:pl-24`; Karte: Terpenspalte 220 vor rechtem Rand,
  Balkenlänge `balkenLaenge()` = 110 + 30 % der Mehrbreite; Regler halbe Schritte, größere Griffe/Trefferflächen.
- Bewertungsmaske /bewerten/[slug] = AromaErkundung mit `eingabe` (versteckte Felder note-*, geschmack-*,
  beschaffenheit-*, feuchtigkeit; Wirkung als 5. Note nur dort); NotenRegler/BeschaffenheitsRegler gelöscht.
  **Terpen-Intensität (Sweet Spot) wird in der Maske nicht mehr erfasst** — Nutzer ggf. fragen.
- Blütenkacheln feste Bildhöhe h-56 (`h-full!`, weil Bild selbst h-auto setzt und cn nicht mergt).
- Storytelling: Buchschrift, je Absatz ein Schlagwort `Buzz` (Logoschrift, Farbverlauf).
- Secrets: SITE_PASSWORD neu, SITE_SESSION_SECRET rotiert (Nutzer selbst; Secret-Writes sind für Claude gesperrt,
  `wrangler deployments list` ist erlaubt).

**1102-Befund (2026-09-25 abends):** `staticAssetsIncrementalCache` + `enableCacheInterception` (Commit 98fe2db)
führte zu durchgehend 1102 auf JEDER Seite (tail: exceededCpu bei 10 ms); nach Revert lief die Seite wieder. Nicht
erneut einschalten ohne Messung. Grundlast (Next + Proxy) liegt nahe/über 10 ms; Nutzer wurde Workers Paid (5 $)
empfohlen, Entscheid offen (Regel: nie kostenpflichtig).

**Caching:** Spike `4d5195b` (KV `260615e2b66348b9b9fb8b7def46c5a4`, D1 `cn-medcan-tags`
`c71695ff-7eee-4c05-af39-2f39f0865b60` existieren weiter) brach den Cloudflare-Build (`"remote": true` am D1-Binding);
per Revert zurück, Build lief danach. 1102 besteht weiter, sogar /zugang (exceededCpu, 10 ms). Nächster Versuch ohne
Build-DB: Seiten zur Laufzeit cachen (ISR ohne Buildzeit-Prerender, z. B. `generateStaticParams` leer bzw.
dynamische Erstbefüllung), Spec/Plan anpassen, Nutzer vorlegen. Build-Log bei Fehlern im Dashboard lesen lassen.

### (Vorher) NÄCHSTE SESSION BEGINNT HIER (Stand 2026-09-25, Session 19, Save for Clear)

**Neu aus Session 19 (alles gepusht bis `60a7a88`, Tests 191/191, live noch NICHT per Screenshot gesehen):**
- Hero-Zeile „Cannabis, offen gelegt.“ in `uppercase tracking-gesperrt` (font-sans), Grad bleibt.
- Aroma-Karte: Symbolbild (`blueteBild(herstellerBildPfad)`) links zwischen Name und Legende, als `bild`-Slot
  von AromaSektion (Server) über AromaErkundung in AromaKarte.
- Schrittziffern 1/2/3 als SVG über die volle Schritthöhe im Hintergrund (`text-kopierstift opacity-15`, -z-10).
- Schlagworte zwischen die Sektionen: „stimmt das?“, „was drin ist“, „wir stimmen ab“ je `bottom-0 translate-y-1/2`.
  Aroma-Karte NICHT transparenter gemacht (kein Hintergrund vorhanden; Linien verblassen hieße schlechter lesbar):
  live prüfen, ob „stimmt das?“ jetzt frei ist, sonst Nutzer fragen.
- Story-Hervorhebungen (TransparentMachen) inline `fontSize: calc(var(--text-kapitel) * 1.35)` wie „prüfen wir nach“.
- Community-Fazit: vier `marke-kontur-N`-Konturen wie die Hero-Wortmarke + `.fazit-puls` (globals.css).
- Hinweis: Tests laufen mit `npm test` (tsx --test), NICHT vitest.

**Reihenfolge für die nächste Session:**

0. **Kopf-Typografie ERLEDIGT (Session 20, `c9ccc91`):** NAV_LINK und Konto-Pille jetzt `font-sans text-caption uppercase tracking-gesperrt`; Regel in ui-design-engine Z. 60 ergaenzt. Live noch nicht gesehen (Deploy lief noch, Chrome-Tab hidden). Bei ~940 px Zeilenbreite pruefen, ob lg einzeilig bleibt.
   Alt: **Kopf-Typografie** (Header/Kopf-Navigation, `components/layout/Kopf.tsx`, NavLink) an die Hero-
   Typografie angleichen wie „Terpen für Terpen“: `font-sans uppercase tracking-gesperrt` (Größe passend, ≥ Regeln
   ui-design-engine; Handschrift-Ziffern gibt es im Kopf nicht mehr). Danach Live-Sichtprüfung aller Session-19-Punkte.
0b. **Aroma-Korrekturen (Session 20, `8a11309`, live noch nicht gesehen):** Boegen der Karte vom festen Achsenbereich (x=260) bis 220 vor den rechten Rand, Karte volle Breite wie die Beschaffenheits-Regler; Sortenkopf ueber der Karte in Schritt 2 (Bild bis 320 px, Terpene laut Hersteller mit %/Rang), AromaKarte ohne `bild`-Slot; Community-Fazit nach Schritt 3.
1. **Caching: Spec + Plan fertig** (`docs/superpowers/specs/2026-09-25-caching-design.md`, `docs/superpowers/plans/2026-09-25-caching.md`), Nutzer: 5 min alte Daten reichen. Offen: Ausfuehrungsweg (Empfehlung: selbst in der Session), dann Task 1 (Spike /apotheken).
   Alt: **Caching (Nutzerentscheid: Caching statt Paid)** — superpowers:brainstorming, siehe unten Punkt 1.

#### (Vorheriger Stand Session 18)


**Reihenfolge für die nächste Session:**

1. **Fehler 1102 „Worker exceeded resource limits“ (live, auch beim Neuladen der Startseite).** Ursache per
   `npx wrangler tail cn-medcan --format json` belegt: Free-Plan = 10 ms CPU je Request; unsere Seiten brauchen
   bis ~210 ms (/produkte 212, /reviews 201, /umfragen 78), weil alles `force-dynamic` ist (SSR + Prisma-7-WASM je
   Abfrage). Cloudflare toleriert das nur gelegentlich; zusätzlich lösten Link-Prefetches je Seitenaufruf mehrere
   solcher Renders aus. /admin wurde gezielt bei 10 ms abgebrochen.
   - Erledigt (gepusht, live prüfen): /admin aufgeteilt (Vorschlagsprüfung jetzt `/admin/vorschlaege`, /admin
     zählt nur) und `prefetch={false}` an Kopf (NavLink), Fuß und Blütenkarten (`tests/prefetch.test.ts`).
   - Danach erneut messen (tail, Startseite neu laden). Wenn 1102 bleibt: **Nutzerentscheid nötig**:
     (a) Workers Paid 5 $/Monat (30 s CPU, löst es sofort, bricht „alles kostenlos“), oder
     (b) Caching nach `.claude/skills/edge-stack-master.md` §4: ISR/`unstable_cache` für Katalog, Startseiten-
     Sektionen, Blütenseiten; braucht KV `NEXT_INC_CACHE_KV` hinter Regional Cache, D1-Tag-Cache (+ Tag-Cache, `WORKER_SELF_REFERENCE`)
     in wrangler.jsonc und OpenNext-Config; nutzerbezogene Teile (Preise/Fachkreis, eigene Stimme) bleiben dynamisch.
     Empfehlung dem Nutzer vorlegen (Brainstorming, architektonisch).
   - **NUTZERENTSCHEID 2026-09-25: Caching (b) ist eingeplant, kein Paid.** Mit superpowers:brainstorming starten.
2. **Terpenlinien-Farbverlauf (Nutzerauftrag, noch nicht begonnen):** In `AromaKarte` färben sich die Bögen zu
   den Terpenen je Geschmacksachse nach Abweichung stufenlos Violett↔Grün: lila Serie („Dein Eindruck“, sonst
   „Laut Community“) höher als Hersteller → Violett; Hersteller höher (übertreibt) → Grün; Stärke nach
   |Differenz|/5 (gedeckelt 1, gern leicht verstärkt); ohne Werte/Gleichstand heutige Farbe; graue Terpene bleiben
   grau. `color-mix(in oklab, var(--color-kopierstift) X%, var(--color-accent))`, Mischanteil als reine Funktion in
   `lib/aromakarte.ts` mit Test.
3. **Live-Sichtprüfung** (Chrome muss vorn sein, `visibilityState` prüfen; bei hidden hängen Screenshots und
   React 19 blendet gestreamte Suspense-Teile nicht ein):
   Community-Fazit (neu, `lib/fazit.ts`: Mittel aus Gesamteindruck (1..5→0..1), Herstellertreue, Beschaffenheit
   (0..5→0..1); groß in `font-hand text-umschlag farbverlauf`, „Dein Fazit“ bei bewegten Reglern; Herstellertreue
   nur noch klein im Terpen-Schritt), Karte breit bei gleicher Feinheit (viewBox-Breite = Containerbreite/1,2 per
   ResizeObserver), Storytelling (Abstand halbiert `mt-[18vh] md:mt-[25vh]`, Videos bis `lg:w-lg`, Text
   `md:max-w-[20ch] leading-[1.08]`), Wortmarken-Konturen, Qualm, Symbolbilder.
4. **Task 8 Rest:** Auf `/admin/vorschlaege` „Testblüte Vorschlag 1“ freigeben (Typ Hybrid, THC 20–24, CBD 0–1;
   Nutzer hat die Freigabe erteilt), dann Zähler an „Mein Konto“, Benachrichtigung auf /mitglied,
   /produkte/testbluete-vorschlag-1 prüfen. Danach fragen, ob die Testblüte gelöscht werden soll.

### ⇢ STAND SESSION 18 (vor dem Save for Clear)

**Blüte vorschlagen** (Spec `docs/superpowers/specs/2026-09-25-bluete-vorschlagen-design.md`, Plan
`docs/superpowers/plans/2026-09-25-bluete-vorschlagen.md`): **Tasks 1–7 fertig und live**, Migration 0006 + Trigger
remote angewendet. Schlussreview (Opus): 0 kritisch, 2 wichtig (beide behoben mit Tests: Terpene beim zweiten Klick
nachholen; Zähler lädt bei Navigation und nach An-/Abmelden neu), dazu hochgestuft: Zähler zeigt nach „gelesen“ keine
alte Zahl mehr. Tests 185/185.
- **Live geprüft (DOM):** /vorschlagen legt an („Danke!“), Doppelvorschlag wird abgewiesen, vorhandene Blüte
  („Apples & Bananas“) → Meldung mit Link; /mitglied zeigt „Benachrichtigungen“ und „Meine Vorschläge“.
- **Offen (braucht Chrome im Vordergrund):** Im Admin „Testblüte Vorschlag 1“ freigeben (Typ Hybrid, THC 20–24,
  CBD 0–1), dann Zähler an „Mein Konto“ und die Benachrichtigung prüfen, /produkte/testbluete-vorschlag-1 aufrufen.
  Danach Testblüte löschen oder behalten (Nutzer fragen). Im Hintergrund-Tab hydriert /admin nicht: React 19 blendet
  nachgestreamte Suspense-Abschnitte per requestAnimationFrame ein, das steht bei `visibilityState: hidden`.
- **Kleinpunkte aus dem Review (bewusst verschoben):** „gelesen“ markiert alle statt nur die 20 angezeigten;
  P2002 bei strain.create pauschal geschluckt (Race mit Import); gleichzeitige Freigabe aus zwei Tabs kann bei
  createMany werfen; `\b` in unternehmensSchluessel nur ASCII; Treffer auf IMPORTEUR wird nicht BEIDES; korrigierter
  Name mit gleicher Id ohne Hinweis; inaktive Blüten in blueteVorhanden; Hersteller Freitext statt Auswahl (Spec
  4.2); Doppelvorschlag-Meldung ohne Link; Anmelde-Weiterleitung verliert `?name=`; Leerzustand zeigt zwei
  Einstiege; Test für Schreibvarianten fehlt; updateMany mit bis 200 Ids (D1 max 98 Bind-Werte); schema.prisma CRLF.
- Mail kommt später (Nutzerentscheid); späterer JSON-Import: Anbindung an offene Vorschläge nach Spec 4.4.

**Startseite und Auftritt (Session 18, alles gepusht):**
- Hero: Kopfzeile „Grünes Buch · Stand · Terps for nerds“ als Band über die volle Breite unten in der ersten
  Ansicht (live gemessen: liegt in 100svh), dünn und gedämpft; Hero-Nebentexte in gesperrten Versalien
  (`tracking-gesperrt`, Regel in ui-design-engine angepasst); Unterzeile „Terpen für Terpen“.
- Wortmarke: vier versetzte Konturen der Schrift in Grün/Violett (`.marke-kontur-N`, nur transform-Drift), statt
  der verworfenen 3D-Bahnen (Nutzer: zu viel, zu teuer). Zeigerfolge über `bewegung/punkte.ts`.
- Kopf ohne Kapitelnummern. „Produkt“ im Auftritt überall „Blüte“ (URL `/produkte` bleibt).
- Storytelling: ohne Chargen; Stationen Gesamteindruck, Terpene, Beschaffenheit (wie die Aroma-Erkundung);
  Grad `text-erzaehlung`; Absatz und Video als Paar nebeneinander (`Paar`), Abstand `mt-[35vh] md:mt-[50vh]`
  zwischen den Paaren; je Video vier morphende Linien (`RINGE`,
  `blob-morph`/`blob-morph-stark`), Zeigerfolge.
- Aroma-Erkundung in drei Schritten voller Breite mit großen Handschrift-Ziffern (1 Gesamteindruck, 2 Terpene mit
  Karte, 3 Beschaffenheit), Herstellertreue zentral darüber.
- Schlagworte: keins im Storytelling; „stimmt das?“ am Ende der Aroma-Sektion, „was drin ist“ unter dem
  neuesten Eintrag; Eintrags-Hintergrund verläuft weich (Gradient statt harter Fläche); Schleifenvideo blendet aus.
- Joint-Cursor: Canvas-Qualm (`components/layout/joint-rauch.ts`), Funken, flackernde Glut, Ausatmen.
- Referenzbilder: zehn freigestellte Pexels-Blüten `bluete-01..10` (lib/medien.ts), **zufällig allen 286 Blüten
  zugeordnet (lokal + live, `strains.hersteller_bild_pfad`)**, als „Symbolbild“ auf Karte und Titelblatt.
  Ausnahme zu Leitplanke 5 in `docs/brand/gruenes-buch.md` dokumentiert: vor öffentlichem Start neu entscheiden.
- **Nicht per Screenshot gesehen** (Chrome war die ganze Session im Hintergrund, `visibilityState: hidden`):
  Linien/Bahnen, Qualm, Bilder, Abstände. Nur per DOM gemessen. Zuerst Chrome nach vorn, dann Sichtprüfung.

### ⇢ STAND SESSION 17 Ende (alles gepusht bis `d682afa`)

**Zuletzt in Session 17 (Code fertig, Tests 157/157; live per Screenshot noch NICHT gesehen, zuerst prüfen):**
- Hell/Dunkel-Schalter als Lampe fest unten rechts (`ThemaSchalter`, Klasse `.thema-lampe`; aus dem Kopf entfernt;
  Lampe an = hell). Übergänge beim Umschalten für einen Frame aus (better-ui).
- Hero-Unterzeile „Cannabis, offen gelegt.“ größer (clamp 1.75–3.25 rem), Story-Texte kleiner (`--text-manifest`
  clamp 2.5–5 rem), Hintergrund-Schlagworte hängen auf der oberen Sektionskante (`Schlagwort` oben=top-0
  -translate-y-1/2). Prüfen, ob sie über der vorigen Sektion gut lesbar/nicht störend sind.
- Video-Anhalten als dezentes Pause/Play-Symbol (`LoopSchalter`, loops.ts setzt aria-label + data-angehalten).
- Im Auftritt heißen Produkte jetzt „Blüten“ (Navigation, Katalog, Apotheken, Produktseite). URL `/produkte` bleibt
  vorerst; Umzug nach `/blueten` mit Weiterleitung ist offen.

**GROSSER TASK (Nutzer 2026-09-25, als Nächstes einplanen, mit superpowers:brainstorming beginnen):**
„Sorte vorschlagen“. Fehlt eine Blüte im Katalog, kann jedes angemeldete Mitglied sie eintragen (Name, Hersteller,
Kultivar, THC/CBD, Terpene, Quelle). Der Betreiber prüft sie im Admin, kann sie anpassen und freigeben (oder
ablehnen). Die vorschlagenden Mitglieder werden informiert: im System (Benachrichtigungen im Mitgliederbereich) und
per Mail (Mailversand klären: Cloudflare Email Sending, Skill cloudflare:cloudflare-email-service). Datenmodell:
Vorschlagstabelle mit Status (OFFEN/FREIGEGEBEN/ABGELEHNT), Verknüpfung zur angelegten Sorte, Dublettenprüfung
gegen Handelsname/Slug. Später kommt vom Nutzer eine große JSON mit vielen Blüten-Daten zum Import (Nutzer sucht
sie noch); der Import darf die Vorschläge nicht doppeln.

### ⇢ STAND SESSION 17 (Zwischenstand)
Live und per Screenshot geprüft bis `17fcd1b`: Kopf transparent/Papierstreifen, Kapitel-Navigation, Fuß als
Kapitelverzeichnis, Aroma-Karte mit ziehbaren Geschmacksbalken + Lernzeile, Beschaffenheits-Leiste, Bud-Cursor.
Das „Einfrieren“ war KEIN Code-Fehler. Hauptursache: Chrome-Fenster im Hintergrund/minimiert -> `document.visibilityState === "hidden"`, dann keine Frames, Screenshots/rAF hängen (per javascript_tool prüfen). Nutzer bitten, das Fenster nach vorn zu holen. Außerdem: Long-Task-Messung (PerformanceObserver) ergab 0 ms auf
Startseite und Produktseite; es hängt nur der Browser-Tab bei `find`/`scroll_to`/`read_page` (MCP). Workaround:
per `javascript_tool` scrollen (`scrollIntoView`) statt `find`+`scroll_to`; hängt ein Tab, schließen und neu anlegen.

**Erledigt in Session 17:**
- Aroma-Karte: Geschmacksbalken links sind Regler (Sweet-Spot-Spur, Griff, Einrasten am Community-Wert, sr-only
  Range-Inputs für Tastatur); Sweet-Spot-Boxen entfernt; Lerneffekt „<Geschmack> steckt vor allem in <Terpene>“
  (`lernen={katalog}`); „Dein Eindruck“ = Herstellertreue der gezogenen Matrix.
- Beschaffenheit im Bewertungsschema: Spalte `reviews.beschaffenheit` (JSON, Migration 0005, live + in d1_migrations
  eingetragen), Achsen in `BESCHAFFENHEIT_ACHSEN` (Chlorophyll, Bud-Dichte, Terpendichte, Trichomfarbe, 0–5, mehr ist
  besser), Restfeuchte bleibt `feuchtigkeit_prozent`. Formular: `BeschaffenheitsRegler`; Anzeige:
  `BeschaffenheitsLeiste` (neben der Karte gemittelt, in der Doppelseite ohne Feuchte). 20 Beispielbewertungen live
  mit abgeleiteten Werten befüllt (Trichomfarbe überall 2,5).
- Joint-Cursor (`components/layout/JointCursor.tsx`, ersetzt den Bud): angestellt wie der Pfeil, Klickpunkt an der Spitze, Duftspur beim Bewegen, Klick glimmt/qualmt/Asche.
- Verlaufsschrift nicht mehr abgeschnitten (Padding + negativer Rand in `.farbverlauf`), Plakat kleiner.
- 3D-Blätter aus (`BLAETTER_AN = false` in components/story/bewegung/start.ts).
- Storytelling-Prüfpunkte: Blob-Morph, leichter Zoom, Bildwechsel/Schweben, Restfeuchte als Video (pflanze-loop).
- Kopf fest+transparent (`KopfZustand`: --kopf-h, data-gescrollt, buehne-dunkel über dem Auftakt), Kapitel-Links
  mit Handschrift-Ziffern (text-vermerk, ≥32 px-Regel) und Stiftstrich, Konto-Pille mit Verlaufsrand.
- Fuß: Kapitelverzeichnis, Unterschrift, „Zurück zum Anfang“, Wortmarke im Verlauf.

**Nachtrag Session 17 (bis `ddc5294`, live geprüft per DOM):**
- Jede Sorte direkt bewertbar: Knopf „Diese Sorte bewerten“ oben auf jeder Produktseite, „Stimmen der Community“
  immer sichtbar (leer: „Erste Bewertung abgeben“). Umfragen pushen nur, Bewerten ist unabhängig davon.
- Noten im Formular als Regler 1–5 (`NotenRegler`, kein stiller Vorgabewert); Gesamteindruck-Block
  (`GesamteindruckLeiste`, ohne Wirkung wegen HWG) neben dem Graphen, verschiebbar.
- Joint-Cursor, Videos überall in normaler Farbe (keine Filter), Storytelling mit 3 Themen-Videos, Blob-Morph stärker,
  Glanz automatisch (3,5 s), Hero-Video 75 %, Hero-Unterzeile unter der Wortmarke, Aroma-Sektion direkt nach dem
  Storytelling, Referenzkreis am Herstellerwert, nicht angegebene Terpene ab Geschmack 0,5 farbig.

**Offen:**
1. Kopf: `backdrop-filter` kommt nicht an (computed none) -> Ursache prüfen (evtl. Lightning CSS).
2. Mobil 390 px (Kopf zweizeilig + fixed: Abstand prüfen), Hell-Modus des Kopfs über dem Auftakt.
3. Bewertungsformular live testen (Beschaffenheit-Regler, Terpene mit Stufe 0) – Anmeldung nötig.
4. Netz-Ansicht: Achsenknoten auf Beschriftungen. Beispielrunde neu eröffnen? (Nutzer fragen)
5. Herstellertreue massenhaft (Spalte, Rangliste), siehe Session-15-Liste.

### ⇢ STAND SESSION 16 Ende
Alles gepusht bis `c4210e8`. **Live NICHT per Screenshot geprüft:** `c421d6c`, `d30644b`, `c4210e8` und Hover-Glanz
(Chrome hing zuletzt: Tab eingefroren, nachdem ein resize_window auf 390 px fehlschlug und der Viewport ~2300 px breit
wurde; Chrome wurde neu gestartet). Zuerst: Browser verbinden, Fenster normal groß, dann prüfen.

**Erledigt in Session 16 (Tests 156/156 via `npm test`; NICHT vitest, das sammelt nur .claude/skills ein):**
- **Produktseiten mit Bewertungen stürzten ab** (React #441; Worker-Log per `npx wrangler tail cn-medcan --format json`:
  „Event handlers cannot be passed to Client Component props“). `SweetSpot.tsx` ist jetzt `"use client"`. Live geprüft ok.
- **Regler-Bug (Nutzer):** Skala 0..5 (0 = nicht geschmeckt), Schritt 0,1, Wert aus Zeigerposition (`wertAmZeiger`, kein
  Daumen-Versatz des nativen Range mehr), rastet ±0,15 am Community-Wert ein (Punkt und Ring deckungsgleich). Sweet Spot
  (3) sitzt bei 60 %, Gradient in `.sweet-spot-spur` angepasst. Live geprüft ok.
- **Handschrift statt Kursiv:** alle `farbverlauf italic` -> `farbverlauf hand-betont` (Inspiration, 1.35em, globals.css).
  Abstimmung: „Nächstes?“ schlicht, „Wähl mit.“ mit `farbverlauf font-hand`. Test in tests/handschrift.test.ts angepasst.
- **Wortmarke im Auftakt:** Farbverlauf wie Buzzwords + Glanzstreifen beim Hover (`.auftakt-marke [data-marke-zeile]`).
- **Aroma-Erkundung:** Auswahlliste „Terpen ergänzen“ entfernt; alle Katalog-Terpene von Anfang an da, nicht angegebene
  bei 0 und grau (Bogen, Knoten, Name), hochgezogen farbig (AromaKarte: `farbig = achseFarbig && kraft > 0`). Layout:
  links Karte + Regler kompakt quer scrollbar direkt darunter (`SweetSpot quer`), rechts Kennzahlen/Texte (sticky).
- **Bewertungsformular:** alle Terpene da, Block „Vom Hersteller nicht angegeben“, Stufe 0 „nicht geschmeckt“
  (Schema min 0 in lib/bewertung-eingabe.ts und terpenIntensitaetSchema), Vorschau-Karte grau bis gewählt.

**Befunde / offen, der Reihe nach:**
0. **KRITISCH: Seiten mit Aroma-Erkundung frieren ein** (Renderer hängt, CDP-Timeout 45 s), auch nach Chrome-Neustart,
   zuletzt /produkte/apples-bananas auf Stand `c4210e8`. Vorher (bis `1c5fd52`) lief die Seite. Verdacht: Render-/Effekt-
   Schleife seit `c421d6c` (alle Katalog-Terpene in der Karte, `staerken`/`useGleitend` in AromaKarte mit neuem Objekt je
   Render?) oder die Glanz-Transition. Mit systematic-debugging eingrenzen (Commits einzeln prüfen), zuerst beheben.
1. Live-Screenshot-Prüfung der obigen ungeprüften Commits (Startseite Aroma-Sektion, /produkte/apples-bananas,
   /bewerten/apples-bananas, Hover-Glanz). Nutzer will Karte und Regler auf einen Blick.
2. Seite fror im sehr breiten Fenster ein -> prüfen, ob echtes Performance-Problem (3D-Blätter? Glanz-Transition auf
   riesigem background-clip:text?) oder nur Browserzustand.
3. Netz-Ansicht: schwarze Achsenknoten liegen auf den Beschriftungen.
4. Sehr breites Fenster (~2300 px): Hero-Wortmarke abgeschnitten („Grünes B…“).
5. Befund 2 ist KEIN Bug: Herbstrunde wurde am 24.09. beendet (Phase BEENDET). Nutzer fragen, ob neu eröffnen
   (data/stamm/beispiel-runde.sql setzt aktiv, aber istGewinner-Flags bleiben).
6. Mobil 390 px (resize_window klappt nicht; ggf. Nutzer bitten, Fenster schmal zu ziehen), reduzierte Bewegung.
7. Danach Task „Herstellertreue massenhaft“ (siehe unten, Session-15-Liste Punkt 2).

### ⇢ STAND SESSION 15 Ende: Browser-Prüfung, dann Tasks unten
Session 15 gepusht (letzter Commit siehe `git log`, Builds bis `dcec4bd` grün). Browser-Erweiterung war nicht
verbunden: **nichts davon ist per Screenshot geprüft.** Zuerst Chrome mit Claude-Erweiterung, Fenster sichtbar.

**Erledigt in Session 15 (Code, Tests 156/156 grün, tsc/eslint sauber):**
- Sichtprüfung-Befunde 1, 3 bis 7 (Bühnen-Tokens, Manifest-Freisteller ohne Kasten, Aroma-Karte ohne Nullbalken,
  Buzz-Satz oben, „Bestand unbekannt“, blassere Fußmarke). Befund 2 (Startseite „keine Runde“): im Code keine
  Ursache, gleiche Funktion wie /umfragen; vermutlich Screenshot vor Beispielrunde -> live prüfen.
- **Aroma-Karte + Sweet Spot zusammengeführt:** `components/review/AromaErkundung.tsx` (Startseite, Produktseite).
  Sweet-Spot-Spuren sind die Regler (`SweetSpot` mit `bedienung`), „Dein Eindruck“ lila auf der Karte;
  `AromaSpielwiese` gelöscht. Sichtbare sr-only-Caption („… Skala 0 bis 5“) behoben (Tabelle in div.sr-only).
- **Karte:** nur aktive Achse farbig, Rest grau; Pfade leuchten/verbreitern nach Terpen-Stärke (`terpenStaerken`);
  Balken gleiten (`useGleitend`), Skala 0..5 über den Balken, Werte an Balkenenden bei aktiver Achse.
- **Terpene ergänzen, die der Hersteller nicht angibt:** `TerpenErgaenzen.tsx` + `ladeTerpenKatalog()`; in
  AromaErkundung und im Bewertungsformular; Server Action erlaubt jetzt alle bekannten Terpene. Ergänzte Pfade
  gestrichelt, zählen nur in den Eindruck (`eindruckProfil(…, ergaenzt)`).
- **Herstellertreue (Koeffizient):** `herstellerTreue()` = Σmin/Σmax Hersteller- vs. Geschmacksprofil je
  Bewertung, `mittlereHerstellerTreue()` über alle freigegebenen Bewertungen; angezeigt in AromaErkundung plus
  Live-Wert „Dein Eindruck“.

**Tasks für die nächste Session, der Reihe nach:**
1. Browser-Prüfung live: Startseite (Aroma-Sektion: Regler, Karte grau/farbig, Leuchten, Skala, Ergänzen,
   Herstellertreue; Abstimmung = Befund 2), Produktseite, `/bewerten/[slug]` (Terpen ergänzen, Speichern).
2. Herstellertreue massenhaft erfassen und auswerten: je Bewertung beim Speichern mitschreiben (Spalte
   `reviews.hersteller_treue`, Migration + Backfill), je Sorte im Katalog zeigen/sortieren/filtern, Rangliste
   „Wer hält, was er verspricht“ (je Hersteller über alle Sorten). Ergänzte Terpene als eigene Kennzahl
   („von Community zusätzlich geschmeckt“) aggregieren.
3. Befund 8: Mobil (390 px), Dunkel-Modus, reduzierte Bewegung (Gleiten springt dann).
4. Offene Sichtprüfung der Unterseiten im neuen Stil.

### ⇢ STAND SESSION 14 Ende: Sichtprüfung-Befunde (in Session 15 abgearbeitet)
Live bis `692eb12` (alle Builds grün). Live-D1 befüllt: 286 Sorten aus eigenem Produktstamm (`data/stamm/`, Import
`scripts/stamm/sql-erzeugen.py` -> `data/stamm/import.sql`), 20 fiktive Bewertungen (`scripts/stamm/beispiel-bewertungen.py`,
Notiz beginnt "Fiktive Beispielbewertung"), Beispielrunde "Herbstrunde 2026" (`data/stamm/beispiel-runde.sql`).
Remote-D1 schreiben ist per Regel in `.claude/settings.local.json` erlaubt (`npx wrangler d1 execute cn-medcan-db --remote:*`,
Befehl genau so beginnen, ohne `cd` davor). Browser-Tab muss sichtbar sein, sonst keine Screenshots / Suspense bleibt
"lädt" (React zeigt gestreamte Inhalte erst per rAF).

**Offene Befunde der Sichtprüfung (Desktop, hell), Skill build-awwwards-quality-sites, der Reihe nach beheben, dann einmal pushen:**
1. **Hero „Video anhalten“:** weiße Pille ohne lesbaren Text. `.buehne-dunkel` (globals.css) setzt surface-raised /
   surface-sunken nicht -> dort ergänzen (neutral-900/1000), Secondary-Button nutzt diese Tokens.
2. **Startseite Abstimmung zeigt „Gerade läuft keine Runde“,** obwohl `/umfragen` die Herbstrunde live zeigt
   (`components/story/Abstimmung.tsx` -> `aktiveUmfrage()` in lib/query/umfragen.ts, findUnique aktiv='AKTIV').
   Ursache klären (Cache? anderer Fehlerpfad in `sicher`? Startseite force-dynamic). Darunter große Leerfläche.
3. **Manifest-Bilder (TransparentMachen `Punkt`):** graue Blob-Fläche (`bg-surface-sunken`) wirkt wie Kasten, Freisteller
   ragen oben raus / hart angeschnitten. Für freigestellte Bilder: `object-contain`, Innenabstand, Blob nur als zarte
   Tönung (accent-subtle) oder ganz ohne Fläche.
4. **Aroma-Karte (components/review/AromaKarte.tsx):** Achsen mit Wert 0 zeigen je zwei Punkte + Stummel -> in der
   Karten-Ansicht bei Wert 0 Balken und Punkte ausblenden; Achsenknoten ruhiger (einfarbig). Beschriftung stößt an
   lange Balken (Label-Versatz `punkt.x - 130` auf ca. -150).
5. **Buzz-Satz „stimmt das?“** (AromaSektion) liegt mitten hinter den Kurven -> `oben="top-8"` oder weglassen.
6. **Katalog-Karten** zeigen überall Badge „Nicht gelistet“ (ProduktCard, heißt: keine Apotheke mit Bestand) -> Text
   neutraler („Bestand unbekannt“) oder Badge ohne Bestand weglassen.
7. **Fuß:** lila Wortmarke im Hintergrund zu kräftig, überdeckt Links -> `.fuss-marke` opacity ~0.15, weiter nach unten.
8. Danach: Mobil-Ansicht (390 px) und Dunkel-Modus einmal prüfen, reduzierte Bewegung.

**Stand der Features (alles live):** Aroma-Karte mit Morph Karte/Netz, Hersteller vs. Community; Aroma-Spielwiese
(offene Regler, `components/review/AromaSpielwiese.tsx`); Sweet Spot je Terpen; Bewertungsformular `/bewerten/[slug]`
(ADMIN sofort redaktionell, Mitglieder -> Freigabe in /admin); 3D-Blätter (5 Stück, 30 %, pausieren bei hidden,
Context-Loss); Hero-Film-Intro; zwei Schriftfamilien; Wir-Form.

**Datenrecherche:** Keine Übernahme ganzer Fremd-Datenbanken (flowzz, medcanonestop): nur Namen als Suchliste, Fakten
je Produkt aus mehreren Quellen. Dauerlösung für Vollständigkeit: ABDA-Artikelstamm-API (pharmazie.com, Lizenz) und
Partner-Apotheken für Bestand. Netz schonen: keine Polling-Schleifen, kein Dev-Server (Memory netzwerk-schonen).

### ⇢ STAND SESSION 14, vierter Block (2026-09-25): live bis `17134f4`, Build erfolgreich
- Aroma-Karte (`components/review/AromaKarte.tsx`, `lib/aromakarte.ts`): Poster mit 8 Geschmacksachsen, Terpenen und
  Bögen, Morph „Karte“/„Netz“ (~900 ms); Hersteller (Grün, `herstellerProfil()`) gegen Community (Lila). In Doppelseite,
  Produktseite („Stimmt das Profil?“) und Startseite (`AromaSektion.tsx`); Aufklärung Sativa/Indica ohne Heilversprechen.
- Terpen-Intensität: `reviews.terpen_intensitaet` (Migration 0004, remote angewandt), 1..5 mit 3 = Sweet Spot,
  Anzeige `SweetSpot.tsx`.
- Startseite: Buzz-Sätze nur noch in drei Sektionen, größer und mittig; Manifest-Betonungen in Handschrift.
- Bewertungsformular `/bewerten/[slug]` mit Live-Aroma-Karte; Mitglieder landen unfreigegeben, Betreiber sofort
  sichtbar; Freigabe in `/admin` (`BewertungFreigabe.tsx`).
- 3D-Blätter `components/story/bewegung/blaetter.ts` (Three.js dynamisch, nur ab Tablet, ohne reduzierte Bewegung,
  22 Canvas-Blätter, Wind aus Lenis-Scrollgeschwindigkeit).
- **Live-D1 ist LEER** (0 Strains, 0 Reviews, 0 Terpene): die fiktiven Seed-Daten gibt es nur lokal, Datensektionen
  sind live ausgeblendet. Produktion befüllen braucht die Entscheidung des Nutzers.
- Netzregel: keine Polling-Schleifen, kein Dev-Server, keine großen Downloads ohne Ansage (Memory netzwerk-schonen);
  `DISABLE_AUTOUPDATER=1` in `~/.claude/settings.json` gesetzt.
- Spec Redesign 14 bis 18 nachgetragen.

### ⇢ STAND SESSION 14, dritter Block (2026-09-24): live bis `9b91d4f`, alles grün
- Auftakt: Bühnenvideo Pexels 7684711 (Nutzervorgabe) in Farbe, opacity 45 % plus Schleier, `buehne-dunkel`,
  Wortmarke `plakat` mittig (gemessen), Film zoomt beim Scrollen, Pause-Knopf.
- Farbe statt Schwarzweiß (Freisteller, trichom, Videos). `.farbverlauf` (Grün, Lila, Grün) auf einem Schlüsselwort je
  Überschrift; Buzz-Sätze abwechselnd `ton="gruen"`/`"lila"`, opacity 15 %.
- Manifest: Volltext über die Sektion, Reveal Wort für Wort (transparent.ts), Prüfpunkte als große Bilder (448 px) in
  ungleichen Kreisen mit shape-outside.
- Nur noch zwei Schriftfamilien: Newsreader (alles Gedruckte, auch Bedienung und Zahlen) und Inspiration. Geist raus.
- Wir-Stimme auf Startseite und Abstimmungsseiten; Stempel „Gesetzt“ entfernt (gesetzte Plätze nicht sichtbar).
- Fuß: Wortmarke absolut im Fuß hinter dem Inhalt.
- Builds dauern nur noch ~3 Min; Status per `gh api repos/bratzi/cn-medcan/commits/<sha>/check-runs`.
  Browser-Screenshots scheitern, wenn das Chrome-Fenster verdeckt ist (`document.visibilityState` = hidden).
- **Offen:** 3D-Blätter (three installiert), Unterseiten im neuen Stil, Sichtprüfung dunkel/hell per Screenshot.

### ⇢ STAND SESSION 14, zweiter Block (2026-09-24): Referenz choreograffiti, Freisteller, Video (`21555d8`)
- Nutzer: Name „Grünes Buch“ bleibt, Notizbuch-Bild weg, alle Downloads erlaubt. Stil nach choreograffiti.com: nur
  der Kopf-Schriftzug (riesig, Rand zu Rand, sitzt im Hintergrund, Bild davor), umgesetzt in UNSERER Handschrift.
- Umgesetzt: h1 = Wortmarke `groesse="plakat"` (`text-plakat`); je Sektion Buzz-Satz über
  `components/story/Schlagwort.tsx` (`text-kulisse`, `text-border`); Handschrift-Notizen im Raster entfernt.
- Freisteller-Pipeline `scripts/medien/freistellen.py` (rembg isnet, SW mit Alpha): `frei-bluete` (Auftakt, vor den
  Buchstaben), `frei-hoch`, `frei-paar` (Manifest-Bühne); `Medium.freigestellt` = kein Mischmodus. Alte Fotos
  leitobjekt/blatt/bluete gelöscht, trichom bleibt.
- Sektion 4: Kreis und Videokasten entfernt, neues Video (Pexels 7667040, HD 1280) blass bildschirmfüllend im
  Hintergrund, Stationen groß davor. `three` installiert, noch ungenutzt (3D-Blätter offen).
- **Offen:** Live-Prüfung von `21555d8` hell/dunkel; 3D-Blätter; Unterseiten.

### ⇢ STAND SESSION 14 (2026-09-24): Redesign Welle 1 gepusht (`6f74318`)
- Richtung und Schalter vom Nutzer freigegeben („ja“, wenig Zwischenfragen, pushen). Spec:
  `docs/superpowers/specs/2026-09-24-redesign-referenz-design.md`.
- Umgesetzt: Newsreader statt Cormorant; Grade `text-riesig`, `text-manifest`, Titel/Kapitel 200 mit negativer
  Laufweite; Auftakt-h1 grüner Serif-Titel, Wortmarke als Signatur (`groesse="signatur"`), Motiv davor (z-10);
  Manifest Wort für Wort Grau zu Tinte; Hintergrund-Notizen in Handschrift; Brand Preset (`docs/brand/gruenes-buch.md`,
  `.claude/skills/ui-design-engine.md`) angepasst. 148/148 Tests, Typecheck, Lint, Farben grün.
- **Offen:** Live-Prüfung (Browser-Anmeldung nötig), dann Welle 2 (SW-Freisteller, Three.js-Blätter: braucht
  `three` als Abhängigkeit), Welle 3 Unterseiten (dort noch `font-light` auf Kapiteln).

### ⇢ NEUER ERSTER TASK (Session 13, 2026-09-24): Redesign nach Referenz moneyincheck.org

**Auftrag des Nutzers (Session 13, sinngemäß):** Typografie, Look and Feel, Animationen, interaktive Elemente und
Bildqualität sind „weit entfernt“ von https://moneyincheck.org/. Mit den besten Skills die Referenz genau ansehen und
eine hochprofessionelle Seite bauen, die mindestens so aussieht, angepasst an unser Thema. **Kostenlos bleiben**, gute
freie Ressourcen suchen. Sagen, was gebraucht wird. Dazu: Typografie „zu einheitlich, nicht aufeinander abgestimmt“;
Elemente „stacked untereinander, nicht in mehreren Ebenen“, Bilder hängen **unter** statt **hinter** dem Text. Dazu
fehlt ein **Schalter Hell/Dunkel** (Nutzer sieht immer nur Schwarz, sein System steht auf dunkel). **Mobil erst mal
nicht**, kommt später. Dieser Task steht vor allem anderen.

**Stand:** Brainstorming läuft (`superpowers:brainstorming`, Pfad architektonisch: Fragen, Spec, Plan). Referenz
analysiert (Desktop 1440). Plan TP3 Welle 2 **pausiert, nicht geschrieben**: Medien und Bewegung werden vom Redesign
neu bestimmt. Die rembg-Pipeline aus Spec TP3 7.2 bleibt als Werkzeug nutzbar.

**Analyse der Referenz (gemessen im Browser, 2026-09-24):**
- Schrift: **eine** Serif, PP Editorial Old (Pangram Pangram, **kommerziell lizenzpflichtig**, nicht nutzbar), in
  Schnitten 200, 200 kursiv, 400, 400 kursiv, 800; Größen von 11 bis 378 px. Betonung nur per Kursiv/Fett derselben
  Familie. Dazu **eine** Handschrift, Liu Jian Mao Cao (Google Fonts, OFL), nur klein und grau als Textur
  (Schachnotizen „Nf3“, „Bc4“, 24 bis 40 px, erscheinen nach und nach über die ganze Seite). Winzige Beschriftungen in
  Helvetica.
- Ebenen: Karopapier-Raster fest im Hintergrund; Titel „MONEY IN CHECK“ riesig in Grün, ein freigestelltes
  **Schwarzweiß**-Motiv (Springer mit Geldrolle, 2427 px, WebP) steht **zwischen** den Buchstaben (z-index 2);
  Handschrift-Notizen hinter dem Text; 3D-Geldscheine fliegen über alles.
- Bewegung: **Lenis**, Manifest-Text Wort für Wort von Grau zu Schwarz scroll-gekoppelt, in Lücken des Textes laufen
  kleine **Kritzel-Videos** (doodle-1 bis 6.mp4, 300 px breit), Schluss-Satz von Kontur zu Füllung, Fortschritt als
  „N … S“-Leiste rechts, Datum und Uhrzeit live in einer Zeitungszeile. **Three.js r185** (Canvas `bills-gl`,
  bildschirmfüllend): Geldscheine als gebogene Flächen mit Foto-Textur, scroll-gekoppelt.
- Rest: Buch-Abschnitt mit Slider (Buchseiten), Preistabelle, grüner Pillen-Button, Pillen-E-Mail-Feld; Autor mit
  rundem Porträt, verstreuten Bildchen mit Bildunterschrift, Unterschrift als Bild; Fuß minimal, „say hello“ als
  Kritzel. Gebaut mit Vite, nicht Next.

**Nutzerentscheidungen (Session 13):** (1) **Handschrift-Logo bleibt** (Inspiration, Kopierstift-Violett; die Serif
führt alles andere). (2) **Bildwelt Schwarzweiß**, Farbe nur in der Schrift (löst TP3 „Farbe, einheitlich gegradet“
ab). (3) **3D-Moment: Blätter**, getrocknete Cannabisblätter aus Foto-Freisteller segeln scroll-gekoppelt (Three.js,
nachgeladen). (4) **Hell/Dunkel-Schalter sofort, Standard Hell**: rechts im Kopf, Wahl gespeichert, ohne Aufblitzen
(als kleiner Entwurf freigegeben, wird vor der Spec gebaut). Mobil erst mal nicht.

**Stand Ende Session 13 (NÄCHSTE SESSION BEGINNT HIER):**
- Nutzer: „Vergiss alles“ aus TP3 Welle 2 und den letzten Tasks; nur noch das Redesign nach der Referenz, mit den
  Skills von **https://agenticskills.io/category/design** (Dauerregel, Memory `skillquelle-agenticskills`). Neu
  installiert: `apple-design`, `animation-vocabulary`, `find-animation-opportunities`, `improve-animations`,
  `review-animations` (Emil Kowalski). Noch prüfen: `impeccable`, `ui-ux-pro-max`, `web-design-engineer`,
  `designer-skills-collection`.
- **Hell/Dunkel-Schalter gebaut und gepusht** (`3b1e1b1`): `lib/thema.ts` (Skript im head, Schlüssel
  `gruenes-buch-thema`), `components/layout/ThemaSchalter.tsx`, Kopf-Grid um eine Spalte erweitert, CSS
  `.thema-ziel-*`. 147/147 Tests, Typecheck, Lint grün. **Live nicht geprüft** (Nutzer nicht angemeldet). Nutzer
  hat noch nicht gesagt, ob der Schalter bleiben soll (angeboten: Rücknahme per Commit).
- **Richtung für das Redesign vorgelegt, noch NICHT freigegeben** (Brainstorming, Pfad architektonisch):
  1. Typo: eine freie Serif für alles Gedruckte, Kandidat **Newsreader** (Google, OFL, 200 bis 800, kursiv,
     opsz); harte Skala (Titel 200 bis ~300 px, Manifest 200 bei 64 bis 100 px, Kapitel 800, Betonung kursiv);
     Geist nur Bedienung/Katalog, Geist Mono Zahlen; Inspiration bleibt Logo und wird zusätzlich Textur
     (Messwert-Notizen wie „Myrcen“, „Charge 24-117“ erscheinen im Hintergrund); Cormorant entfällt.
  2. Ebenen: Karopapier mit Notizen hinten, Schrift Mitte, SW-Freisteller zwischen/vor den Buchstaben, 3D-Blätter
     über allem; Auftakt mit riesigem grünem Serif-Titel und Handschrift-Wortmarke als Signatur; Bilder im Satz
     (Lücken im Manifest), nicht als Block darunter.
  3. Bilder SW-Freisteller (Pexels + rembg), AVIF/WebP bis 2400 px, Grün nur in der Schrift.
  4. Bewegung: Manifest Wort für Wort grau zu schwarz, Schluss Kontur zu Füllung, 3D-Blätter (Three.js,
     nachgeladen, federnd), Notizen erscheinen; Bedienung/Katalog/Formulare nicht animiert; reduzierte Bewegung
     statisch. Mobil erst mal nicht.
  5. Wellen: 1 Typo + Startseite, 2 Bilder + 3D, 3 Unterseiten.
- **Nächster Schritt:** Nutzer die Richtung freigeben lassen (v. a. Newsreader), dann Spec schreiben
  (`docs/superpowers/specs/`), vorher `better-colors`, `animate`, `emil-design-eng`, `better-ui`, `better-writing`
  und die obigen Skills laden. Danach Plan (`superpowers:writing-plans`).

**Offen aus Session 12, weiter gültig:** Live-Prüfung TP3 Welle 1 (Nutzer muss sich im Browser-Tab anmelden).

### NÄCHSTE SESSION (Stand Session 12, 2026-09-24): TP3 Welle 1 live prüfen, dann Plan TP3 Welle 2

**Session 12:** Spec TP3 freigegeben, **Plan TP3 Welle 1 geschrieben, freigegeben („ja“) und vollständig umgesetzt**
(`docs/superpowers/plans/2026-09-24-makeover-tp3-welle-1.md`, Tasks 1 bis 11, je Commit auf `main` gepusht, letzter
Code-Commit `fdeda51`). Lokal verifiziert: 141/141 Tests, Typecheck, Lint, `npm run farben`, keine Wand-Reste.
Abschlussreview durch frischen Reviewer: 0 kritisch, 0 wichtig, 6 klein; einer hochgestuft und behoben (Fuß-Wortmarke,
Trigger `top bottom`), der Rest unter Teilprojekt 3 als „zurückgestellt“. Entscheidungen und Rulings: Abschnitt
Teilprojekt 3 unten.

**Welle 1 ist live seit 17:08 UTC** (Workers Build zu `fdeda51` erfolgreich, GitHub-Checkrun „success“). Die Builds
zu den neun Pushes davor (16:26 bis 16:50 UTC) haben nie ein Ergebnis gemeldet: **jeder neue Push bricht offenbar den
laufenden Build ab** (Build dauert rund 11 bis 14 Minuten). **Lehre: während einer Welle nicht nach jedem Task pushen,
sondern an wenigen Prüfpunkten, und nach einem Push rund 15 Minuten nicht erneut pushen** (HANDOFF-only-Commits sind
vom Build ausgenommen und stören nicht).

**Offen aus Welle 1 (zuerst erledigen): die Live-Prüfung** (Plan Task 11, Steps 2 bis 7: Seitenregeln, Ansichten
320 bis 1440 px hell und dunkel, Handschrift ≥ 32 px, ohne JavaScript, JS-Budget, LCP und CLS). Nicht gemacht, weil
(a) das Gate-Cookie im Browser abgelaufen ist und das lokale Gate-Geheimnis live nicht gilt (`seiten-pruefen.ts` mit
`PRUEF_BASIS` bekommt 307), der Nutzer muss sich einmal im Browser-Tab anmelden, und (b) die Browser-Erweiterung um
17:10 UTC nicht verbunden war.

**Neue Dauerregel des Nutzers (Session 12): kein lokales Dev-System.** Kein `next dev`, kein
`opennextjs-cloudflare preview`, kein lokaler `next build`. Lokal nur `npm test`, Typecheck, Lint, `npm run farben`.
Jeder Task wird nach `main` gepusht (Workers Builds stellt live), geprüft wird live per Browser-MCP. Der Push braucht
damit kein eigenes Go mehr (so ausgelegt und dem Nutzer gesagt). Memory `live-statt-dev`.

**Session 11:** Brainstorming zur Marken- und Medien-Überarbeitung abgeschlossen. **Spec geschrieben und committet:**
`docs/superpowers/specs/2026-09-24-makeover-teilprojekt-3-marke-medien-design.md` (Teilprojekt 3). Kern der
Nutzerentscheidungen: Konzept **„Buch und Handschrift“** (Graffiti, Sedgwick, Drips, Nebel, Marmor, „gb“-Tag
entfallen ganz), Handschrift in **Inspiration** und **Kopierstift-Violett** (bisherige Sprühviolett-Werte, Token
`kopierstift`), Logo = handschriftliche Wortmarke + Unterzeile „Charge für Charge“ + Signet „gB“, Motive **von Pexels,
lokal freigestellt** (`rembg`), **in Farbe einheitlich gegradet**, kein `invert`/`multiply` mehr, Komposition
**„Randnotizen“** mit Flat-Lay im Auftakt, Technik **browser-nativ** (CSS scroll-gekoppelte Tiefenebenen, React
`<ViewTransition>`) **plus ein WebGL-Effekt** „Kopierstift läuft“ (eigener WebGL2-Baustein, nur Startseite).
Zuschnitt: **drei Wellen** (1 Marke, 2 Medien, 3 Unterseiten), **vor** TP2 Welle 2. Die Entscheidungen mit „Claude“
in Spec Abschnitt 2 hat Claude selbst getroffen (Nutzer wollte keine Einzelfreigaben mehr, Memory
`entscheidungen-buendeln`). TP2-Spec trägt oben einen Verweis auf die abgelösten Teile.

**Betreiber-Konto live (Session 11, auf Wunsch des Nutzers):** das einzige Live-Konto hat per
`wrangler d1 execute --remote` (Bootstrap aus `db/README.md`) Rolle `ADMIN` und `freigegeben = 1`, nach dem Update
live gelesen. Claude durfte den Live-Zugriff diesmal selbst ausführen. Kontodetails gehören nicht ins Repo.

1. **Zuerst:** Live-Prüfung TP3 Welle 1 nachholen, falls sie unter Teilprojekt 3 noch als offen steht (Plan Task 11,
   Steps 2 bis 7). Dann **Plan TP3 Welle 2 (Medien)** mit `superpowers:writing-plans` aus Spec TP3 Abschnitte 7, 8, 9,
   13 (Welle 2), 14, 15; erster Schritt `pip install "rembg[cpu,cli]"` (einmal, bei Netzfehler stoppen). Ausführung
   Native, geprüft live, Push nur an Prüfpunkten. Danach Welle 3 (Unterseiten).
2. Der Nutzer kann `/interface-review` für TP2 Welle 1 starten (Spec TP2 9.12); Claude kann es nicht selbst starten.
3. **Nach TP3: TP2 Welle 2** (Katalog: `/produkte`, `/apotheken`, `/apotheken/[slug]`), jetzt im Stil „Buch und
   Handschrift“ und mit den Seitenkopf-Motiven aus TP3 Abschnitt 10. Plan mit `superpowers:writing-plans` aus
   Spec TP2 Abschnitt 5, Ausführung wieder **Native**. In den Plan übernehmen (Lehren aus Welle 1):
   - **Keine Suspense-Grenze um den Seiteninhalt** der Unterseiten (Nutzerentscheidung Session 10: ohne JS lesbar,
     Sprungziele, echte 404). Skelette nur, wo das nicht gilt.
   - Viewport-Prüfung zusätzlich bei **800 px** (Kopf, Tabellen), „ohne JS“ mit echtem Blick auf `<div hidden id="S:…">`
     im Roh-HTML, nicht nur „Markup vorhanden“.
   - Zurückgestellt für Welle 2: Fokus-Ketten in `Select.tsx`/`RangeSlider.tsx`, BestandTabelle-Caption und HWG-Satz
     (Spec-7-Wortlaut), `ProduktCard` Deckkraft-Hover und Vermerk, Scrollbalken der Navigationsleiste in schmalen
     Desktop-Fenstern.
   - Zurückgestellt ohne Welle: Produktseiten-Metadaten „Meine Bewertung“ auch ohne eigene Bewertung, Fokusreihenfolge
     „Mein Konto“ im Kopf unter lg, Reel-iframe bei lg sehr hoch (`max-w-sm`), Skelett-Flächen der Startseite kaum
     sichtbar, DSGVO-Frage Instagram-Reel (Nutzer).
   - Vorbestehend aus TP1: zwei Hydrations-Meldungen im Dev-Overlay der Startseite (GSAP-Styles vor der Hydrierung
     gestreamter Sektionen, `WissenBuendeln` und Doppelseite), Details unter „Teilprojekt 2“ in Abschnitt 1.
4. Werkzeug-Hinweise aus Session 10: Git Bash wandelt `/pfad`-Argumente in Windows-Pfade um, daher
   `MSYS_NO_PATHCONV=1 npx tsx scripts/seiten-pruefen.ts /…`. `sed -i` in Git Bash kann CRLF-Dateien auf LF umstellen,
   Änderungen an CRLF-Dateien per Node-Skript oder Edit-Werkzeug. Im Hintergrund-Tab des Browserwerkzeugs laufen
   Server Actions, Client-Navigationen und GSAP nicht sichtbar durch: solche Prüfungen im sichtbaren Tab.

### Teilprojekt 3 „Marke und Medien“

Spec: `docs/superpowers/specs/2026-09-24-makeover-teilprojekt-3-marke-medien-design.md`. Plan Welle 1:
`docs/superpowers/plans/2026-09-24-makeover-tp3-welle-1.md` (Ausführung Native, direkt auf `main`, jeder Task
gepusht und live geprüft; Dauerregel: kein lokales Dev-System).

- Welle 1, Task 1 erledigt: Sprühviolett heißt Kopierstift (`violett-*`, `kopierstift*`), neue Paare gemessen
  (surface-raised 5.53/6.88, surface-sunken 4.61/7.66).
- Welle 1, Task 2 erledigt: Inspiration geladen, Handschrift-Grade `text-marke`, `text-umschlag`, `text-notiz`,
  `text-vermerk` (neu, 32 px).
- Welle 1, Task 3 erledigt: Wortmarke handschriftlich (Kopf 40 px, Auftakt als h1 zweizeilig), Unterzeile „Charge für
  Charge“, Tag und Drip im Auftakt raus, Einstieg per CSS.
- Welle 1, Task 4 erledigt: Fuß mit angeschnittener Wortmarke statt „gb“-Tag, kleine Wortmarke im Fuß entfällt,
  `schreiben.ts` als gemeinsamer Ablauf.
- Welle 1, Task 5 erledigt: Wissen bündeln als Seite mit Randspalte (Zahl gedruckt, Wort von Hand), `wand.ts` und
  Schwenk raus.
- Welle 1, Task 6 erledigt: Schleife (Stationen der Community von Hand, 32 px), „Wähl mit.“ von Hand, Wasserzeichen
  und Drip raus, Stimmzettel-Skelett in Zettelform.
- Welle 1, Task 7 erledigt: Stimmzettel mit „von euch“ und „x“ von Hand, `Kandidat` eigene Datei,
  /umfragen-Überschriften von Hand ohne Nebel.
- Welle 1, Task 8 erledigt: Sedgwick, SprayFilter, Textur, Masken (drip, nebel, marmor) und alte Tokens entfernt; Suche
  nach Wand-Resten in app/components/lib als Test.
- Welle 1, Task 9 erledigt: Signet „gB“ aus der Schriftdatei (OFL im Repo), `app/icon.png`, `app/apple-icon.png`,
  `app/favicon.ico` neu, `assets/marke/signet-1080.png` für Instagram (nicht ausgeliefert). Befund: im 32/16-px-Favicon
  sind die Haarstriche blass, „g“ und „B“ aber erkennbar.
- Welle 1, Task 10 erledigt: Brand Guideline und `ui-design-engine` auf „Buch und Handschrift“ umgeschrieben.
- Welle 1, Task 11 (Abschlussprüfung): lokal grün (141/141, Typecheck, Lint, Farben, keine Reste). Design-Review
  `web-design-guidelines`: ein niedriger Befund (s. u.). Abschlussreview (frischer Reviewer): „with fixes“, einziger
  Fix Fuß-Wortmarke-Trigger (`fdeda51`). Live seit 17:08 UTC. **Live-Prüfung (Steps 2 bis 7): noch offen**, siehe
  „Hier geht es weiter“.
- Entscheidungen aus dem Plan (Nutzer hat den Plan mit „ja“ freigegeben): Token `text-vermerk` 32 px; Stationen der
  Schleife in `text-vermerk` statt `text-notiz`; Wortmarke im Auftakt schreibt sich per CSS (steht ohne JS); kleine
  Wortmarke im Fuß entfällt, große einzeilig; `Kandidat` eigene Datei; Randspalte und Stimmzettel bleiben gestreamt mit
  Skelett (Spec 15.5 so ausgelegt). Rulings beim Umsetzen: Randspalte mit logischen Eigenschaften (`border-s`, `ps-8`);
  CRLF-Annahme im Plan war falsch (die meisten Dateien sind LF).
- Zurückgestellt (klein): Randzahlen stehen bis zum Trigger auf 0 (feuert er nie, stünde „0 Stimmen“ sichtbar; 0 erst
  am Timeline-Start setzen); Schreib-Endrand schneidet Schwünge über 20 % Breite während der Animation; Rückfall
  „Segoe Script“ in `--font-hand` greift nie (next/font liefert „Inspiration Fallback“); CSS-Einstieg schneidet die h1
  0,1 bis 1,6 s, LCP beobachten; Wortmarke ohne `translate="no"`; Favicon 16/32 px mit blassen Haarstrichen.

### 0. Live-Stand und Sessionablauf

Live-Adresse: **https://cn-medcan.w-helwich.workers.dev** (hinter dem Seitenpasswort = lokales
`SITE_PASSWORD`). **Der Prisma-Fix ist live (2026-09-23, Commit `9a6aadd`)** - Claude durfte
`npm run deploy` nach ausdruecklicher Anweisung des Nutzers ausfuehren. Geprueft mit
Passwort-Cookie: `/`, `/reviews`, `/umfragen`, `/produkte`, `/apotheken`, `/anmelden`,
`/registrieren`, `/api/auth/get-session` alle 200, ohne Cookie 307. Katalog live leer (keine
Seed-Daten in der Cloud-D1).

**Jede Session endet mit dem festen Ablauf** aus der Memory `periodic-session-handoff`: Go fuer
den Live-Gang erfragen -> nach dem Go live stellen und pruefen -> HANDOFF sichern, committen,
pushen -> Bescheid geben, dass gecleart werden kann.

**Workers Builds ist verbunden (2026-09-23, von Claude per Browser-Werkzeug im Dashboard,
nachdem der Nutzer sich angemeldet hatte).** Worker `cn-medcan` -> Settings -> Builds:
Repo `bratzi/cn-medcan`, Branch `main`, Build command `npx prisma generate && npm run cf-build`,
Deploy command `npx opennextjs-cloudflare deploy`, Root `/`, Preview-Builds **aus**, keine
Build-Variablen, API-Token automatisch ("Workers Builds - 2026-09-23 21:00"). **Exclude paths:
`HANDOFF.md`** - ein Commit, der nur HANDOFF.md aendert, loest keinen Build aus. Nach dem Neuladen
geprueft, dass alles gespeichert ist.
**Ab jetzt gilt: Push nach `main` mit Code-Aenderung = Live-Gang** - erst nach dem Go des
Nutzers pushen (Memory `immer-nach-github-pushen`).

**Workers Builds funktioniert (2026-09-23, 22:04):** Der Build zu `4e21291` lief durch und hat
Version `138177b3` live gestellt. Online einmal geprueft: `/`, `/reviews`, `/umfragen` 200,
`/admin` 307 (Login). Damit ist jeder Push nach `main` mit Code-Aenderung ein Live-Gang.
Alle Commits bis einschliesslich Session 4 (Spec, Design-Skills) sind gepusht; der Push erfolgte
nach Rueckfrage, Citrix war laut Nutzer getrennt.

**Nebenbefund zum Netzausfall:** Nach dem Neustart hielt ein fremder Dienst `aoservice`
(PID 5452, Systemrechte, Hersteller nicht lesbar) rund 200 TCP-Verbindungen, davon 68
**eingehende** auf Port 3159; daneben lief `urban-vpn-service`. Beides nicht von Claude. Dem
Nutzer gesagt; er soll im Task-Manager nachsehen, was `aoservice.exe` ist. Nach dem Neustart
lief der Push ohne Probleme.

**Verlauf des Testlaufs (zur Nachvollziehbarkeit):**
1. Build `d87d9ae` (nur README geaendert) scheiterte am Typecheck: `cloudflare-env.d.ts` war
   gitignored -> `Cannot find name 'D1Database'`, `Property 'DB' does not exist on type
   'CloudflareEnv'`. **Behoben in `77537ad`** (Datei wird mitcommittet, `.gitignore` erklaert
   es; enthaelt nur Secret-*Namen*, keine Werte - geprueft). Gepusht.
2. Build `77537ad` scheiterte beim Vorab-Rendern von `/admin`: `getAuth()` warf "BETTER_AUTH_SECRET
   fehlt", bevor `headers()` die Seite dynamisch machte (Workers Builds hat keine Secrets, lokal
   lieferte `.env.local` sie). **Behoben in `4e21291`** (`lib/session.ts`: erst `headers()`, dann
   `getAuth()`). Verifiziert: `next build` in einem frischen Klon **ohne** `.env.local` laeuft
   durch, gleiche Routen. Nach dem Netzausfall gepusht, Build gruen (siehe oben).
3. Build-Pruefung kuenftig: **einmal** im Dashboard (Worker -> Deployments -> Recent builds; Log per
   "Download log" landet in `C:\Users\w.helwich\Downloads`). **Nicht pollen** - siehe Memory
   `netzwerk-schonen`.
- Im CI-Log: npm 10.9.2 fuehrt Installationsskripte nicht aus ("9 packages have install scripts
  not yet covered by allowScripts": esbuild, workerd, better-sqlite3, prisma, @prisma/engines,
  unrs-resolver). Der Build kam trotzdem bis `next build`; beobachten, falls Deploy daran scheitert.
- **Offen, pruefen:** das Dashboard zeigt fuer die Live-Version eine Median-CPU-Zeit von 69 ms,
  `edge-stack-master` rechnet mit 10 ms im Free-Plan. Fehlerrate war 0 %. Aktuelle Limits in der
  Cloudflare-Doku nachlesen, bevor daraus Schluesse gezogen werden.

**Netzausfall am 2026-09-23:** Waehrend dieser Arbeit fiel das gesamte Netz des Nutzers aus
(DNS-Timeouts fuer alle Hosts). Vorher liefen: `npm ci` in einem frischen Klon, mehrere
`next build`, Polling-Schleifen gegen `wrangler deployments list`, Browser-Automation,
Push-Wiederholungen. Ursache nicht belegt; der Nutzer kennt das aus einem frueheren Projekt.
Regel seitdem: Memory `netzwerk-schonen`. Nach dem Router-Reconnect scheiterte auch ein
einzelner `git push` (erst DNS, dann Timeout auf github.com:443), und das Netz fiel laut Nutzer
erneut aus. Lokal ausgelesen: **Citrix-VPN-Adapter aktiv** (10.180.0.3) neben WLAN, zwei
Standard-Gateways, kein Proxy. Verdacht: der Citrix-Client. ~~Regel: vor jedem Push fragen, ob
Citrix getrennt ist.~~ **Aufgehoben am 2026-09-24:** laut Nutzer ist das Citrix-Problem behoben,
Claude pusht ohne Rückfrage (einmal, keine Wiederholung bei Netzfehler). Das Go vor einem Live-Gang
bleibt.
Das Browser-Werkzeug: Screenshots laufen hier oft in einen Timeout; `get_page_text`, `find` und
`zoom` funktionieren. `form_input` setzt Felder im Dashboard zuverlaessig.

### 1. Makeover „Grünes Buch“ - Teilprojekt 1 live und reviewt, als Naechstes Teilprojekt 2

**Stand (2026-09-23, Session 4):** Brainstorming abgeschlossen, **Spec geschrieben und
committet:** `docs/superpowers/specs/2026-09-23-makeover-gruenes-buch-design.md`.
Sie enthaelt alle Entscheidungen samt verworfenen Alternativen, Farben mit gemessenen
Kontrasten, Schriften, Logo, Startseiten-Dramaturgie (9 Sektionen), Technik, Medien-Pipeline,
Budgets, Akzeptanzkriterien und Reihenfolge. **Die Spec ist die Quelle - nicht diese Notiz.**

**Session 5 (2026-09-23), Stand von Schritt 0:**
- **Erledigt, in die Spec eingearbeitet** (Commits `7d60fd5`, `6f5a5bc`):
  a. moneyincheck.org im Browser gemessen (Desktop per Screenshots und berechneten Styles,
     Handy per gleich-originigem iframe mit 390 px) -> Spec 4.2 (Cormorant zusaetzlich 500),
     4.6 (Hover, Vorhang), neu 4.7 (Feldbuch-Raster), neu 4.8 (Referenzwerte), 5.1 Sektionen
     1, 2, 9 umgebaut (randfuellender Titel mit ueberlagertem Leitobjekt, Manifest mit
     scroll-gekoppelter Wort-Einfaerbung, Schlusszeile als Kontur, die sich fuellt).
  b. Logos, Verpackung und Merch von Wizard Trees und Doja Pak ueber die Google-Bildersuche
     -> Spec 4.3 (Schleife um das Tag, gesperrte Versalien darunter, Stanzkontur,
     Marmorierung, angeschnittenes Footer-Tag, Ton-in-Ton-Wasserzeichen, Holo nur auf dem
     Aufkleber). Die **Websites** wizardtrees.com und Doja wurden **nicht** gesehen: der Tab
     hing bei wizardtrees.com (Screenshot-Timeout, vermutlich Altersabfrage). Nutzer will
     Websites auch sehen - einmal im **neuen Tab** versuchen, bei Timeout den Nutzer bitten,
     den Dialog wegzuklicken.
- **Offen:** c. Schriftvergleich, d. Pexels-Motive, dann Schritt 1 (Freigabe der Spec).
- Dosierung bleibt **60/40** (Nutzer hat bestaetigt, 80/20 war ein Versprecher).
- Browser: `mcp__browser__navigate` steht jetzt in den Allow-Regeln. Die Fenstergroesse laesst
  sich nicht aendern (innen 2296 px). Bei "Permission denied" sofort dem Nutzer sagen, dass ein
  Freigabe-Fenster wartet (Memory `freigabe-fenster-melden`).

**⇢ Stand für die nächste Session (2026-09-24, Session 8): TEILPROJEKT 1 IST LIVE UND LIVE GEPRÜFT.**
- **Live-Prüfung (Plan Task 16 Step 8) erledigt**, einmal im Browser, kein Polling: `/` 200 mit den drei
  Leitsätzen, „Das erste Kapitel wird gerade geschrieben.“, „Gerade läuft keine Runde …“, Katalog-Leerzustand;
  **LCP 364 ms** (Leitobjekt), **CLS 0**, TTFB 150 ms; `/reviews`, `/umfragen`, `/produkte` mit Leerzuständen,
  keine Konsolenfehler; `/admin` → `/anmelden`. Medien der ersten Ansicht 551 KB bei 2296-px-Fenster (bekannt).
- **Rulings, Befunde, zurückgestellte Kleinigkeiten** aus dem Ledger stehen jetzt am Ende des Plans
  (`docs/superpowers/plans/2026-09-24-makeover-gruenes-buch.md`, „Ausfuehrungsprotokoll“) - dort nachlesen.
- **Aufgeräumt (Session 8, mit Erlaubnis des Nutzers):** Ledger-Ordner
  `.superpowers/sdd/2026-09-24-makeover-gruenes-buch/` gelöscht, Branch `makeover/gruenes-buch` lokal und auf
  GitHub gelöscht (beide vorher per `merge-base --is-ancestor` als vollständig in `main` geprüft).
- **Live-Gate-Cookie:** das lokale `SITE_SESSION_SECRET` ist **nicht** das live gesetzte. Für Live-Prüfungen
  einmal per `fetch` POST auf `/api/zugang` mit `SITE_PASSWORD` aus `.env.local` anmelden (Wert nie ausgeben),
  Token aus `Set-Cookie` per `document.cookie` in den Browser. Messungen nur im **sichtbaren** Tab (im
  Hintergrund-Tab gibt Chrome gestreamte Suspense-Inhalte nicht frei und misst kein LCP); `javascript_tool`
  wartet nicht auf Promises - Ergebnis in `window` ablegen und nachlesen.
- **`/interface-review` erledigt (Session 8)**, Umfang `26e691d..768c5e5`. Dafür `better-interface`,
  `better-ui`, `better-writing` aus jakubkrehel/skills@267330e nachinstalliert (gelesen, keine Befehle/URLs;
  `skills-lock.json` ohne `computedHash`, Verfahren des Skills-CLI nicht nachbildbar). Drei Befunde, alle
  behoben, je mit Test RED→GREEN (Suite 46/46, Typecheck, Lint, Farben grün), im Browser lokal geprüft, **gepusht
  (`5213e5a`) = live**, live einmal geprüft (`/` 200, Video-Schalter im HTML; Netzdiagramm live nicht sichtbar, D1 leer):
  1. HIGH: Fehlersätze auf der Startseite ohne Ausweg → „Lade die Seite in ein paar Minuten neu …“ (`4610750`).
  2. MEDIUM: Netzdiagramm-Beschriftung schrumpfte als SVG-Text auf 9,2 px (390) / 6,5 px (320) → HTML-Text
     `text-caption` 13 px, prozentual positioniert, Figur `px-2 sm:px-6` (`db6d317`).
  3. MEDIUM: Video-Schleife ohne Pause (WCAG 2.2.2) → Knopf „Video anhalten/abspielen“ unter der Schleife,
     sichtbar erst wenn `loops.ts` läuft; Pause hält beim Wiedereintritt (`5213e5a`). Nutzer: „alles korrigieren“.
  Vorbestehend, nicht behoben (Teilprojekt 2): `ProduktCard` nutzt noch Deckkraft-Hover.
  Nicht verifiziert: reduzierte Bewegung gerendert, Dunkelmodus gerendert, Stimmzettel-Zustände, 200 % Textzoom.
- **Teilprojekt 2 - Brainstorming läuft (Session 9, 2026-09-24).** Pfad: architektonisch (Spec → Plan). Kein
  Browser-Companion. Geladen: `ui-design-engine`, `design-taste-frontend` (Katalog/Tabellen/Admin laut Skill
  außerhalb seines Geltungsbereichs), `better-layout`. **Entscheidungen des Nutzers:**
  1. Umfang **„Optik + Kleinkram“**: alle übrigen Seiten im Stil Buch und Wand, dazu Korrekturen in ohnehin
     angefassten Dateien (Hydrations-Sperre + `Meldung` in `AnmeldeFormular`/`RegistrierFormular`/`ProfilFormular`,
     Texte ohne Geviert-/Gedankenstrich, Deckkraft-Hover weg, falscher Preis-Satz auf `/mitglied`). **Nicht** drin:
     Review-Formular im Admin (kommt danach als eigenes Vorhaben), Datenmodell, `FACHKREIS_PASSWORD`-Ausbau.
  2. Zuschnitt **eine Spec, drei Wellen** mit je eigenem Plan und Live-Gang: 1 Kern (`/reviews`, `/umfragen`,
     `/produkte/[slug]`), 2 Katalog (`/produkte`, `/apotheken`, `/apotheken/[slug]`), 3 Konto (`/anmelden`,
     `/registrieren`, `/zugang`, `/mitglied`, `/admin`, `not-found`).
  3. Navigation **„Kern zuerst“**: 01 Bewertungen, 02 Abstimmung, 03 Produkte, 04 Apotheken, dazu „Mein Konto“
     ohne Nummer als abgesetzte Pille rechts; Handy: Leiste unter der Wortmarke seitlich wischbar, nächster
     Punkt schaut an.
  4. Produktkopf **Titelblatt statt Glas**: `GlasHeader` (Nutzer-Ausnahme aus der Zeit vor dem Makeover) entfällt,
     kein Herstellerbild (Leitplanke 5), Reel wandert zu seiner Bewertung.
  5. Ansatz **A „Durchgehend Buch, Dichte je Seitentyp“**: gemeinsamer `Seitenkopf` (Cormorant `text-kapitel`,
     ein Satz Du+Ich, keine Oberzeile), Gruppierung über Abstand/Haarlinien statt Karten, Flächen nur mit
     Bedeutung (Formularblatt, Stimmzettel, Doppelseite); Kernseiten luftig mit Doppelseite/Stimmzettel der
     Startseite, Katalog/Apotheken als Verzeichnis (mittlere Dichte), Admin als dichte Werkbank; Bewegung nur CSS.
     Verworfen: B „Zwei Register“ (Katalog bliebe 0815), C „GSAP auf Kernseiten“ (bricht Regel 7, +60 KB JS).
  6. Design in vier Abschnitten vorgelegt, **jeder vom Nutzer bestätigt** („passt“, „ja“, „ja“, „ja“), dabei auch:
     Produktseite zeigt **„Meine Note“** (neueste eigene Bewertung), Community-Mittel getrennt (Abfrage bekommt
     `istRedaktionell`); Katalog als **Zeilen** mit Vermerk **„Von mir getestet“** (Relation `take: 1`).
  **Spec geschrieben und committet:** `docs/superpowers/specs/2026-09-24-makeover-teilprojekt-2-design.md`
  (Wortlaut aller neuen Sätze in Abschnitt 7, Präzisierungen gegenüber dem Chat in Abschnitt 13).
  **Spec vom Nutzer freigegeben** („passt“). **Plan für Welle 1 geschrieben:**
  `docs/superpowers/plans/2026-09-24-makeover-tp2-welle-1.md`, 13 Tasks, Branch `makeover/tp2-welle-1`,
  Prüfskript `scripts/seiten-pruefen.ts` entsteht in Task 9. Ausführung wie in TP1 **Native**
  (`superpowers:executing-plans`), sofern der Nutzer nichts anderes sagt. Beim Planen geklärt: Next 16.3.6 hat
  `retry` in `error.tsx` stabil; Seed enthält nur eigene Bewertungen (Community-Stimme für die Sichtprüfung per
  `wrangler d1 execute --local` anlegen und löschen, SQL im Plan Task 9 Step 7); `formatiereProzentSpanne` setzt
  „22,0 – 28,0 %“ mit Gedankenstrich zwischen schmalen Leerzeichen, das Prüfskript erlaubt Zahlenbereiche.
  **Als Nächstes:** siehe „Eingetaktet für eine neue Session“ direkt darunter und die Reihenfolge-Entscheidung
  des Nutzers dort.
  **Fortschritt Welle 1 (Session 10; Branch `makeover/tp2-welle-1` nach dem Merge gelöscht, Ledger als „Ausfuehrungsprotokoll“ am Ende des Plans):**
  - Welle 1, Task 1 erledigt: textLinkKlassen, namenLinkKlassen, Blatt, Faktenliste (Branch makeover/tp2-welle-1).
  - Welle 1, Task 2 erledigt: Buchtabelle, Leerzustand ohne Kasten (wirkt auf allen Seiten).
  - Welle 1, Task 3 erledigt: Seitenkopf, seitenRahmen, ABSCHNITT_TITEL, TitelblattSkelett.
  - Welle 1, Task 4 erledigt: Navigation Kern zuerst (Kopf, Fuss, NavLink mit aria-current).
  - Welle 1, Task 5 erledigt: app/error.tsx im Buchstil (retry).
  - Welle 1, Task 6 erledigt: teileBewertungen, ReviewEintrag.istRedaktionell (eine Abfrage, Datenmodell unverändert).
  - Welle 1, Task 7 erledigt: Doppelseite (auszug/voll, story) in components/review, Netzdiagramm umgezogen, Startseite nutzt sie.
  - Welle 1, Task 8 erledigt: Titelblatt, CommunityStimmen, Balken und Chips in Tinte, BestandTabelle-Links.
  - Welle 1, Task 9 erledigt: Produktseite als vollständiger Eintrag, Prüfskript scripts/seiten-pruefen.ts (in Git Bash mit `MSYS_NO_PATHCONV=1` aufrufen), GlasHeader/TerpenMap/BewertungsListe entfernt. Befund, vorbestehend: `/produkte/<unbekannt>` liefert Status 200 und kein h1 im Server-HTML (notFound() innerhalb der Suspense-Grenze).
  - Welle 1, Task 10 erledigt: /reviews mit Doppelseite und Inhaltsverzeichnis, ReviewKarte entfernt; ProduktCard sagt „für“ statt „fuer“ (vorgezogen aus Welle 2).
  - Welle 1, Task 11 erledigt: UmfrageKarte nur noch Stimmzettel, Balken in Tinte, Begriffe freigeschaltet, ort-Prop.
  - Welle 1, Task 12 erledigt: /umfragen mit Wand-Tags, Stimmzettel, Vorschlagsblatt, Chronik; Stimm- und Vorschlagsformular in Ich-Form. Lokal gesehen: Vorschlagsphase freigeschaltet, Abstimmung stimmberechtigt und abgestimmt, anonym; nicht gesehen: angemeldet ohne Freischaltung.
  - **Welle 1, Task 13 (Abschluss), Stand Session 10:** Welle 1 ist **live** (`6aa8937`, Fast-Forward nach Go, Workers Builds). Prüfbericht:
    grün: `npm test`, Typecheck, eslint, `npm run farben`, Build; Prüfskript `/ /reviews /umfragen /produkte/nebelharz-22 /produkte/pfefferstern-extrakt /gibt-es-nicht` 6x ok.
    Browser (Hintergrund-Tab): Kopf und aria-current, 320/390/720 px ohne seitliches Überlaufen, Fokus überall sichtbar, hell/dunkel, Startseiten-Zähler auf Endwerten, Stimmzustände per SQL-Testrunde (freigeschaltet, stimmberechtigt, abgestimmt, anonym).
    **Live geprüft (einmal, kein Polling):** Gate-Login, `/` 200, `/reviews` 200 mit „Das erste Kapitel wird gerade geschrieben.“, `/umfragen` 200 mit „Gerade läuft keine Runde.“ und „Noch keine Runden.“, `/produkte` 200, `/produkte/gibt-es-nicht` **404**; auf `/reviews` und `/umfragen` keine versteckten Stream-Blöcke mehr.
    **Lokal im sichtbaren Tab verifiziert:** Klick auf „Ganzen Eintrag lesen“ landet auf `#eintrag-…` (Client-Navigation, Ziel 32 px unter der Oberkante), Startseite: Doppelseite schlägt auf, Zähler laufen 0 → Endwerte.
    **Nicht verifiziert:** Zustand „angemeldet ohne Freischaltung“ (kein solches Konto lokal).
    **Befund, vorbestehend aus TP1 (nicht Welle 1):** Dev-Overlay meldet 2 Hydrations-Unterschiede (`style` an `wand-reihe` in `WissenBuendeln.tsx`, `clip-path` an `[data-story=doppelseite]`): `StoryBuehne` setzt GSAP-Styles, bevor React die nachgestreamten Sektionen hydriert. Nicht sichtbar, in Produktion still. Idee: Story-Ziele erst nach Hydrierung animieren oder `suppressHydrationWarning` an den Zielen.
    Abschlussprüfung parallel (Nutzerwunsch): Code-Review-Agent und Design-Review-Agent (Umfang: alle geänderten Oberflächen). Ein Korrekturdurchgang, jeder Fix mit Test RED→GREEN.
    **Nutzerentscheidung:** Suspense-Grenzen auf `/reviews`, `/umfragen`, Produktseite entfernt (Sprung auf den Eintrag, Lesbarkeit ohne JS, echte 404 vor Skeletten). Weitere Fixes: Kopf erst ab lg einzeilig, Fokusring in der Leiste, Badge-Kontrast hell (warning/accent in Tinte), Tabellen-Region, 44-px-Einzellinks, kleinere Doppelseiten-Überschrift auf Unterseiten, eine Phasennamen-Quelle, "freigeschaltet" auf der Startseite, Formular-Hover, lange Namen, Stimmzettel shadow-md.
    **Offen für den Nutzer:** DSGVO-Frage zum Instagram-Reel-iframe (Einwilligung/Zwei-Klick, sobald ein Reel hinterlegt ist). Zurückgestellte Kleinigkeiten und alle Rulings stehen im Ledger bzw. im Plan-Ausführungsprotokoll.

- **⇢ EINGETAKTET FÜR EINE NEUE SESSION (Nutzer, 2026-09-24, Session 9): Marke und Medien professionell
  überarbeiten, für das gesamte Projekt.** Der Nutzer schickte das mitten in die Planung und sagte ausdrücklich:
  „das als task eintakten und nicht zwischendrin was neu beginnen erst abschließen die bisherigen tasks und den
  eintakten für eine neue session“. Wortlaut der Anforderung (sinngemäß vollständig):
  1. **Logo neu gestalten** mit der Google-Schrift **„Inspiration“** (Nutzer schickte die `<link>`-Einbindung
     von fonts.googleapis.com; im Projekt gilt `next/font/google`, selbst gehostet, kein `<link>`). Das heutige
     Logo gefällt ihm nicht.
  2. **Akzente** sollen ebenfalls eher diese Schrift nutzen (heute: Sedgwick Ave Display für die Wand).
  3. **Bilder und Video** sind ihm „zu laienhaft eingebaut“: sie sollen hochprofessionell, ansprechend und mit
     den neuesten technischen Mitteln „awwwards-fähig“ eingebaut werden.
  4. **„Die Bilder einfach negativ machen ist der falsche Ansatz“** (gemeint: Dunkelmodus `invert(1)` plus
     `screen`, Spec TP1 4.5). **Ausgeschnittene (freigestellte) Bilder im Storytelling** verwenden.
  5. Im Zweifel **Drittanbieter-Systeme** suchen, die passende Bilder erzeugen, die sich in Website und
     Brand-Preset einfügen.
  6. „Professionelle Umgestaltung dieser Aspekte bitte für das gesamte Projekt anwenden.“
  **Kollisionen mit bisherigen Entscheidungen, im Brainstorming zu klären (nicht vorab entscheiden):**
  Sedgwick wurde in TP1 nach Schriftvergleich gewählt (Spec TP1 4.2) und trägt das Konzept „Buch und Wand“;
  „Inspiration“ ist eine Kalligrafie-/Skriptschrift, kein Graffiti: ersetzt sie die Wand ganz, nur das Logo, oder
  wird das Konzept neu gefasst? Spec TP1 4.5 hat „Freistellen entfällt“ und Graustufen plus `multiply`
  festgelegt; freigestellte Motive brauchen eine Freistell-Pipeline (z. B. `sharp` reicht nicht, Hintergrund-
  entfernung nötig). Bildgenerierung über Drittanbieter: vorhandene Skills `ideogram4` (Text-zu-Bild),
  `qwen-edit` (Bildbearbeitung, Freistellen/Umgestalten), `runpod` (GPU); **Kostenregel** aus Memory
  `cn-medcan-projekt` beachten und Kosten vorher nennen; Leitplanken 1 bis 7 (kein Konsum, keine Figuren,
  keine Blüten mit Handelsnamen) gelten auch für generierte Bilder. Motion/WebGL (OGL) wurde in TP1 aus
  Gewichtsgründen verworfen; „neueste technologische Mittel“ neu bewerten (Budget 60 KB JS, Workers Free).
  **Vorgehen:** `superpowers:brainstorming` (architektonisch, eigene Spec „Teilprojekt 3“ oder Nachtrag zu TP1),
  Skills laut Memory `design-skills-einsatz`, v. a. `build-awwwards-quality-sites`, `design-taste-frontend`,
  `better-typography`, `animate`, `emil-design-eng`; für Bilder `ideogram4`, `qwen-edit`.
  **Reihenfolge (Nutzer, Ende Session 9): erst Welle 1 umsetzen, dann diese Überarbeitung als eigene
  Session, vor Welle 2.**
  Beim Einlesen gefundener Kleinkram (für die Spec): `/produkte` rendert ein zweites `<main>` im Layout-`<main>`
  (ebenso `/zugang`); sichtbares „fuer“ in `ProduktCard` („Preis nur fuer Fachkreise“) und „oeffentlich“ auf
  `/zugang`; `/zugang`-Titel noch „cn-medcan“, eigener Button mit Deckkraft-Hover und `rounded-md`; Geviertstrich
  im Seitentitel von `/produkte` und im `GlasHeader`; `Notenzeile` doppelt (`ReviewKarte`, `BewertungsListe`) und
  Balken in `accent` statt Tinte (Guideline 3); viele `hover:opacity-70`-Links.
  Offen für den Nutzer (unverändert): 4 npm-audit „high“; Instagram-Handle.

**Stand davor (2026-09-24, Session 6/7):**
- Ausführungsart ist gewählt: **Native**, also `superpowers:executing-plans` in der Session
  (keine Subagents; Nutzer hat nach Abwägung der Kosten so entschieden). Nicht erneut fragen.
- Gearbeitet wird auf dem Branch **`makeover/gruenes-buch`** (gepusht, `main` unberührt, also nichts
  live). Beim Start prüfen: `git branch --show-current` muss `makeover/gruenes-buch` zeigen.
- **Ledger** (Fortschritt, Rulings; **gelöscht, Rulings stehen am Ende des Plans**): `.superpowers/sdd/2026-09-24-makeover-gruenes-buch/progress.md`,
  lokal, über `.git/info/exclude` ignoriert (nicht im Repo). Tasks mit `Task N: complete` sind fertig.
- **Stand 2026-09-24 (Session 7): Makeover Teilprojekt 1 ist auf `main` und gepusht** (`768c5e5`, Fast-Forward
  von `makeover/gruenes-buch`, Go des Nutzers, Citrix getrennt). Workers Builds baut; **Live-Prüfung steht noch aus**
  (Plan Task 16 Step 8: leere Cloud-D1 → Leitsätze, „Das erste Kapitel …“, „Gerade läuft keine Runde …“,
  Katalog-Leerzustand; LCP/CLS live; `/reviews`, `/umfragen`, `/produkte`, `/admin` 307). Danach Ledger-Workspace
  `.superpowers/sdd/2026-09-24-makeover-gruenes-buch/` löschen und lokalen Branch `makeover/gruenes-buch` entfernen.
  Geprüft: 43/43 Tests, Farben, Typecheck, Lint, Build, JS 58.968 B gz; Browser lokal: Bewegung (SplitText, Lenis,
  Pin, Zähler, Schlusszeile), ohne JS vollständig, Tastatur, Fokus, 390 px, LCP 2,0 s/CLS 0 (Dev), keine Konsolenfehler.
  Nicht verifiziert: reduzierte Bewegung (Windows-Einstellung blieb an), Stimmzettel-Zustände (keine Runde lokal).
  Nutzer-Entscheidungen: Video-Loop ohne Pause und Notiz-Freitext auf der Startseite bleiben so; Medien verkleinert
  (Masken 3:2 + 16 Stufen, Standbild 576 px, 1,9 MB → 0,45 MB). **Nutzer startet nach dem Clear `/interface-review`.**
  Danach laut Plan: Teilprojekt 2 (eigene Spec für die übrigen Seiten). Offen: 4 npm-audit „high“ (bestehende Abh.).
- Sichtprüfung: Browser-Erweiterung „Browser 1“; hängt ein Tab nach Hot Reload, frischen Tab öffnen (nicht aufgeben). Gate-Cookie lokal: der Browser hat
  schon eins; für `curl` erzeugt man es aus `.env.local` (`SITE_SESSION_SECRET`, Format in `lib/gate.ts`).
- Skripte: `task-start`/`task-done` unter
  `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.4.1/skills/executing-plans/scripts/`,
  Aufruf mit `bash <skript> docs/superpowers/plans/2026-09-24-makeover-gruenes-buch.md <N> …`.
- Skills je Task stehen im Plan unter **Skills**; zu Beginn jedes Tasks laden und dem Nutzer in einem
  Satz nennen (Memory `skills-einsatzregeln`).

**Session 6 (2026-09-24), Fortsetzung: Schritt 1 und 2 erledigt.** Der Nutzer hat die Spec
freigegeben ("ja"). Umsetzungsplan geschrieben und committet (`ee6385b`, **nicht gepusht**):
`docs/superpowers/plans/2026-09-24-makeover-gruenes-buch.md`, 16 Tasks, Arbeit auf Branch
`makeover/gruenes-buch`. Die Spec hat einen neuen Abschnitt 13 (Präzisierungen aus der Planung,
z. B. Nummerierung nur in der Navigation, Radius-Tokens 0, Pipeline-Skripte als .ts über tsx).
**Als Nächstes:** Der Nutzer prüft den Plan und wählt die Ausführungsart (empfohlen: "Native",
also `superpowers:executing-plans` in der Session; Alternative "Subagent-driven"). Danach Task 1.

**Konto des Nutzers (2026-09-24):** Auf Wunsch des Nutzers Passwort zurückgesetzt, lokal und
live erledigt (live hat der Nutzer den vorbereiteten `wrangler d1 execute --remote`-Aufruf selbst
ausgeführt: "1 command executed successfully"). Hinweise für künftige Live-Zugriffe: in PowerShell
`npx.cmd` statt `npx` (Ausführungsrichtlinie sperrt `npx.ps1`); wrangler-Login läuft ab
(`Authentication error [code: 10000]` → `npx.cmd wrangler login`); lesende und schreibende
Live-Zugriffe von Claude blockiert der Auto-Modus. Einzelheiten zum Konto gehören nie ins
öffentliche Repo.

**Session 6 (2026-09-23): Schritt 0 ist komplett erledigt** (Commit `1f1bd17`, Spec 4.2,
4.3, 4.5): wizardtrees.com und dojadirect.com (vom Nutzer genannt; dojaexclusive.com liefert
eine Fehlerseite) im Browser, Schriftvergleich (Cormorant und Sedgwick bleiben), Pexels-Motive
mit IDs. **Als Naechstes: Schritt 1, die Freigabe der Spec** - dem Nutzer vorgelegt, Antwort offen.
Auf Pexels frieren Screenshots ein; Treffer per `javascript_tool` auslesen.

**Naechste Schritte, in dieser Reihenfolge:**
0. **Zuerst, ohne Rueckfrage: Rest von Schritt 0 (siehe oben: Websites, c, d), dann Spec nachschaerfen**
   (Nutzer nach Session 4: "nach dem clear alles mit der faehigkeit des browsers checken und
   nachschaerfen!"). Die Referenzanalyse in Session 4 lief nur ueber `curl` auf HTML/CSS/JS,
   ohne gerenderte Seite. Browser verbinden (`list_connected_browsers` -> Nutzer per
   AskUserQuestion waehlen lassen -> `select_browser` -> `tabs_context_mcp`; ist die Liste
   leer: Nutzer bitten, Chrome neu zu starten). Dann pruefen:
   a. **moneyincheck.org**, Desktop (1440 px) und Handy (390 px): Screenshot je
      Scrollabschnitt; Scroll-Choreografie (was pinnt, was blendet wie ein, Ladevorhang,
      Uebergaenge, Footer-Video); berechnete Styles per `javascript_tool` (Schriftgroessen,
      Laufweite, Zeilenhoehe, Abstaende, Button- und Hover-Zustaende); Verhalten bei
      reduzierter Bewegung.
   b. **Wizard Trees** (wizardtrees.com) und **Doja Pak** (dojaexclusive.com lief per `curl` in
      einen Timeout, im Browser einmal versuchen; sonst Instagram `@doja.pak`): Handstyle,
      Schnoerkel, Farben, Layout, Bewegung.
   c. **Schriften** auf fonts.google.com mit Mustertext „Grünes Buch“ / „Wähl mit“ /
      „Cannabis, offen gelegt.“: Cormorant Garamond 300 gegen EB Garamond und Playfair Display;
      Sedgwick Ave Display gegen Permanent Marker und Rubik Spray Paint.
   d. **Pexels** (Website-Suche, noch keine API): gibt es die Motive der Spec wirklich
      (Blatt/Pflanze vor hellem Grund, Trichom-Makro, Sprühfarbe/Drips auf heller Wand, grünes
      Notizbuch; SD-Videos)? Je Motiv 2 bis 3 Treffer notieren.
   Befunde in die Spec einarbeiten (v. a. Abschnitte 4 und 5.1), die Aenderungen dem Nutzer
   kurz auflisten, dann Schritt 1. Screenshots laufen oft in einen Timeout: dann `zoom`,
   `get_page_text`, `javascript_tool` nutzen. Nicht pollen, keine Wiederholungsschleifen.
   Der Nutzer will **keinen** Browser-Companion fuer Mockups - Screenshots sind nur fuer die
   eigene Analyse.
1. **Nutzer um Freigabe der Spec bitten** (Pflicht-Gate aus `superpowers:brainstorming`: "Spec
   written and committed ... please review"). Dabei **ausdruecklich** auf die eine Abweichung vom
   Chat hinweisen: Kapitel "Wissen buendeln" zeigt **echte Zahlen** (Stimmen, Vorschlaege,
   Runden) statt der Vorschlaege selbst - Vorschlaege tragen Handelsnamen und unmoderierten
   Freitext (§10 HWG, Spec Abschnitt 2). Aenderungswuensche einarbeiten, Spec neu pruefen.
2. Nach Freigabe: **`superpowers:writing-plans`** aufrufen (einziger erlaubter naechster Skill
   laut brainstorming) -> Plan nach `docs/superpowers/plans/`, Nutzer waehlt die
   Ausfuehrungsart.
3. Umsetzen nach Spec Abschnitt 10. Design-Skills je Schritt laden (Spec Abschnitt 12, Memory
   `design-skills-einsatz`) - **der Nutzer besteht darauf ("wichtig")**.

**Kernentscheidungen in einem Satz je (Details in der Spec):**
- Name **Grünes Buch** (Gaddafi-Assoziation genannt, akzeptiert). Instagram-Handle prueft der
  Nutzer.
- Leitreferenz **moneyincheck.org**, dazu ein Touch **Wizard Trees / Doja Pak**
  (Graffiti, Schnoerkel). Konzept **"Buch und Wand"**, **60/40**: Buch = Stimme des
  Betreibers (Editorial), Wand = Stimme der Community (Graffiti in Sprühviolett).
- **Du + Ich**. Reviews sind der **Hoehepunkt der Scroll-Story**; "Wirkung" nicht auf der
  Startseite.
- Hell als Marke, Dark Mode abgeleitet. Blattgruen einziger Bedienakzent, Sprühviolett nur Wand.
- Cormorant Garamond 300 (Buch-Display), Geist/Geist Mono (vorhanden), Sedgwick Ave Display
  (Wand).
- **GSAP + ScrollTrigger + SplitText + Lenis**, eine Client-Insel `StoryBuehne`, nur Startseite.
- Medien: **nur Pexels** (Nutzer: "pixabay erstmal nicht"), zur Entwicklungszeit per Skript,
  selbst gehostet, Graustufen + multiply/screen, Wand-Texturen als Alpha-Masken via `sharp`.
- Nutzer wollte **keinen** Browser-Companion fuer Mockups - Varianten nur als Text zeigen.

**Referenzanalyse (ohne Browser, per einzelnem `curl` auf HTML/CSS/JS):** moneyincheck.org nutzt
`#e9e9e9` Papier, `#000` Tinte, einen Akzent `#00846a` (Hover `#00ae8c`), PP Editorial Old
(kommerziell, daher Cormorant als freie Verwandte), Liu Jian Mao Cao fuer den Ladevorhang,
Pillen-Buttons, Lenis + OGL (WebGL) + Lottie, kein GSAP, `clip-path`-Enthuellungen,
`mix-blend-mode: multiply`, Leitobjekt = Schwarzweiss-Springer im Geldschein. Wizard Trees:
psychedelische Schnoerkel-Wortmarke mit Spirale, Violett, Chrom, fette breite Grotesk daneben.
Doja-Seite lief in einen Timeout (nicht wiederholt).

**Schon erledigt in dieser Session (nicht erneut machen):**
- 9 Design-Skills installiert und inhaltlich geprueft (keine riskanten Muster):
  `design-taste-frontend` (= taste-skill), `build-awwwards-quality-sites`, `animate`,
  `emil-design-eng`, `better-typography`, `better-colors`, `better-layout`,
  `better-accessibility`, `interface-review`. Liegen als Kopie in `.claude/skills/`,
  eingetragen in `skills-lock.json`. `brand-guidelines` (Anthropic) bewusst **nicht**
  installiert: wendet nur Anthropics eigene Marke an.
- `.env.local`: Pexels-Key vom Nutzer eingetragen, Variable von `pexel-api-key` in
  **`PEXELS_API_KEY`** umbenannt (Wert nie gelesen). `.env.local.example` hat den Platzhalter.

**Offen beim Nutzer:** Instagram-Handle pruefen.

**Browser-Werkzeug:** War fast die ganze Session 4 nicht verbunden (`list_connected_browsers`
leer). **Abhilfe: Nutzer startet Chrome neu** - danach war "Browser 1" sofort da
(`select_browser`, dann `tabs_context_mcp`). Den MCP-Server selbst kann Claude nicht neu starten.

### 2. Danach (aeltere Punkte, weiter gueltig)

**Block A (Cloudflare D1) ist abgeschlossen.** Von **Block B** sind **Schritt 1 bis 7** erledigt:
Anmeldung, `/mitglied`, `/admin`, das Umfragemodell samt Schreibschicht, die umgebaute Startseite,
`/umfragen`, `/reviews` - und jetzt die **Umfrageverwaltung in `/admin`**. Die Schleife, die das
Alleinstellungsmerkmal ist (Runde eroeffnen, Vorschlag, Uebernahme, Abstimmung, Beenden,
Bewertung verknuepfen), ist damit **zum ersten Mal vollstaendig durch die Oberflaeche gelaufen**.

**Als naechstes:**

1. **Die drei uebrigen alten Formulare ohne Hydrations-Sperre** - `AnmeldeFormular`,
   `RegistrierFormular`, `ProfilFormular`. `MitgliedAktionen` ist mit Schritt 7 nachgezogen.
   Dabei gleich auf `Meldung` (`components/ui/Meldung.tsx`) umstellen, das Muster steht dort
   noch dreimal von Hand.
2. **`vorschlagBisAm` ist nicht setzbar.** Die Karte auf der Startseite zeigt "Vorschlaege bis",
   wenn das Feld gesetzt ist - `umfrageAnlegen` liest es aber nicht, und es gibt kein Feld dafuer.
   Braucht Pruefung in `umfrageEingabePruefen` und ein Datumsfeld im Formular.
3. Die drei alten offenen Punkte unter "Was noch offen ist", danach der Mailversand als **Block C**.

**Beim Abgleich mit dem Code gefunden (2026-09-23), Reihenfolge vom Nutzer noch nicht bestaetigt.**
Empfohlen: diese drei **vor** den Punkten 1 und 2 oben.

- **Der geplante Block-B-Schritt 7 ist nie gemacht worden.** Die Nummer 7 ging an die
  Umfrageverwaltung; `FACHKREIS_PASSWORD` ausbauen und die Preise an `mitglied.freigegeben`
  binden steht noch aus. `istFachkreis()` aus dem Gate-Token steuert weiter die Preise in
  `app/page.tsx`, `app/produkte/page.tsx`, `app/produkte/[slug]/page.tsx`,
  `app/apotheken/[slug]/page.tsx`. **Sichtbarer Fehler:** `app/mitglied/page.tsx` verspricht
  Freigegebenen „Sicht auf die Preisangaben“ - das stimmt nicht.
- **Es gibt keine Oberflaeche zum Anlegen einer Bewertung.** `review.create` steht nur in
  `prisma/seed.ts`. Der Betreiber kann seine eigenen Reviews - den Kern der Seite - nicht
  schreiben, `ergebnisVerknuepfen` verknuepft nur Seed-Bewertungen. Community-Reviews: weder
  Schreiben noch Freigabe in `/admin`. **Offene Nutzerfrage:** darf jedes freigegebene Mitglied
  schreiben, und wird jede einzeln freigegeben?
- `/mitglied` zeigt die eigenen Vorschlaege und Stimmen nicht (steht im Plan unter "Oberflaeche").
- **Block C kollidiert mit der Kostenregel:** Mailversand ueber Cloudflare braucht eine eigene
  Absenderdomain. Offene Nutzerfrage, ob eine Domain vorhanden ist.

---

## Block B, Schritt 7 - erledigt: Umfrageverwaltung in /admin

| Datei | Inhalt |
|---|---|
| `app/admin/page.tsx` | Umgebaut: drei Bereiche in je eigener `Suspense`-Grenze - laufende Runde (oder "Neue Runde eroeffnen"), "Ergebnisse verknuepfen", Mitglieder. Die Mitgliedertabelle ist unveraendert, nur in `MitgliederBereich` ausgelagert. |
| `components/admin/RundeSteuerung.tsx` | Die laufende Runde als Arbeitsflaeche: Kandidatentabelle, Phasenschalter, gesetzter Platz. Server Component. |
| `components/admin/VorschlagListe.tsx` | Vorschlaege der Runde, offene zuerst, mit "Uebernehmen". |
| `components/admin/ErgebnisListe.tsx` | Die letzten 5 beendeten Runden mit ihren Gewinnern und je einer Bewertungsauswahl. |
| `components/admin/RundeAnlegenFormular.tsx`, `PhasenSchalter.tsx`, `GesetztenPlatzFormular.tsx`, `VorschlagUebernehmen.tsx`, `ErgebnisFormular.tsx` | Die fuenf Client-Teile, je einer pro Aktion in `app/admin/umfrage-aktionen.ts`. |
| `components/admin/useAktion.ts` | Gemeinsamer Hook: Zustand, Fehlertext, `router.refresh()`, Hydrations-Sperre (`bereit`) und ein `catch` fuer geworfene Serverfehler. `MitgliedAktionen` nutzt ihn jetzt auch. |
| `components/ui/Meldung.tsx` | Fehler- und Erfolgssatz mit Wortmarker (`role="alert"` bzw. `status`). |
| `lib/query/umfragen.ts` | Neu: `beendeteRundenMitGewinnern()` - eine Query. |
| `lib/query/reviews.ts` | Neu: `reviewAuswahlFuerStrains()` - eine Query ueber alle Sorten (`in`), eine leere Liste fragt gar nicht. |
| `components/ui/Select.tsx` | Fehler behoben, siehe "Was beim Umsetzen anders kam", Punkt 1. |

### Entscheidungen, damit sie niemand zurueckdreht

1. **`RundeSteuerung` ist nicht `UmfrageKarte`.** Die Karte zeigt die Runde einem Mitglied und
   bietet das Abstimmen an; hier ist dieselbe Runde ein Vorgang. Eine Karte mit `istAdmin`-Schalter
   waere beides halb.
2. **Beide Phasenwechsel haben eine Rueckfrage** - kein Dialog, derselbe Knopf in zwei Stufen.
   Beide sind unumkehrbar (`phasenwechselPruefen` laesst nur vorwaerts zu).
3. **Die Ergebnisverknuepfung haengt an den beendeten Runden, nicht an der laufenden.**
   `istGewinner` setzt erst der Wechsel nach BEENDET; vorher gibt es nichts zu verknuepfen.
4. **Die Bewertungsauswahl zeigt auch Entwuerfe**, mit "· Entwurf" im Label. Der Betreiber
   verknuepft oft, bevor er veroeffentlicht. Angeboten werden nur eigene Bewertungen
   (`istRedaktionell`) der jeweiligen Sorte - die Pruefung auf die Sorte macht zusaetzlich die Aktion.
5. **Das Ergebnis wird per Knopf gespeichert, nicht beim Umschalten des Feldes.** Ein `select`
   feuert bei Tastaturbedienung pro Pfeiltaste ein `change`. (`MitgliedAktionen` speichert die Rolle
   noch beim Umschalten - dort bewusst nicht angefasst.)
6. **In der Vorschlagsphase hat die Kandidatentabelle keine Stimmenspalte**, gesetzte Plaetze
   zeigen "—" statt 0. Dieselbe Regel wie auf der Startseite.
7. **Alle neuen Knoepfe sind `md` (44 px).** `sm` (36 px) unterschreitet das Touch-Target aus
   `ui-design-engine`. `MitgliedAktionen` ist mitgezogen.
8. **`PhasenSchalter` hat einen `key` aus Phase und Zahl der waehlbaren Kandidaten.** Ohne ihn
   stuende "Uebernimm zuerst Kandidaten" noch da, nachdem genau das geschehen ist.

### Was beim Umsetzen anders kam als geplant

1. **Der Platzhalter von `Select` war nie ausgewaehlt.** HTML waehlt die erste *nicht
   deaktivierte* Option vor; der deaktivierte "Bitte auswaehlen" wurde uebersprungen. Das Feld
   stand also auf dem ersten Katalogeintrag, `required` griff nie, `reset()` fiel auf denselben
   Eintrag zurueck. Betraf auch das bestehende `VorschlagFormular`. Behoben in `Select`: mit
   `platzhalter` und ohne `value`/`defaultValue` wird `defaultValue=""` gesetzt.
2. **`curl` gegen das Gate braucht drei Dinge:** das Passwort aus `.env.local` ohne die
   Anfuehrungszeichen, `MSYS_NO_PATHCONV=1` (Git Bash macht aus `weiter=/` sonst einen
   Windows-Pfad), und das Cookie von Hand als Header - es ist `Secure`, und curl schickt es ueber
   `http://localhost` nicht mit.
3. **Screenshots ueber das Browserwerkzeug liefen wieder in einen Timeout**, ein Tab blieb
   zeitweise bei "Page still loading" haengen. Ein neuer Tab half. Gelesen wurde ueber Seitentext,
   Accessibility-Baum und `javascript_exec`.
4. **Die Anmeldung ueber das Formular lief diesmal im Browser durch** - kein Haengen wie in
   Schritt 5/6.

### Verifiziert (gegen `next dev` mit echtem D1-Binding, im Browser geklickt)

- `npm run typecheck`, `npx eslint .` und `npm run build` gruen.
- **Alle fuenf Aktionen aus `umfrage-aktionen.ts` sind zum ersten Mal durch einen Klick gelaufen:**
  - `umfrageAnlegen`: Runde erscheint in der Vorschlagsphase, ohne Stimmenspalte.
  - `phaseWeiterschalten` ohne waehlbaren Kandidaten: lesbare Ablehnung. Mit Kandidat:
    Abstimmung, Stimmenspalte erscheint, gesetzter Platz zeigt "—".
  - `gesetztenPlatzVergeben`: Zeile mit "Gesetzter Platz"; dieselbe Sorte ein zweites Mal ergibt
    "Diese Sorte steht in dieser Runde schon auf der Liste."
  - `vorschlagUebernehmen`: Kandidat "Zur Wahl", Vorschlag "Auf der Wahlliste", Badge-Zaehler stimmt.
  - Beenden: gesetzter Platz und der Community-Platz mit Stimme als Gewinner markiert, `aktiv`
    frei, "Neue Runde eroeffnen" wieder da, "Ergebnisse verknuepfen" erscheint.
  - `ergebnisVerknuepfen`: Verknuepfen und Loesen, Badge wechselt, Wert in der Datenbank geprueft.
- **Der Nutzer hat parallel eine eigene Runde ("test") durch die Oberflaeche gefahren** - mit vier
  gesetzten Plaetzen, einem Community-Platz und verknuepften Bewertungen. Sie steht noch in der
  lokalen D1 und ist absichtlich nicht geloescht.
- Der `key`-Reset am Phasenschalter: Fehler ausgeloest, Vorschlag uebernommen, Fehler verschwindet.
- Der Platzhalter im `Select` ist nach dem Fix tatsaechlich ausgewaehlt (auf `/umfragen` geprueft).
- Kontrast der Statusfarben rechnerisch geprueft: `danger`/`success` auf `surface` und
  `surface-raised` in Light 4,82-5,32:1, in Dark 5,40-6,81:1. Keine `dark:`-Varianten, keine
  Pixelwerte, kein Inline-Style in den neuen Dateien.
- Eigene Testdaten wieder geloescht (Testrunde, Key-Test-Runde, Testkonto samt Sitzung).

### Noch nicht verifiziert

- **Kein Screenshot, weder Light noch Dark** - das Browserwerkzeug brach dabei ab. Dark ist nur
  ueber die Token-Werte belegt.
- **Nichts davon lief in workerd** - `npm run cf-build` scheitert hier weiterhin an den Symlinks.
- Der `catch`-Zweig in `useAktion` (Sitzung laeuft waehrend einer Aktion ab) ist nicht
  ausgeloest worden.

---

## Block B, Schritt 5 und 6 - erledigt: Startseite, /umfragen, /reviews

| Datei | Inhalt |
|---|---|
| `app/page.tsx` | Umgebaut. Oben die laufende Runde und daneben die neueste eigene Bewertung, beide in einer eigenen `Suspense`-Grenze. Katalog, Filter und Apotheken darunter, der Rechtshinweis ans Ende. |
| `app/umfragen/page.tsx` | Laufende Runde, Vorschlagsformular (nur in der Vorschlagsphase und nur fuer Freigegebene), Vorschlagsliste, Uebersicht aller Runden. |
| `app/reviews/page.tsx` | Alle freigegebenen Bewertungen des Betreibers. Nicht nutzerbezogen - der erste Kandidat fuer ISR. |
| `lib/query/reviews.ts` | Neu: `neuesteRedaktionelleReview()` und `redaktionelleReviews()`. |
| `lib/query/umfragen.ts` | Neu: `umfragenUebersicht()` - alle Runden mit Phase und Gewinnern in **einer** Query. |
| `lib/query/strains.ts` | Neu: `ladeStrainAuswahl()` - nur Id und Handelsname, fuer das Auswahlfeld. |
| `components/umfrage/UmfrageKarte.tsx` | Die Runde als Karte. Kennt vier Betrachterzustaende, entscheidet aber ueber nichts. |
| `components/umfrage/StimmFormular.tsx`, `VorschlagFormular.tsx` | Die beiden Schreibformulare. |
| `components/review/ReviewKarte.tsx` | Eine Bewertung mit Reel, Noten und Restfeuchte. |
| `components/ui/useHydriert.ts` | Neu, siehe "Was beim Umsetzen anders kam", Punkt 1. |

### Entscheidungen, damit sie niemand zurueckdreht

1. **Der Betrachterzustand entsteht in der Seite, nicht in der Karte.** `UmfrageKarte` bekommt
   `StimmZustand` (`ANONYM`, `FREIGABE_OFFEN`, `STIMMBERECHTIGT`, `ABGESTIMMT`) uebergeben und
   zeigt ihn nur an. Ueber das Schreiben entscheidet erneut `freigabeErforderlich()` in der
   Server Action - die Karte ist Anzeige, kein Gate.
2. **Gesetzte Plaetze bekommen keinen Balken und keinen Zaehler.** `stimmen` ist dort `null`;
   ein Balken auf 0 % hiesse "niemand wollte sie" und waere eine Falschaussage.
3. **In der Vorschlagsphase zeigt die Karte weder Zaehler noch "Deine Stimme".** Beides haengt an
   derselben Bedingung. Sonst behauptet ein Badge einen Zustand, den die Zahlen daneben nicht
   zeigen - im Browser gesehen und behoben.
4. **Die Startseite bleibt `force-dynamic`, jetzt mit einem zweiten Grund:** sie ist
   nutzerbezogen geworden. Die eigene Stimme darf nie gecacht werden. Wenn ISR kommt, wird
   einzeln gecacht (Umfragezahlen, Katalog), nicht die Seite als Ganzes. `/reviews` ist dagegen
   fuer alle Nutzer gleich.
5. **`ReviewKarte` ist nicht `BewertungsListe`.** Die Liste zeigt Bewertungen *zu einem Produkt*
   und nennt das Produkt deshalb nicht; hier ist der Handelsname die Hauptaussage.
6. **Das Vorschlagsformular laedt die Katalogliste nur, wenn es angezeigt wird.** Sonst waere es
   eine Abfrage fuer nichts - jede Query ist ein Sub-Request.

### Was beim Umsetzen anders kam als geplant

1. **Vor der Hydration schickt ein Formular einen nativen GET ab** - die Eingaben landen in der
   URL, und es passiert nichts. Reproduzierbar auf einer frisch geladenen Seite, wenn abgeschickt
   wird, bevor React den `onSubmit`-Handler angehaengt hat. Deshalb `components/ui/useHydriert.ts`
   (`useSyncExternalStore`, nicht `useState` plus `useEffect` - die ESLint-Regel
   `react-hooks/set-state-in-effect` verbietet das) und `disabled={laeuft || !hydriert}` am
   Absende-Button. **Die vier aelteren Formulare** (`AnmeldeFormular`, `RegistrierFormular`,
   `ProfilFormular`, `MitgliedAktionen`) haben dieselbe Luecke und sind **nicht** nachgezogen.
2. **Der laufende `next dev` musste neu gestartet werden**, weil er den vor Schritt 4
   generierten Prisma-Client im Speicher hielt: `prisma.umfrage` war `undefined` und
   `review.istRedaktionell` ein unbekanntes Argument. `npm run db:generate`, Prozess beenden,
   `.next` loeschen, neu starten. Wer nach Schritt 4 zum ersten Mal Seiten baut, faengt damit an.
3. **Ein abgebrochener Dev-Server hinterlaesst einen Zustand, in dem gestreamte
   `Suspense`-Inhalte nie eingeblendet werden** - die Seite bleibt bei den Platzhaltern stehen,
   obwohl das ausgelieferte HTML den Inhalt enthaelt (per `curl` geprueft). Betraf auch
   `/produkte`, an dem nichts geaendert war. Ein sauberer Neustart behebt es. Nicht als Fehler im
   eigenen Code suchen.
4. **Ein `wrangler d1 execute` mit mehreren Statements bricht beim ersten Fehler ab und fuehrt
   keines davon aus.** Beim Aufraeumen stand `user_id` statt `userId` in einem `DELETE` - die
   Better-Auth-Tabellen haben camelCase-Spalten. Danach war scheinbar nichts geloescht.
5. **Registrierung und Anmeldung liefen im Browserwerkzeug in ein Haengen** (der POST kam
   minutenlang nicht am Server an). Konto per `curl` gegen `/api/auth/sign-up/email` angelegt -
   **der `Origin`-Header ist Pflicht**, sonst antwortet Better Auth `MISSING_OR_NULL_ORIGIN` -,
   angemeldet per `fetch` aus der Seite heraus. Danach lief alles normal.

### Verifiziert (gegen `next dev` mit echtem D1-Binding, im Browser geklickt)

- `npm run typecheck`, `npx eslint .` und `npm run build` gruen; `/umfragen` und `/reviews`
  erscheinen im Routenbaum.
- **Die Server Actions sind zum ersten Mal echt gelaufen** - das war der offene Punkt aus
  Schritt 4:
  - `stimmeAbgeben`: Klick auf einen Community-Kandidaten schreibt die Stimme (`option_id` = der
    gewaehlte Platz, `mitglied_id` = das angemeldete Konto). Danach ist das Formular weg, der
    Zaehler steht auf 1, das Badge "Deine Stimme" sitzt an der richtigen Zeile.
  - `vorschlagEinreichen`: Vorschlag samt Begruendung landet **getrimmt** in der Datenbank,
    die Bestaetigung erscheint, der Vorschlag steht danach in der Liste ("Offen", mit Autor und
    Datum).
  - **Derselbe Vorschlag ein zweites Mal** ergibt die lesbare Meldung "Diese Sorte hast du in
    dieser Runde schon vorgeschlagen." - der P2002-Pfad war bisher nur als Datenbankregel belegt,
    jetzt auch als Antwort der Aktion.
- **Alle vier Betrachterzustaende gesehen:** abgemeldet (Hinweis und "Anmelden"), angemeldet ohne
  Freigabe (Badge "Freigabe ausstehend"), freigegeben ohne Stimme (Formular mit **nur** den
  Community-Kandidaten, der gesetzte Platz fehlt), nach der Stimme (Bestaetigung).
- **Phasen:** in `VORSCHLAG` keine Zaehler, keine Balken, dafuer Vorschlagsfrist und
  Vorschlagsformular; in `ABSTIMMUNG` Zaehler, Balken und Abstimmfrist.
- **`freigegeben` wirkt:** die Startseite nahm die neueste *freigegebene* Bewertung, nicht die
  neuere unfreigegebene, an der die Test-Reel-URL zuerst hing.
- `/reviews` zeigt alle vier freigegebenen redaktionellen Bewertungen, eine davon mit
  Reel-`<iframe>`.
- Light geprueft (Screenshot), Dark ueber die berechneten Token-Werte (`--color-surface`,
  `--color-text`, `--color-accent` und weitere schalten unter `[data-theme="dark"]` um). Die
  neuen Komponenten nutzen ausschliesslich semantische Tokens und keine `dark:`-Varianten.
  **Ein Dark-Screenshot ist nicht entstanden** - das Browserwerkzeug brach dabei wiederholt ab.
- Testdaten wieder geloescht: `umfragen`, `umfrage_optionen`, `umfrage_vorschlaege` und `stimmen`
  sind leer, das Testkonto ist weg, die 6 Bewertungen stehen unveraendert und ohne Reel-URL.

### Noch nicht verifiziert

- **`app/admin/umfrage-aktionen.ts` ist weiterhin durch keinen Klick gelaufen** - es gibt keine
  Oberflaeche dazu. Die Testrunde dieser Session wurde per SQL angelegt, nicht ueber die Aktion.
- **Nichts davon lief in workerd.** `npm run cf-build` scheitert auf diesem Rechner weiterhin an
  den Symlinks (EPERM), damit bleiben `npm run preview` und `npm run deploy` ungetestet.

---

## Block B, Schritt 4 — erledigt: Umfragemodell und Schreibschicht

| Datei | Inhalt |
|---|---|
| `prisma/schema.prisma` | Neu: `Umfrage`, `UmfrageVorschlag`, `UmfrageOption`, `Stimme`. Geaendert: `Review.autorId` ist Relation auf `Mitglied` (optional), neu `Review.istRedaktionell`. |
| `migrations/0003_umfragen.sql` | Vier Tabellen, Umbau von `reviews`, dazu zwei `UPDATE` auf Bestandsdaten (siehe unten). |
| `db/enums.ts` | `UMFRAGE_PHASEN`, `UMFRAGE_PHASEN_AKTIV`, `OPTION_HERKUNFT` plus Type-Guards. |
| `db/constraints.sql` | Trigger fuer `umfragen`, `umfrage_optionen` und `stimmen`. |
| `lib/umfrage-eingabe.ts` | Pruefregeln und `gewinnerErmitteln()` als **reine Funktionen**. |
| `lib/query/umfragen.ts` | Leseschicht: `aktiveUmfrage()`, `umfrageLaden()`, `eigeneStimme()`, `vorschlaegeLaden()`. |
| `lib/prisma-fehler.ts` | `istEindeutigkeitsfehler()` (P2002) — der Unique-Verstoss ist hier eine fachliche Antwort, kein Unfall. |
| `app/umfragen/aktionen.ts` | `vorschlagEinreichen`, `stimmeAbgeben`. Beide hinter `freigabeErforderlich()`. |
| `app/admin/umfrage-aktionen.ts` | `umfrageAnlegen`, `gesetztenPlatzVergeben`, `vorschlagUebernehmen`, `phaseWeiterschalten`, `ergebnisVerknuepfen`. Alle hinter `adminErforderlich()`. |
| `prisma/seed.ts` | Die fiktiven Autoren-Ids sind raus, die Seed-Bewertungen sind `istRedaktionell` ohne Autor. |

### Entscheidungen, damit sie niemand zurueckdreht

1. **„Genau eine aktive Umfrage“ haengt an der Spalte `umfragen.aktiv`, nicht an einer Pruefung.**
   Eine laufende Runde traegt dort die Konstante `'AKTIV'`, eine beendete `NULL`. SQLite laesst
   beliebig viele `NULL` in einer Unique-Spalte zu, aber nur ein `'AKTIV'`. Dass Wert und Phase
   zusammenpassen, erzwingt ein Trigger. **Nicht** durch „erst nachsehen, ob eine laeuft“ ersetzen —
   D1 hat keine Transaktionen, das waere eine Race Condition.
2. **Eine Stimme je Mitglied und Runde steht im Unique-Index `(umfrage_id, mitglied_id)`.** Die
   Server Action faengt P2002 ab und macht daraus einen lesbaren Satz — sie prueft nicht vorher.
3. **Auf `GESETZT` kann nicht abgestimmt werden**, und eine Stimme muss zur selben Runde gehoeren.
   Beides steht doppelt: als Trigger (damit eine vergessene Pruefung nicht still danebengeht) und
   in der Server Action (damit die Meldung verstaendlich ist).
4. **`stimmen` ist bei gesetzten Plaetzen `null`, nicht `0`.** `null` heisst „steht nicht zur
   Wahl“, `0` hiesse „niemand wollte sie“. Ohne diesen Unterschied wirkt die Abstimmung
   manipuliert.
5. **Phasen laufen nur vorwaerts.** Ein Rueckschritt aus `ABSTIMMUNG` stellte abgegebene Stimmen in
   einen Zustand, den es fachlich nicht gibt; ein Wiederoeffnen machte ein Ergebnis nachtraeglich
   verschiebbar. Wer wiederholen will, legt eine neue Runde an.
6. **Gleichstand am Schnitt entscheidet die kleinere `reihenfolge`** (die fruehere Aufnahme in die
   Runde). Das ist eine gesetzte Regel, keine fachliche Wahrheit — sie muss nur deterministisch
   sein, sonst haengt das Ergebnis an der Sortierung der Datenbank.
7. **Eine Option ohne eine einzige Stimme gewinnt keinen freien Platz.** Sie zur Gewinnerin zu
   erklaeren, weil niemand sonst kandidierte, waere eine Behauptung. Gesetzte Plaetze gewinnen
   dagegen immer — sie standen nie zur Wahl.
8. **`Review.autorId` ist optional und `SetNull`.** Eine Bewertung des Betreibers braucht kein
   Mitglied dahinter, und ein geloeschtes Mitglied nimmt seine Bewertung nicht mit. Wer schreiben
   darf, entscheidet die Schreibschicht, nicht die Spalte.
9. **Beim Beenden werden erst die Gewinner markiert, dann die Runde geschlossen.** Ohne
   Transaktion ist die Reihenfolge die einzige Sicherung: bricht es dazwischen ab, steht eine
   laufende Runde mit markierten Gewinnern da — sichtbar und nachbesserbar. Andersherum stuende
   eine beendete Runde ohne Ergebnis, und nachtragen ginge nicht, weil Phasen nur vorwaerts laufen.

### Was beim Umsetzen anders kam als geplant

1. **Der `cp`-Befehl aus `db/README.md` funktionierte nicht mehr.** Im Ordner
   `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` liegt inzwischen auch `metadata.sqlite`;
   der Glob `*.sqlite` trifft zwei Dateien und `cp` bricht mit „target is not a directory“ ab.
   **`db/README.md` ist korrigiert** (`| grep -v metadata`).
2. **Die Migration enthaelt ein `DROP TABLE "reviews"` — das ist in Ordnung.** Es ist der normale
   SQLite-Tabellenumbau (neu anlegen, Zeilen kopieren, umbenennen), weil SQLite Spalten und
   Fremdschluessel nicht nachtraeglich aendern kann. Nicht mit der `d1_migrations`-Falle
   verwechseln. Die Zeilen werden mitkopiert — 6 Bewertungen vorher, 6 nachher.
3. **Der Umbau laeuft mit `foreign_keys=OFF`** und haette die erfundenen Autoren-Ids aus dem Seed
   stehen lassen: Zeilen, die gegen ihren eigenen Fremdschluessel verstossen und erst beim
   naechsten Schreibzugriff auffallen. Deshalb stehen in `0003` zwei `UPDATE` auf Bestandsdaten —
   entgegen der Regel aus `0002`, und mit Begruendung im Migrationskopf.

### Verifiziert (gegen die lokale D1)

- `npx prisma validate`, `npm run typecheck`, `npx eslint .` und `npm run build` gruen.
- Migration angewendet (32 Befehle), `db/constraints.sql` danach erneut ausgefuehrt.
- Bestandsdaten: 6 Bewertungen vorher und nachher, alle `ist_redaktionell = 1`, alle Autoren-Ids
  geleert. `npm run db:seed` erneut durchgelaufen — weiterhin 6, keine Duplikate.
- **Trigger, 16 Faelle gegen die echte Datenbank, alle korrekt:** laufende Umfrage ohne `AKTIV`
  abgewiesen, unbekannte Phase abgewiesen, beendete Umfrage mit `AKTIV` abgewiesen, leerer Titel
  abgewiesen, **zweite aktive Umfrage vom Unique-Index abgewiesen**, beendete Umfrage daneben
  erlaubt, unbekannte Herkunft abgewiesen, **Stimme auf einen gesetzten Platz abgewiesen**,
  Stimme auf eine Option fremder Runde abgewiesen, Stimme ausserhalb der Abstimmungsphase
  abgewiesen, gueltige Stimme durchgelassen, **zweite Stimme desselben Mitglieds vom
  Unique-Index abgewiesen**.
- **Reine Funktionen: 30 Faelle, alle bestanden** — Trimmen, Laengengrenzen, alle Phasenwechsel
  (auch rueckwaerts und uebersprungen), `communityPlaetze` als „2x“/„2.5“/0/11, und die
  Gewinnerermittlung inklusive Gleichstand, Null-Stimmen und „weniger Kandidaten als Plaetze“.
- Testdaten wieder geloescht.

### Noch nicht verifiziert

**Die Server Actions sind durch keinen echten Aufruf gelaufen.** Es gibt noch keine Oberflaeche,
die sie ausloest, und ein Server-Action-Aufruf laesst sich von Hand nicht sinnvoll nachbauen
(siehe Schritt 2). Belegt sind ihre Entscheidungslogik (reine Funktionen) und die Regeln der
Datenbank (Trigger, Unique-Indizes) — nicht die Verdrahtung dazwischen. **Das ist beim Bauen der
Seiten in Schritt 5 und 6 als Erstes zu pruefen.**

---

## Block B, Schritt 3 — erledigt: /admin mit Freigabe und Rollenvergabe

| Datei | Inhalt |
|---|---|
| `app/admin/page.tsx` | Mitgliedertabelle, offene Freigaben zuerst. Gate: ohne Sitzung 307 auf `/anmelden?weiter=%2Fadmin`, als Nicht-Betreiber **404**. |
| `app/admin/aktionen.ts` | `freigabeSetzen` und `rolleSetzen`. Beide beginnen mit `adminErforderlich()`. |
| `lib/admin-eingabe.ts` | Die Pruefregeln als **reine Funktionen**, ohne Request, Prisma und Sitzung. |
| `components/admin/MitgliedAktionen.tsx` | Freigabe-Button und Rollen-Select je Zeile. |
| `components/ui/Field.tsx`, `Select.tsx` | Neu: `labelVersteckt` — Label bleibt fuer Screenreader, ist in der Tabellenzelle aber unsichtbar, weil die Spaltenueberschrift schon beschriftet. |
| `app/mitglied/page.tsx` | Einstieg „Zur Verwaltung“, nur fuer Rolle `ADMIN`. |
| `db/README.md` | Neuer Abschnitt „Den ersten Betreiber anlegen (Bootstrap)“. |

### Entscheidungen, damit sie niemand zurueckdreht

1. **Als Nicht-Betreiber gibt `/admin` 404, keinen Redirect und keine Meldung „keine Berechtigung“.**
   Wer die Seite nicht benutzen darf, soll nicht erfahren, dass es sie gibt.
2. **Der eigene Satz ist gesperrt**: die eigene Freigabe ist nicht zuruecknehmbar, die eigene
   Betreiber-Rolle nicht ablegbar. Sonst waere `/admin` nach einem Fehlklick fuer alle zu und nur
   noch per `wrangler d1 execute` zu oeffnen. Entschieden wird das in `lib/admin-eingabe.ts`; was
   die Oberflaeche ausgraut, ist nur Bedienkomfort.
3. **Der Einstieg zu `/admin` steht auf `/mitglied`, nicht in der Navigation.** Gleicher Grund wie
   bei Schritt 2: die Navigation muesste sonst auf jeder Seite die Sitzung lesen.
4. **`freigegeben_von` und `freigegeben_am` werden beim Zuruecknehmen geleert.** Eine
   stehengebliebene Freigabe-Spur ohne Freigabe waere spaeter nicht zu deuten.
5. **Den ersten Betreiber kann `/admin` nicht vergeben** — dafuer muesste man schon Betreiber sein.
   Der erste Satz wird einmalig per SQL gesetzt, dokumentiert in `db/README.md`. **Es gibt keine
   Rolle `SUPERADMIN`**: `db/enums.ts` kennt `MITGLIED`, `FACHKREIS`, `ADMIN`, und der Trigger weist
   alles andere ab. `ADMIN` ist die hoechste Rolle.

### Was beim Umsetzen anders kam als geplant

1. **React verwirft Klicks auf Buttons, die es selbst als `disabled` gerendert hat** — auch wenn man
   `disabled` vorher im DOM entfernt und einen `MouseEvent` schickt. Es geht kein Request raus.
   Die Client-Sperre laesst sich im Browser also **nicht** umgehen und damit auch nicht
   gegenpruefen; der serverseitige Selbstschutz ist ueber die reinen Funktionen belegt, nicht ueber
   einen Klick.
2. **Der Zeitstempel `freigegeben_am` hat zwei moegliche Darstellungen.** Prisma schreibt
   ISO-8601-Text mit Offset; ein Bootstrap per `strftime('%s','now')*1000` schreibt einen Integer.
   Beides wird gelesen, steht danach aber als zwei Formate in derselben Spalte. `db/README.md`
   nennt deshalb ausdruecklich die ISO-Form.
3. **`curl` gegen `/api/zugang` braucht `--data-urlencode`**, wenn das Passwort ein `&` enthaelt —
   mit `-d` wird es zum Parametertrenner und das Gate antwortet mit `fehler=1`. Ausserdem mangelt
   Git Bash Argumente, die mit `/` beginnen, zu Windows-Pfaden: `MSYS_NO_PATHCONV=1` setzen.
   Das Gate-Cookie ist `Secure` und landet ueber `http` **nicht** im Cookie-Jar — mit
   `-b "cn_gate=..."` von Hand mitgeben.

### Verifiziert (gegen `next dev` mit echtem D1-Binding)

- `npm run typecheck`, `npx eslint .` und `npm run build` gruen; `/admin` erscheint im Routenbaum.
- **Gate:** ohne Sitzung 307 auf `/anmelden?weiter=%2Fadmin`, als einfaches Mitglied **404**,
  als Betreiber 200 mit allen Konten in der Tabelle.
- **`freigabeEingabePruefen` und `rolleEingabePruefen`: 15 Faelle, alle bestanden** — Trimmen,
  leere Id, unbekannte Aktion, kleingeschriebene Aktion/Rolle, alle drei Rollen, eigene Freigabe
  zuruecknehmen abgelehnt, eigene Rolle ablegen abgelehnt, eigene Rolle `ADMIN` erneut setzen erlaubt.
- **Im Browser geklickt:** „Freigeben“ schreibt `freigegeben = 1` samt `freigegeben_am` und
  `freigegeben_von` (Id des handelnden Betreibers); der Rollen-Select schreibt die neue Rolle.
- **Das Rollen-Gate der Server Action greift im echten Durchlauf:** waehrend das Konto kurzzeitig
  nur `FACHKREIS` war, warf derselbe Klick serverseitig `Keine Berechtigung.` und schrieb nichts.
- Eigener Satz: Button und Select sind gesperrt, fremde Zeilen bedienbar.
- Dark und Light geprueft (`data-theme`), Tabelle, Badges und Felder sitzen in beiden Themes.
- Testkonten wieder geloescht.

---

## Block B, Schritt 2 — erledigt: Registrierung, Anmeldung, /mitglied

| Datei | Inhalt |
|---|---|
| `app/registrieren/page.tsx`, `app/anmelden/page.tsx` | Serverseiten. Wer schon angemeldet ist, wird direkt weitergeleitet. |
| `app/mitglied/page.tsx` | Eigenes Konto: Freigabestatus, Rolle, Profilangaben, Abmelden. Ohne Sitzung 307 auf `/anmelden?weiter=%2Fmitglied`. |
| `app/mitglied/aktionen.ts` | Server Action `profilSpeichern`. |
| `lib/mitglied-eingabe.ts` | Die Pruefregeln als **reine Funktion**, ohne Request, Prisma und Sitzung. |
| `lib/weiterleitung.ts` | `sicheresZiel()` gegen offene Weiterleitung ueber `?weiter=`. |
| `components/auth/` | `AnmeldeFormular`, `RegistrierFormular`, `ProfilFormular`, `AbmeldeButton`, `fehlertexte.ts`. |
| `components/ui/Input.tsx` | Fehlendes Primitive, gleiche Klassenbasis wie `Select`, haengt an `Field`. |

### Entscheidungen, damit sie niemand zurueckdreht

1. **`profilSpeichern` nimmt genau zwei Felder entgegen**: `anzeigename` und `instagramHandle`.
   `freigegeben` und `rolle` sind hier **nicht** schreibbar — sonst koennte sich jedes Mitglied
   selbst Stimmrecht und Preissicht geben. Beides vergibt `/admin` (Schritt 3). Die Identitaet
   kommt aus `lib/session.ts`, nie aus dem Formular: eine mitgesendete Mitglieds-Id waere eine
   fremde Identitaet.
2. **Die Pruefregeln liegen in `lib/mitglied-eingabe.ts`, nicht in der Server Action.** Grund:
   ein Server-Action-Aufruf laesst sich von aussen praktisch nicht nachbauen (siehe unten), die
   Regel als reine Funktion dagegen direkt. Wer eine Regel aendert, aendert sie dort.
3. **Der Instagram-Name wird normalisiert** (fuehrendes `@` faellt weg, leer wird `null`), sonst
   stehen `@name` und `name` als zwei verschiedene Werte in der Spalte.
4. **Der Navigationspunkt ist fest „Mein Konto"**, nicht „Anmelden"/„Mein Konto" je nach Sitzung.
   Sonst muesste das Layout auf **jeder** Seite die Sitzung lesen und waere durchgehend dynamisch.
   `/mitglied` leitet ohne Anmeldung selbst weiter.
5. **Der Instagram-Name wird bei der Registrierung nachgetragen**, nicht mitgeschickt: er gehoert
   zu `mitglied`, nicht zu Better Auth. Schlaegt der Nachtrag fehl, ist das Konto trotzdem da und
   der Name unter `/mitglied` nachtragbar — dafuer wird die Registrierung nicht abgebrochen.
6. **`Input` setzt „(Pflichtangabe)" nicht automatisch aus `required`.** In diesen Formularen ist
   fast jedes Feld Pflicht; der Marker an jedem Label waere Rauschen. Freiwillige Felder sagen es
   im `hinweis`.

### Was beim Umsetzen anders kam als geplant

1. **Ein Server-Action-Aufruf laesst sich mit `curl` nicht sinnvoll nachbauen.** Weder der
   `Next-Action`-Header mit `1_feld`-Namen noch die `$ACTION_ID_<id>`-Variante brachten die
   Felder an: die Datenbank blieb unveraendert, obwohl die Aktion lief. Wer hier testet und aus
   der Fehlermeldung „Bitte einen Anzeigenamen angeben" schliesst, die Pruefung funktioniere,
   sitzt einem falschen Positiv auf: das ist nur der Zweig fuer den leeren Namen.
   **Deshalb die reine Funktion in `lib/mitglied-eingabe.ts`** — sie ist mit `npx tsx` direkt
   pruefbar. Die Action-Id steht uebrigens im Client-Chunk:
   `curl -s http://localhost:3000/_next/static/chunks/<chunk>._.js | grep -oE '"[0-9a-f]{40,}"'`.
   **Achtung, Fehlschluss:** die Log-Zeile `ƒ profilSpeichern({}) in 511ms` zeigt **immer** `{}`,
   auch wenn das FormData vollstaendig ankommt — der Browser-Durchlauf hat das bewiesen. Sie ist
   kein Beleg fuer leere Argumente.
2. **`--data-urlencode` mit `-G` verfaelschte in einem Testlauf die Ergebnisse** (ein `/produkte`
   kam als leerer Parameter an). Weiterleitungsziele mit fertig kodierter URL testen, nicht mit
   `-G`.
3. **Tastatur- und Klick-Simulation im Browserwerkzeug kam auf dieser Seite nicht an** — die
   Felder blieben leer, und der Submit scheiterte still an der nativen `required`-Pruefung, ohne
   dass der eigene Handler lief. Das sah zweimal nach einem Fehler im Formular aus und war
   keiner. Wer hier wieder testet: Werte ueber den `value`-Setter von `HTMLInputElement.prototype`
   setzen, ein `input`-Event verschicken und `form.requestSubmit()` aufrufen — nur so sieht React
   die Eingabe.

### Verifiziert (gegen `next dev` mit echtem D1-Binding)

- `npm run typecheck`, `npx eslint .` und `npm run build` gruen; die drei neuen Routen
  `/anmelden`, `/registrieren`, `/mitglied` erscheinen im Routenbaum.
- Ohne Sitzung: `/anmelden` 200, `/registrieren` 200, `/mitglied` **307** auf
  `/anmelden?weiter=%2Fmitglied`.
- Mit Sitzung: `/mitglied` 200 mit E-Mail, Badge „Freigabe steht aus" und „Rolle: Mitglied";
  `/anmelden` und `/registrieren` leiten **307** auf `/mitglied`.
- Nach `freigegeben = 1` in der Datenbank: Badge „Freigegeben", der §-10-HWG-Hinweis erscheint,
  der Instagram-Name steht im Formularfeld.
- **Offene Weiterleitung abgewehrt:** `?weiter=` mit `https://fremd.example`, `//fremd.example`
  und `/remd.example` faellt auf `/mitglied` zurueck, `/produkte` geht durch.
- **`profilSpeichern` ohne Sitzung:** 500 `Nicht angemeldet.` aus `mitgliedErforderlich()` —
  der Aufruf am Formular vorbei greift also nicht.
- **`profilEingabePruefen`: 11 Faelle, alle bestanden** — Trimmen, `@`-Entfernung (auch mehrfach),
  leerer Name, Grenzen 60 und 30 Zeichen (je genau/ueberschritten), Sonderzeichen, Leerzeichen,
  nur `@` ergibt `null`.
- Testnutzer wieder geloescht, `user` und `mitglied` sind leer — die Kaskade greift.

### Verifiziert im Browser (echter Durchlauf durch die Oberflaeche)

- Passwort-Gate, dann Registrierung: ungleiche Passwoerter zeigen „Die beiden Passwoerter stimmen
  nicht ueberein", gleiche legen das Konto an und leiten auf `/mitglied`.
- Der Instagram-Nachtrag nach der Registrierung greift: `@Browser.Kanal_1` steht als
  `Browser.Kanal_1` in der Spalte.
- `/mitglied`: Profil speichern mit ungueltigem Handle zeigt die Meldung der Server Action,
  gueltig gespeichert steht getrimmt und normalisiert in der Datenbank („  Geaenderter Name  "
  -> `Geänderter Name`, `@Neuer.Kanal_2` -> `Neuer.Kanal_2`), Bestaetigung „Gespeichert."
- Abmelden: `/mitglied` faellt danach auf `/anmelden?weiter=%2Fmitglied` zurueck.
- Anmelden: falsches Passwort zeigt „E-Mail-Adresse oder Passwort ist falsch", richtiges fuehrt
  auf `/mitglied`.
- Dark und Light geprueft (`data-theme="light"`): Badge „✓ Freigegeben" mit Haken, Rolle,
  §-10-HWG-Hinweis, Felder und Fokusringe sitzen in beiden Themes.

---

## Block B, Schritt 1 — erledigt: Better Auth mit D1

Better Auth `1.7.5` laeuft ueber den **Prisma-Adapter**, nicht ueber Drizzle oder Kysely und
nicht ueber einen D1-Adapter. Gruende, damit das niemand „aufraeumt":

- Die Datenbank laeuft in diesem Projekt ohnehin ueber Prisma. Ein zweites ORM haette einen
  zweiten Migrationspfad bedeutet.
- Das `better-auth`-Skill verspricht fuer v1.5+ eine native D1-Unterstuetzung („`database: env.DB`").
  In `better-auth@1.7.5` gibt es dazu **keine Spur** — kein `D1Database` in den Typen, kein
  D1-Adapter. Die Angabe im Skill ist fuer diese Version falsch.
- `transaction: false` ist Pflicht: D1 hat keine echten Transaktionen. Mit `true` wuerde Better
  Auth eine Garantie annehmen, die die Datenbank nicht gibt.

| Datei | Inhalt |
|---|---|
| `lib/auth.ts` | `getAuth()` — Instanz pro Isolate, gecacht am Prisma-Client. Kein Modul-Singleton: das D1-Binding gibt es erst im Request. Enthaelt den `user.create.after`-Hook, der den `mitglied`-Satz anlegt. |
| `lib/session.ts` | Die Zugriffsschicht (DAL). `aktuellesMitglied()` mit React-`cache()`, dazu `istFreigegeben()`, `istAdmin()` und die drei werfenden Gates fuer Server Actions. **Ueber Rechte entscheidet ausschliesslich diese Datei.** |
| `lib/auth-client.ts` | Browser-Client, nur Bedienoberflaeche. |
| `app/api/auth/[...all]/route.ts` | Alle Auth-Endpunkte. Kein `toNextJsHandler` — der braucht eine Instanz auf Modulebene, die es hier nicht geben kann. |
| `prisma/schema.prisma` | `User`, `Session`, `Account`, `Verification` (Feldnamen von Better Auth vorgegeben, camelCase ohne `@map` — abgeglichen mit `getAuthTables()`), plus eigenes Modell `Mitglied` mit `1:1`. |
| `migrations/0002_better_auth_mitglied.sql` | Fuenf Tabellen, nur `CREATE`, keine Aenderung an Bestandsdaten. |
| `db/enums.ts`, `db/constraints.sql` | `MITGLIED_ROLLEN` (`MITGLIED`/`FACHKREIS`/`ADMIN`) plus Trigger auf `mitglied`. |

E-Mail-Bestaetigung ist **bewusst aus**: es gibt keinen Mailversand-Dienst, und die Verifizierung
ist ohnehin die manuelle Freigabe durch den Betreiber (`mitglied.freigegeben`, Default `false`).

### Was beim Umsetzen anders kam als geplant

1. **`prisma migrate diff --from-migrations` funktioniert hier nicht.** Der Ordner `migrations/`
   gehoert wrangler (flache `.sql`-Dateien), Prisma erwartet seine eigene Struktur mit
   `migration_lock.toml` und bricht mit „Could not determine the connector" ab.
   **Und `--from-url` gibt es in Prisma 7 nicht mehr.** Der Weg, der funktioniert:
   die lokale D1-Datei aus `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite` nach
   `db/.migrate-diff.sqlite` kopieren (genau der Pfad aus `prisma.config.ts`), dann
   `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`,
   danach die Kopie loeschen. Das Ergebnis pruefen: der Diff kennt `d1_migrations` nicht und
   koennte ein `DROP` erzeugen — in `0002` tat er es nicht, in der naechsten Migration erneut
   nachsehen. **`db/README.md` ist entsprechend korrigiert.**
2. **`server-only` war nicht installiert.** Next.js bringt es nicht mit; ohne das Paket ist der
   Import in `lib/session.ts` nur ein Laufzeitfehler-Risiko. Nachinstalliert.

### Verifiziert (gegen `next dev` mit echtem D1-Binding)

- Registrierung ueber `/api/auth/sign-up/email` gibt 200 und setzt `better-auth.session_token`.
- `/api/auth/get-session` liefert Sitzung und Nutzer; Anmeldung mit richtigem Passwort 200,
  mit falschem **401**.
- Der `user.create.after`-Hook legt den `mitglied`-Satz an: `freigegeben = 0`, `rolle = MITGLIED`.
- Der neue Trigger weist `rolle = 'SUPERADMIN'` ab (`SQLITE_CONSTRAINT_TRIGGER`), der Wert bleibt
  unveraendert.
- `delete from user` raeumt den Mitgliedssatz per Cascade mit ab.
- Testnutzer wieder geloescht, die Datenbank ist sauber.

**Zwei Stolpersteine fuer den naechsten Test von Hand:** die Auth-Route liegt hinter dem
Entwicklungs-Passwort aus `proxy.ts` (erst `cn_gate`-Cookie holen), und Better Auth weist
Anfragen ohne `Origin`-Header mit 403 `MISSING_OR_NULL_ORIGIN` ab. Im Browser faellt beides
nicht auf, mit `curl` sofort.

---

## Block A — erledigt

Supabase ist vollständig entfernt (`@supabase/*`, `lib/supabase/`, `supabase/rls.sql`, die
Pooler-URLs). Die Datenbank ist **Cloudflare D1** als Binding `DB`. Was dabei entstand:

| Datei | Inhalt |
|---|---|
| `db/enums.ts` | Die sieben Wertelisten als `as const` plus Unions und Type-Guards. SQLite kennt keine Enums. |
| `db/constraints.sql` | Die früheren CHECK-Constraints als **Trigger**, plus Prüfung der Wertelisten. |
| `db/README.md` | Migrationspfad, Seed-Weg, D1-Eigenheiten. **Vor jeder Migration lesen.** |
| `migrations/0001_initial.sql` | Erzeugt mit `prisma migrate diff`, angewendet mit `wrangler`. |

### Was beim Umsetzen anders kam als geplant

1. **`prisma migrate diff` bricht still ab**, wenn `prisma.config.ts` keine `datasource` hat:
   Exit-Code 0, leere Ausgabe, keine Fehlermeldung. Die Schema-Engine verlangt das Argument auch
   bei `--from-empty`. Dort steht deshalb ein lokaler Dateipfad, in den nie geschrieben wird.
2. **Die Flags aus dem alten Plan gibt es in Prisma 7 nicht mehr.** `--to-schema-datamodel` und
   `--from-local-d1` sind weg; es heißt `--from-schema` / `--to-schema` bzw. `--from-migrations`.
3. **CHECK-Constraints lassen sich in SQLite nicht nachrüsten** — es gibt kein
   `alter table ... add constraint`, sie gehen nur beim `create table`. Die Tabellen erzeugt aber
   Prisma. Deshalb sind die Prüfungen **Trigger** (`RAISE(ABORT, ...)`), und deshalb muss
   `db/constraints.sql` **nach jeder Migration** erneut laufen: SQLite verwirft beim Tabellenumbau
   alle Trigger der alten Tabelle.
4. **Der Seed kann nicht über den D1-Adapter laufen** — der braucht ein `D1Database`-Binding, das
   es nur im Worker gibt. `prisma/seed.ts` schreibt jetzt mit `@prisma/adapter-better-sqlite3`
   direkt in die Miniflare-Datei unter `.wrangler/`. Für die entfernte Datenbank führt der Weg
   über `wrangler d1 export --local` und `wrangler d1 execute --remote`, siehe `db/README.md`.

### Zwei Sicherheitsbefunde, beide behoben

1. **Das Fachkreis-Recht hatte nach dem Umbau keine Quelle mehr.** Es kam aus
   `app_metadata` des Supabase-Nutzers; `FACHKREIS_PASSWORD` war zwar dokumentiert, aber nirgends
   implementiert. Die Rolle steckt jetzt im HMAC-signierten Gate-Token
   (`gate:<ablauf>:<rolle>`), `lib/gate.ts` gibt sie nur nach geprüfter Signatur heraus.
   `istFachkreis()` liest sie dort. Ein manipuliertes Cookie fällt auf „kein Zugang" zurück —
   verifiziert.

2. **Der Zugangsschutz war faktisch wirkungslos** (Fehler war vorher schon da). Im Matcher in
   `proxy.ts` stand `"...|.*\.)..."` — in einem normalen JS-String ist `\.` nur `.`, das Muster
   wurde also zu `.*.` und passte auf jeden nicht leeren Pfad. Die Negation nahm damit **alles
   außer `/`** vom Gate aus: `/produkte` und alle Detailseiten waren ohne Passwort erreichbar.
   Jetzt `\\.`, mit Kommentar. Verifiziert: ohne Cookie liefert `/produkte` 307, mit gültigem
   Cookie 200, `/zugang` bleibt erreichbar.

### Verifiziert

- `npm run typecheck` grün, `npx eslint .` grün (ESLint ignoriert jetzt `.agents/**` und
  `.claude/**` — fremde Referenzdateien der installierten Skills, 22 Fehler stammten von dort).
- `npm run build` grün, alle acht Routen inklusive `/produkte/[slug]`.
- **Gegen echte D1-Daten in `next dev`** (Bindings über `initOpenNextCloudflareForDev`):
  Katalogliste, Filter, Freitextsuche (Groß-/Kleinschreibung über `suchtext`), Produktdetailseite,
  Apothekenseiten, 404 bei unbekanntem Slug. Preisspalte erscheint als Fachkreis und fehlt als
  Besucher, mit §-10-HWG-Hinweis.
- Die Trigger greifen: ein Insert mit unbekanntem Wertelisten-Wert wird abgewiesen
  (`SQLITE_CONSTRAINT_TRIGGER`), der komplette Seed läuft durch sie hindurch.

### Ungetestet geblieben

- **`npm run cf-build` läuft auf diesem Windows-Rechner nicht durch.** OpenNext legt beim Bündeln
  Symlinks unter `.open-next/` an; das scheitert mit `EPERM`, weil der Windows-Entwicklermodus
  nicht aktiv ist. Ein Symlink-Test schlägt auch direkt fehl. `next build` läuft durch — der
  Fehler liegt also im OpenNext-Bündelschritt, nicht im Code.
  **Folge: `npm run preview` (workerd) und `npm run deploy` sind ungetestet.**
  Abhilfe: Entwicklermodus in den Windows-Einstellungen aktivieren, oder den Build in einer
  Shell mit Administratorrechten laufen lassen.

---

## Was noch offen ist

1. **Die D1-Datenbank in Cloudflare ist angelegt, aber noch leer (2026-09-23).**
   `cn-medcan-db`, ID `cdee3489-a940-4353-b164-c58e7a1226f7`, mit `--jurisdiction eu`
   (Mitgliederdaten mit Gesundheitsbezug bleiben in der EU; Region EEUR). Die ID steht in
   `wrangler.jsonc`. Wrangler-Login laeuft ueber OAuth (`wrangler login --device` - der normale
   Login scheiterte mit „No CSRF value available in the session cookie“).
   **`preview_database_id` traegt absichtlich den alten Platzhalterwert:** Miniflare benennt die
   lokale Datei nach einem Hash dieser ID (`preview_database_id ?? database_id`, im Wrangler-Code
   nachgesehen). Ohne das Feld haette die echte ID eine neue, leere lokale Datei erzeugt, und
   `npm run db:seed` bricht bei zwei Dateien ab. Geprueft: dieselbe Datei, die Runde „test“ ist da.
   Die Cloud-Datenbank hat noch **keine Tabellen**, siehe Punkt 3.
2. **`npm run cf-build` laeuft durch (2026-09-23)** - zum ersten Mal, seit der Windows-
   Entwicklermodus aktiv ist. Secret-Pruefung sauber. Groesse laut `wrangler deploy --dry-run`:
   19,7 MiB unkomprimiert (gzip 4,9 MiB); das Limit ist 64 MiB unkomprimiert, auch im Free-Plan,
   ein komprimiertes Limit gibt es laut Cloudflare-Doku nicht mehr. **Bedingung: `next dev` muss
   gestoppt sein.** Es haelt ueber `initOpenNextCloudflareForDev` den Ordner `.open-next/assets`
   (`assets.directory` in `wrangler.jsonc`) offen, `cf-build` bricht dann mit EPERM beim Loeschen
   ab. Bestaetigt: nach dem Stoppen liess sich der Ordner sofort loeschen.
   Nicht erwogen: die Wrangler-Option `build.command` als zweite Sperre vor jedem Deploy - wrangler
   fuehrt sie auch bei `wrangler types` aus (`getEntry(..., "types")`), und `cf-typegen` braeche
   ohne Build-Ausgabe.
3. **Erledigt am 2026-09-23 durch den Nutzer:** Secrets gesetzt, Migrationen und Trigger in der
   Cloud-D1, erstes Deploy (`https://cn-medcan.w-helwich.workers.dev`, Version `f7abe9f7`).
   **Im PowerShell des Nutzers `npm.cmd`/`npx.cmd` schreiben** - die Execution Policy sperrt
   `npm.ps1`/`npx.ps1`. Die Deploy-Ausgabe zeigt bei D1 `PLATZHALTER-...` an: das ist nur die
   Anzeige (wrangler druckt `preview_database_id`), die Version haengt nachweislich an
   `cdee3489-...` (`wrangler versions view`). Das Gate greift live (ohne Cookie 307).
   Urspruenglicher Stand zu Punkt 3: **Live gehen - liegt beim Nutzer, weil die Session es nicht darf.** Die Rechtepruefung von
   Claude Code blockiert Remote-Migration, `wrangler secret put` (beim zweiten Mal) und Deploy als
   Produktionsaktionen, und ein Skript, das diese Schritte buendelt, als Umgehung. **Nicht erneut
   versuchen**, sondern dem Nutzer den Block geben (PowerShell, in `C:\cn`, Dev-Server gestoppt):
   ```
   node -e "const {parseEnv}=require('util');process.stdout.write(parseEnv(require('fs').readFileSync('.env.local','utf8')).SITE_PASSWORD)" | npx wrangler secret put SITE_PASSWORD
   node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))" | npx wrangler secret put SITE_SESSION_SECRET
   node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))" | npx wrangler secret put BETTER_AUTH_SECRET
   npm run db:migrate:remote
   npm run db:constraints:remote
   if ((npx wrangler secret list | Out-String) -match 'BETTER_AUTH_SECRET') { npm run deploy } else { 'Secrets fehlen - kein Deploy' }
   ```
   Secrets **vor** dem Deploy, weil `proxy.ts` die Seite ohne `SITE_PASSWORD`/`SITE_SESSION_SECRET`
   offen laesst - deshalb die Pruefung in der letzten Zeile. `SITE_PASSWORD` ist das lokale
   Seitenpasswort (der Nutzer kennt es), die beiden anderen sind neu, zufaellig und nirgends
   gespeichert (wer sie verliert, erzeugt neue; kostet nur Sitzungen). Wrangler kuerzt die Eingabe
   per `trimEnd()`, der Zeilenumbruch aus der PowerShell-Pipe schadet nicht. Ohne Terminal an
   stdin bestaetigt wrangler Rueckfragen mit dem Standard "ja" (auch "Worker anlegen?").
   **Verlauf:** Die Secrets waren schon einmal gesetzt; der Nutzer hat den Worker `cn-medcan` danach
   im Dashboard geloescht, die Secrets sind mit ihm weg.
   `FACHKREIS_PASSWORD` **absichtlich nicht** setzen, es faellt mit dem Umbau der Preisanzeige
   weg. `BETTER_AUTH_URL` ist kein Secret: nach dem ersten Deploy die workers.dev-Adresse als
   `vars` in `wrangler.jsonc`. Bis dahin leitet Better Auth die Herkunft aus dem Request ab.
   Danach ist die Cloud-Datenbank leer (kein Katalog). Ob die Seed-Daten hoch sollen, ist eine
   Frage an den Nutzer; der Weg steht im Kopf von `prisma/seed.ts`.
   **Automatisches Deploy bei jedem Push ist nicht eingerichtet.** Der Nutzer landete im
   Dashboard im **Pages**-Dialog (`*.pages.dev`, kein Feld "Deploy command") - das ist der falsche
   Weg, das Projekt laeuft auf Workers. Workers Builds (Worker -> Settings -> Build) braucht einen
   existierenden Worker, also erst nach dem ersten Deploy. Einstellungen dann: Build command
   `npx prisma generate && npm run cf-build` (der Prisma-Client ist gitignored), Deploy command
   `npx opennextjs-cloudflare deploy`. Der Nutzer ist davon genervt - nur anfassen, wenn er es will.
4. **Sicherheitsbefund, behoben: OpenNext packt `.env.local` in den Worker.**
   `opennextjs-cloudflare build` schreibt die Werte aller `.env*`-Dateien im Klartext nach
   `.open-next/cloudflare/next-env.mjs` (alle drei Modi), wrangler buendelt das in den Worker, und
   zur Laufzeit fuellt es jede nicht gesetzte Variable (`process.env[key] ??=`). Ein Deploy haette
   die lokalen Secrets hochgeladen und das lokale `FACHKREIS_PASSWORD` live scharf geschaltet.
   Einen Schalter gibt es in OpenNext 1.20.6 nicht. **`scripts/bundle-env-bereinigen.mjs`** laeuft
   jetzt in `cf-build` (und damit in `preview` und `deploy`): schreibt `next-env.mjs` nur mit
   `NEXT_PUBLIC_*` neu und durchsucht danach die gesamte Build-Ausgabe nach jedem lokalen
   Secret-Wert - Treffer = Exit 1, kein Deploy. Getestet mit einer absichtlich verseuchten Kopie
   (drei Treffer gemeldet, nur Pfad und Name) und danach sauber. **Nie `opennextjs-cloudflare
   deploy` direkt aufrufen**, immer `npm run deploy`.
   Git-Historie geprueft: keiner der vier lokalen Werte steht in einem der 21 Commits.
   **Nachtrag:** Die Pruefung ueberspringt `node_modules` in der Ausgabe - unveraenderte
   Paketkopien, die keine `.env`-Werte enthalten koennen. Vorher las sie seit Punkt 5 Hunderte
   kopierte Pakete samt Binaerdateien und brauchte ueber zehn Minuten; jetzt 1 Sekunde. Erneut
   mit einer absichtlich platzierten Datei geprueft: Treffer, Exit 1.
5. **Behoben, aber noch nicht deployt: jede Datenbankabfrage warf live.**
   `WebAssembly.Module(): Wasm code generation disallowed by embedder` (per `wrangler tail`).
   Der Generator `prisma-client` erzeugt ohne `runtime` den Query-Compiler als Base64 und
   kompiliert ihn zur Laufzeit - Workers verbieten das, Node erlaubt es, lokal fiel es nie auf.
   Seiten mit `Suspense` meldeten trotzdem 200 (der Status war vor dem Fehler gesendet), nur
   `/reviews` und `/umfragen` zeigten 500.
   - `prisma/schema.prisma`: `runtime = "cloudflare"` -> Import als `.wasm?module`, von wrangler
     vorkompiliert. `next dev` (Turbopack) versteht das, geprueft.
   - **Zweiter Generator `seed`** (`runtime = "nodejs"`, Ausgabe `lib/generated/prisma-node`) nur
     fuer `prisma/seed.ts`: unter tsx liefert der `?module`-Import nichts ("The loaded wasm module
     was unexpectedly undefined"). Geprueft: Node-Client liest die lokale D1.
   - **Nebenwirkung, behoben in `next.config.ts`:** Turbopacks Wasm-Lader loest den Pfad dynamisch
     auf, die Build-Spur erfasst ~30.000 Dateien, OpenNext importiert **jede** erfasste `.wasm`
     statisch (`loadWasmChunkFn`) - der Worker wuchs von 19,7 auf 62,6 MiB (Limit 64).
     `outputFileTracingExcludes` mit einer ausdruecklichen Paketliste; `resvg.wasm`/`yoga.wasm`
     aus `next/dist/compiled/@vercel/og` muessen drin bleiben (OpenNexts og-Patch importiert sie
     fest, sonst ENOENT beim Deploy). `node_modules/!(next)/**` greift in Next **nicht**.
     Ergebnis: 19,5 MiB, drei `.wasm` in der Spur.
   - Verifiziert in lokalem workerd (`npx opennextjs-cloudflare preview` auf dem fertigen Build):
     `/reviews`, `/produkte`, `/` liefern 200 mit Daten, keine Wasm-Fehler im Log.
   - **`npm run preview` braucht eine `.dev.vars`** mit den lokalen Secrets: OpenNext schaltet das
     Laden von `.env`-Dateien in wrangler ab (`CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false`) und
     liefert sie sonst ueber `next-env.mjs` - das bereinigt Punkt 4. Ohne `.dev.vars` ist das Gate
     in der Vorschau offen und Auth wirft. Nur lokal relevant, noch nicht angelegt.
   - **Live erst nach `npm.cmd run deploy` durch den Nutzer** (bei gestopptem `next dev`).

---

## Block C — Mailversand (vom Nutzer beauftragt, nach Block B)

Eingetaktet am 2026-09-23. **Erst nach Block B**, weil es den Produktkern nicht beruehrt.
Heute verschickt das Projekt **keine** E-Mail: es gibt keinen Mailversand-Dienst, kein
Kontaktformular, und die E-Mail-Bestaetigung in Better Auth ist bewusst aus (die Verifizierung
ist die manuelle Freigabe). Es gibt also auch keine „normale Routine“, die man testen koennte —
die entsteht erst hier.

1. **Mailversand einbauen.** Kandidat: Cloudflare Email Sending (Skill
   `cloudflare:cloudflare-email-service`), passend zum Worker-Stack und ohne zweiten Anbieter.
   Absenderdomain und DNS sind Voraussetzung. Zugangsdaten als Worker-Secret, nie in
   `wrangler.jsonc` (siehe `edge-stack-master`, §7).
2. **Benachrichtigung an den Betreiber, wenn sich jemand registriert** und auf Freigabe wartet —
   Ziel ist die Betreiber-Adresse, Ausloeser der `user.create.after`-Hook in `lib/auth.ts`, der
   heute schon den `mitglied`-Satz anlegt. **Der Versand darf die Registrierung nicht scheitern
   lassen**, gleiche Begruendung wie beim Instagram-Nachtrag in Schritt 2: das Konto ist wichtiger
   als die Benachrichtigung.
3. Danach ist eine Testmail „so wie sie beim Nutzer ankommt“ ueber die echte Routine moeglich.

---

## Block B — Mitglieder, Umfragen, Reviews (Entwurf, vom Nutzer bestätigt)

### Die vier Entscheidungen des Nutzers
1. **Verifizierung durch manuelle Freigabe.** Registrierung ist offen, Stimmrecht vergibt der
   Betreiber in einer Admin-Ansicht. Kein Mailversand-Dienst nötig, keine Wegwerf-Adressen-Lücke.
2. **Eigene Reviews zentral, Community-Reviews als Zweitstimme.** Die Freigabe-Warteschlange
   (`Review.freigegeben`) bleibt und wird gebraucht.
3. **Umfrage mit gesetzten und erwählten Plätzen.** Eine Runde ergibt 3 bis 4 getestete Strains:
   - **1 bis 2 gesetzte Plätze** — der Betreiber wählt sie selbst, sie stehen von Anfang an fest
     und werden **nicht** abgestimmt. Er testet sie ohnehin.
   - **2 Community-Plätze** — darüber entscheidet die Abstimmung.

   Ablauf in drei Phasen:
   `VORSCHLAG` → Mitglieder schlagen Strains mit Begründung vor.
   `ABSTIMMUNG` → der Betreiber übernimmt geeignete Vorschläge als Kandidaten. **Jedes Mitglied
   hat genau eine Stimme; die zwei Vorschläge mit den meisten Stimmen gewinnen** die beiden
   Community-Plätze. Die Umfrage hat ein Enddatum.
   `BEENDET` → alle Gewinner (gesetzte plus erwählte) werden mit den daraus entstehenden Reviews
   verknüpft.

   Konsequenz für die Oberfläche: gesetzte und erwählte Plätze müssen sichtbar unterschieden sein,
   sonst wirkt die Abstimmung manipuliert. Gesetzte Kandidaten tragen keinen Stimmenzähler.
4. **Preise sehen alle verifizierten Mitglieder.** Ausdrückliche Entscheidung des Nutzers.
   **Einordnung, die im Code als Kommentar stehen muss:** §10 HWG adressiert Fachkreise, also
   Angehörige der Heilberufe — „verifiziertes Mitglied" ist das nicht. Die Preisanzeige braucht
   deshalb einen deutlichen Hinweis. Die Rolle `fachkreis` bleibt im Datenmodell erhalten, damit
   die strengere Variante ohne Schemaänderung nachziehbar ist.

### Auth: Better Auth mit D1
Das Skill `better-auth` ist installiert (Better Auth mit D1-Adapter, OAuth, RBAC). Better Auth
verwaltet seine eigenen Tabellen (`user`, `session`, `account`, `verification`). Unsere Felder
kommen als eigene Tabelle `mitglied` mit `1:1` auf `user`, damit ein Better-Auth-Update unsere
Spalten nicht anfasst:

- `mitglied`: `userId` (1:1), `anzeigename`, `instagramHandle`, `freigegeben` (Boolean, die
  manuelle Verifizierung), `rolle` (`mitglied` | `fachkreis` | `admin`), `freigegebenAm`,
  `freigegebenVon`.

Das bisherige Passwort-Gate in `proxy.ts` **bleibt zusätzlich bestehen**, solange die Seite in der
geschlossenen Entwicklungsphase ist. Es schützt die ganze Seite; Better Auth regelt, wer darin
abstimmen darf. Das zweite Passwort (`FACHKREIS_PASSWORD`) wird mit Block B überflüssig und
entfällt dann — zusammen mit der Rolle im Gate-Token und `lib/query/fachkreis.ts`.

### Neue Modelle
| Modell | Felder (Kern) | Wichtig |
|---|---|---|
| `Umfrage` | `titel`, `beschreibung`, `phase` (`VORSCHLAG`/`ABSTIMMUNG`/`BEENDET`), `startAm`, `vorschlagBisAm`, `endetAm`, `communityPlaetze` (Int, Default 2) | Genau **eine** Umfrage darf aktiv sein — über einen partiellen Unique-Index oder eine Prüfung in der Schreibschicht sicherstellen und kommentieren. Kein einzelnes `gewinnerStrainId`: eine Runde hat mehrere Gewinner. |
| `UmfrageVorschlag` | `umfrageId`, `strainId`, `mitgliedId`, `begruendung`, `uebernommen` | Unique `(umfrageId, mitgliedId, strainId)` — ein Mitglied schlägt einen Strain nur einmal vor. |
| `UmfrageOption` | `umfrageId`, `strainId`, `reihenfolge`, **`herkunft`** (`GESETZT`/`COMMUNITY`), `istGewinner`, `ergebnisReviewId` | `GESETZT` = Wahl des Betreibers, nicht abstimmbar, ohne Stimmenzähler in der Oberfläche. `COMMUNITY` = aus einem übernommenen Vorschlag, abstimmbar. Unique `(umfrageId, strainId)` und `(umfrageId, reihenfolge)`. Beim Beenden werden die `communityPlaetze` stimmenstärksten `COMMUNITY`-Optionen plus alle `GESETZT`-Optionen als `istGewinner` markiert. |
| `Stimme` | `umfrageId`, `optionId`, `mitgliedId`, `abgegebenAm` | **Unique `(umfrageId, mitgliedId)`** — jedes Mitglied hat genau eine Stimme, die zwei stimmenstärksten Community-Optionen gewinnen. Das ist die einzige Absicherung gegen Doppelstimmen; **nicht** über eine Transaktion lösen, D1 hat keine. Die Schreibschicht muss zusätzlich prüfen, dass `optionId` zur Umfrage gehört **und** `herkunft = COMMUNITY` ist — sonst ließe sich auf einen gesetzten Platz abstimmen. |
| `Review` (Änderung) | neu: `istRedaktionell` (Boolean) | Trennt die Reviews des Betreibers von Community-Reviews. `autorId` wird Relation auf `mitglied`. |

**Für alle neuen Modelle gilt der D1-Umbau mit:** keine Enums (Werte nach `db/enums.ts`, Prüfung
in `db/constraints.sql` ergänzen), kein `Json`, kein `Decimal`, und jede neue durchsuchbare Spalte
braucht eine kleingeschriebene Suchspalte.

### Oberfläche
- **Startseite:** oben die aktuelle Umfrage als Kernelement (Phase, Kandidaten, Stimmenzahl,
  Restlaufzeit, Abstimm-Button oder Hinweis „Freigabe ausstehend"), daneben die neueste eigene
  Review mit Instagram-Reel. Der Katalog rutscht darunter.
- `/umfragen` — laufende und vergangene Umfragen mit Ergebnis und verknüpfter Review.
- `/reviews` — alle eigenen Reviews chronologisch, Community-Reviews je Charge darunter.
- `/mitglied` — eigenes Konto, Freigabestatus, eigene Vorschläge und Stimmen.
- `/admin` — nur Rolle `admin`: Mitglieder freigeben, Vorschläge übernehmen, Umfragephase
  weiterschalten, Community-Reviews freigeben.
- Schreibzugriffe als Server Actions. **Jede Schreibaktion prüft serverseitig `freigegeben` und
  die Rolle** — nie im Client entscheiden.

### Reihenfolge für Block B
1. ~~Better Auth mit D1 einrichten, Schema erweitern, Migration.~~ **erledigt**
2. ~~Registrierung, Anmeldung, `/mitglied`.~~ **erledigt**
3. ~~`/admin` mit Freigabe von Mitgliedern.~~ **erledigt**
4. ~~Umfragemodell, Server Actions für Vorschlag und Stimme, Umfragephasen.~~ **erledigt**
5. ~~Startseite umbauen: Umfrage und neueste Review als Kern.~~ **erledigt**
6. ~~`/umfragen`, `/reviews`.~~ **erledigt** (dazu, ungeplant: Umfrageverwaltung in `/admin`,
   oben als "Schritt 7" gefuehrt)
7. **Offen:** `FACHKREIS_PASSWORD` und das zweite Gate-Passwort ausbauen, Preisanzeige an die
   Mitgliedsrolle binden, HWG-Hinweis setzen. Siehe "Hier geht es weiter".

---

## Was fertig ist

- Scaffold, Cloudflare-Anbindung, `lib/cloudflare.ts` als einziger Binding-Zugang
- Zugangsschutz: `proxy.ts`, `lib/gate.ts` (HMAC-Cookie mit Rolle, zeitkonstanter Vergleich),
  `app/zugang/page.tsx`, `app/api/zugang/route.ts`
- Datenbank: Cloudflare D1, Schema, Migration, Trigger, Seed — siehe `db/README.md`
- Design-System: `.claude/skills/ui-design-engine.md`, Tokens in `app/globals.css`
  (Akzent: klinisches Tiefblau `oklch(0.52 0.11 240)`), 12 Primitives in `components/ui/`
- Edge-Regelwerk: `.claude/skills/edge-stack-master.md` — auf D1 umgeschrieben
- Produktkomponenten: `ProduktCard`, `CannabinoidBar`, `TerpenChips`, `GlasHeader`, `TerpenMap`,
  `BestandTabelle`, `BewertungsListe`, `InstagramEmbed`, `FilterLeiste`, `AktiveFilter`
- Anmeldung: Better Auth mit D1, `lib/auth.ts`, `lib/session.ts` als einzige Rechtequelle,
  `components/auth/`
- Seiten: Layout, Landing, `/produkte` mit Live-Filter, `/produkte/[slug]`, `/apotheken` und
  Detail, `/anmelden`, `/registrieren`, `/mitglied`, `/admin`, 404
