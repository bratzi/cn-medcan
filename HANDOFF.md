# HANDOFF — Stand der Arbeit

> Übergabemedium zwischen Sessions. Wird nach jedem Arbeitsblock aktualisiert und committet.
> Wer hier weiterarbeitet, liest diese Datei zuerst und braucht den Chatverlauf nicht.

**Letzte Aktualisierung:** 2026-09-26 (Session 21, Save for Clear)
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

### ⇢ NÄCHSTE SESSION BEGINNT HIER (Stand 2026-09-26, Session 21)

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
