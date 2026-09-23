# HANDOFF — Stand der Arbeit

> Übergabemedium zwischen Sessions. Wird nach jedem Arbeitsblock aktualisiert und committet.
> Wer hier weiterarbeitet, liest diese Datei zuerst und braucht den Chatverlauf nicht.

**Letzte Aktualisierung:** 2026-09-23
**Repo:** https://github.com/bratzi/cn-medcan (public)
**Branch:** `main`

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
Standard-Gateways, kein Proxy. Verdacht: der Citrix-Client. **Regel:** vor jedem Push fragen,
ob Citrix getrennt ist, oder den Nutzer selbst pushen lassen.
Das Browser-Werkzeug: Screenshots laufen hier oft in einen Timeout; `get_page_text`, `find` und
`zoom` funktionieren. `form_input` setzt Felder im Dashboard zuverlaessig.

### 1. Makeover „Grünes Buch“ - **damit beginnt die naechste Session**

**Stand (2026-09-23, Session 4):** Brainstorming abgeschlossen, **Spec geschrieben und
committet:** `docs/superpowers/specs/2026-09-23-makeover-gruenes-buch-design.md`.
Sie enthaelt alle Entscheidungen samt verworfenen Alternativen, Farben mit gemessenen
Kontrasten, Schriften, Logo, Startseiten-Dramaturgie (9 Sektionen), Technik, Medien-Pipeline,
Budgets, Akzeptanzkriterien und Reihenfolge. **Die Spec ist die Quelle - nicht diese Notiz.**

**Naechste Schritte, in dieser Reihenfolge:**
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
