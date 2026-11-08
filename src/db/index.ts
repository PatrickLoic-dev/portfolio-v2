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
  const db = drizzle(
    postgres(url, {
      max: 5,
      // Supabase's transaction pooler (Supavisor, port 6543) doesn't support
      // prepared statements, and hangs when several queries are pipelined on
      // one connection (e.g. a Promise.all of 9 queries in the Studio layout).
      // One query in flight per connection avoids both.
      prepare: false,
      max_pipeline: 1,
      // Fail fast on an unreachable host instead of hanging the request.
      connect_timeout: 10,
      idle_timeout: 20,
    }),
    { schema },
  );
  globalForDb.db = db;
  return db;
}

/** Lazily connected, so importing this module never needs the database (e.g. at build time). */
export const db = new Proxy({} as Db, {
  get: (_, prop) => Reflect.get(instance(), prop),
});
