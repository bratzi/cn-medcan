---
name: ui-design-engine
description: Design-System-Regelwerk "Book of Terpz" (Buch und Handschrift, 8px-Raster) für diesen Medizinalcannabis-Katalog. Greift immer beim Bauen oder Ändern von UI-Komponenten, Seiten, Layouts oder Styles in diesem Projekt (alles unter app/** und components/**, sowie app/globals.css): Spacing, Typografie, Farbe, Formen, Medien, Motion, Zustände, Badges, Barrierefreiheit. Marke in docs/brand/gruenes-buch.md, hier die verbindlichen Code-Regeln und die Abschluss-Checkliste.
---

# UI Design Engine (Wrapper)

Die Quelle der Wahrheit für dieses Skill ist die flache Datei
**`.claude/skills/ui-design-engine.md`** im Projekt.

**Lies diese Datei jetzt vollständig** (Read-Tool auf
`.claude/skills/ui-design-engine.md`) und arbeite nach ihren Regeln, bevor du
UI-Code schreibst oder änderst. Sie enthält Buch und Handschrift, 8px-Raster, Tokens, Formen,
Medien, Bewegung, Barrierefreiheit, Checkliste.

Dieser Wrapper existiert nur, weil Claude Code Skills als `<name>/SKILL.md`
lädt. Inhalte werden hier absichtlich nicht wiederholt — bei Abweichungen gilt
immer `.claude/skills/ui-design-engine.md`.

Die Tokens sind in `app/globals.css` (Tailwind v4, `@theme`) implementiert.
Ergänzend gilt das Skill `frontend-design` für allgemeine Frontend-Qualität.
