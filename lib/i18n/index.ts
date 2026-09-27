import "server-only";

import { de } from "./de";
import { en } from "./en";
import { holeSprache } from "./sprache";
import type { Sprache } from "./sprache-kern";
import type { Woerterbuch } from "./typen";

export const WOERTERBUECHER: Record<Sprache, Woerterbuch> = { de, en };

export async function holeWoerterbuch(): Promise<Woerterbuch> {
  return WOERTERBUECHER[await holeSprache()];
}

export { holeSprache };
export type { Sprache, Woerterbuch };
