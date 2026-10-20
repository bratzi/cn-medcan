# Vorrendern im Build, Blütenseite in voller Breite, Startseite kompakt

**Auftrag (Nutzer 2026-10-20, Session 80, sinngemäß):**
- Startseite: „Was das Datenblatt verspricht, prüfen wir nach.“ darf die Strain-Suche nicht überlagern
  (Fix b7c2ced ist live und geprüft). Nach der Sortenwahl hängt der Block „Das bewerten wir“ allein
  darunter: weg damit, die Bewertung beginnt direkt unter dem Explorer, kompakter.
- Blütenseite: Blätter und Note ragen manchmal aus der Karte. Sortieren können (meist bewertet usw.),
  nicht nur filtern. Karte: Name oben, dann Bild; statt Terpenen die Geschmäcker und ob die Community sie
  bestätigt. Desktop: Raster über die volle Breite, Filter und Sortierung ein- und ausblendbar, mehr als
  drei Spalten, Spaltenzahl passt sich dem Bildschirm an.
- Befund dieser Session (Controller): `/blueten` liefert live Error 1102. Ursache siehe Strang 1.

**Specs, auf denen das aufbaut:**
- `docs/superpowers/specs/2026-10-01-statische-seiten-sprache-in-url-design.md` (4.3: „Gerendert wird beim
  ersten Aufruf, nicht im Build (der Build hat weder D1 noch Secrets)“). Strang 1 hebt genau das auf.
- `docs/superpowers/specs/2026-10-20-bluetenseite-katalog-im-browser-design.md` (Blütenseite, Katalog im Browser).

## Global Constraints

- Cloudflare Workers **Free**, nie kostenpflichtig (kein Paid-Plan, kein R2). CPU-Grenze 10 ms je Anfrage.
  Live belegt (Observability 2026-10-20 19:45–20:30 UTC): 6 von 8 Anfragen `GET /blueten` mit
  `exceededCpu` bei genau 10 ms CPU, 2 erfolgreiche mit 1033 ms. Ein Seitenbau im Worker ist damit ein
  Glücksspiel. Ziel: **kein Seitenbau im Request eines Besuchers.**
- Kein lokales `next dev`, `next build`, `opennextjs-cloudflare build/preview` (Dauerregel des Nutzers).
  Lokal erlaubt: `npm test`, `npm run typecheck`, `npm run lint`, `npm run farben`, `npx tsx --test <datei>`,
  `npx wrangler d1 execute|export … --remote` nur lesend.
- Regelwerke: `.claude/skills/edge-stack-master.md` (Worker, Caching, Bindings nur über `lib/cloudflare.ts`),
  `.claude/skills/ui-design-engine.md` (8px-Leiter, nur semantische Tokens, Handschrift-Regeln, Pillen
  `rounded-full`, Karten eckig, Touch-Ziele ≥ 44 px, kein Zustand nur über Farbe).
- Wording: nie „Ware“ (Blüte/Strain), nie „Stärke“ (Variante). Keine Geviert- oder Gedankenstriche als Trenner.
- Texte in `lib/i18n/de.ts` und `lib/i18n/en.ts` (Typ `lib/i18n/typen.ts`), keine Literale in Komponenten
  (Test `tests/i18n-literale.test.ts`).
- Commits auf Deutsch in Prosa, Ende mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Kein Push. Der Controller merged nach `main` und pusht.

## Stränge (parallel, je eigener Worktree)

| Strang | Task | Dateien (Schwerpunkt) | Berührt andere Stränge |
|---|---|---|---|
| 1 | Task 1 Vorrendern im Build + Revalidierung ohne Seitenbau im Request | `package.json`, `scripts/cf-build.mjs` (neu), `lib/i18n/vorrendern.ts` (neu), `lib/i18n/revalidiere.ts`, je statische `app/[lang]/**/page.tsx` (nur `generateStaticParams`), Tests | `app/[lang]/blueten/page.tsx` mit Strang 2 (andere Zeilen) |
| 2 | Task 2 Blütenseite voll | `app/[lang]/blueten/page.tsx` (Container), `components/katalog/*`, `lib/katalog/*`, i18n, Tests | s. o.; i18n mit Strang 3 nicht (Strang 3 ohne Texte) |
| 3 | Task 3 Startseite kompakt | `components/story/AromaWechsel.tsx`, `components/story/AromaSektion.tsx`, `components/review/NoteUndErkundung.tsx` | keine |

---

### Task 1: Vorrendern im Build, Revalidierung als stale-while-revalidate

**Skills:** `edge-stack-master`, `cloudflare:wrangler`, `cloudflare:nextjs-on-cloudflare`, `cloudflare:workers-best-practices`, `cloudflare-d1`, `superpowers:systematic-debugging`, `superpowers:test-driven-development`, `superpowers:verification-before-completion`

**Ursache (belegt):** Workers Builds baut mit `npx prisma generate && npm run cf-build` und deployt mit
`npx opennextjs-cloudflare deploy`. Das Build-Log (Build ea50593d, Commit b7c2ced) zeigt
`Successfully populated cache with 5 entries`: keine Seite unter `/[lang]` ist vorgerendert
(`○ /[lang]/blueten` ohne Pfade, weil kein `generateStaticParams`). Die KV-Schlüssel des
Inkrement-Caches tragen die Build-ID (`incremental-cache/<BUILD_ID>/…`), also ist nach jedem Deploy jede
statische Seite kalt und wird im ersten Besucher-Request gebaut (Startseite 700 bis 1300 ms CPU,
`/blueten` 1033 ms). Zusätzlich: `revalidiereSprachen()` (`lib/i18n/revalidiere.ts`) ruft
`revalidatePath`; OpenNext 1.20.6 behandelt so markierte Einträge als abgelaufen (`hasBeenRevalidated`
→ Cache-Miss → Seitenbau im Request), während `revalidateTag(tag, "max")` sie nur als stale markiert
(`isStale` → alte Seite ausliefern, Neubau im Hintergrund; `node_modules/@opennextjs/aws/dist/adapters/cache.js`
Zeilen 78–100, `dist/utils/cache.js`).

**Ziel:**
1. Der Build rendert die statischen Seiten beider Sprachen mit echten Daten vor; `opennextjs-cloudflare
   deploy` legt sie in KV. Nach einem Deploy baut kein Besucher-Request eine Seite.
2. Nach Datenänderungen (Bewertung speichern usw.) werden Seiten nur noch als stale markiert: der Besucher
   bekommt die bisherige Seite, der Neubau läuft im Hintergrund (scheitert er am CPU-Limit, bleibt die alte
   Seite stehen, kein 1102 für den Besucher).

**Vorgehen (verbindlich, Details nach eigenem Urteil):**
- `scripts/cf-build.mjs` (neu, Node ESM, ohne neue Abhängigkeiten), `package.json`: `"cf-build": "node scripts/cf-build.mjs"`.
  Ablauf:
  1. Nur wenn `process.env.WORKERS_CI === "1"` oder `process.env.VORRENDERN_DATEN === "1"`:
     `npx wrangler d1 export cn-medcan-db --remote --output <tmp>/d1.sql`, dann
     `npx wrangler d1 execute cn-medcan-db --local --file <tmp>/d1.sql` (lokaler Zustand unter
     `.wrangler/state`, den `getPlatformProxy` im Build liest; vorher den alten lokalen Zustand der DB
     verwerfen, damit kein Doppelimport scheitert). Danach Plausibilität lokal prüfen
     (`SELECT count(*) FROM strains WHERE aktiv = 1` > 0). Nur bei Erfolg `VORRENDERN=1` setzen.
  2. `opennextjs-cloudflare build` mit `VORRENDERN` im Env des Kindprozesses ausführen, danach
     `node scripts/bundle-env-bereinigen.mjs` (wie bisher).
  3. Scheitert Export, Import oder Prüfung: deutliche Warnung ins Log (`[vorrendern] …`), Build ohne
     `VORRENDERN` weiter (heutiges Verhalten). Scheitert der eigentliche Build: Exit-Code ≠ 0.
  - Vor dem Schreiben prüfen: `npx wrangler d1 export --help` und `d1 execute --help` der installierten
    Version (4.136.3), Flags nicht raten. Der Export lief in dieser Session als Lesezugriff noch nicht;
    lokal einmal ausprobieren (nur `--remote` lesend, Ausgabe nach `%TEMP%`/Scratch, nicht ins Repo).
- `lib/i18n/vorrendern.ts` (neu): `export function sprachParameter(): { lang: Sprache }[]` → bei
  `process.env.VORRENDERN === "1"` alle `SPRACHEN` als `{ lang }`, sonst `[]` (dann gilt wie heute:
  Seite beim ersten Aufruf).
- `export function generateStaticParams() { return sprachParameter(); }` in den statischen Seiten, deren
  Inhalt nur aus D1 und Code kommt: `app/[lang]/page.tsx`, `app/[lang]/blueten/page.tsx`,
  `app/[lang]/reviews/page.tsx`, `app/[lang]/neu/page.tsx`, `app/[lang]/jury/page.tsx`,
  `app/[lang]/jury/team/page.tsx`, `app/[lang]/jury/favourites/page.tsx`, `app/[lang]/zugang/page.tsx`,
  `app/[lang]/ig/page.tsx` (vorher prüfen, ob eine davon Secrets/`requireVar` beim Rendern liest; solche
  Seiten auslassen und im Report nennen). **Nicht** `impressum`/`datenschutz` (Secret `IMPRESSUM_JSON`
  fehlt im Build). Seiten mit eigenen Parametern (`jury/[slug]`, `reviews/band/[band]`,
  `jury/seite/[nummer]`, `jury/ausgabe/[slug]`) nur, wenn sie schon `generateStaticParams` haben
  (dann `lang` ergänzen), sonst auslassen.
- `revalidiereSprachen(pfad, typ)` so umbauen, dass Seiten stale statt abgelaufen werden. Erst in
  `node_modules/next/dist/docs/` und im Next-16.3.6-Code nachlesen, was `revalidatePath` und
  `revalidateTag(tag, profile)` an den Cache-Handler melden, und wie OpenNext 1.20.6 (`d1NextTagCache`,
  `isStale`, `hasBeenRevalidated`) das unterscheidet. Gewünscht: dieselben Seiten wie bisher werden
  markiert, aber mit stale-while-revalidate-Wirkung. Belege die gewählte Lösung im Report mit Datei:Zeile.
  Wenn es keinen sauberen Weg gibt: im Report begründen, nichts Halbes einbauen.
- Tests (node:test wie im Projekt): `sprachParameter()` mit/ohne `VORRENDERN`; dass jede genannte Seite
  `generateStaticParams` exportiert und impressum/datenschutz nicht (Quelltext-Test wie in
  `tests/startseite-statisch.test.ts`); die Entscheidungslogik von `scripts/cf-build.mjs` als reine
  Funktion getestet (Export ok/fehlgeschlagen → Env mit/ohne `VORRENDERN`), ohne echte Prozesse.
- Doku: Abschnitt in `.claude/skills/edge-stack-master.md` (Caching) und Nachtrag in der Spec
  2026-10-01 (4.3), dass der Build jetzt mit D1-Abzug vorrendert und warum (CPU-Befund oben).

**Akzeptanz:** `npm test`, `npm run typecheck`, `npm run lint` grün. Report nennt: geänderte Seiten, die
ausgelassenen mit Grund, die Revalidierungs-Lösung mit Belegen, und was erst der Workers Build zeigt
(Export-Recht des Build-Tokens, Laufzeit). Erwartung im Build-Log nach dem Push:
`[vorrendern]`-Zeilen und deutlich mehr als 5 Cache-Einträge.

---

### Task 2: Blütenseite in voller Breite, Sortierung, Filter ein- und ausblendbar, Karte neu

**Skills:** `ui-design-engine`, `frontend-design`, `better-layout`, `hicks-law`, `fitts-law`, `law-of-proximity`, `critique-information-density`, `emil-design-eng`, `better-accessibility`, `better-writing`, `react-best-practices`, `edge-stack-master`, `superpowers:test-driven-development`

**Ist (Code):** `app/[lang]/blueten/page.tsx:38` begrenzt auf `max-w-7xl`; `KatalogAnsicht.tsx` hat am
Desktop eine feste Filterspalte `aside.w-72` und **keine Sortierung** (nur `MobilLeiste.tsx:73-81` hat sie);
Raster `grid-cols-[repeat(auto-fill,minmax(min(16rem,100%),1fr))]` ergibt bei 1280 px drei Spalten.
`KatalogKarte.tsx`: Reihenfolge Bild, Community-Zeile, Name, Terpen-Chips, Fuß.

**Soll:**
1. **Volle Breite:** `main` der Blütenseite ohne `max-w-7xl` (Seitenrand `px-4 sm:px-8`), Kopf (h1, Einleitung)
   bleibt im Lesemaß.
2. **Werkzeugleiste ab `lg`** über dem Raster, eine Zeile: Knopf „Filter“ (mit Anzahl aktiver Filter,
   `aria-expanded`, `aria-controls` auf die Filterspalte) – Umschalter Blüten/Strains (bestehend) –
   Trefferzahl – rechts „Sortieren“ als `<select>` mit `SORTIERUNGEN`/`texte.sortierungen` (dieselbe Liste
   wie `MobilLeiste`; gemeinsame Komponente statt Doppelcode, wenn sauber möglich).
3. **Filterspalte ein- und ausblendbar** ab `lg`: Standard eingeblendet ab 1536 px (`2xl`), darunter
   ausgeblendet; die Wahl des Besuchers merkt sich `localStorage` (Schlüssel `bt-katalog-filter`, alle
   Zugriffe in try/catch, ohne Speicher gilt der Standard). Vor der Hydration entscheidet CSS
   (kein Springen, kein Hydration-Fehler). Ausgeblendet nimmt das Raster die ganze Breite.
4. **Raster:** `repeat(auto-fill, minmax(min(15rem, 100%), 1fr))`, `gap-6`. Ergebnis: bei 1280 px mit
   ausgeblendetem Filter mindestens 4 Spalten, bei 1536 px mit Filter mindestens 4, bei 1920 px mit Filter
   mindestens 5. Mobil unverändert (MobilLeiste + Schublade).
5. **Karte** (`BlueteKarte` und `StrainKarte`, gemeinsames Gerüst `KartenRahmen`): Reihenfolge
   **Name (h3) → Bild → Community-Zeile → Geschmäcker → Fuß**. Der Link-Überzug über die ganze Karte bleibt.
   Community-Zeile darf bei 15rem Kartenbreite nicht überstehen (Note `font-hand text-vermerk`, Blätter
   `BlattAnzeige` schrumpfen, Stimmen-Text bricht um; prüfen mit langem Text „123 Stimmen“).
   **Terpen-Chips entfallen auf der Karte.**
6. **Geschmäcker mit Community-Bestätigung** (neue Zeile, eigene Komponente, gedruckt, keine Handschrift):
   - Datenblatt-Geschmäcker: die Hauptgeschmäcker der Top-3-Terpene der Blüte (`terpene[].geschmack`,
     Strain-Karte: `terpenGeschmack`), eindeutig, in Rangfolge, höchstens 3.
   - Community-Werte: neues Feld je Kultivar im Katalog-JSON: `gm` = `kultivar_kennwerte.geschmack_median`
     (JSON-Objekt Achse → Median 0–5, Schlüssel klein wie `{"suess":4.5,"erdig":3.25,…}`; Achse ↔
     `GeschmacksKategorie` über `GESCHMACKS_ACHSEN` in `lib/query/bewertung.ts`), `null` ohne Kennwerte.
     In `lib/katalog/laden.ts` per SQL als `json(kk.geschmack_median)` einbetten (kein Parsen im Worker).
   - Status je Datenblatt-Geschmack: **bestätigt**, wenn Community-Median ≥ 1,25 (die Hälfte des
     Sweet Spots 2,5, Skala laut `lib/bewertung-v2.ts` QUALITAET_MITTE); **nicht bestätigt**, wenn
     Kennwerte da sind und der Median < 1,25; **offen**, wenn keine Community-Kennwerte.
   - **von der Community gefunden:** Achsen außerhalb des Datenblatts mit Median ≥ 2,5, höchstens 2.
   - Darstellung: Pille je Geschmack (`rounded-full`, Text gedruckt) mit Markerzeichen, das ohne Farbe
     lesbar ist: bestätigt „✓“, nicht bestätigt „✕“, offen „○“, gefunden „+“; dazu `sr-only`-Text
     („Süß, von der Community bestätigt“). Farbe nur zusätzlich, nur semantische Tokens.
     Eine kurze Legende einmal über dem Raster oder als `InfoKnopf` (bestehende Komponente
     `components/ui/InfoKnopf.tsx`), nicht in jeder Karte.
   - Logik als reine Funktion in `lib/katalog/` mit Tests (alle vier Status, Schwellen 1,25 und 2,5
     als benannte Konstanten, höchstens 3 + 2).
7. **KV-Schlüssel** `cn-katalog/oeffentlich-v1` → `cn-katalog/oeffentlich-v2` (`lib/katalog/kv.ts`), weil
   sich die Form ändert. Der Browser muss Katalog-JSON ohne `gm` (Cache bis 300 s) vertragen: dann „offen“.
8. Sortierung bleibt im URL-Zustand (`sortierung`, bestehend), Standard `community`.

**Akzeptanz:** `npm test`, `npm run typecheck`, `npm run lint`, `npm run farben` grün; neue Tests für die
Geschmacks-Logik, `gm` im SQL (Quelltext-Test wie bestehende Katalog-Tests), KV-Schlüssel v2, Reihenfolge
der Karte (Name vor Bild), Werkzeugleiste mit Sortierung am Desktop. Checkliste
`ui-design-engine` Abschnitt 11 im Report abgehakt.

---

### Task 3: Startseite kompakt

**Skills:** `ui-design-engine`, `better-layout`, `law-of-proximity`

**Soll:** In `components/story/AromaWechsel.tsx` entfällt der `SortenKopf` als `bild` von `NoteUndErkundung`
(Block „Das bewerten wir“: Handschrift-Name, Typ, THC/CBD, Vertreiber, Terpene laut Datenblatt; 637 px
hoch). Die Bewertung (Gesamtnote, dann Overall/Terpz/Qualität) folgt direkt dem Explorer. Ungenutzte Props
(`kopfTexte`) und Importe entfernen; `AromaSektion` reicht sie nicht mehr. Abstand zwischen Gesamtnote und
Erkundung auf der Startseite `gap-16` statt `md:gap-24` (Bewertungsformular unverändert).
Live-Prototyp per Browser-MCP am 2026-10-20 bestätigt die Wirkung.

**Akzeptanz:** Tests und Typen grün; Quelltext-Test, dass `AromaWechsel` keinen `SortenKopf` mehr rendert.
