import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Der Prisma-Client (runtime = "cloudflare") importiert seinen Query-Compiler
  // als `.wasm?module`. Turbopacks Lader dafuer loest den Pfad dynamisch auf,
  // und die Build-Spur erfasst deshalb rund 30.000 Dateien - darunter jede
  // .wasm aus node_modules (pglite, pg_dump, Schema-Engine, Query-Compiler fuer
  // Postgres/MySQL/SQL Server). OpenNext importiert jede erfasste .wasm statisch
  // in den Worker: 62,6 statt 19,7 MiB, knapp unter dem Limit von 64 MiB.
  // Gebraucht werden nur die Kopie, die Turbopack unter .next/server/chunks
  // ablegt (liegt nicht in node_modules), und resvg.wasm/yoga.wasm aus
  // next/dist/compiled/@vercel/og - die importiert OpenNexts Patch fuer
  // @vercel/og fest, ohne sie bricht `wrangler deploy` mit ENOENT ab.
  // Deshalb eine ausdrueckliche Liste statt `node_modules/**/*.wasm`; das
  // Muster `node_modules/!(next)/**` greift in Next nicht (geprueft).
  outputFileTracingExcludes: {
    "/**": [
      "node_modules/@electric-sql/**/*.wasm",
      "node_modules/@prisma/**/*.wasm",
      "node_modules/prisma/**/*.wasm",
      "node_modules/blake3-wasm/**/*.wasm",
      "node_modules/next/dist/compiled/@mswjs/**/*.wasm",
      "node_modules/next/dist/compiled/source-map08/**/*.wasm",
    ],
  },
};

export default nextConfig;

// Bindings (IMAGES, Secrets, ...) auch in `next dev` verfuegbar machen.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
