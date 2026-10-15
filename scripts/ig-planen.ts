/**
 * Publora-Entwurf zur Veröffentlichung auf Instagram einplanen (Betreiber 2026-10-15: Posts selbständig planen und
 * posten). Nur nach bestandener Handwerks-Checkliste (docs/instagram/handwerk.md).
 *   npx tsx scripts/ig-planen.ts <postGroupId> <ISO-Zeit | jetzt>
 */
import { planenMitStory, planZeit } from "./ig-gemeinsam";

async function main() {
  const [gruppe, angabe] = process.argv.slice(2);
  if (!gruppe || !angabe) throw new Error("Aufruf: ig-planen.ts <postGroupId> <ISO-Zeit | jetzt>");
  if (!/^[a-f0-9]{24}$/i.test(gruppe)) throw new Error(`postGroupId unbekannten Formats: ${gruppe}`);
  const zeit = planZeit(angabe);
  const story = await planenMitStory(gruppe, zeit);
  console.log(`Eingeplant: ${gruppe} um ${zeit}${story ? `, Story ${story} eine Minute später` : ""}`);
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
