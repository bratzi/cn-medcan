# Seiten aus Assets, Worker nur als Tor (Design)

Stand: 2026-10-21, Session 87. Status: Entwurf, Freigabe durch den Nutzer ausstehend.

## 1. Anlass

Am 2026-10-21 lieferte die Live-Seite ab etwa 18 Uhr UTC fast nur noch Cloudflare-Fehler 1102
(„Worker exceeded resource limits“), auch auf der Startseite. Workers Observability, Version `000bea7f`:
139 Aufrufe `exceededCpu`, 22 `ok`.

Messung (Observability, 2026-10-14 bis 2026-10-21):

- Strain-Seite `/blueten/[slug]` ist `force-dynamic` und kostet je Aufruf 100 bis 450 ms CPU, Einzelwerte bis 1000 ms.
- Statische Seiten aus dem KV-Inkrement-Cache (Startseite, `/blueten`, `/jury`, `/neu`) kosten 2 bis 12 ms;
  `/blueten` lief selbst als statische Seite 6 Mal in `exceededCpu`.
- Free-Plan: 10 ms CPU je Aufruf. Cloudflare hat Überschreitungen eine Zeit lang toleriert und setzt die Grenze
  jetzt durch.

Folgerungen:

1. Ein Neubau im Aufruf (Cache-Fehltreffer, ISR) wird auf Free abgebrochen und landet nie im Cache.
   Lazy ISR kann für teure Seiten nicht funktionieren.
2. Vorrendern in KV scheitert an der Schreibgrenze: 427 Kultivare × 2 Sprachen = 854 Schreibvorgänge je Deploy,
   Grenze 1000 am Tag. Die KV-Schlüssel tragen die Build-ID, also schreibt jeder Deploy alles neu.
3. Auch der Cache-Treffer über OpenNext liegt am Rand des Limits.

Bezahlter Plan ist ausgeschlossen (Nutzer, Dauerregel „nie kostenpflichtig“).

## 2. Ziel und Erfolgskriterien

- Kein 1102 mehr auf öffentlichen Leseseiten, auch nicht bei einem Durchlauf über alle Strains.
- Leseseiten (Startseite, `/blueten`, `/blueten/[slug]`, Jury-Seiten, `/neu`) kosten je Aufruf höchstens 3 ms CPU
  (Median, gemessen in Observability), nie über 10 ms.
- Kostenlos: Workers Free, Static Assets, Workers Builds Free, D1 Free.
- Neue Bewertungen sind nach höchstens etwa 5 Minuten öffentlich sichtbar (Nutzer 2026-10-21: „kostenlos nach 5 min“).
- Wer eine Bewertung speichert, bekommt den Hinweis, dass sie in wenigen Minuten auf der Seite erscheint
  (Beta, Testnutzer sollen nicht denken, die Bewertung sei verloren; Nutzer 2026-10-21).

## 3. Architektur

### 3.1 Leseseiten als Dateien

Der Build rendert die Leseseiten wie bisher mit Next vor (Abzug der Live-D1, `VORRENDERN=1`,
`scripts/cf-build.mjs`) und kopiert danach HTML und RSC-Nutzlast jeder vorgerenderten Seite in das
Assets-Verzeichnis (`.open-next/assets/_seiten/<sprache>/<pfad>/index.html` und `.rsc`). Neu ist nur der
Kopierschritt; das Rendern selbst bleibt Next.

Die Strain-Seite wird dafür statisch:

- `force-dynamic` entfällt, `generateStaticParams` liefert alle aktiven Kultivare beider Sprachen.
- Gerendert wird die Standardauswahl (meistbewerteter Vertreiber) und je weiterem Vertreiber eine Variante.
  Die öffentliche Adresse bleibt `?vertreiber=` bzw. `?ware=` und `?alle=1`; das Tor (3.2) bildet sie auf die
  Datei der Variante ab. Unbekannte Werte fallen auf die Standardauswahl.
- Mengengerüst: 581 Kultivar-Vertreiber-Paare × 2 (`alle`) × 2 Sprachen ≈ 2300 Dateien. Grenze Free: 20 000
  Asset-Dateien je Version. Vor der Umsetzung gegen die aktuelle Doku prüfen.
- Gerendert wird immer als Gast und ohne Fachkreis. Nichts, was vom Mitglied abhängt, steht im HTML.

### 3.2 Tor in `worker.mjs`

Vor Next läuft ein schlanker Pfad in `worker.mjs`:

1. Passwort-Gate: das signierte Zugangs-Cookie per WebCrypto-HMAC prüfen, Logik aus `lib/gate.ts` und `proxy.ts`
   ohne Next nachgebaut und durch gemeinsame Tests abgesichert. Ohne gültiges Cookie: Weiterleitung auf `/zugang`
   wie heute.
2. Sprache wie heute aus Cookie bzw. Standard Deutsch bestimmen.
3. Passt der Pfad auf eine Leseseite: `env.ASSETS.fetch` auf die Datei unter `_seiten/`, mit `Cache-Control` wie heute.
   Fehlt die Datei: weiter an Next (Ausweichweg, z. B. ein Kultivar, der seit dem Build neu ist).
4. Alles andere geht unverändert an Next: Admin, Anmelden, Server Actions, API, `/zugang`, Bilder.

`run_worker_first` wird für die Leseseiten gesetzt, damit das Gate nicht umgangen wird. Direkter Abruf von
`/_seiten/...` ohne Cookie wird vom Tor abgewiesen.

### 3.3 Persönliche Insel

Was heute vom Mitglied abhängt, lädt nach dem Laden der Seite eine Client-Insel `StrainPersoenlich` über
`GET /api/ich/strain?kultivar=<id>&vertreiber=<id>`:

- Zugang (Gast, Mitglied, freigegeben, Admin), eigene Bewertung als Vorbelegung, Live-Netz-Basis.
- Der Endpunkt läuft in `worker.mjs` ohne Next, mit wenigen rohen D1-Abfragen (Sitzung prüfen, eigene Bewertung,
  Live-Netz). Antwort `Cache-Control: private, no-store`.
- Bis die Antwort da ist, zeigt der Abschnitt „Bewerten“ den Gastzustand (Erkundung und Anmelden-Hinweis).
  Für freigegebene Mitglieder tauscht die Insel ihn gegen das Bewertungsformular. Ohne JavaScript bleibt der Gastzustand.
- Budpic-Upload-Zugang und „Meine Bewertung“ im Titelblatt kommen aus derselben Antwort.
- Fachkreis-Angaben: Apotheken und Bestände stehen seit 2026-09-25 nur in Aussicht. Die Seite rendert ohne Fachkreis.
  Kommt das zurück, gehört es in diese Insel.

### 3.4 Aktualität: Neubau nach Bewertung

- Speichern einer Bewertung (und jede Admin-Aktion, die heute `revalidiereSprachen` ruft) setzt in D1 eine Marke
  „Neubau fällig seit“.
- Ein Workers-Build wird über einen Deploy-Hook ausgelöst, gebündelt: höchstens ein Build gleichzeitig. Eine
  Marke, die während eines Builds entsteht, löst nach dessen Ende genau einen weiteren aus.
- Zusätzlich ein Neubau am Tag über den bestehenden Cron.
- Budget Workers Builds Free: Build-Minuten im Monat begrenzt. Dauer eines Builds vorab messen; bei etwa
  5 Minuten Build reicht das Budget für rund 20 Builds am Tag. Vor der Umsetzung Grenze und Deploy-Hook gegen die
  aktuelle Doku prüfen.
- Die eigene Bewertung sieht das Mitglied sofort über die Insel (3.3), auch bevor der Neubau fertig ist.

### 3.5 Hinweis nach dem Speichern

Nach erfolgreichem Speichern zeigt das Formular: „Danke! Deine Bewertung ist gespeichert. Wir sind noch in der
Beta: auf der Seite erscheint sie in etwa 5 Minuten.“ (Englisch entsprechend, Wörterbuch `w.bewerten`).
Gilt für jede Bewertung, auch Änderungen.

## 4. Was entfällt oder sich ändert

- KV-Inkrement-Cache für die Leseseiten wird nicht mehr gebraucht. Binding und OpenNext-Konfiguration bleiben
  vorerst für Seiten, die nicht in Assets liegen. Rückbau erst, wenn nichts mehr daraus liest.
- `revalidiereSprachen` setzt künftig die Neubau-Marke statt KV-Tags. Die Aufrufer bleiben gleich.
- `edge-stack-master` §6 wird ergänzt: Stufe „Assets mit Tor“ vor ISR, Begründung aus Abschnitt 1.

## 5. Fehlerfälle

- Datei fehlt (neuer Kultivar seit dem Build): Ausweichweg Next. Das kann teuer sein. Darum löst das Anlegen eines
  Kultivars ebenfalls einen Neubau aus.
- Build schlägt fehl: Die alte Version bleibt live, die Marke bleibt gesetzt, der nächste Anlass versucht es erneut.
  Kein Wiederholen in einer Schleife.
- Insel-Endpunkt fällt aus: Die Seite bleibt im Gastzustand lesbar, das Formular fehlt. Fehler in der Konsole und in
  Observability.
- Abzug der Live-D1 im Build scheitert: Heute baut der Build dann ohne Vorrendern weiter. Künftig bricht er ab,
  denn ohne Dateien fiele alles auf den teuren Weg zurück. Die alte Version bleibt live.

## 6. Prüfung

- Unit-Tests: Abbildung Adresse auf Datei (Pfad, Sprache, `vertreiber`, `ware`, `alle`, unbekannte Werte),
  Gate-Prüfung im Tor gegen dieselben Testvektoren wie `lib/gate.ts`, Insel-Antwort je Zugang,
  Bündelung der Neubau-Marke.
- Build: Zahl der Dateien unter `_seiten/` gleich der erwarteten Zahl.
- Live: je eine Strain-Seite mit einem und mit mehreren Vertreibern, Startseite, `/blueten`, beide Sprachen,
  mit und ohne Login. Observability: `cpuTimeMs` der Leseseiten im Median höchstens 3 ms, kein `exceededCpu`.
  Bewertung speichern, Hinweis sehen, nach etwa 5 Minuten öffentlich sichtbar.
- Kein Durchlauf aller Strain-Seiten in einer Schleife (Regel „Netzwerk schonen“); Stichproben genügen.

## 7. Offen vor der Umsetzung (in den Plan, nicht an den Nutzer)

- Aktuelle Grenzen gegen die Cloudflare-Doku: Asset-Dateien je Version, Build-Minuten Workers Builds Free,
  Deploy-Hook für Workers Builds, CPU von `env.ASSETS.fetch` im Worker.
- Wo Next die vorgerenderten Dateien im Build ablegt (`.next/server/app/...`) und wie die RSC-Nutzlast für
  Client-Navigation (`_rsc`) adressiert wird.
