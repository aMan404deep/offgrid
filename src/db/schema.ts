import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar").notNull(),
  location: text("location").notNull(), // 'Noida' | 'Hyderabad' | 'Kolkata'
  level: text("level").notNull(),
  
  // Leave balances
  earnedLeave: integer("earned_leave").notNull().default(14),
  earnedLeaveMax: integer("earned_leave_max").notNull().default(40),
  clCount: integer("cl_count").notNull().default(6),
  slCount: integer("sl_count").notNull().default(6),
  compOffCount: integer("comp_off_count").notNull().default(2),
  compOffExpiryDays: integer("comp_off_expiry_days").notNull().default(45),

  // Preferences
  vibes: text("vibes").notNull().default("Mountains"), // Comma-separated or serialized
  budgetLevel: integer("budget_level").notNull().default(2),
  prioritizeROI: boolean("prioritize_roi").notNull().default(true),
  prioritizeLowestCost: boolean("prioritize_lowest_cost").notNull().default(false),

  // Current session/trip state
  currentTripLocation: text("current_trip_location").notNull().default("Coimbatore"),
  isTripLocked: boolean("is_trip_locked").notNull().default(false),
  activeHolidaySwaps: text("active_holiday_swaps").notNull().default("{}"), // Stringified JSON

  updatedAt: timestamp("updated_at").defaultNow(),
});
