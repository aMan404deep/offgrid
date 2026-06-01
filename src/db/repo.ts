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

    if (!dbStatus.isConfigured) {
      console.log(`[ZenQuery Fallback] Local server cache upsert: ${email}`);
      sandboxCache[normEmail] = {
        ...merged,
        updatedAt: new Date(),
      };
      return sandboxCache[normEmail];
    }

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

    return insertedRows[0] as DbEmployee;
  } catch (error) {
    console.error(`[ZenQuery Exception] Failed to persist employee: ${employee.name || email}`, error);
    throw new Error("Database persistence failed. Verify database connectivity and user privileges.", { cause: error });
  }
}
