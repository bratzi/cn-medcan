# Eine Seite je Strain (Plan, 2026-10-22)

Nutzerentscheid 2026-10-22: Vertreiber ist Nebensache. Eine statische Leseseite je Strain (ca. 854 statt
3064 Dateien, Build ~8 statt ~25 min), Vertreiberwahl nur im Bewertungsformular.

## Schritte (TDD, je Schritt Test zuerst)

1. **Tor und Dateien.** `lib/seiten-tor.ts`: `/blueten/<slug>` → `/_seiten/<sprache>/blueten/<slug>/index.html`,
   `?vertreiber=`/`?alle=` wählen keine Datei mehr. Neu `alteStrainAdresse(pfad, suche)`: `/blueten/<slug>/<auswahl>`
   und `?vertreiber=`/`?alle=` → 308 auf `/blueten/<slug>` (übrige Query bleibt). `lib/tor.ts` ruft sie vor der
   Dateiwahl (kein D1, nur Regex). `scripts/seiten-in-assets.mjs`: `<sprache>/blueten/<slug>.html` wie feste Seiten
   nach `_seiten/.../index.html`. Tests: `seiten-tor`, `seiten-in-assets`, neuer Tor-Test.
2. **Routen.** `app/[lang]/blueten/[slug]/[auswahl]` und `lib/strain-varianten.ts` entfallen.
   `[slug]/page.tsx` wird statisch (`force-static`, `generateStaticParams` je Sprache und Slug aus
   `lib/strain-slugs.ts`, `dynamicParams = true` für neue Sorten), liest keine Suchparameter mehr. Alte
   Produktadressen leitet die Seite weiter wie bisher (ohne Query). Test `vorrendern` anpassen.
3. **Strain-Seite.** `SortenSeite({ slug })`: Buch immer über alle Vertreiber, Angaben der meistbewerteten Blüte,
   HerstellerLeiste und Filter „Nur X / Alle“ entfallen (Komponenten und Tests löschen). Links mit `?vertreiber=`
   (Buch, Explorer, Feed, `bewertungHref`) zeigen auf `/blueten/<slug>`.
4. **Formular.** `WareWahlFeld`: Vertreiber als `<select>` (Pflicht, ohne Vorwahl bei mehreren Vertreibern),
   Variante wie bisher. Insel fragt ohne Vertreiber; `ichStrain` lädt dann die jüngste eigene Bewertung der Sorte
   (Prisma- und Roh-Weg), Vorbelegung trägt `vertreiberId`, die Maske wählt diesen Vertreiber vor.
5. **Katalog.** Vertreiber-Chip, -Feld und -Filter aus `/blueten`; alte `?vertreiber=` im Katalog wird ignoriert.
   Profil „Deine Vertreiber“ ohne Katalog-Link.
6. **Texte.** Hinweis nach dem Speichern „etwa 10 Minuten“ (Build ~8 min plus Deploy); Edge-Regelwerk §6.

Keine Migration nötig (Abfragen über bestehende Spalten). Kein Mehraufwand im Request: Weiterleitung ist ein Regex im Tor.
