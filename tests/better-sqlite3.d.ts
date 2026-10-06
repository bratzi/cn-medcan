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
    get(...werte: unknown[]): unknown;
  };

  export default class Database {
    constructor(pfad: string);
    exec(sql: string): this;
    /** Migration 0016: PRAGMA foreign_keys = ON wie in D1. */
    pragma(anweisung: string): unknown;
    prepare(sql: string): Anweisung;
    /** T11: bildet die atomare D1-batch im Test nach. */
    transaction<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void;
  }
}
