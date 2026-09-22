import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "./db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
});
