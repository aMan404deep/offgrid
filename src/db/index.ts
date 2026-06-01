import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pg;

const hasDBCredentials = 
  !!process.env.DATABASE_URL || (
    !!process.env.SQL_HOST && 
    !!process.env.SQL_USER && 
    !!process.env.SQL_PASSWORD && 
    !!process.env.SQL_DB_NAME
  );

let pool: any = null;
let dbInstance: any = null;

if (hasDBCredentials) {
  console.log("[ZenPlan DB] SQL Database environment detected. Initializing pg Pool connection.");
  
  const hasIndividual = !!process.env.SQL_HOST && !!process.env.SQL_USER && !!process.env.SQL_PASSWORD && !!process.env.SQL_DB_NAME;
  const hasUrl = !!process.env.DATABASE_URL;

  console.log(`[ZenPlan DB Info] Environment Variables Check:`);
  console.log(`  - DATABASE_URL: ${hasUrl ? "DEFINED" : "UNDEFINED"}`);
  console.log(`  - SQL_HOST: ${process.env.SQL_HOST ? "DEFINED" : "UNDEFINED"}`);
  console.log(`  - SQL_USER: ${process.env.SQL_USER ? "DEFINED" : "UNDEFINED"}`);
  console.log(`  - SQL_DB_NAME: ${process.env.SQL_DB_NAME ? "DEFINED" : "UNDEFINED"}`);
  console.log(`  - SQL_PORT: ${process.env.SQL_PORT ? "DEFINED" : "UNDEFINED"}`);

  // Prioritize individual SQL parameters if they are supplied (like your new Neon database credentials)
  const useIndividual = hasIndividual;
  
  if (useIndividual) {
    console.log(`[ZenPlan DB] Mode: Prioritizing Individual Parameters (Neon DB). Host: ${process.env.SQL_HOST}, User: ${process.env.SQL_USER}, DB: ${process.env.SQL_DB_NAME}, Port: ${process.env.SQL_PORT || "5432"}`);
  } else if (hasUrl) {
    const maskedUrl = process.env.DATABASE_URL!.replace(/:[^:@\n]+@/, ":****@");
    console.log(`[ZenPlan DB] Mode: Falling back to DATABASE_URL Connection String. Masked URL: ${maskedUrl}`);
  }

  const poolConfig = useIndividual
    ? {
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        connectionTimeoutMillis: 15000,
        ssl: { rejectUnauthorized: false },
      }
    : {
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 15000,
        ssl: { rejectUnauthorized: false },
      };

  pool = new Pool(poolConfig);

  pool.on("error", (err: any) => {
    console.error("[ZenPlan Database] Unexpected error on idle SQL pool client:", err);
  });

  dbInstance = drizzle(pool, { schema });

  // Self-healing: ensure the schema is initialized and up to date on startup
  (async () => {
    try {
      const { sql } = await import("drizzle-orm");
      
      // 1. Create table if not exists with all default columns
      await dbInstance.execute(sql`
        CREATE TABLE IF NOT EXISTS "employees" (
          "id" serial PRIMARY KEY,
          "email" text UNIQUE,
          "name" text NOT NULL,
          "role" text NOT NULL,
          "avatar" text NOT NULL,
          "location" text NOT NULL,
          "level" text NOT NULL,
          "earned_leave" integer NOT NULL DEFAULT 14,
          "earned_leave_max" integer NOT NULL DEFAULT 40,
          "cl_count" integer NOT NULL DEFAULT 6,
          "sl_count" integer NOT NULL DEFAULT 6,
          "comp_off_count" integer NOT NULL DEFAULT 2,
          "comp_off_expiry_days" integer NOT NULL DEFAULT 45,
          "vibes" text NOT NULL DEFAULT 'Mountains',
          "budget_level" integer NOT NULL DEFAULT 2,
          "prioritize_roi" boolean NOT NULL DEFAULT true,
          "prioritize_lowest_cost" boolean NOT NULL DEFAULT false,
          "current_trip_location" text NOT NULL DEFAULT '',
          "is_trip_locked" boolean NOT NULL DEFAULT false,
          "active_holiday_swaps" text NOT NULL DEFAULT '{}',
          "password_hash" text,
          "password_salt" text,
          "updated_at" timestamp DEFAULT now()
        );
      `);
      console.log("[ZenPlan DB] Verified and initialized 'employees' table schema.");

      // 2. Ensure password hashes and salt columns are present (for backwards-compatibility updates)
      await dbInstance.execute(sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash text;`);
      await dbInstance.execute(sql`ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_salt text;`);
      console.log("[ZenPlan DB] Verified authentication password columns exist.");
    } catch (err: any) {
      console.warn("[ZenPlan DB] Schema initialization check message:", err.message);
    }
  })();
} else {
  console.warn("[ZenPlan DB] Running in Local Memory fallback mode because Cloud SQL environment variables are not yet populated.");
}

export const dbStatus = {
  isConfigured: hasDBCredentials,
};

export const db = dbInstance;
