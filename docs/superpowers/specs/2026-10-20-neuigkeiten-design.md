# Neuigkeiten-Seite „Was ist neu“ — Design

**Stand:** 2026-10-20 · **Status:** Entwurf, wartet auf Nutzer-Review

## Ziel

Eine Seite, die zeigt, was sich an Book of Terpz geändert hat und woran gerade gebaut wird.
Sie wirkt wie ein kleines News-Portal, nicht wie ein technisches Changelog. Leser sind
Mitglieder ohne Technikwissen: jede Meldung in kurzen, knappen Sätzen, Nutzen zuerst.

Erfolg heißt: Ein Mitglied öffnet die Seite und versteht in einer Minute, was neu ist und was
als Nächstes kommt. Nach jeder ausgelieferten Änderung steht eine Meldung da, ohne dass der
Nutzer daran denken muss.

## Entscheidungen (Nutzer, 2026-10-20)

- Einträge liegen als Datei im Repo, nicht in D1. Claude pflegt sie per Commit.
- Rückblick: die großen Meilensteine aus der Git-Historie verdichtet nachtragen (15 bis 25 Meldungen).
- Sichtbar wie alle Seiten: hinter dem bestehenden Zugangs-Gate, ohne Login.

## Entscheidungen (Claude)

- **Route:** `/neu` (de-Titel „Was ist neu“, en „What's new“). Kurz, klingt nicht nach Technik.
- **Menü:** neuer Punkt in `HAUPTNAVIGATION` (`lib/navigation.ts`) als letzter Kernpunkt vor
  „Mein Profil“. Die Desktop-Zeile braucht heute rund 940 px; der neue Punkt wird geprüft, ob die
  Zeile ab `lg` noch einzeilig passt. Wenn nicht, rückt die Schwelle für die einzeilige Zeile hoch
  (`lg` auf `xl`). Das ist eine reine Layoutfrage und wird beim Prototyp live entschieden.
- **Datenformat:** `lib/neuigkeiten/eintraege.ts`, ein typisiertes Array. TypeScript statt
  Markdown, weil es keinen Parser braucht, der Typ Pflichtfelder erzwingt und das Bundle klein
  bleibt.

  ```ts
  type Meldung = {
    id: string;              // stabil, kebab-case, z. B. "2026-10-20-info-knoepfe"
    datum: string;           // ISO-Datum, Tag der Auslieferung
    art: "neu" | "besser" | "behoben";
    titel: { de: string; en: string };   // höchstens rund 60 Zeichen
    text: { de: string; en: string };    // 1 bis 3 kurze Sätze
    link?: string;           // optional: Seite, auf der man es sieht
  };
  type InArbeit = { id: string; titel: { de: string; en: string }; text: { de: string; en: string } };
  ```
- **Aufbau der Seite:**
  1. Kopf: Überschrift, ein Satz Einleitung.
  2. „Gerade in Arbeit“: 1 bis 4 Karten aus `IN_ARBEIT`, deutlich als „kommt bald“ markiert,
     ohne Datum und ohne Versprechen.
  3. Meldungen, neueste zuerst, nach Monat gruppiert. Jede Meldung: Datum, kleines Etikett
     (Neu / Besser / Behoben), Titel, Text, optional „Ansehen“-Link.
  Gestaltung nach `ui-design-engine` (Buch, Handschrift-Akzent auf dem kurzen Element, z. B. der
  Tageszahl). Keine Bilder Pflicht.
- **Startseite:** kein Umbau. Die Regel „Startseite mitziehen“ betrifft die Review-Darstellung,
  nicht diese Seite. Ein Teaser „Zuletzt neu“ ist ausdrücklich nicht Teil dieser Spec (YAGNI).
- **Rendering:** statisch. Die Seite liest nur die Datei, keine Anfrage, kein D1. Neue Meldung
  heißt neuer Deploy.
- **Wortwahl:** nach `better-writing` und den Projektregeln (nie „Ware“, nie „Stärke“, kein
  HWG-Werbeversprechen zu Wirkung oder Heilung). Keine Commit-Hashes, keine Dateinamen, keine
  Fachwörter wie „Deploy“, „Migration“, „Cache“.
- **Automatik:** fester Schritt im Sessionabschluss. Vor dem HANDOFF prüft Claude, ob seit der
  letzten Meldung etwas Sichtbares ausgeliefert wurde, und schreibt dann eine Meldung. Rein interne
  Änderungen (Tests, Doku, Refactor) bekommen keine Meldung. `IN_ARBEIT` wird im selben Schritt
  an die offenen großen To-Dos im HANDOFF angeglichen. Umgesetzt als Memory-Regel und als Zeile
  in der Abschluss-Checkliste.
- **Rückblick:** einmalig aus `git log` und HANDOFF verdichtet: nur sichtbare Meilensteine
  (z. B. Bewertung mit Blättern, Strain of the Month, Terpen-Register, neues Logo, neue Adresse).

## Tests

- Wächter-Test über `eintraege.ts`: IDs eindeutig, Datum gültig und nicht in der Zukunft, beide
  Sprachen gefüllt, Titel höchstens 80 Zeichen, Text höchstens 3 Sätze, keine verbotenen Wörter
  („Ware“, „Stärke“, „Deploy“, „Commit“, „Migration“), Links beginnen mit `/`.
- Komponententest: Gruppierung nach Monat, Reihenfolge neueste zuerst, leeres `IN_ARBEIT` blendet
  den Abschnitt aus.
- Live: Menüzeile ab `lg`, 390 px, hell und dunkel, de und en.

## Nicht Teil davon

RSS-Feed, Kommentare, Benachrichtigungen, Admin-Maske, Teaser auf der Startseite.
