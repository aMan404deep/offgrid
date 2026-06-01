export type OfficeLocation = 'Noida' | 'Hyderabad' | 'Kolkata';

export interface UserProfile {
  name: string;
  role: string;
  avatar: string;
  location: OfficeLocation;
  level: string;
}

export interface LeaveBalances {
  earnedLeave: number;
  earnedLeaveMax: number;
  clCount: number;
  slCount: number;
  compOffCount: number;
  compOffExpiryDays: number;
}

export interface TravelPreferences {
  vibes: string[]; // e.g. ["Mountains", "Historical"]
  budgetLevel: number; // 1: Backpacker, 2: Mid-Range, 3: Luxury
  prioritizeROI: boolean;
  prioritizeLowestCost: boolean;
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'Morning' | 'Afternoon' | 'Evening';
  icon: string;
}

export interface ItineraryDay {
  dayNumber: number;
  dateStr: string;
  title: string;
  activities: ItineraryItem[];
}

export interface BudgetForecast {
  flights: number;
  accommodation: number;
  transit: number;
  total: number;
  currency: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  colorType: 'primary' | 'secondary' | 'tertiary' | 'muted';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
