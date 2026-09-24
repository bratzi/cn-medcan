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

## 6. Regeländerungen
- `accent` darf zusätzlich den Auftakt-Titel färben (einzige Schrift in Grün).
- Handschrift darf als aria-hidden-Textur im Hintergrund stehen (nur Grade ≥ 32 px).
