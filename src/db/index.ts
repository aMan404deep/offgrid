import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pg;

const hasDBCredentials = 
  !!process.env.SQL_HOST && 
  !!process.env.SQL_USER && 
  !!process.env.SQL_PASSWORD && 
  !!process.env.SQL_DB_NAME;

let pool: any = null;
let dbInstance: any = null;

if (hasDBCredentials) {
  console.log("[ZenPlan DB] SQL Database environment detected. Initializing pg Pool connection.");
  pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 6543,
    connectionTimeoutMillis: 15000,
  });

  pool.on("error", (err: any) => {
    console.error("[ZenPlan Database] Unexpected error on idle SQL pool client:", err);
  });

  dbInstance = drizzle(pool, { schema });

  // Self-healing: verify authentication columns exist on startup
  (async () => {
    try {
      const { sql } = await import("drizzle-orm");
      await dbInstance.execute(sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash text;`);
      await dbInstance.execute(sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_salt text;`);
      console.log("[ZenPlan DB] Verified password columns in database.");
    } catch (err: any) {
      console.warn("[ZenPlan DB] Optional schema check message:", err.message);
    }
  })();
} else {
  console.warn("[ZenPlan DB] Running in Local Memory fallback mode because Cloud SQL environment variables are not yet populated.");
}

export const dbStatus = {
  isConfigured: hasDBCredentials,
};

export const db = dbInstance;
