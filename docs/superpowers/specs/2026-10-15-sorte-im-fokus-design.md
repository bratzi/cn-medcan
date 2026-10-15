# Sorte im Fokus, Vertreiber in der Bewertung, Sorten-Explorer

Datum: 2026-10-15 · Status: Entwurf, wartet auf Freigabe

## Ziel (Nutzer)

- Die **Sorte** (Kultivar, primär über ihren Namen) steht im Mittelpunkt, nicht der Handelsname.
- Zu einer Sorte gibt es mehrere **Vertreiber**, oft mit unterschiedlichen THC/CBD-Stärken.
- Eine **Bewertung gilt der Sorte**; man gibt an, **welcher Vertreiber** es war (Pflicht). Die
  konkrete Stärke/der Handelsname ist optional.
- Die Blütenseite wird zur **Sortenseite** umgebaut (keine zweite Seitenart).
- Das Startseiten-Kapitel „Gleiche Blüte, andere Ware“ wird ein klickbarer **Sorten-Explorer**,
  auf dem Niveau der anderen Features.

Grenzen: Katalog bleibt BfArM-genau (Produkte bleiben als Daten), keine Rangfolge nach Qualität
(HWG), Free-Plan-CPU (10 ms), keine Bezahldienste.

## 1. Datenmodell (Migration 0024)

Ist: `Kultivar` 1:n `Strain` (= Produkt: Handelsname, Vertreiber, THC/CBD); `Review.strainId` Pflicht.

- `kultivare.slug TEXT` (eindeutig), aus dem Namen erzeugt (`lib/slug`-Logik wie bei Strains;
  Kollision mit Zähler). Backfill in derselben Migration per Skript-erzeugtem SQL.
- `reviews.vertreiber_id TEXT` (FK `unternehmen`, `SET NULL`) und `reviews.ware_genau INTEGER NOT
  NULL DEFAULT 1`. Backfill: `vertreiber_id` = Vertreiber des bisherigen Produkts.
- `Review.strainId` bleibt Pflicht (kein Tabellenumbau in D1, Likes/Kommentare hängen am Review).
  Wählt das Mitglied nur den Vertreiber und führt dieser mehrere Stärken der Sorte, wird das erste
  Produkt des Vertreibers (nach Handelsname) gespeichert und `ware_genau = 0`. Anzeige und
  Auswertung lesen dann nur Sorte + Vertreiber, nie die Stärke. Führt der Vertreiber genau ein
  Produkt, ist `ware_genau = 1`.
- Kennwerte: `KultivarKennwerte` wird die **Hauptnote** der Sorte. Neu `kultivar_vertreiber_kennwerte`
  (kultivar_id, vertreiber_id, anzahl, gesamtnote_mittel), beim Speichern fortgeschrieben wie die
  übrigen Kennwerte (`lib/kennwerte.ts`), damit Seite und Explorer ohne GROUP BY im Request lesen.

## 2. Bewertungsschema

Die fünf Kriterien, Restfeuchte, Notizen und Charge (optional) bleiben unverändert. Neu im Formular:

1. Sorte ist durch die Seite gesetzt.
2. **Vertreiber** (Pflicht): Auswahl als Chips aller Vertreiber der Sorte.
3. **Stärke** (optional): erscheint nur, wenn der gewählte Vertreiber mehrere Produkte führt;
   Chips „THC 22–26 %“ plus „Weiß ich nicht“.

`lib/bewertung-eingabe.ts` prüft: Vertreiber gehört zur Sorte, Produkt (falls gewählt) gehört zu
Vertreiber und Sorte. Eine Bewertung je Mitglied und **Sorte + Vertreiber** (bisher je Produkt).

Anzeige jeder Bewertung (Buch, Startseite, Profil, IG-Feed): Sortenname groß, darunter
„über {Vertreiber}“ und, nur wenn `ware_genau`, die Stärke. Laut Dauerregel zieht die Startseite
im selben Zug mit.

## 3. Sortenseite `/blueten/[slug]`

- `slug` ist der **Kultivar-Slug**. Alte Produkt-Slugs leiten per 308 auf
  `/blueten/<kultivar-slug>?ware=<produkt-slug>` (Nachschlag im Request über Slug-Index, eine Abfrage).
- Kopf: Sortenname, Typ, Genetik, Spanne THC/CBD über alle Vertreiber, Hauptnote der Sorte
  (KultivarKennwerte), Anzahl Bewertungen.
- **Ware-Leiste**: Vertreiber als klickbare Karten (Name, Stärken, Bewertungszahl, Note je
  Vertreiber als Blattanzeige). Reihenfolge: Bewertungsanzahl, dann Name (nie nach Note).
  Auswahl (`?ware=` bzw. `?vertreiber=`) filtert die Bewertungsliste und zeigt die
  Produktangaben (Handelsname, PZN, Bestrahlung, Herkunft, Terpene laut Datenblatt) des Produkts.
- Bewerten-Abschnitt mit dem Formular aus Abschnitt 2, vorbelegt mit der gewählten Ware.
- `/blueten` (Katalog): ein Eintrag je Sorte mit Vertreiberzahl und THC-Spanne; Filter
  Vertreiber/Typ/THC wirken auf die Produkte darunter.
- Ranglisten (`lib/rangliste.ts`) rechnen je Sorte statt je Produkt.

## 4. Sorten-Explorer auf der Startseite

Ersetzt `VertreiberBeispielKarte`, Kopf und Absatz des Kapitels bleiben (Text angepasst).

- **Daten**: statisch mit der Startseite (ISR), ein JSON von höchstens 12 Sorten mit mindestens
  zwei Vertreibern, Auswahl nach Bewertungsanzahl, je Sorte ≤ 8 Vertreiber mit THC/CBD-Spanne,
  Anzahl, Note. Keine eigene API, keine CPU im Request.
- **Insel** `components/story/SortenExplorer.tsx` (Client):
  1. Sorten-Chips (scrollbar, Tastatur: Pfeile, roving tabindex) plus Suchfeld, das die Chips filtert.
  2. Vertreiber-Karten der gewählten Sorte: Name, THC- und CBD-Balken (Spanne auf gemeinsamer
     Skala), Bewertungszahl, Blattanzeige. Karte anklickbar → Detailfläche.
  3. Detailfläche: Produkte des Vertreibers, Links „Zur Sorte“ und „Diese Ware bewerten“
     (`/blueten/<slug>?vertreiber=<id>#bewerten`).
  4. **Vergleich**: zweite Karte per „Vergleichen“ markieren → beide nebeneinander (mobil
     untereinander), Unterschiede in THC/CBD und Note hervorgehoben.
- Motion: Kartenwechsel mit Layout-Übergang (≤ 250 ms, ease-out), Balken wachsen beim Einblenden;
  `prefers-reduced-motion` und Sparmodus schalten ab.
- Barrierefreiheit: Chips als `radiogroup`, Karten als Buttons mit `aria-pressed`, Live-Region
  meldet Sortenwechsel. 390 px ohne Querscroll, hell/dunkel über Tokens.

## 5. Nicht im Umfang

Apotheken/Preise, neue Bewertungskriterien, Umbenennung der Route `/blueten`, Änderungen an
Umfragen (bleiben freiwillige Events).

## 6. Tests

- Migration: Backfill `vertreiber_id`, Slugs eindeutig (gegen Remote-D1 lesend geprüft).
- `bewertung-eingabe`: Vertreiber fremder Sorte abgelehnt, `ware_genau` korrekt gesetzt,
  Duplikat je Sorte + Vertreiber.
- Kennwerte je Sorte und Vertreiber fortgeschrieben.
- Redirect alter Produkt-Slugs.
- Explorer: Auswahl, Tastatur, Vergleich, reduzierte Bewegung (Komponententests).
- Live: Sortenseite, Explorer bei 390 px und Desktop, hell/dunkel, CPU-Telemetrie.

## Entscheidungen des Controllers (bei Bedarf korrigieren)

- `strainId` bleibt Pflicht mit `ware_genau`-Flag statt Tabellenumbau (D1-Risiko).
- Eine Bewertung je Sorte + Vertreiber (wer zwei Vertreiber probiert, bewertet zweimal).
- Explorer-Daten statisch, max. 12 Sorten.
- Bestehende Bewertungen erhalten `ware_genau = 1` (Produkt war bekannt).
