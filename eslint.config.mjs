import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generiert: von wrangler types bzw. prisma generate erzeugt.
    "cloudflare-env.d.ts",
    "lib/generated/**",
    ".open-next/**",
    // Lokale Worker-Buendel von wrangler dev/preview (mehrere MB, sprengen den Heap).
    ".wrangler/**",
    // Fremder Code: Referenz- und Vorlagendateien der installierten Skills.
    // Sie werden nie gebaut und folgen nicht unseren Regeln.
    ".agents/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
