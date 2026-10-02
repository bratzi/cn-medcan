import { de } from "./de";
import { en } from "./en";
import type { Sprache } from "./sprache-kern";
import type { Woerterbuch } from "./typen";

/**
 * Beide Wörterbücher ohne Sprachermittlung: für Server Components über
 * lib/i18n/index.ts, für Actions und Route Handler über lib/i18n/anfrage.ts.
 */
export const WOERTERBUECHER: Record<Sprache, Woerterbuch> = { de, en };
