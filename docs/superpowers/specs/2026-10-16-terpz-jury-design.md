# Terpz-Jury: Review-Blog, Jury's Favourites, Collab-Posts

Stand 2026-10-16, Brainstorming mit dem Betreiber. Ersetzt die Hervorhebung der Betreiber-Bewertungen durch eine Jury.

## Ziel

Eine vom Betreiber bestimmte, kundige Jury bewertet regelmäßig Strains und schreibt dazu Beiträge in einem
Review-Blog. In regelmäßigen Ausgaben stellt sie ausgewählte Blüten groß und hochwertig vor (Agentur-Optik). Jeder
veröffentlichte Beitrag wird als Instagram-Collab-Post mit dem Jury-Mitglied geteilt; das pusht Plattform und
Jury-Mitglied regelmäßig.

Erfolg: eine Ausgabe mit 3 bis 6 Blüten ist ohne Entwickler veröffentlichbar (Jury schreibt, Admin gibt frei, Bilder
und Collab-Post entstehen im Ablauf), und die Seiten wirken wie ein professionelles Magazin.

## Rahmen (HWG, entschieden)

Redaktionell, nicht werbend (§ 10 HWG): Erfahrungsberichte über Aussehen, Geruch, Geschmack, Konsistenz und Aroma, nie
über Wirkung. Keine Preise, keine Apotheken-Links, keine Kaufaufforderung. Alle Beitragstexte laufen beim Speichern
durch `hwgTreffer`. Listen sind nach Erscheinungsdatum sortiert, nie nach Note. Vertreiber werden neutral genannt.

## Rollen

- Neues Feld `mitglied.jury` (Boolean, Standard false), unabhängig von `rolle`: der Betreiber bleibt `ADMIN` und ist
  zugleich Jury-Mitglied. Vergabe im Admin-Portal (Liste der Mitglieder, Schalter „Jury“).
- Ein Jury-Mitglied braucht ein öffentliches, freigegebenes Profil und einen IG-Handle (neues Feld
  `mitglied.instagram`, optional, geprüft `^[a-z0-9._]{1,30}$`) für den Collab.
- `review.istRedaktionell` heißt fachlich künftig „Jury-Bewertung“: gesetzt, wenn der Autor beim Speichern Jury ist.
  Bestehende Betreiber-Bewertungen bleiben gesetzt (Betreiber wird Jury). Texte „Betreiber“ werden zu „Jury“, der
  Terpz-Score bleibt der Score der Jury.

## Daten (Ansatz: eigene Tabellen, freigegeben)

Migration `0026_jury.sql`:

| Tabelle | Felder |
|---|---|
| `jury_ausgabe` | id, slug (unique), titel, einleitung, erscheint_am, status (ENTWURF, VEROEFFENTLICHT), erstellt_am |
| `jury_beitrag` | id, slug (unique), titel, anriss (≤ 200), text (Markdown-Teilmenge: Absätze, Zwischentitel, Fett, Kursiv, Listen), autor_id → mitglied, review_id → review (optional), ausgabe_id → jury_ausgabe (optional), position in der Ausgabe, status (ENTWURF, EINGEREICHT, VEROEFFENTLICHT, ZURUECKGEZOGEN), ig_url (optional), ig_status (KEIN, ENTWURF, GEPLANT, VEROEFFENTLICHT, FEHLER), veroeffentlicht_am, erstellt_am, geaendert_am |
| `jury_bild` | id, beitrag_id, position, daten (BLOB, verkleinert), breite, hoehe, symbolbild (Boolean), alt |

- Ein Beitrag mit `review_id` ist ein Review-Beitrag (Blüte, Scores, Aroma-Karte kommen aus der Bewertung); ohne ist
  er ein freier Artikel (etwa über ein Terpen).
- Bilder: bis 5 je Beitrag zum Start (Konstante `JURY_BILDER_MAX`, später erhöhbar), Verkleinern und Prüfen wie bei
  Budpics (`skalierteMasse`, lange Kante 1600 px, WebP/JPEG), ausgeliefert über `/api/jury-bild/<id>` mit Cache.
  Kein R2 (Kostenregel).

## Ablauf

1. Jury-Mitglied schreibt im Profil (`/profil`, Bereich „Jury“) einen Entwurf: Titel, Anriss, Text, optional eine
   eigene freigegebene Bewertung verknüpfen. Speichern prüft HWG und Längen. „Einreichen“ setzt EINGEREICHT und
   benachrichtigt die Admins (bestehende Benachrichtigungen).
2. Admin sieht eingereichte Beiträge im Admin-Portal (`/admin/jury`): bearbeiten, Bilder hochladen und ordnen
   (Symbolbild markieren), Ausgabe und Position wählen, veröffentlichen oder mit Notiz zurückgeben.
3. Admin legt Ausgaben an und veröffentlicht sie; ein Beitrag erscheint öffentlich, wenn er VEROEFFENTLICHT ist und
   (falls einer Ausgabe zugeordnet) die Ausgabe auch.
4. Beim Veröffentlichen eines Beitrags erzeugt das System einen IG-Collab-Post (siehe unten). Der Link zum
   erschienenen Post wird in `ig_url` gespeichert und im Beitrag gezeigt.

## Instagram-Collab

- Publora kennt keine Collab-Partner (geprüft 2026-10-16, docs.publora.com/platforms/instagram). Collab-Posts der Jury
  laufen daher direkt über die Instagram Graph API (Content Publishing: Karussell-Container mit
  `collaborators: [<jury-handle>]`, dann `media_publish`). Kostenlos; braucht einmalig eine Meta-App mit
  `instagram_content_publish` und ein langlebiges Token des Business-Accounts (Secret im Skript-Umfeld, nicht im
  Worker).
- Ausführung als Skript `scripts/ig-jury.ts <beitrag-slug> [--probe] [--planen=ISO]`, nicht im Request des Workers:
  holt den Beitrag über einen geschützten Feed (wie `IG_FEED_URL`), baut das Karussell mit der bestehenden Vorlage
  (`lib/ig-karussell.ts`, Grafik-Pflicht, HWG, `IG_CTA`): Cover mit Foto, Blätter, Merkmal- und Aroma-Icons, Zitat
  aus dem Text, CTA. Die Fotos des Beitrags kommen auf die Slides.
- Planung: ein Post pro Tag, 17:00 UTC, wie die übrige Redaktion; die Cloud-Routine übernimmt veröffentlichte, noch
  nicht gepostete Beiträge. Nach dem Posten schreibt das Skript `ig_url` und `ig_status` zurück (geschützter
  Endpunkt).
- Fallback, solange die Meta-App fehlt: Entwurf über Publora ohne Collab, Jury-Mitglied auf dem ersten Bild genannt;
  `ig_status` zeigt das im Admin-Portal.

## Seiten

Alle unter `app/[lang]/jury`, statisch mit Revalidierung beim Veröffentlichen (`revalidiereSprachen`).

- `/jury`: Magazin-Startseite. Aufmacher = neueste veröffentlichte Ausgabe (großes Titelbild, Titel, Einleitung,
  Beitragskarten), darunter weitere Beiträge chronologisch, Seitenwechsel.
- `/jury/<beitrag>`: Strain-Review in Agentur-Optik: Bildbühne mit Galerie (bis 5, ganz im Rahmen, Symbolbild
  gekennzeichnet), Sortenname und Vertreiber, Terpz-Score, Blätter, Gesamteindruck, Aroma-Karte, Text, Autorkasten
  mit Link zum Profil, Link zur Bewertung auf der Sortenseite (`bewertungHref`), Link zum IG-Post. Freie Artikel
  ohne Bewertungsblock.
- `/jury/ausgabe/<slug>`: eine Ausgabe mit allen Beiträgen.
- `/jury/favourites`: „Jury's Favourites“: alle Blüten aus veröffentlichten Ausgaben als Bildraster, nach
  Erscheinungsdatum.
- `/jury/team`: Jury-Mitglieder mit Avatar, Kurztext aus dem Profil, Anzahl Beiträge, Link zum Profil.
- Navigation: Punkt „Jury“ im Kopf. Startseite (Regel „Startseite mitziehen“): „Neuester Eintrag“ zeigt die neueste
  Ausgabe bzw. den neuesten Jury-Beitrag. Sortenseite: Jury-Bewertungen mit Abzeichen „Jury“ und Link auf den
  Beitrag, falls vorhanden. Öffentliches Profil eines Jury-Mitglieds: Abzeichen und Liste seiner Beiträge.

Gestaltung nach `ui-design-engine` (Buch und Handschrift, Tokens), dazu frontend-design, design-taste-frontend,
emil-design-eng und animate für Bildbühne und Übergänge; Review mit better-interface. Bewegung nur transform,
opacity, clip-path; reduzierte Bewegung respektiert.

## Fehler und Grenzen

- HWG-Treffer, zu lange Texte, mehr als `JURY_BILDER_MAX` Bilder, fremde Bewertung verknüpft: Speichern lehnt mit
  Meldung ab.
- Nur der Autor bearbeitet Entwürfe, nur Admins veröffentlichen; Rechte immer aus der Sitzung.
- D1-Grenzen: Listen mit `take`, Bilder nie in Listenabfragen (nur Metadaten), höchstens eine Seite Ids je `in`.
- IG-Fehler brechen den Lauf ohne Wiederholung ab und setzen `ig_status = FEHLER` (Netzregel).

## Tests

Einheiten: Markdown-Teilmenge rendern (keine Roh-HTML), HWG-Prüfung der Beiträge, Rechteprüfung (Autor, Admin,
Jury-Flag), Sichtbarkeit (Beitrag und Ausgabe veröffentlicht), Favourites-Sortierung nach Datum, Karussell aus
Beitrag (Grafik-Pflicht, Collab-Handle), Graph-API-Aufruf mit `collaborators` (gemockt). Rendertests für Beitragsseite
und Magazin-Startseite. Live-Prüfung per Browser nach Deploy.

## Nicht in diesem Teilprojekt

Kommentare an Jury-Beiträgen (die bestehenden Kommentare decken Bewertungen ab), Newsletter, mehrere Autoren je
Beitrag, Admin-Dashboard mit Publora-Kalender (eigenes Teilprojekt).
