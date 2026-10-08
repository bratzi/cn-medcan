# Buch-Doppelseite: Bewertung im Fokus, Nutzerstimme abgesetzt

**Stand:** 2026-10-09 (Session 52). Status: zur Freigabe.
**Nutzer-Wunsch:** Die Blätter-Bewertung soll in den Fokus rücken und zentrierter stehen. Der Text der Person
soll kursiv und klar als ihr Text erkennbar sein. Die Akzentschrift fehlt und soll hinein. Das Profil mit dem
Namen soll kleiner und eingefasst sein. Das gilt überall, wo ein Buch steht.
**Entscheidungen des Nutzers:** Nutzertext kursiv gedruckt mit handschriftlichem Vermerk; Bewertung mittig
oben auf der rechten Seite; die große Note in der Akzentschrift.

## 1. Befund (Kritik der Hierarchie, Stand live 2026-10-09)

- Einstieg: der Avatar mit 128 px und der Name in `text-h1` ziehen den ersten Blick, nicht die Bewertung.
- Gewicht: Blätter und Note stehen linksbündig und wirken wie eine Kennzahl unter vielen.
- Nutzertext: wirkt wie Beiwerk, nicht wie die Stimme einer Person.
- Akzentschrift: kommt nur im Vermerk „von euch“ vor, beim Betreiber gar nicht.

## 2. Geltungsbereich

Eine Komponente, alle Bücher: `components/review/BuchDoppelseite.tsx` mit `BlattUrteil`, `NotenLeiste`,
`BuchNotiz`. Sie steht im großen Buch auf `/reviews`, im Buch der Blütenseite (`BewertungsBuch`) und im neuesten
Eintrag der Startseite (`NeuesterEintrag`, `auszug`). Keine eigene Fassung je Ort.

## 3. Linke Seite: die Person

### 3.1 Exlibris statt Visitenkarte

Kopf der linken Seite wird ein eingefasstes Exlibris: eine Pille (`rounded-full`, Rand `border-border-strong`,
Innenabstand 8 px links, 24 px rechts) mit Avatar 40 px (`md`), Name in `font-buch text-h3 font-medium`
und der Marke Betreiber oder Community dahinter. Der Name bleibt die Überschrift des Eintrags (h2/h3 wie
bisher) und bleibt verlinkt, wenn das Profil öffentlich ist. Über dem Exlibris steht wie bisher die Sorte
als Link (`sorte`). Die Pille umbricht nicht ins Leere: unter 640 px darf der Name in der Pille umbrechen
(`wrap-break-word`), die Marke rutscht dann unter den Namen.

### 3.2 Die Stimme der Person

- Über dem Text ein Vermerk von Hand (`font-hand text-vermerk text-logo`, schreibt sich wie heute ein):
  Betreiber „meine notiz“, Community „von euch“ (der bisherige Vermerk wandert vom Kopf hierher).
  **Abweichung von der Vorschau „notiert von GrünesBuch“:** Namen stehen nie in Handschrift (Leitplanke 4,
  Regelwerk 1). Der Name steht direkt darüber im Exlibris, der Bezug bleibt klar.
- Der Text in der Kursiven der Buchschrift (`font-buch italic`), ab 640 px `text-h3`, Farbe `text`, in
  deutschen bzw. englischen Anführungszeichen über ein `<q>` (Sprache aus `lang`). Links eine Haarlinie in
  `accent` (2 px, Abstand 16 px), damit der Text als Zitat abgesetzt ist. Höchstens 52 Zeichen je Zeile wie
  bisher, Messung und „Weiterlesen“ bleiben unverändert.
- Ohne Text: „Kein Text zu dieser Bewertung.“ bleibt, ohne Vermerk, ohne Linie.

## 4. Rechte Seite: das Urteil im Fokus

- `BlattUrteil` wird ein zentrierter Block oben auf der rechten Seite: fünf Blätter (Breite wie heute),
  darunter die Note groß in der Akzentschrift (`font-hand text-notiz text-logo`), darunter „von 5 Blättern“
  in `text-small text-text-muted`. Alles `items-center text-center`. Vorleser hören wie bisher nur den Satz
  aus dem `sr-only`.
- Regelwerk-Ausnahme wie bei den Auftakt-Kennzahlen: die Gesamtnote im Buch steht in `font-hand`; die
  Einzelnoten bleiben gedruckt (`numeric`).
- `NotenLeiste` zentriert ihre Zellen (Bezeichnung, Zahl, Strich mittig); die Raster-Spalten bleiben.
- Unter dem Urteil eine Haarlinie, dann die Noten, dann das Register (Karte, Beschaffenheit, Reel) wie heute.

## 5. Bewegung

Unverändert die Einzugs-Bewegung des Buchs (`data-eintritt`): Blätter nacheinander, Note `auf`, Vermerk
`schreiben`. Der Vermerk der linken Seite behält `data-eintritt="schreiben"`.

## 6. Startseite und HWG

`auszug` bleibt: auf der Startseite fehlt die Wirkungsnote weiter. Keine neuen Aussagen zur Wirkung.

## 7. Tests

- Render-Tests in `tests/buch-doppelseite.test.ts`: Exlibris mit Avatar `size-10` und Name `text-h3`, kein
  `size-32` mehr; Vermerk „meine notiz“ beim Betreiber, „von euch“ bei der Community, nie der Name in
  `font-hand`; Text in `<q>` mit `italic`; ohne Text kein Vermerk.
- `BlattUrteil`: zentriert, Note mit `font-hand text-notiz`, `sr-only` unverändert.
- `NotenLeiste`: Zellen zentriert, `auszug` ohne Wirkung bleibt grün.
- Regelwerk-Test `tests/marke.test.ts` bleibt grün (Handschrift nur mit ihren Graden).
- Live: `/reviews` 1418 px und 390 px, hell und dunkel; Blütenseite; Startseite.

## 8. Nicht Teil davon

Keine Änderung an Blättern (Zeichnung), Register-Reitern, Bildfeld, Kolophon, Buch-Blättern und Seitenleiste.
