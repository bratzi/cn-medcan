# Profil @bookofterpz

Stand 2026-10-15. Der Betreiber setzt Profil, Bio und Highlights in der Instagram-App (keine API dafür). Spec:
`docs/superpowers/specs/2026-10-15-instagram-produktmarke-design.md`. Alle Texte sind gegen `IG_SPERRE` geprüft.

## Profilfelder

| Feld | Wert |
|---|---|
| Profilbild | Signet „gB“ (`scripts/marke/signet.ts`) |
| Name | Book of Terpz \| Sortenbewertung |
| Kategorie | Website (keine Gesundheits-Kategorie) |
| Link | `https://cn-medcan.w-helwich.workers.dev/ig` |

Bio (drei Zeilen, 125 Zeichen, Limit 150):

```
Sorten ehrlich bewertet, Charge für Charge.
Die Community wählt die nächste Sorte.
Mitglied werden und mitwählen: Link unten.
```

## Highlights

Cover erzeugt `npx tsx scripts/ig-highlights.ts` (1080 × 1920 nach `tmp/ig/highlights/`). Instagram zeigt nur den
Kreis in der Mitte, die Farbe folgt der Säule.

| Highlight | Säule | Story-Ideen |
|---|---|---|
| Was ist das | Transparenz (Blattgrün) | Das Buch in einem Satz; Eine Person bewertet, die Community wählt; Screenshot der Startseite; Warum jede Bewertung an einer Charge hängt |
| So bewerten wir | Transparenz (Blattgrün) | Die Noten: Aussehen, Geruch, Geschmack, Konsistenz; Gesamtnote in Blättern von 1 bis 5; Beispielkarte einer Bewertung; Chargen derselben Sorte unterscheiden sich |
| Abstimmen | Mitbestimmen | So stimmst du ab (Screenshot Umfrage); Wer abstimmen darf: verifizierte Mitglieder; Aktuelle Umfrage mit Link; Ergebnis der letzten Runde |
| FAQ | Portal | Wie werde ich Mitglied; Wo finde ich eine Sorte; Wie lese ich eine Bewertung; Was heißt Charge |

Hochladen: Profil, Neu, Story-Highlight, Stories wählen, Name eintragen, „Cover bearbeiten“, Bild aus der Galerie.

## Pin-Reihenfolge

Angepinnt werden drei Karussells, von links nach rechts:

1. Manifest (`docs/instagram/karussells/manifest.json`)
2. So bewerten wir (`so-bewerten-wir.json`)
3. Stimm mit ab (`stimm-mit-ab.json`)

Entwurf anlegen: `npx tsx scripts/ig-karussell.ts docs/instagram/karussells/<name>.json`. Veröffentlichen und
anpinnen macht der Betreiber in der App, in umgekehrter Reihenfolge (Stimm mit ab zuerst), damit das Manifest
zuletzt angepinnt links steht.
