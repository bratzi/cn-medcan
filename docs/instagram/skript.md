# Instagram-Entwürfe per Skript (ohne Cowork)

`scripts/ig-entwuerfe.ts` holt neue Betreiber-Bewertungen aus dem IG-Feed, fotografiert die Karte mit Microsoft Edge
(headless, 1080 × 1350) und legt je Bewertung einen **Entwurf** in Publora an, mit Bild und Caption. Es veröffentlicht
nie selbst: Du öffnest den Entwurf in Publora, prüfst ihn und planst ihn ein.

## Voraussetzungen

- `.env` mit `PUBLORA_API_KEY` und `INSTAGRAM_PLATFORM_ID`
- `.env.ig-feed` mit `IG_FEED_KEY` und `IG_FEED_URL`
- Microsoft Edge (auf Windows 11 vorhanden)

Alle drei Dateien bleiben lokal und sind gitignored, ebenso `.ig-gepostet.txt` und `tmp/ig/`.

## Aufrufe

| Befehl | Wirkung |
|---|---|
| `npx tsx scripts/ig-entwuerfe.ts --probe` | Karten als PNG und Captions als TXT nach `tmp/ig/`, nichts an Publora |
| `npx tsx scripts/ig-entwuerfe.ts --nur-merken` | alle aktuellen Bewertungen als erledigt merken, ohne Entwurf |
| `npx tsx scripts/ig-entwuerfe.ts` | neue Bewertungen als Publora-Entwurf, höchstens 3 je Lauf |
| `npx tsx scripts/ig-entwuerfe.ts --max=1` | eigene Obergrenze |

Bei einem Fehler bricht das Skript ab und wiederholt nichts. Erledigte Ids stehen in `.ig-gepostet.txt`; wer eine
Bewertung erneut posten will, löscht ihre Zeile dort.

## HWG

Caption und Karte zeigen nur Aroma, Aussehen, Charge und Note. Das Zitat aus der Notiz entfällt ganz, sobald der
HWG-Filter oder die strengere Instagram-Sperrliste in `lib/ig-karte.ts` anschlägt (Wirkung, Rausch, Konsum,
Beschwerden, THC/CBD). Den Entwurf trotzdem immer selbst gegenlesen.

## Grenzen

- Publora Free: 15 Posts im Monat.
- Die Instagram-Verbindung in Publora läuft am **13. Dezember 2026** ab: vorher unter Channels „Reconnect“.

## Optional: täglich automatisch

In der Windows-Aufgabenplanung eine Aufgabe für deinen Benutzer anlegen (keine Admin-Rechte nötig), zum Beispiel
täglich um 19:00 Uhr, in PowerShell:

```powershell
schtasks /Create /SC DAILY /ST 19:00 /TN "Book of Terpz IG-Entwuerfe" /TR "cmd /c cd /d C:\cn && npx tsx scripts\ig-entwuerfe.ts >> tmp\ig\lauf.log 2>&1"
```

Wieder entfernen: `schtasks /Delete /TN "Book of Terpz IG-Entwuerfe" /F`.

## Cloud-Agent

Seit 2026-10-14 läuft zusätzlich eine Claude-Code-Routine in der Cloud (Mo, Mi, Fr). Sie nutzt dieselben Skripte
und legt auch Themen-Posts an. Anweisung: `docs/instagram/agent-anweisung.md`, Themen: `docs/instagram/themen.md`,
Lagebericht: `npx tsx scripts/ig-lage.ts`.
