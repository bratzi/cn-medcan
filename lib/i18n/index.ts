import "server-only";

import { holeSprache } from "./sprache";
import type { Sprache } from "./sprache-kern";
import type { Woerterbuch } from "./typen";
import { WOERTERBUECHER } from "./woerterbuecher";

export { WOERTERBUECHER };

export async function holeWoerterbuch(): Promise<Woerterbuch> {
  return WOERTERBUECHER[await holeSprache()];
}

export { holeSprache };
export type { Sprache, Woerterbuch };
