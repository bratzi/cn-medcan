# Kommentare, Likes und Bewertungs-Statistik – Design

**Stand:** 2026-10-14 (Session 60) · **Status:** Entwurf, wartet auf Freigabe des Nutzers

## Ziel

Mitglieder reagieren aufeinander: sie kommentieren Bewertungen und Profile, liken Bewertungen, Blüten und
Mitglieder (Mitglied liken = folgen). Der Reiter Bewertungen (`/reviews`) zeigt dazu allgemeine Zahlen:
meistbewertete, bestbewertete und schlechtestbewertete Blüten, Blüten und Bewertungen mit den meisten Kommentaren.
Das stärkt den Produktkern (Bewertungen und Mitbestimmung), nicht den Katalogkomfort.

## Entscheidungen des Nutzers (2026-10-14)

1. Ein Spec, drei Stränge im Plan: **A Likes und Folgen**, **B Kommentare**, **C Statistik im Reiter Bewertungen**.
2. Moderation: Kommentar ist **sofort sichtbar**; jedes Mitglied kann melden; ab **3 Meldungen** ist er
   ausgeblendet, bis der Admin entscheidet; der Admin kann jeden Kommentar löschen; ein **Wortfilter** gegen
   Heilversprechen (HWG) lehnt Kommentare beim Absenden ab.
3. Kommentieren, Liken und Melden dürfen **nur verifizierte Mitglieder** (`mitglied.freigegeben = true`), wie bei
   Umfragen. Lesen darf jeder.
4. Private Profile: ein privates Profil hat **keine Pinnwand** (keine Profilkommentare). Kommentare und Likes
   eines privaten Mitglieds an öffentlichen Bewertungen zeigen seinen Anzeigenamen ohne Profil-Link.

## Begriffe

- **Blüte** = Kultivar (`kultivare`), über alle Vertreiber. Likes für Blüten hängen am Kultivar.
- **Bewertung** = Zeile in `reviews`, nur `freigegeben = true` ist öffentlich.
- **Folgen** = ein Like auf ein Mitglied. Es gibt keinen zweiten Knopf.

## Datenmodell (Migration `0023_kommentare_likes.sql`, rein additiv)

```sql
CREATE TABLE "likes" (
  "mitglied_id" TEXT NOT NULL,          -- wer liket
  "ziel_art"    TEXT NOT NULL,          -- 'BEWERTUNG' | 'BLUETE' | 'MITGLIED'
  "ziel_id"     TEXT NOT NULL,          -- reviews.id | kultivare.id | mitglied.id
  "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("mitglied_id", "ziel_art", "ziel_id"),
  FOREIGN KEY ("mitglied_id") REFERENCES "mitglied"("id") ON DELETE CASCADE
);
CREATE INDEX "likes_ziel_idx" ON "likes"("ziel_art", "ziel_id");

CREATE TABLE "kommentare" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "autor_id"    TEXT NOT NULL,
  "ziel_art"    TEXT NOT NULL,          -- 'BEWERTUNG' | 'PROFIL'
  "ziel_id"     TEXT NOT NULL,          -- reviews.id | mitglied.id
  "text"        TEXT NOT NULL,          -- 1 bis 1000 Zeichen, reiner Text
  "status"      TEXT NOT NULL DEFAULT 'SICHTBAR',  -- 'SICHTBAR' | 'GEMELDET' | 'GELOESCHT'
  "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("autor_id") REFERENCES "mitglied"("id") ON DELETE CASCADE
);
CREATE INDEX "kommentare_ziel_idx" ON "kommentare"("ziel_art", "ziel_id", "status", "erstellt_am");
CREATE INDEX "kommentare_autor_idx" ON "kommentare"("autor_id");

CREATE TABLE "kommentar_meldungen" (
  "kommentar_id" TEXT NOT NULL,
  "mitglied_id"  TEXT NOT NULL,
  "grund"        TEXT,                  -- optional, max. 200 Zeichen
  "erstellt_am"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("kommentar_id", "mitglied_id"),
  FOREIGN KEY ("kommentar_id") REFERENCES "kommentare"("id") ON DELETE CASCADE,
  FOREIGN KEY ("mitglied_id") REFERENCES "mitglied"("id") ON DELETE CASCADE
);

-- Vorberechnete Zähler (CPU-Limit 10 ms): je Ziel eine Zeile, beim Schreiben gepflegt.
CREATE TABLE "zaehler" (
  "ziel_art"   TEXT NOT NULL,           -- 'BEWERTUNG' | 'BLUETE' | 'MITGLIED'
  "ziel_id"    TEXT NOT NULL,
  "likes"      INTEGER NOT NULL DEFAULT 0,
  "kommentare" INTEGER NOT NULL DEFAULT 0, -- nur SICHTBAR
  PRIMARY KEY ("ziel_art", "ziel_id")
);
```

Polymorphe Ziele haben keinen Fremdschlüssel. Darum räumt das Löschen einer Bewertung, eines Kultivars oder eines
Mitglieds die zugehörigen Likes, Kommentare und Zähler im selben `$transaction`-Batch ab (eine Hilfsfunktion
`raeumeZielAb(art, id)` in `lib/reaktionen.ts`). Kommentare an einem Profil zählen im Zähler `MITGLIED`;
Kommentare an einer Bewertung zählen zusätzlich bei der Blüte der Bewertung (für „Blüten mit den meisten
Kommentaren“).

## Strang A – Likes und Folgen

- **Knopf** `LikeKnopf` (Client-Insel, Herz, Zahl daneben): an jeder Bewertungskarte und im großen Buch, auf der
  Blütenseite im Kopf, im öffentlichen Profil im Profilkopf („Folgen“ mit Zahl der Folgenden).
- **Server-Aktion** `schalteLike(art, id)`: prüft verifiziertes Mitglied, prüft, dass das Ziel öffentlich existiert
  (freigegebene Bewertung, Kultivar, Mitglied mit öffentlichem Profil), schreibt oder löscht die Zeile in `likes`
  und ändert `zaehler.likes` um ±1 in einem Batch. Eigene Bewertungen und sich selbst liken ist gesperrt.
  Optimistische Anzeige im Client, bei Fehler zurück.
- **Anzeige der Zahl:** öffentlich aus `zaehler`. Ob ich selbst geliket habe, lädt die Insel nur mit Sitzung
  (eine Abfrage je Seite über alle sichtbaren Ziele, `IN (…)`), damit die Seiten statisch bleiben.
- **Profil (`/profil`):** neues Feld „Gemocht und gefolgt“: wem ich folge, welche Blüten und Bewertungen ich
  gemocht habe, wie oft meine Bewertungen gemocht wurden. Profilkopf-Notizen bekommen „Folgende“ und „Likes
  erhalten“.
- **Öffentliches Profil:** Zahl der Folgenden und der erhaltenen Likes; Listen „folgt“ nur, wenn das Profil
  öffentlich ist; private Mitglieder in fremden Listen erscheinen nicht.
- **Benachrichtigung** (bestehende Tabelle `benachrichtigungen`, Art `LIKE`/`FOLGT`): höchstens eine je Ziel und
  Tag, damit Liken-Entliken keinen Strom erzeugt.

## Strang B – Kommentare

- **Orte:** unter jeder freigegebenen Bewertung (Blütenseite, großes Buch per Aufklappen „Kommentare (n)“) und als
  Pinnwand im öffentlichen Profil. Private Profile haben keine Pinnwand; wird ein Profil privat, bleiben die
  Kommentare gespeichert, sind aber unsichtbar, bis es wieder öffentlich ist.
- **Liste:** flach, älteste zuerst, 20 je Seite, „Mehr laden“. Keine Antworten auf Antworten (YAGNI). Anzeige:
  Avatar, Anzeigename (Link nur bei öffentlichem Profil), relatives Datum, Text.
- **Schreiben** `schreibeKommentar(art, id, text)`: verifiziertes Mitglied; Text getrimmt, 1 bis 1000 Zeichen,
  reiner Text (keine Links außer als Text, kein HTML); Ratenbremse 10 Kommentare je Mitglied und Stunde (Zählung
  über `kommentare_autor_idx`); **HWG-Wortfilter** `lib/hwg-filter.ts` lehnt ab mit Hinweis „Bitte keine
  Aussagen über Wirkung auf Krankheiten oder Beschwerden“ (Liste: heilt, gegen Schmerzen, hilft bei, Therapie,
  Depression, Schlafstörung, Krebs, … de und en; Wortgrenzen, klein, Umlaute normiert). Zähler +1 im Batch.
- **Löschen:** der Autor löscht eigene Kommentare, der Inhaber der Bewertung oder des Profils löscht Kommentare
  darunter, der Admin alle. Löschen setzt `status = 'GELOESCHT'` (Text bleibt für Rückfragen 30 Tage, dann
  Aufräumen beim nächsten Admin-Aufruf), Zähler −1.
- **Melden** `meldeKommentar(id, grund?)`: verifiziert, einmal je Mitglied. Bei der dritten Meldung `status =
  'GEMELDET'`, Zähler −1, Benachrichtigung an Admins. Admin-Seite `/admin` bekommt den Abschnitt „Gemeldete
  Kommentare“ mit Freigeben (zurück auf `SICHTBAR`, Meldungen gelöscht, Zähler +1) oder Löschen.
- **Benachrichtigung** an den Inhaber der Bewertung oder des Profils (Art `KOMMENTAR`), nicht bei eigenen.
- **Rechtliches:** Hinweis unter dem Eingabefeld: keine Wirkversprechen, keine persönlichen Gesundheitsdaten
  Dritter; Nutzungsbedingungen bekommen einen Absatz zu Kommentaren und Melden.

## Strang C – Statistik im Reiter Bewertungen

- **Ort:** `/reviews`, neuer Abschnitt über den Ranglisten, unter dem großen Buch: „Zahlen aus dem Buch“.
- **Inhalte** (je fünf Einträge, Link auf Blüte oder Bewertung):
  1. Meistbewertete Blüten (Anzahl freigegebener Bewertungen je Kultivar).
  2. Bestbewertete Blüten (Mittel der Gesamtnote, erst ab 3 Bewertungen).
  3. Schlechtestbewertete Blüten (dieselbe Regel; Wortwahl neutral: „am niedrigsten bewertet“).
  4. Blüten mit den meisten Kommentaren.
  5. Bewertungen mit den meisten Kommentaren.
  6. Meistgemochte Bewertungen.
- **Berechnung:** eine Funktion `ladeBuchStatistik()` liest `kultivar_kennwerte` (Anzahl, Mittel liegen dort schon)
  und `zaehler` mit `ORDER BY … LIMIT 5`. Sie läuft in der statischen Seite mit `cacheTag('buch-statistik')`;
  Schreibaktionen (Bewertung freigeben, Kommentar, Like) rufen `revalidateTag('buch-statistik')`. Kein Zählen beim
  Aufruf.
- **Darstellung:** nach `ui-design-engine` (Buch und Handschrift): sechs kleine Listen im Raster, Zahl von Hand im
  Akzent, Wort gedruckt, wie im Profilkopf. Leere Listen zeigen „Noch zu wenig Bewertungen“.

## Startseite

Gemäß Dauerregel „Startseite mitziehen“: die Bewertungskarten der Startseite zeigen Like-Zahl und
Kommentarzahl (nur Anzeige, Link zur Bewertung). Kein neues Kapitel.

## Fehler und Grenzen

- Nicht angemeldet: Knopf und Feld zeigen „Anmelden zum Mitreden“ mit Link. Angemeldet, nicht verifiziert:
  „Nach der Freigabe kannst du mitreden“.
- Ziel weg oder nicht öffentlich: Aktion meldet „Nicht mehr verfügbar“, nichts wird geschrieben.
- Doppelklick: Primärschlüssel verhindert doppelte Likes und Meldungen; Fehler P2002 gilt als Erfolg.
- CPU: jede Seite höchstens eine zusätzliche Abfrage je Insel; Zähler nie per `COUNT` im Request-Pfad.

## Tests

Vitest wie bisher: Wortfilter (Treffer, Nicht-Treffer, Umlaute, Wortgrenzen), Eingabeprüfung Kommentar,
Like-Umschalter (Zähler ±1, Selbst-Like gesperrt), Melde-Schwelle 3, Löschrechte (Autor, Inhaber, Admin, Fremder),
Sichtbarkeit privater Profile, Statistik-Sortierung und Schwelle 3. Live-Prüfung nach Push per Browser.

## Nicht im Umfang

Antworten auf Kommentare, Erwähnungen mit @, Bilder in Kommentaren, Kommentare an Blüten ohne Bewertung,
Feed „Neues von Mitgliedern, denen ich folge“ (später eigener Punkt), Bearbeiten von Kommentaren.
