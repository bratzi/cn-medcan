# Redesign nach Referenz (moneyincheck.org) — Spec

Freigegeben vom Nutzer am 2026-09-24 („ja“). Mobil erst später. Kostenlos, nur freie Ressourcen.

## 1. Typografie
- Eine Serif für alles Gedruckte: **Newsreader** (Google Fonts, OFL, variabel 200 bis 800, kursiv, opsz). Ersetzt Cormorant.
- Harte Skala: `text-riesig` (Auftakt-Titel, clamp 6 bis 18rem, 200), `text-titel` (200), `text-kapitel` (200),
  Manifest in `text-manifest` (clamp 3 bis 6.25rem, 200). Betonung nur kursiv; 800 nur für kurze Kapitelmarken.
- Geist für Bedienung und Katalog, Geist Mono für Zahlen.
- Inspiration bleibt Logo und Community-Stimme und wird zusätzlich **Textur**: blasse Messwert-Notizen im Hintergrund
  (`text-notiz`, ab `lg`, aria-hidden).

## 2. Ebenen
Karopapier und Notizen hinten, Schrift in der Mitte, Schwarzweiß-Freisteller zwischen und vor den Buchstaben, 3D-Blätter
über allem (Welle 2). Auftakt: riesiger grüner Serif-Titel, Handschrift-Wortmarke als Signatur (bleibt h1-Inhalt der
Marke). Bilder im Satz statt als Block darunter.

## 3. Bilder (Welle 2)
Schwarzweiß-Freisteller (Pexels plus rembg), AVIF/WebP bis 2400 px. Grün nur in der Schrift.

## 4. Bewegung
Manifest Wort für Wort von `text-muted` zu `text` (scroll-gekoppelt), Schluss Kontur zu Füllung, Notizen erscheinen,
3D-Blätter (Three.js, nachgeladen, Welle 2). Bedienung, Katalog, Formulare nicht animiert. Reduzierte Bewegung: statisch.

## 5. Wellen
1. Typografie und Startseite. 2. Bilder und 3D. 3. Unterseiten.

## 7. Referenz choreograffiti.com (Nachtrag 2026-09-24)
Übernommen wird nur der Stil des Kopf-Schriftzugs: riesig, von Rand zu Rand, angeschnitten, sitzt im Hintergrund, Bild
davor. Umsetzung in unserer Handschrift: Wortmarke als h1 in `text-plakat`, dazu je Sektion ein Buzz-Satz in
`text-kulisse` blass dahinter. Die Handschrift-Notizen im Raster entfallen, das Notizbuch-Bild ebenso.

## 8. Bühnenvideo (Nutzervorgabe)
Auftakt über Pexels 7684711 (Hände, Blüte), bildschirmfüllend, Sektion `buehne-dunkel`, Film zoomt beim Scrollen, Wortmarke gleitet weg.

## 9. Farbe und Manifest
Schwarzweiß entfällt: Freisteller, Fotos und Videos in echten Farben, mehr Grün und Lila. Manifest als langer Text über die
ganze Sektion, Reveal Wort für Wort (blass und versetzt bis Tinte, scrub). Aussehen, Geruch, Restfeuchte als kleine runde
Bilder, um die der Text fließt.

## 10. Wir-Stimme und Fuß
Texte in der Wir-Form, gesetzte Plätze nicht erwähnt. Die Wortmarke im Fuß liegt im Fuß hinter dem Inhalt, nicht darunter.

## 14. Aroma-Karte
`components/review/AromaKarte.tsx` mit `lib/aromakarte.ts`. Poster-Karte: links 8 Geschmacksachsen, rechts Terpene,
dazwischen Bögen. Schalter „Karte“/„Netz“ morpht animiert per `requestAnimationFrame` (~900 ms). Zwei Reihen:
„Laut Hersteller“ (Grün, `herstellerProfil()` aus den Strain-Terpenen, gewichtet nach Konzentration, sonst Rang) gegen
„Laut Community“ bzw. „Diese Bewertung“ (Lila). Eingesetzt in der Doppelseite, auf der Produktseite („Stimmt das
Profil?“) und auf der Startseite (`components/story/AromaSektion.tsx`). Aufklärung Sativa/Indica in
`components/review/Aufklaerung.tsx`, ohne Heilversprechen (§10 HWG).

## 15. Terpen-Intensität
Spalte `reviews.terpen_intensitaet` (Migration `migrations/0004_terpen_intensitaet.sql`, remote angewandt 2026-09-24):
JSON Terpenname → 1..5, 3 = Sweet Spot. Parsen und Mitteln in `lib/query/bewertung.ts`, Anzeige
`components/review/SweetSpot.tsx`.

## 16. Startseite
Buzz-Sätze nur noch in drei Sektionen (was drin ist, wir stimmen ab, stimmt das?), `text-kulisse` größer und mittig.
Betonungen im Manifest in Handschrift.

## 17. Bewertungsformular
`/bewerten/[slug]` (`app/bewerten/aktionen.ts`, `lib/bewertung-eingabe.ts`, `components/review/BewertungsFormular.tsx`
mit Live-Vorschau der AromaKarte). Mitglieder: `freigegeben = false`; Betreiber (ADMIN): redaktionell, sofort sichtbar.
Freigabe in `/admin` (`components/admin/BewertungFreigabe.tsx`).

## 18. 3D-Blätter
`components/story/bewegung/blaetter.ts`. Three.js dynamisch geladen, nur ab Tablet und ohne reduzierte Bewegung.
22 selbst gezeichnete siebenfingrige Blätter (Canvas, Grün und Lila), fixe Leinwand `z-40 pointer-events-none`.
Scrollgeschwindigkeit (Lenis) treibt den Wind.

## 6. Regeländerungen
- `accent` darf zusätzlich den Auftakt-Titel färben (einzige Schrift in Grün).
- Handschrift darf als aria-hidden-Textur im Hintergrund stehen (nur Grade ≥ 32 px).
