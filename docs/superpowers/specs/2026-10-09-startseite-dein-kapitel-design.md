# Startseite: Sektion „Dein Kapitel“

**Stand:** 2026-10-09 (Session 52). Status: zur Freigabe.
**Nutzer-Wunsch:** „das Profil als Highlight in der Startseite als neue Section … agentur kickass-like,
hoch professionell“. Entscheidungen des Nutzers: Inhalt **„Dein Kapitel live“** (Mitglied sieht sein
eigenes Kapitel, Gast dieselbe Bühne am echten Betreiber-Profil), Position **nach der Abstimmung**.

## 1. Ziel

Die Story der Startseite endet bisher bei der Abstimmung und geht dann in den Katalog. Die neue Sektion
schließt die Schleife beim Leser: Der Betreiber bewertet, ihr stimmt ab, und hier steht, was davon in
**deinem** Buch landet. Für Gäste ist sie das stärkste Argument, Mitglied zu werden, weil sie ein echtes
Kapitel zeigt statt einer Attrappe.

Erfolg heißt:
- Ein Gast versteht in einem Blick, was ein Profil ist, und hat genau einen Weg zum Registrieren.
- Ein Mitglied sieht beim Scrollen sein eigenes Kapitel mit echten Zahlen und kommt mit einem Klick hinein.
- Die Seite bleibt statisch (`force-static`, 300 s), ohne JavaScript vollständig, ohne neue Abhängigkeit.

## 2. Design Read

Editorial Scroll-Story für Patientinnen und Patienten mit Rezept und Interesse an Aroma, im Buch-und-
Handschrift-Stil des Grünen Buchs. Variance 8, Motion 6, Density 3. Keine neue Schrift, keine neue Farbe,
eckige Flächen, Pillen nur für Bedienung. Die Sektion bekommt eine Layout-Familie, die es auf der Seite
noch nicht gibt: **der Aufschlag eines Kapitels als große typografische Komposition** (Name als Titel,
Zahlen als Randnotizen um ihn herum, das Aroma-Netz als einziges Bild).

## 3. Aufbau

Reihenfolge in `app/[lang]/page.tsx`: … `NeuesterEintrag`, `Empfehlungen`, `Abstimmung`,
**`DeinKapitel`**, `Katalog`.

### 3.1 Komposition ab 1080 px (Feldbuch-Raster, 10 Spalten)

```
 Schlagwort (Buzz-Satz, aria-hidden)            "dein buch"
 ┌────────────────────────────────────────────────────────────────┐
 │ h2  Dein Kapitel                          (text-kapitel, links) │
 │                                                                │
 │ [Avatar]  GrünesBuch                        ┌────────────────┐ │
 │           (Name in text-titel, gedruckt)    │   Aroma-Netz   │ │
 │                                             │   (6 Achsen,   │ │
 │  5          4,4          3                  │   zeichnet     │ │
 │  bewertet   im schnitt   gestimmt           │   sich ein)    │ │
 │  (Zahl gedruckt, Wort Mr Dafoe)             └────────────────┘ │
 │                                                                │
 │  Zuletzt: Remexian 30/1 PGF CIS  ✿✿✿✿✿ 4,5   08.10.2026        │
 │                                                                │
 │  [ Zu deinem Kapitel ]   bzw. Gast: [ Konto anlegen ]          │
 └────────────────────────────────────────────────────────────────┘
```

- Links 6 Spalten: Avatar mit Stempelring wie im Buch, darunter der Name in `font-buch text-titel`
  (gedruckt, nie Handschrift: Namen sind Druck, Leitplanke 4 sinngemäß), darunter drei Randnotizen
  über `components/kapitel/Randnotizen` (Zahl `numeric`, Wort `font-hand text-notiz`).
- Rechts 4 Spalten: das Aroma-Netz des Profils (`ProfilNetz`-Grafik, nur Aroma, keine Wirkung), auf dem
  Papier ohne Karte; der Bogenrahmen `rounded-t-full` wie überall beim Netz.
- Darunter über die volle Breite eine Zeile „Zuletzt bewertet“: Handelsname als Link (gedruckt),
  Blätter-Anzeige, Datum. Eine Haarlinie darüber, keine Karte.
- Eine Aktion, gefüllt (`buttonKlassen("primary")`): Mitglied „Zu deinem Kapitel“ (`/profil`), Gast
  „Konto anlegen“ (`/registrieren`). Kein zweiter Knopf. Die Abstimmung davor hat ihre eigene Primäraktion
  in einer anderen Sektion; je Ansicht bleibt es eine.
- Gast: über dem Namen ein Vermerk von Hand `so sieht ein kapitel aus` (`text-vermerk`, `kopierstift`),
  damit klar ist, dass das Kapitel des Betreibers gezeigt wird, nicht das eigene.

### 3.2 Unter 1080 px

Eine Spalte in Lesereihenfolge: h2, Vermerk (Gast), Avatar und Name, Randnotizen zwei je Reihe (wie im
Profil), Netz auf voller Breite (höchstens 24rem), Zeile „Zuletzt“, Aktion. Kein Überlauf bei 343 px
Inhaltsbreite; lange Namen umbrechen (`wrap-break-word`).

### 3.3 Randnotizen

| Wer | Notiz 1 | Notiz 2 | Notiz 3 |
|---|---|---|---|
| Mitglied | bewertet (Anzahl freigegebene) | im Schnitt (eigene Gesamtnote) | gestimmt (Stimmen über alle Runden) |
| Gast (Betreiber) | bewertet | im Schnitt | von euch (freigegebene Community-Bewertungen gesamt) |

Nur echte Zähler (Do's und Don'ts: „echte Zähler“). Fehlt ein Wert (keine Gesamtnote), entfällt die Notiz.

## 4. Daten

### 4.1 Gast: statisch mit der Seite

Neue Abfrage `ladeSchaufensterKapitel()` in `lib/query/kapitel-start.ts`, `cache()`:
- das Mitglied mit `rolle = "ADMIN"`, `profilOeffentlich = true`, `freigegeben = true` (ältestes zuerst,
  falls es mehrere gibt). Nur Daten, die `ladeOeffentlichesProfil` schon öffentlich zeigt: Name, Avatar,
  Anzahl freigegebener Bewertungen, Netz aus `nutzer_profil.oeffentlich`, neueste Bewertung.
- dazu Schnitt der eigenen Gesamtnoten und die Zahl freigegebener Community-Bewertungen (beides öffentlich
  auf /reviews ablesbar).
- Ist das Profil nicht öffentlich oder fehlt, zeigt der Gast die Sektion ohne Kapitel: h2, ein Satz,
  „Konto anlegen“. Nie ein privates Profil auf der Startseite.

### 4.2 Mitglied: über `/api/startseite`

`StartSitzung` holt schon einen Abruf für alle Inseln. Die Antwort bekommt ein Feld `kapitel`
(nur für angemeldete Mitglieder, `private, no-store` bleibt):
`{ anzeigename, avatarId, bewertet, schnitt | null, gestimmt, netz | null, zuletzt | null }`.
- `netz` aus dem gespeicherten `nutzer_profil` gelesen, **nicht** neu gerechnet (CPU-Limit 10 ms);
  Neurechnung bleibt Sache von `/profil`.
- `zuletzt`: neueste eigene freigegebene Bewertung zu einer aktiven Sorte (Handelsname, Slug, Gesamtnote,
  Datum).
- Drei kleine Abfragen parallel, kein GROUP BY über alle Bewertungen.

### 4.3 Wechsel vom Schaufenster zum eigenen Kapitel

Das statische HTML zeigt immer das Schaufenster (oder die leere Fassung). Kommt die Sitzung mit `kapitel`
zurück, blättert die Insel um: das Schaufenster weicht dem eigenen Kapitel per `<ViewTransition>`
(Cross-Fade mit kurzem Versatz, unter reduzierter Bewegung sofort). Das ist gewollt: „das Buch schlägt
dein Kapitel auf“. Während `laedt` bleibt das Schaufenster stehen, kein Skelett, kein Springen der Höhe
(beide Fassungen nutzen dieselbe Komposition).

Mitglied ohne freigegebene Bewertung: Name, Randnotiz „gestimmt“ falls vorhanden, statt Netz ein Satz
„Dein Netz entsteht mit deiner ersten Bewertung.“ und die Aktion „Erste Bewertung schreiben“ (`/blueten`).
Fehler der Sitzung: das Schaufenster bleibt, kein Fehlertext (die Sektion ist kein Pflichtinhalt).

## 5. Bewegung

Story-Bewegung nur über `StoryBuehne` (Regel 7), neue Choreografie `components/story/bewegung/kapitel.ts`:
1. Der Name deckt sich per `clip-path: inset()` von links auf (gedruckt, kein „Schreiben“).
2. Die Wörter der Randnotizen schreiben sich nacheinander (Ränder und Dauer aus `schreiben.ts`).
3. Das Netz zeichnet sich ein über das vorhandene `[data-netz-erscheinen]`.
Einmal beim Hineinscrollen (`start: "top 70%"`, `once`). Nur `transform`, `opacity`, `clip-path`.
Ohne JavaScript und bei reduzierter Bewegung stehen alle Endzustände sofort. Der Umblätter-Wechsel aus 4.3
läuft nicht über GSAP, sondern über `<ViewTransition>` und ist bei reduzierter Bewegung aus.

## 6. Texte (de, en)

Neuer Block `w.start.kapitel`: `titel` „Dein Kapitel“, `schlagwort` „dein buch“, `vermerk`
„so sieht ein kapitel aus“, `satzGast` „Jede Bewertung, jede Stimme landet in deinem Kapitel.“,
`zuletzt` „Zuletzt bewertet“, Notizwörter und Vorlese-Sätze, `zumKapitel` „Zu deinem Kapitel“,
`kontoAnlegen` „Konto anlegen“, `leerNetz`, `ersteBewertung`. Englisch gleichwertig. Keine Geviert- oder
Gedankenstriche, keine Wirkungsaussagen.

## 7. Barrierefreiheit

- `section` mit `aria-labelledby` auf die h2. Randnotizen lesen je einen Satz vor (vorhandenes Muster).
- Das Netz hat seinen Endwert als Text (vorhandenes `ProfilNetz`-Muster).
- Beim Umblättern wechselt der Inhalt ohne Fokusverlust; eine höfliche Live-Region sagt einmal
  „Dein Kapitel ist geladen“.
- Avatar und Schlagwort dekorativ, Aktion ≥ 44 px.

## 8. Tests

- `lib/query/kapitel-start.ts`: Schaufenster nur bei öffentlichem, freigegebenem Admin-Profil; privat ergibt null.
- `lib/startseite-sitzung.ts`: `kapitel` nur für Mitglieder, Gäste ohne Datenbank (bestehender Test erweitert).
- Komponente per `renderToStaticMarkup`: Gast mit Vermerk und „Konto anlegen“, Mitglied mit „Zu deinem
  Kapitel“, Mitglied ohne Bewertung mit Leer-Satz, Name nie in `font-hand`, genau eine Primäraktion.
- Quelltext: `kapitel.ts` nutzt nur `transform`/`opacity`/`clip-path`, ist in `start.ts` registriert;
  Seite bleibt `force-static`.
- i18n: keine deutschen Literale in den neuen Dateien.
- Live: 1418 px und 390 px, hell und dunkel, als Gast und als Mitglied, reduzierte Bewegung.

## 9. Nicht Teil davon

Kein Community-Spotlight anderer Mitglieder, keine Rangliste der Mitglieder, keine neuen Profilwerte,
keine Wirkungsnote, keine Änderung an `/profil` selbst.
