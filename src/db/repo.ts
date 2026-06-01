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
  updatedAt?: Date | null;
}

// In-memory cache for fallback when Cloud SQL is unconfigured/offline
const sandboxCache: Record<string, DbEmployee> = {};

/**
 * Retrieves an employee record by name.
 */
export async function getEmployeeByEmail(email: string): Promise<DbEmployee | null> {
  const normEmail = email.trim().toLowerCase();
  
  try {
    if (!dbStatus.isConfigured) {
      console.log(`[ZenQuery Fallback] Local server cache fetch: ${email}`);
      return sandboxCache[normEmail] || null;
    }

    const records = await db
      .select()
      .from(employees)
      .where(eq(employees.email, normEmail));
    
    return (records[0] as DbEmployee) || null;
  } catch (error) {
    console.error(`[ZenQuery Exception] Failed to query DB for employee: ${email}`, error);
    throw new Error("Database query failed. Please ensure schema matches active definition.", { cause: error });
  }
}

/**
 * Upserts an employee record on name match.
 */
export async function upsertEmployee(employee: DbEmployee): Promise<DbEmployee> {
  const email = employee.email.trim();
  const normEmail = email.toLowerCase();

  try {
    if (!dbStatus.isConfigured) {
      console.log(`[ZenQuery Fallback] Local server cache upsert: ${email}`);
      sandboxCache[normEmail] = {
        ...employee,
        updatedAt: new Date(),
      };
      return sandboxCache[normEmail];
    }

    const insertedRows = await db
      .insert(employees)
      .values({
        email: normEmail,
        name: employee.name,
        role: employee.role,
        avatar: employee.avatar,
        location: employee.location,
        level: employee.level,
        earnedLeave: employee.earnedLeave,
        earnedLeaveMax: employee.earnedLeaveMax,
        clCount: employee.clCount,
        slCount: employee.slCount,
        compOffCount: employee.compOffCount,
        compOffExpiryDays: employee.compOffExpiryDays,
        vibes: employee.vibes,
        budgetLevel: employee.budgetLevel,
        prioritizeROI: employee.prioritizeROI,
        prioritizeLowestCost: employee.prioritizeLowestCost,
        currentTripLocation: employee.currentTripLocation,
        isTripLocked: employee.isTripLocked,
        activeHolidaySwaps: employee.activeHolidaySwaps,
      })
      .onConflictDoUpdate({
        target: employees.email,
        set: {
          name: employee.name,
          role: employee.role,
          avatar: employee.avatar,
          location: employee.location,
          level: employee.level,
          earnedLeave: employee.earnedLeave,
          earnedLeaveMax: employee.earnedLeaveMax,
          clCount: employee.clCount,
          slCount: employee.slCount,
          compOffCount: employee.compOffCount,
          compOffExpiryDays: employee.compOffExpiryDays,
          vibes: employee.vibes,
          budgetLevel: employee.budgetLevel,
          prioritizeROI: employee.prioritizeROI,
          prioritizeLowestCost: employee.prioritizeLowestCost,
          currentTripLocation: employee.currentTripLocation,
          isTripLocked: employee.isTripLocked,
          activeHolidaySwaps: employee.activeHolidaySwaps,
          updatedAt: new Date(),
        },
      })
      .returning();

    return insertedRows[0] as DbEmployee;
  } catch (error) {
    console.error(`[ZenQuery Exception] Failed to persist employee: ${name}`, error);
    throw new Error("Database persistence failed. Verify database connectivity and user privileges.", { cause: error });
  }
}
