---
name: ui-design-engine
description: Design-System-Regelwerk "8px-Grid & Premium-Ästhetik" für diesen Medizinalcannabis-Produktkatalog. Greift immer beim Bauen oder Ändern von UI-Komponenten, Seiten, Layouts oder Styles in diesem Projekt (alles unter app/** und components/**, sowie app/globals.css) — also bei jeder Arbeit an Spacing, Typografie, Farbe, Motion, Zuständen, Badges oder Barrierefreiheit. Definiert die verbindlichen Tokens und die Abschluss-Checkliste.
---

# UI Design Engine (Wrapper)

Die Quelle der Wahrheit für dieses Skill ist die flache Datei
**`.claude/skills/ui-design-engine.md`** im Projekt.

**Lies diese Datei jetzt vollständig** (Read-Tool auf
`.claude/skills/ui-design-engine.md`) und arbeite nach ihren Regeln, bevor du
UI-Code schreibst oder änderst. Sie enthält 8px-Grid, Typo-Skala,
OKLCH-Farbtokens, Anti-"AI-Look"-Regeln, Motion, Barrierefreiheit, die
domänenspezifischen Vorgaben und die Abschluss-Checkliste.

Dieser Wrapper existiert nur, weil Claude Code Skills als `<name>/SKILL.md`
lädt. Inhalte werden hier absichtlich nicht wiederholt — bei Abweichungen gilt
immer `.claude/skills/ui-design-engine.md`.

Die Tokens sind in `app/globals.css` (Tailwind v4, `@theme`) implementiert.
Ergänzend gilt das Skill `frontend-design` für allgemeine Frontend-Qualität.
