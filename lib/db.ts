import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { getD1 } from "@/lib/cloudflare";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

/** Drizzle-Client fuer den aktuellen Request. */
export async function getDb(): Promise<Db> {
  const d1 = await getD1();
  return drizzle(d1, { schema, logger: process.env.NODE_ENV !== "production" });
}

export { schema };
