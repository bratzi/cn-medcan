# Caching gegen Fehler 1102 — Design

**Stand:** 2026-09-25 (Session 20) · **Nutzerentscheid:** Caching statt Workers Paid; Daten dürfen bis 5 Minuten alt sein.

## Problem

Free-Plan: 10 ms CPU je Request. Alle Hauptseiten sind `force-dynamic` und rendern je Aufruf mit
Prisma-7-WASM-Abfragen (gemessen bis ~210 ms: /produkte 212, /reviews 201, /umfragen 78). Folge: live
Fehler 1102 „Worker exceeded resource limits“, auch auf der Startseite.

## Ziel und Erfolgskriterium

- Startseite, `/produkte`, `/produkte/[slug]`, `/reviews`, `/umfragen`, `/apotheken` lösen im Normalfall
  (Cache warm) **keine** D1-Abfrage aus und bleiben laut `wrangler tail` unter 10 ms CPU.
- Geteilte Daten dürfen bis **300 s** alt sein. Nutzerbezogenes (eigene Stimme, Preise je Rolle, Konto-Zähler,
  Freigabestatus) ist nie gecacht und immer aktuell.
- Kosten: nur Free-Plan-Dienste mit harter Grenze (KV, D1, Regional Cache). Kein R2, kein Paid.

## Ansatz: Next-16-Cache-Components

1. `next.config.ts`: `cacheComponents: true`. Alle `export const dynamic = "force-dynamic"` entfallen.
2. **Geteilte Lesefunktionen** in `lib/query/` (Katalog, Blütendetail ohne Preise, Reviews, Umfragen mit
   Stimmenzahlen, Apotheken, Startseiten-Sektionen) bekommen `"use cache"`, `cacheLife({ revalidate: 300 })`
   und `cacheTag(...)` mit einem Tag je Bereich: `katalog`, `bluete:<slug>`, `reviews`, `umfragen`, `apotheken`.
   Sie lesen weder Cookies noch Header noch Session.
3. **Nutzerbezogene Teile** werden eigene async Server Components in eigenen `<Suspense>`-Grenzen (dynamische
   Löcher im gecachten Gerüst): eigene Stimme/Abstimm-Button, Preisanzeige, Freigabehinweis. Nur sie lesen
   Session bzw. Gate-Rolle und fragen D1 ab — klein, eine Abfrage je Loch.
4. **Filter auf `/produkte`** (`searchParams`): das Gerüst ist statisch, die Trefferliste ist eine gecachte
   Funktion mit dem normalisierten Filter als Cache-Schlüssel (Argumente von `"use cache"`).
5. **Invalidierung:** Admin-Aktionen (Mitglied-/Vorschlagsfreigabe, Umfragephase, Review-Freigabe) rufen
   zusätzlich zu `revalidatePath` `revalidateTag(<bereich>)`. Stimmen und Vorschläge invalidieren nicht — die
   Zählstände dürfen 5 Minuten nachlaufen (Nutzerentscheid), die eigene Stimme ist dynamisch.
6. **OpenNext** (`open-next.config.ts`): Incremental Cache = KV `NEXT_INC_CACHE_KV` hinter Regional Cache,
   Tag-Cache = D1 (`NEXT_TAG_CACHE_D1`, eigene kleine DB oder Tabelle laut OpenNext-Doku), Queue nur falls für
   Revalidierung nötig und im Free-Plan hart begrenzt, sonst `WORKER_SELF_REFERENCE`. Bindings in
   `wrangler.jsonc` mit Kommentar.
7. `edge-stack-master.md` §6 um die Regel ergänzen: geteilte Daten nur über `"use cache"`-Funktionen, Nutzer-
   bezogenes nur in Suspense-Löchern; nie Session in einer gecachten Funktion.

## Risiken und Absicherung

- **OpenNext 1.20 und Cache Components:** unbelegt. Plan-Schritt 1 ist ein Spike an **einer** Seite
  (`/apotheken`, kaum nutzerbezogen), gepusht und per `wrangler tail` gemessen. Trägt es nicht, Rückfall auf
  klassisches ISR (`revalidate = 300` je Seite, Nutzerbezogenes über eine kleine Route clientseitig) — dann
  Spec anpassen, bevor weitere Seiten umgebaut werden.
- **Datenleck über den Cache:** Eine gecachte Funktion, die Preise oder Rolle einbezieht, würde Preise an alle
  ausliefern. Absicherung: Test, der für jede `"use cache"`-Datei prüft, dass sie `lib/session`,
  `lib/query/fachkreis`, `cookies` und `headers` nicht importiert; `bestandSichtbarkeit()` bleibt die einzige
  Sichtbarkeitsgrenze und wird nur in dynamischen Löchern mit Preisen aufgerufen.
- **KV-Free-Grenzen** (1000 Schreibvorgänge/Tag): bei 300 s und ~6 Seiten plus Filterkombinationen im Rahmen;
  Filterliste zusätzlich mit begrenztem Schlüsselraum (normalisierte, sortierte Parameter).
- **Kalter Cache:** Der erste Aufruf nach Ablauf rendert noch teuer; das ist gelegentlich und wird von
  Cloudflare toleriert. Stale-while-revalidate liefert dabei die alte Fassung aus.

## Tests

- Bestehende 191 Tests bleiben grün.
- Neuer statischer Test „keine Nutzerdaten im Cache“ (siehe Risiken).
- Reine Funktion für die Normalisierung des Filter-Schlüssels mit Test.
- Live: `wrangler tail` je Seite, warm und kalt; Sichtprüfung, dass Preise ohne Anmeldung fehlen und mit
  Anmeldung erscheinen, und dass die eigene Stimme sofort angezeigt wird.

## Nicht Teil dieser Arbeit

Preisbindung an die Mitgliedsrolle und Ausbau von `FACHKREIS_PASSWORD` (Block B Schritt 7) — das Preis-Loch
wird so gebaut, dass es die Rolle an einer Stelle liest und der Umstieg dort passiert.
