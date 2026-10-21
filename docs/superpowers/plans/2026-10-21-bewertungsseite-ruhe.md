# Plan: Bewertungsseite ruhiger, Hersteller-Logos (Spec 2026-10-21, Abschnitte 1–3a)

Skills: ui-design-engine, design-taste-frontend, better-interface, critique-information-density,
critique-visual-hierarchy, emil-design-eng, better-accessibility, edge-stack-master, cloudflare-d1,
prisma-client-api, test-driven-development.

1. Schema: `Unternehmen.logoPfad String? @map("logo_pfad")`, Migration `migrations/0032_unternehmen_logo.sql`
   (ALTER TABLE ADD COLUMN, rein additiv), `prisma generate`. `WareKarte.vertreiberLogo` aus ladeSorte.
2. `lib/marken-initialen.ts` (Initialen aus Firmenname, Rechtsform weg) und `components/sorte/HerstellerLeiste.tsx`
   (waagerecht scrollbar, Logo-Karten, 44 px, gewählte Karte markiert, Initialen-Marke ohne Logo). Ersetzt WareLeiste.
3. Seite neu reihen: Titelblatt+Note, Angaben, Hersteller-Leiste, Wertung, Buch, Ähnliche, Chargen.
   WareWahlFeld verliert die Vertreiber-Chips („Deine Blüte ist von“): Vertreiber kommt aus der Leiste.
4. Lange Erklärtexte in Formular und Erkundung hinter InfoKnopf (vorhandene Komponente components/ui/InfoKnopf.tsx).
5. Logos aus offiziellen Quellen nach public/marken/hersteller/, ≤30 KB, ≤256 px; SQL-Datei setzt logo_pfad.
6. Admin `admin/hersteller`: Liste, logoPfad, Name, Website pflegen; nur ADMIN; Server Action mit Prüfung.
Prüfen: npm test, npx tsc --noEmit, npm run lint. Kleine Commits, kein Push.
