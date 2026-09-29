/**
 * better-sqlite3 liegt als Abhängigkeit von @prisma/adapter-better-sqlite3 bei,
 * aber ohne Typen (@types/better-sqlite3 ist nicht installiert, neue Pakete
 * sind tabu). Nur das, was tests/kennwerte-nachtragen.test.ts braucht, um eine
 * Migration gegen eine Datenbank im Speicher zu prüfen (T5, Nutzer 2026-09-29).
 */
declare module "better-sqlite3" {
  type Anweisung = {
    run(...werte: unknown[]): unknown;
    all(...werte: unknown[]): unknown[];
  };

  export default class Database {
    constructor(pfad: string);
    exec(sql: string): this;
    prepare(sql: string): Anweisung;
  }
}
