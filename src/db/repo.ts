import { db, dbStatus } from "./index.ts";
import { employees } from "./schema.ts";
import { eq } from "drizzle-orm";

// Symmetrical local model mapping
export interface DbEmployee {
  id?: number;
  email: string;
  name: string;
  role: string;
  avatar: string;
  location: string;
  level: string;
  earnedLeave: number;
  earnedLeaveMax: number;
  clCount: number;
  slCount: number;
  compOffCount: number;
  compOffExpiryDays: number;
  vibes: string;
  budgetLevel: number;
  prioritizeROI: boolean;
  prioritizeLowestCost: boolean;
  currentTripLocation: string;
  isTripLocked: boolean;
  activeHolidaySwaps: string;
  passwordHash?: string | null;
  passwordSalt?: string | null;
  updatedAt?: Date | null;
}

// In-memory cache for fallback when Cloud SQL is unconfigured/offline
const sandboxCache: Record<string, DbEmployee> = {};

/**
 * Retrieves an employee record by email.
 */
export async function getEmployeeByEmail(email: string): Promise<DbEmployee | null> {
  const normEmail = email.trim().toLowerCase();
  console.log(`[ZenPlan DB Query] Finding employee by email: "${normEmail}"`);
  
  try {
    if (!dbStatus.isConfigured) {
      console.log(`[ZenPlan DB Query] [Fallback Mode] Local memory cache fetch for: "${normEmail}"`);
      const cached = sandboxCache[normEmail] || null;
      console.log(`[ZenPlan DB Query] [Fallback Mode] Cache result: ${cached ? "FOUND" : "NOT FOUND"}`);
      return cached;
    }

    console.log(`[ZenPlan DB Query] Executing database query "SELECT FROM employees WHERE email = '${normEmail}'"...`);
    const records = await db
      .select()
      .from(employees)
      .where(eq(employees.email, normEmail));
    
    const found = (records[0] as DbEmployee) || null;
    console.log(`[ZenPlan DB Query] Database query execution finished. Employee found? ${found ? "YES" : "NO"}`);
    if (found) {
      console.log(`[ZenPlan DB Query] Retrieved record: ID=${found.id}, Name="${found.name}", Role="${found.role}", Location="${found.location}"`);
    }
    return found;
  } catch (error: any) {
    console.error(`[ZenPlan DB Query] [ERROR] Failed to query database for email "${normEmail}"!`, error);
    console.error(`[ZenPlan DB Query] [ERROR Details] Message: ${error.message}, Code: ${error.code || "N/A"}`);
    throw new Error(`Database query failed for "${normEmail}". Please ensure schema matches active definition.`, { cause: error });
  }
}

/**
 * Upserts an employee record on name match.
 */
export async function upsertEmployee(employee: DbEmployee): Promise<DbEmployee> {
  const email = employee.email.trim();
  const normEmail = email.toLowerCase();
  console.log(`[ZenPlan DB Write] Start upsert employee process for: "${normEmail}"`);

  try {
    // 1. Get existing employee from database or cache (if any)
    const existing = await getEmployeeByEmail(normEmail);

    // 2. Define standard default values for mandatory fields
    const defaultTemplate: DbEmployee = {
      email: normEmail,
      name: "New Joiner",
      role: "Optimizer",
      avatar: "",
      location: "Noida",
      level: "Lv 4 Leave Optimizer",
      earnedLeave: 14,
      earnedLeaveMax: 40,
      clCount: 6,
      slCount: 6,
      compOffCount: 2,
      compOffExpiryDays: 45,
      vibes: "Mountains",
      budgetLevel: 2,
      prioritizeROI: true,
      prioritizeLowestCost: false,
      currentTripLocation: "Coimbatore",
      isTripLocked: false,
      activeHolidaySwaps: "{}",
      passwordHash: null,
      passwordSalt: null,
    };

    // 3. Keep only fields that are explicitly provided (not null or undefined)
    const incomingClean = Object.fromEntries(
      Object.entries(employee).filter(([_, val]) => val !== undefined && val !== null)
    );

    // 4. Merge: Default values < Existing DB records < Incoming client changes
    const merged: DbEmployee = {
      ...defaultTemplate,
      ...existing,
      ...incomingClean,
      email: normEmail, // strictly enforce normalized email
    };

    console.log(`[ZenPlan DB Write] Merged database data payload for insert/update:`);
    console.log(JSON.stringify({ 
      email: merged.email, 
      name: merged.name, 
      role: merged.role, 
      avatar: merged.avatar || "(empty string)", 
      location: merged.location, 
      level: merged.level 
    }, null, 2));

    if (!dbStatus.isConfigured) {
      console.log(`[ZenPlan DB Write] [Fallback Mode] Saving to local memory cache...`);
      sandboxCache[normEmail] = {
        ...merged,
        updatedAt: new Date(),
      };
      console.log(`[ZenPlan DB Write] [Fallback Mode] Saved in memory cache successfully.`);
      return sandboxCache[normEmail];
    }

    console.log(`[ZenPlan DB Write] Executing PostgreSQL Upsert Query in database...`);
    const insertedRows = await db
      .insert(employees)
      .values({
        email: merged.email,
        name: merged.name,
        role: merged.role,
        avatar: merged.avatar,
        location: merged.location,
        level: merged.level,
        earnedLeave: merged.earnedLeave,
        earnedLeaveMax: merged.earnedLeaveMax,
        clCount: merged.clCount,
        slCount: merged.slCount,
        compOffCount: merged.compOffCount,
        compOffExpiryDays: merged.compOffExpiryDays,
        vibes: merged.vibes,
        budgetLevel: merged.budgetLevel,
        prioritizeROI: merged.prioritizeROI,
        prioritizeLowestCost: merged.prioritizeLowestCost,
        currentTripLocation: merged.currentTripLocation,
        isTripLocked: merged.isTripLocked,
        activeHolidaySwaps: merged.activeHolidaySwaps,
        passwordHash: merged.passwordHash,
        passwordSalt: merged.passwordSalt,
      })
      .onConflictDoUpdate({
        target: employees.email,
        set: {
          name: merged.name,
          role: merged.role,
          avatar: merged.avatar,
          location: merged.location,
          level: merged.level,
          earnedLeave: merged.earnedLeave,
          earnedLeaveMax: merged.earnedLeaveMax,
          clCount: merged.clCount,
          slCount: merged.slCount,
          compOffCount: merged.compOffCount,
          compOffExpiryDays: merged.compOffExpiryDays,
          vibes: merged.vibes,
          budgetLevel: merged.budgetLevel,
          prioritizeROI: merged.prioritizeROI,
          prioritizeLowestCost: merged.prioritizeLowestCost,
          currentTripLocation: merged.currentTripLocation,
          isTripLocked: merged.isTripLocked,
          activeHolidaySwaps: merged.activeHolidaySwaps,
          passwordHash: merged.passwordHash,
          passwordSalt: merged.passwordSalt,
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log(`[ZenPlan DB Write] SQL Query executed successfully! Rows returned count: ${insertedRows.length}`);
    const persisted = insertedRows[0] as DbEmployee;
    console.log(`[ZenPlan DB Write] Persisted Database Row: ID=${persisted.id}, Email="${persisted.email}", Name="${persisted.name}"`);
    return persisted;
  } catch (error: any) {
    console.error(`[ZenPlan DB Write] [ERROR] Failed to save employee "${employee.name || email}"!`, error);
    console.error(`[ZenPlan DB Write] [ERROR Details] Error message: ${error.message}`);
    if (error.code) {
      console.error(`[ZenPlan DB Write] [ERROR Details] Database Error Code: ${error.code} (e.g., 23502 = Not Null Violation, 23505 = Unique Constraint)`);
    }
    throw new Error("Database persistence failed. Verify database connectivity and user privileges.", { cause: error });
  }
}
