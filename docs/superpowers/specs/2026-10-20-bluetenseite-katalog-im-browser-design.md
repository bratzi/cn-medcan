# Blütenseite: Katalog im Browser, neue Filter, Community vorn

**Stand:** 2026-10-20 (Session 79) · **Status:** Entwurf zur Freigabe
**Auftrag (Nutzer, S78):** Filter mobil viel zu groß; Filtern und Umblättern laden neu; Filter an die neuen
Kriterien anpassen, hochprofessionell; Karten: Community-Bewertung vor THC/CBD.

## Entscheidungen des Nutzers (2026-10-20)

1. **Katalog im Browser.** Die Liste kommt einmal als kompaktes JSON, Filtern, Sortieren und Blättern laufen
   im Browser ohne Server-Rundweg.
2. **Mobil: Leiste und Schublade.** Schmale, mitlaufende Leiste, Filter in einer Schublade von unten.
3. **Neue Filter:** Community-Score, Terpene, Hersteller/Vertreiber (durchsuchbar), Nur bewertet.

## Ist-Zustand

- `app/[lang]/blueten/page.tsx` ist `force-dynamic`. Jede Filteränderung ruft `router.replace(…, { scroll: false })`
  (`components/produkt/FilterLeiste.tsx`), der Server rechnet neu.
- Der `Suspense`-`key` hängt am Filter. Bei jeder Änderung verschwinden Leiste **und** Liste hinter dem Spinner:
  das ist das „Neuladen“, das der Nutzer sieht.
- Zwei Ansichten: `bluete` (je Kultivar, `KultivarKarte`) und `ware` (je Handelsname, `ProduktCard`).
- Community-Kennwerte gibt es je Kultivar (`kennwerte.gesamtnoteMittel`, `anzahl`), nicht je Handelsname.
- Free-Plan: 10 ms CPU je Anfrage. Facetten sind schon per `unstable_cache` im KV gecacht.

## Ziel

Jede Filter-, Sortier- und Seitenänderung zeigt neue Treffer in unter 100 ms, ohne Spinner, ohne Sprung.
Die URL bleibt teilbar und der Zurück-Knopf funktioniert. Die Seite erzählt zuerst, was die Community sagt.

## Architektur

### Daten: eine Route, zwei Varianten

- **Route Handler `GET /api/katalog?v=<stand>`** liefert `KatalogDaten` (JSON, gzip):
  - `kultivare[]`: id, slug, name, typ, thc/cbd-Spanne, Top-3-Terpene (Name, Geschmack), Vertreiber-Ids,
    Anzahl Handelsnamen, `community: { note, stimmen } | null`, `eigeneNote | null`, Bild (Budpic-Id oder
    Herstellerbild), Geschmackskategorien.
  - `waren[]`: id, slug, handelsname, kultivarId, typ, form, thc/cbd, Vertreiber-Id, Top-3-Terpene,
    Bestrahlung, Anbauland, Bild, Verfügbarkeit (Zahl Apotheken); Preis **nur** in der Fachkreis-Variante.
  - `facetten`: Vertreiber (Id, Name, Anzahl), Terpene (Name, Anzahl), Geschmack, Typ, Form, THC-Grenzen.
- **Öffentlich:** `unstable_cache` (Tag `katalog`, `revalidate: 3600`), Antwort mit
  `Cache-Control: public, max-age=300, stale-while-revalidate=3600`. Höchstens 24 KV-Schreibvorgänge am Tag.
- **Fachkreis:** dieselbe Route mit Cookie liefert die Variante mit Preisen, `Cache-Control: private, no-store`,
  serverseitig ebenfalls per `unstable_cache` (zweiter Schlüssel). Freigabe nur über `istFachkreis()` und
  `bestandSichtbarkeit()`; der öffentliche Cache enthält nie Preise.
- **CPU-Grenze:** Der Neubau bei Cache-Fehlschlag muss unter 10 ms Worker-CPU bleiben. Deshalb baut D1 das JSON
  per `json_group_array`/`json_object` in einer oder zwei SQL-Abfragen (`$queryRaw`), der Worker reicht den
  Text nur durch. **Task 0 ist ein Spike, der das live misst**; scheitert er, fällt der Plan auf ein bei
  Import/Admin erzeugtes JSON in KV zurück (Schreiben nur bei Datenänderung).
- **Invalidierung:** Import, Admin-Änderung an Strains und neue Reviews rufen `revalidateTag("katalog")`
  zusammen mit dem bestehenden `facetten`-Tag.
- **Größe:** Ziel unter 200 KB gzip für ~700 Waren. Kurze Schlüssel sind erlaubt, Typen in `lib/katalog/typen.ts`.

### Seite

- `app/[lang]/blueten/page.tsx` wird `force-static` (je Sprache). Sie rendert Kopf, die Leiste im Grundzustand
  und als Startinhalt die **ersten 24 Kultivare ohne Filter** auf dem Server (gut für erste Ansicht und SEO).
- Eine Client-Insel `KatalogAnsicht` lädt `/api/katalog` sofort nach dem ersten Bild (`fetch` mit
  `priority: "low"`), liest den Filter aus `window.location.search` (wie `ZugangFelder`) und übernimmt dann.
  Ein Deep-Link mit Filter zeigt bis zum Laden die Leiste und ein Skelett der Kartenliste, nie einen Spinner
  über der ganzen Seite.
- **Zustand:** Filter bleibt `StrainFilter` mit dem bestehenden `parseStrainFilter`/`serialisiereFilter`
  (erweitert). Änderungen schreiben per `history.replaceState` (Filter) und `history.pushState` (Seite), kein
  Next-Router-Aufruf, also kein Server. `popstate` liest neu.
- **Filtern, Sortieren, Blättern** sind reine Funktionen in `lib/katalog/filtern.ts` (testbar ohne DOM).
  Freitext ohne Akzente, Groß-/Kleinschreibung egal, über Name, Handelsnamen, Genetik, Vertreiber.
- **Blättern:** 24 je Seite, Nummern plus Vor/Zurück. Beim Seitenwechsel springt die Liste weich an ihren
  Anfang (nicht an den Seitenanfang). Die Trefferzahl wird per `aria-live="polite"` angesagt.
- Budpic-Diashows auf Karten laden wie heute, aber erst sichtbar (`IntersectionObserver`), über eine kleine
  Route `GET /api/katalog/budpics?ids=…` (öffentlich gecacht).

### Filter (neu geordnet)

Reihenfolge nach Versprechen der Seite (Community-Bewertung), Hick: die ersten drei offen, der Rest eingeklappt.

1. **Suche** (immer sichtbar, auch in der mobilen Leiste).
2. **Community-Score:** Mindestnote als Stufenwahl (alle, ab 3, ab 3,5, ab 4, ab 4,5), dazu Schalter
   **Nur bewertet** (Kultivar hat Community-Stimmen oder eine eigene Bewertung).
3. **Terpene:** Chips mit Terpen-Icon (aus dem bestehenden Register), Mehrfachauswahl, Treffer müssen **alle**
   gewählten unter den Top 3 haben. Die acht häufigsten sichtbar, „mehr“ klappt den Rest auf.
4. **Geschmack** (bestehend, als Chips).
5. **Typ** (Indica, Sativa, Hybrid) als Segmentwahl.
6. **THC-Spanne** (bestehender Slider), CBD nur als „CBD-reich“-Schalter (CBD ≥ 1 %).
7. **Hersteller/Vertreiber:** durchsuchbare Liste mit Anzahl, Mehrfachauswahl.
8. Darreichungsform, Verfügbarkeit, Apotheke, Preis: wie heute, Preis und Apotheke nur im Fachkreis.

Jede Option zeigt die Trefferzahl, die sie ergäbe (live aus dem Katalog berechnet); Optionen mit 0 sind
abgeschwächt, nicht versteckt. Aktive Filter stehen als Chips über der Liste, einzeln löschbar, plus „alle
löschen“.

**Sortierung:** Community-Note (Standard), Anzahl Stimmen, Neueste Bewertung, Name, THC. Neue URL-Parameter:
`note` (Mindestnote), `bewertet` (bool), `terp` (Liste), `cbd` (bool). Alte Parameter bleiben lesbar.

### Layout

- **Desktop (ab `lg`):** Filterleiste links, 18rem, `sticky` unter dem Kopf mit eigenem Scrollbereich.
  Darüber nichts außer Titel und Einleitung.
- **Mobil:** Kopf der Liste wird eine **mitlaufende Leiste** (`sticky`, Höhe 56 px): Suchfeld, Knopf
  „Filter“ mit Zahl aktiver Filter, Sortierung. Der Knopf öffnet eine **Schublade von unten** (`<dialog>`,
  85 dvh, Ziehgriff, Escape, Fokusfalle, Hintergrund inert), unten fest der Primärknopf „N Treffer zeigen“
  und „zurücksetzen“. Änderungen wirken sofort auf die Liste dahinter; die Zahl im Knopf zählt mit.
- Bewegung: Schublade per CSS-Transform 250 ms (`--duration-normal`), bei reduzierter Bewegung ohne Gleiten.
  Kein GSAP, kein Lenis (Regel 7).

### Karten

- **Community zuerst:** Oben die Community-Note in `font-hand` mit Blatt-Reihe und Stimmenzahl
  („4,3 · 12 Stimmen“, gedruckt bei der Zahl der Stimmen), daneben die eigene Note, falls vorhanden.
  Ohne Stimmen: Vermerk „noch keine Stimmen“ und Link „als Erste:r bewerten“.
- Danach Name (gedruckt, nie Handschrift), Top-3-Terpene als Icons mit Namen, Geschmack.
- THC/CBD, Typ und Vertreiber rücken in eine kleine Fußzeile (`text-caption`, `text-muted`).
- Waren-Ansicht: Community-Wert des Kultivars mit Hinweis „Wert der Blüte“.
- Karten werden Client-Komponenten ohne Server-Abhängigkeit (Texte über einen schmalen Wörterbuch-Ausschnitt
  als Prop).

## Fehler und Ränder

- `/api/katalog` schlägt fehl: die Server-Startliste bleibt stehen, Hinweis mit „erneut versuchen“, Filter
  deaktiviert (nicht still kaputt).
- Ohne JavaScript: Startliste und Leiste sind da; die Leiste ist ein GET-Formular an `/blueten`, das zu einer
  serverseitigen Liste führt. **Entscheidung:** Der Nicht-JS-Weg zeigt nur die erste Seite ungefiltert plus
  Hinweis; ein zweiter Server-Pfad lohnt sich für die Zielgruppe nicht.
- Unbekannte URL-Parameter werden ignoriert, ungültige Werte fallen auf den Standard (bestehendes zod-Schema).

## Tests

- `lib/katalog/filtern.ts`: Einheitstests für jeden Filter, Kombinationen, Sortierung, Seitenzahl, Zählung je
  Option, Freitext mit Umlauten.
- `serialisiereFilter`/`parseStrainFilter`: Rundweg für neue Parameter, alte URLs bleiben gültig.
- Route: öffentliche Variante enthält kein Preisfeld (Wächter-Test über die Serialisierung).
- Quelltext-Wächter: keine `router.replace`/`router.push` mehr in der Katalog-Insel, kein `Suspense key` am Filter.
- Live (Browser-MCP): 390 px und Desktop, hell und dunkel; Filterwechsel ohne Netzanfrage (Network-Liste),
  Zurück-Knopf, Deep-Link, Schublade mit Tastatur, CPU-Zeit der Route im Cloudflare-Log.

## Nicht in diesem Umfang

- Preise und Apotheken neu gestalten (zurückgestellt, Memory „Apotheken und Preise“).
- Detailseite `/blueten/[slug]`.
- Merklisten, Vergleiche, Volltextsuche über Reviews.

## Stränge für parallele Umsetzung

- **A Daten:** Spike CPU, `/api/katalog`, Typen, Invalidierung, Budpic-Route.
- **B Logik:** `lib/katalog/filtern.ts`, Filter-Schema erweitern, Tests (hängt nur an den Typen aus A,
  die als erster Schritt festgelegt werden).
- **C Oberfläche:** Leiste Desktop, mobile Leiste und Schublade, Karten neu, `KatalogAnsicht`.
- **D Seite:** `page.tsx` statisch, Startliste, Verdrahtung, Wächter-Tests, danach Live-Prüfung.
