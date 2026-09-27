# Session 22 – Wellen und Agent-Aufträge (2026-09-26)

Zweck: Nach einem Clear lassen sich die Agent-Aufträge von hier neu starten. Laufende Agents sterben beim
Clear; ihre halbfertigen Änderungen liegen dann unkommittet im Arbeitsbaum. Reihenfolge und Status stehen in
`HANDOFF.md` (Abschnitt Session 22). Gemeinsame Regeln für jeden Agent: nicht committen/pushen (die Leitung
committet dateigenau), kein Dev-Server, kein Build, kein npm install; lokal nur `npm test` (tsx --test),
`npm run typecheck`, `npm run lint`. Projektregeln `ui-design-engine` und `docs/brand/gruenes-buch.md` gelten,
**Nutzergeschmack geht vor**: Puls, Glanz, Konturen, Blob-Morph, Glas, Joint-Cursor nie abschwächen;
Startseiten-Reihenfolge bleibt; nur GSAP, keine neuen Abhängigkeiten; § 10 HWG (keine Werbesprache).

## Welle 1

### W1-A Startseite Bewegung und Performance
Skills: animate, improve-animations, apple-design, emil-design-eng, build-awwwards-quality-sites.
Dateien: components/layout/KopfZustand.tsx, components/story/StoryBuehne.tsx, components/story/bewegung/*.ts,
TransparentMachen.tsx, UeberlaufWort.tsx, components/medien/GlasMaske.tsx, Loop*.tsx,
components/umfrage/Kandidat.tsx, StimmFormular.tsx, components/story/Abstimmung.tsx, WissenBuendeln.tsx,
Randspalte.tsx, tests; in app/globals.css nur neue Regeln (bestehende .glanz-wort/.auftakt-marke/.marke-*/
.farbverlauf/.bogen-*/.delta-puls nicht anfassen).
1. Bug: bewegung/auftakt.ts `.set(einstieg, { animation: "none", opacity: 0 })` schaltet den CSS-Notfall
   (`einstieg-notfall`, 8 s) ab, auch im Hintergrund-Tab ohne rAF → Text bleibt unsichtbar. Abschalten erst
   in `onStart` der Timeline oder nur bei `visibilityState === "visible"`. Zoomwerte 1.02/1.05 bleiben.
2. Ein IntersectionObserver (Muster loops.ts, rootMargin ~200px) setzt `data-ruhend` auf Story-Sektionen
   außerhalb des Bildes; CSS: `[data-ruhend] *, … ::before, ::after { animation-play-state: paused !important }`.
   Kopf nie pausieren. Ohne JS läuft alles.
3. will-change: `clip-path` am Vorhang (vorhang.ts) nur während des Tweens, `translate` an
   `[data-punkt-tiefe]` (punkte.ts) nur solange aktiv.
4. StimmFormular: während pending opacity 0.6, scale 0.98, 150 ms, `cubic-bezier(0.23,1,0.32,1)`; reduzierte
   Bewegung beachten.
5. Kandidat.tsx: Balken `data-stimmbalken` + `origin-left`; abstimmung.ts am bestehenden Trigger
   `gsap.from("[data-stimmbalken]", { scaleX: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 })`,
   Stimmenzahlen zählen hoch (randnotizen/data-randzahl). Ohne JS Endzustand.
6. KopfZustand.tsx (~Z. 25): `toggle("buehne-dunkel", ueberBuehne)` ohne `&& !gescrollt` (heller Papierstreifen
   über dem schwarzen Hero im Hell-Modus).
7. „Umschlag wird Seite“: eigene, per Konstante abschaltbare Choreografie in auftakt.ts, Pin des Hero
   (`pin: true, pinSpacing: false`, start "top top", end "bottom top"); TransparentMachen `relative z-10
   bg-surface` + weicher Schatten nach oben, Feldbuch-Raster sichtbar. Nicht bei reduzierter Bewegung. Lenis prüfen.
8. Totes `schleife.ts` (Ziel `schleife-linie` existiert nicht mehr) samt Registrierung in start.ts entfernen.
9. WissenBuendeln-Zahlen hochzählen lassen, falls noch nicht.

### W1-B Aroma- und Review-Details
Skills: better-accessibility, better-typography, emil-design-eng, animate, react-best-practices.
Dateien: components/review/AromaKarte.tsx, AromaErkundung.tsx, SortenKopf.tsx, Doppelseite.tsx,
components/story/Skelette.tsx, components/produkt/ProduktCard.tsx, tests. Kein globals.css.
Volles Blütenbild in der Doppelseite bleibt (Nutzer); .bogen-puls/.bogen-fluss bleiben.
1. Sichtbarer Tastaturfokus an den Reglern der Aroma-Karte (eigener Zustand aus den sr-only Range-Inputs, Ring
   `r=16`, Fokus-Token).
2. Karte/Netz-Umschalter als APG-Radiogroup (Pfeiltasten, roving tabindex), `active:scale-[0.97]`, 120 ms.
3. Filter der Bögen (saturate/drop-shadow) nicht in jedem Frame von Morph (900 ms) und Gleiten (420 ms)
   neu setzen; erst im Ruhezustand. Endbild identisch.
4. tabular-nums an Community-/Dein-Fazit (erledigt in `e6c647a`); SortenKopf-Eyebrows `tracking-wide`.
5. Leitplanke 4: Handelsname im SortenKopf nicht in Inspiration, sondern `font-buch text-kapitel font-medium`.
6. Buchfalz in der Doppelseite ab lg (Inline-Verlauf an der Mittelachse).
7. Skelette: Katalogkarte `sm:w-88`, Randspalten-Skelett höher (h-16/20/24).
8. ProduktCard: totes `rounded-sm` und wirkungsloses `justify-between` raus.

### W1-C Review-Kleinpunkte „Blüte vorschlagen“
Skills: surgical-patch, superpowers:test-driven-development, prisma-client-api, cloudflare-d1.
Liste in HANDOFF.md (Session 18, „Kleinpunkte aus dem Review“). Wichtigster Punkt: `updateMany` mit bis zu
200 Ids reißt die D1-Grenze (~100 Bind-Werte) → in Häppchen ≤ 90. Punkt „Hersteller als Auswahl“ nur, wenn
klein. Nicht anfassen: story/review/layout-Komponenten, globals.css, page.tsx.

### W1-D Impressum und Datenschutz
Neue Dateien app/impressum/page.tsx, app/datenschutz/page.tsx, lib/rechtliches.ts (Betreiberdaten nur als
sichtbare Platzhalter „[BITTE ERGÄNZEN: …]“, nie erfinden); Links im Fuß (Fuss.tsx) und auf /zugang;
beide Seiten vom Passwort-Gate ausnehmen (proxy.ts). Impressum nach § 5 DDG und § 18 Abs. 2 MStV.
Datenschutz nach DSGVO, jede Aussage am Code geprüft (Cloudflare Workers/D1/Images, Cookies aus lib/gate.ts
und lib/auth.ts, localStorage, Konto-Daten laut schema.prisma, Bewertungen/Stimmen/Vorschläge,
Instagram-iframe laut InstagramEmbed.tsx, Schriften per next/font, keine Analyse). Skills: better-writing,
better-typography, better-layout, better-accessibility.

### W1-E i18n-Spec
Ausgabe `docs/superpowers/specs/2026-09-26-englisch-umschalter-design.md`. Nutzerentscheide: Cookie, gleiche
URLs, nur Oberfläche, Deutsch Standard. Eigene Entscheidungen markieren (u. a. keine Bibliothek, Erkennung
Cookie → Accept-Language → de, Admin bleibt deutsch, Meldungs-Schlüssel statt Sätze, Glossar). Pfade schon
als /blueten. Danach Nutzer-Review, dann writing-plans.

### W1-F Caching v2
Ausgabe `docs/superpowers/specs/2026-09-26-caching-v2-design.md` + `docs/superpowers/plans/2026-09-26-caching-v2.md`.
Daten statt HTML cachen (HTML variiert mit Sprach-Cookie und Nutzer), Messung zuerst (ein `wrangler tail` +
curl), kleine rücknehmbare Schritte; nicht wiederholen: `staticAssetsIncrementalCache` +
`enableCacheInterception` (1102 überall), `"remote": true` am D1-Binding (Build kaputt). CPU-Senken im Code
suchen (Prisma-Client je Request, Auth-Lookup, Abfragen je Sektion).

## Welle 2 (nach Welle 1)
7. Integration, Sammelpush, Live-Sichtprüfung (Chrome vorn). 8. /bewerten/apples-bananas speichern; Task 8
Rest (Testblüte). 9. Aufräumen: `three`, bewegung/blaetter.ts, components/story/Apotheken.tsx.
10. `vorschlagBisAm` im Admin setzbar; `useHydriert` für Anmelde-/Registrier-/Profilformular.
11. /produkte → /blueten mit Weiterleitungen (33 Dateien verweisen auf /produkte).

## Welle 3 und Abschluss
12. Caching v2 ab Schritt 0 (nach Freigabe). 13. i18n in Wellen (nach Freigabe von Spec und Plan).
14. Abschluss-Review über alles (Code-Review, Live-Stichprobe, npm audit einmal, HANDOFF stimmig).
