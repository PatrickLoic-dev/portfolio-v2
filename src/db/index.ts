import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

// One pool, reused across hot reloads in dev.
const globalForDb = globalThis as unknown as { db?: Db };

function instance(): Db {
  if (globalForDb.db) return globalForDb.db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example).");
  const db = drizzle(postgres(url, { max: 5, prepare: false }), { schema });
  globalForDb.db = db;
  return db;
}

/** Lazily connected, so importing this module never needs the database (e.g. at build time). */
export const db = new Proxy({} as Db, {
  get: (_, prop) => Reflect.get(instance(), prop),
});
