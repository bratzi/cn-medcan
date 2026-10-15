# Profil @bookofterpz

Stand 2026-10-15. Der Betreiber setzt Profil, Bio und Highlights in der Instagram-App (keine API dafür). Spec:
`docs/superpowers/specs/2026-10-15-instagram-produktmarke-design.md`. Alle Texte sind gegen `IG_SPERRE` geprüft.

## Profilfelder

| Feld | Wert |
|---|---|
| Profilbild | Signet „gB“ (`scripts/marke/signet.ts`) |
| Name | Book of Terpz Sortenbewertung (29 Zeichen, Suchwort im durchsuchten NAME-Feld) |
| Kategorie | Website (keine Gesundheits-Kategorie) |
| Link | keiner (Nutzer 2026-10-16): Vorabzugang nur per DM |

Bio (drei Zeilen, 138 Zeichen, Limit 150; Nutzen, Thema, Beleg nach ig-profile-optimizer):

```
Unabhängige Sortenbewertung: 5 Noten, ein Schema.
Bei Events bringen wir Sorten gemeinsam nach vorn.
Vorabzugang und Testnutzer: schreib uns per DM.
```

## Highlights

Cover erzeugt `npx tsx scripts/ig-highlights.ts` (1080 × 1920 nach `tmp/ig/highlights/`). Instagram zeigt nur den
Kreis in der Mitte, die Farbe folgt der Säule.

| Highlight | Säule | Story-Ideen |
|---|---|---|
| Was ist das | Transparenz (Blattgrün) | Das Buch in einem Satz; Eine Person bewertet, die Community macht bei Events mit; Screenshot der Startseite; Aroma statt Hype |
| So bewerten wir | Transparenz (Blattgrün) | Die Noten: Aussehen, Geruch, Geschmack, Konsistenz; Gesamtnote in Blättern von 1 bis 5; Beispielkarte einer Bewertung; Chargen derselben Sorte unterscheiden sich |
| Mitmachen | Mitbestimmen | Was ein Event ist; Sorten vorschlagen und pushen; Aktuelles Event mit Link; Was beim letzten Event herauskam |
| FAQ | Portal | Wie werde ich Mitglied; Wo finde ich eine Sorte; Wie lese ich eine Bewertung; Muss ich bei Events mitmachen? |

Hochladen: Profil, Neu, Story-Highlight, Stories wählen, Name eintragen, „Cover bearbeiten“, Bild aus der Galerie.

## Pin-Reihenfolge

Angepinnt werden drei Karussells, von links nach rechts:

1. Manifest (`docs/instagram/karussells/manifest.json`)
2. So bewerten wir (`so-bewerten-wir.json`)
3. Mach mit (`mach-mit.json`)

Entwurf anlegen: `npx tsx scripts/ig-karussell.ts docs/instagram/karussells/<name>.json`. Veröffentlichen und
anpinnen macht der Betreiber in der App, in umgekehrter Reihenfolge (Stimm mit ab zuerst), damit das Manifest
zuletzt angepinnt links steht.
