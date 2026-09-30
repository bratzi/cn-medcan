/**
 * Erster Import in Tests, die Komponenten mit Server Actions rendern (T9):
 * `server-only` wirft im Node-Testlauf, weil dort kein Server-Bundle laeuft.
 * Der Stub ersetzt das Paket durch ein leeres Modul; nur fuer Tests.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require.cache[require.resolve("server-only")] = {
  id: "server-only",
  filename: "server-only",
  loaded: true,
  exports: {},
} as unknown as NodeJS.Module;
