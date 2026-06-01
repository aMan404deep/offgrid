import { create } from "zustand";
import { UserProfile, LeaveBalances, TravelPreferences, ItineraryDay, ItineraryItem, BudgetForecast, Achievement, ChatMessage, OfficeLocation, LiveDealsData } from "../types";
import { getTransitDetails } from "../utils/transit";

interface LeaveState {
  isAuthenticated: boolean;
  currentTab: 'gateway' | 'dashboard' | 'calendar' | 'itinerary' | 'profile' | 'settings' | 'sync' | 'shared';
  user: UserProfile;
  leaveBalances: LeaveBalances;
  preferences: TravelPreferences;
  chatHistory: ChatMessage[];
  achievements: Achievement[];
  isCommandPaletteOpen: boolean;
  
  // App-specific interactive state
  activeHolidaySwaps: Record<string, string>; // maps fixed date string -> floater name
  currentTripLocation: string;
  isTripLocked: boolean;
  activeStreakDays: string[]; // e.g. ["2026-10-10", ...]
  itinerary: ItineraryDay[];
  isGeneratingItinerary: boolean;
  budgetForecast: BudgetForecast;
  liveDeals: LiveDealsData | null;
  isFetchingDeals: boolean;

  // Sidebar resizable/collapsible layout states
  sidebarWidth: number;
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  
  // Actions
  checkAutoLogin: () => void;
  finalizeLogin: (data: any) => void;
  login: (location: OfficeLocation, name: string) => void;
  logout: () => void;
  setTab: (tab: LeaveState['currentTab']) => void;
  updatePreferences: (prefs: Partial<TravelPreferences>) => void;
  toggleVibe: (vibe: string) => void;
  resetPreferences: () => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  setCommandPalette: (open: boolean) => void;
  swapHoliday: (fixedHolidayDate: string, floaterName: string) => void;
  resetSwaps: () => void;
  setTripLocation: (loc: string) => void;
  generateItinerary: (destination: string) => Promise<void>;
  fetchLiveDeals: (destination: string) => Promise<void>;
  lockTrip: () => void;
  syncToHRMS: () => Promise<boolean>;
  unlockTrip: () => void;
  setSidebarWidth: (w: number) => void;
  setSidebarCollapsed: (c: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  updateUserAvatar: (avatar: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const DEFAULT_PREFERENCES: TravelPreferences = {
  vibes: ["Mountains"],
  budgetLevel: 2, // Standard/Mid range
  prioritizeROI: true,
  prioritizeLowestCost: false,
};

const INITIAL_BALANCES: LeaveBalances = {
  earnedLeave: 14,
  earnedLeaveMax: 40,
  clCount: 6,
  slCount: 6,
  compOffCount: 2,
  compOffExpiryDays: 45, // Nearing 90-day expiry loop
};

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: "a1", title: "Comp-Off Champ", description: "Utilize a compensatory off day within 15 days of earning it.", icon: "zap", unlocked: true, colorType: "primary" },
  { id: "a2", title: "Globetrotter", description: "Optimize consecutive weekends with 2 leaves to get 10+ days off.", icon: "globe", unlocked: true, colorType: "secondary" },
  { id: "a3", title: "Efficiency Expert", description: "Secure an itinerary with an optimization ROI ratio exceeding 4.0x.", icon: "award", unlocked: false, colorType: "tertiary" },
  { id: "a4", title: "Early Bird", description: "Plan standard leaves 30 days ahead of the regional fixed holiday.", icon: "clock", unlocked: false, colorType: "muted" },
];

function getDynamicFallbackItinerary(destination: string, budgetLevel: number): ItineraryDay[] {
  // Simple default origin if we don't have access to state
  const origin = "Delhi"; 
  const transitInfo = getTransitDetails(origin, destination || "Manali", budgetLevel);

  if (budgetLevel === 1) {
    // Economy/Budget Specific high-fidelity schedule
    const firstActivity: ItineraryItem = transitInfo.isDirect ? {
      id: "co-1",
      time: "09:30 AM",
      title: `Direct Flight Arrival`,
      description: `Fly in to ${destination} terminal. Enjoy immediate entry to your wellness retreat compound.`,
      category: "Morning",
      icon: "bus"
    } : {
      id: "co-1",
      time: "08:15 AM",
      title: `Flight to ${transitInfo.hubName}`,
      description: `Hop on the budget air flight to ${transitInfo.hubName}. Prepare for the beautiful scenic overland section.`,
      category: "Morning",
      icon: "bus"
    };

    const secondActivity: ItineraryItem = transitInfo.isDirect ? {
      id: "co-2",
      time: "02:00 PM",
      title: "Cozy Backpacker Hostel Settle",
      description: "Check into a tidy shared cabin space or local eco-guest rooms. Clean your gear.",
      category: "Afternoon",
      icon: "home"
    } : {
      id: "co-22",
      time: "01:30 PM",
      title: `Scenic Overland Transfer to ${destination}`,
      description: `Board the standard regional transit link climbing through spectacular vertical canyon views.`,
      category: "Afternoon",
      icon: "home"
    };

    return [
      {
        dayNumber: 1,
        dateStr: "Sat, Oct 10",
        title: "The Multi-Modal Passage",
        activities: [
          firstActivity,
          secondActivity,
          { id: "co-3", time: "06:30 PM", title: "Street Food Expedition", description: `Unwind in ${destination}. Savor spiced hot tea, local dumplings, and traditional baked treats near your stay.`, category: "Evening", icon: "sunset" }
        ]
      },
      {
        dayNumber: 2,
        dateStr: "Sun, Oct 11",
        title: "Free Nature Vibe Trails",
        activities: [
          { id: "co-4", time: "08:30 AM", title: "Self-Brewed Local Coffee", description: "Fresh morning self-pack travel brew filter with handground local coffee beans.", category: "Morning", icon: "coffee" },
          { id: "co-5", time: "11:30 AM", title: "DIY Nature Ridge Hike", description: "Trek up free public pathways through emerald slopes with zero-cost entry; enjoy stunning raw vistas.", category: "Afternoon", icon: "mountain" },
          { id: "co-7", time: "07:00 PM", title: "Hearth Room Social Gather", description: "Gather around an open log fire, swapping local lore and traveler tales with standard snacks.", category: "Evening", icon: "flame" }
        ]
      },
      {
        dayNumber: 3,
        dateStr: "Mon, Oct 12",
        title: "Pristine Stream Calm",
        activities: [
          { id: "co-8", time: "09:00 AM", title: "River Bank Meditation", description: "Simple relaxation next to cool mountain currents for tranquil breathing and mindfulness.", category: "Morning", icon: "droplet" },
          { id: "co-9", time: "03:00 PM", title: "Regional Herbal Forest Walk", description: "Self-guided walk through fragrant spices bushes and tea gardens under deep skies.", category: "Afternoon", icon: "smile" },
          { id: "co-10", time: "08:00 PM", title: "Telescope Starspotting", description: "Unobstructed stellar sightings over the hills from a shared community deck.", category: "Evening", icon: "sparkles" }
        ]
      }
    ];
  } else if (budgetLevel === 3) {
    // Luxury Specific high-fidelity schedule
    const firstActivity: ItineraryItem = transitInfo.isDirect ? {
      id: "co-1",
      time: "09:30 AM",
      title: `VIP Landing Escort`,
      description: `Exclusive air landing at ${destination}. Direct first-class air lounge gate pickup to your private villa quarters.`,
      category: "Morning",
      icon: "plane"
    } : {
      id: "co-1",
      time: "08:00 AM",
      title: `Sky Connect: First-Class to ${transitInfo.hubName}`,
      description: `Fly in ultra comfort to regional gate ${transitInfo.hubName}. Personalized arrival liaison processes baggage.`,
      category: "Morning",
      icon: "plane"
    };

    const secondActivity: ItineraryItem = transitInfo.isDirect ? {
      id: "co-2",
      time: "02:00 PM",
      title: "Infinite Pool Villa Settle",
      description: "Unwind inside your five-star woodland villa featuring scenic heated plunge baths and customized ambient therapy layouts.",
      category: "Afternoon",
      icon: "home"
    } : {
      id: "co-22",
      time: "12:30 PM",
      title: `Premium Private Escort to ${destination}`,
      description: `Chauffeur transfer via private luxury high-wheel Cruiser equipped with gourmet refreshments and spectacular hairpin camera view anchors.`,
      category: "Afternoon",
      icon: "home"
    };

    return [
      {
        dayNumber: 1,
        dateStr: "Sat, Oct 10",
        title: "The Regal Passage",
        activities: [
          firstActivity,
          secondActivity,
          { id: "co-3", time: "06:30 PM", title: "Five-Star Sommelier Dusk Reception", description: `Champagne sunset toast overlooking the rolling mountain ridges of ${destination}.`, category: "Evening", icon: "sunset" }
        ]
      },
      {
        dayNumber: 2,
        dateStr: "Sun, Oct 11",
        title: "Exclusive Helicopter Vantage & Fine Art",
        activities: [
          { id: "co-4", time: "08:30 AM", title: "Private Butler Room Service", description: "In-villa artisanal espresso pairing served by your personal butler alongside fresh organic berries.", category: "Morning", icon: "coffee" },
          { id: "co-5", time: "11:30 AM", title: "Helicopter Panoramic Flight", description: `Private scenic flight charter soaring over majestic cliffs of ${destination} with exclusive alpine ridge champagne picnic.`, category: "Afternoon", icon: "mountain" },
          { id: "co-6", time: "07:00 PM", title: "Michelin-caliber Gala Dining", description: "Multi-course local fusion degustation menu in an intimate glass-domed observatory with live harp music.", category: "Evening", icon: "flame" }
        ]
      },
      {
        dayNumber: 3,
        dateStr: "Mon, Oct 12",
        title: "Exclusive Botanical Spa Rest",
        activities: [
          { id: "co-7", time: "09:00 AM", title: "Private Thermal Spring Soak", description: "Exclusive reservation space in deep mineral hot baths with warm organic eucalyptus compresses.", category: "Morning", icon: "droplet" },
          { id: "co-8", time: "03:00 PM", title: "Suspended Forest Pavilion Spa", description: "Therapeutic five-hour full-rest muscular program featuring custom neuro-relaxation massage oils inside a suspended botanical canopy.", category: "Afternoon", icon: "smile" },
          { id: "co-9", time: "08:00 PM", title: "High-Grade Space Observance", description: "Private stargazing session using research-grade automated glass guided by a personal astrophysicist.", category: "Evening", icon: "sparkles" }
        ]
      }
    ];
  } else {
    // Standard / Mid Range Cozy Retreat Schedule
    const firstActivity: ItineraryItem = transitInfo.isDirect ? {
      id: "co-1",
      time: "09:30 AM",
      title: `Arrival at ${destination}`,
      description: "Direct flight landing followed by pre-arranged premium sedan terminal transport. Welcome coolers on board.",
      category: "Morning",
      icon: "plane"
    } : {
      id: "co-1",
      time: "08:30 AM",
      title: `Flight Connection to Regional Hub`,
      description: `Arrive at ${transitInfo.hubName} Airport. Meet your personal coordinator for the beautiful drive segment up the mountains.`,
      category: "Morning",
      icon: "plane"
    };

    const secondActivity: ItineraryItem = transitInfo.isDirect ? {
      id: "co-2",
      time: "02:00 PM",
      title: "Cottage Garden Check-In",
      description: "Settle into your warm wood-and-stone forest cottage. Cozy up near the custom pine-wood patio.",
      category: "Afternoon",
      icon: "home"
    } : {
      id: "co-22",
      time: "01:00 PM",
      title: `Scenic Overland Drive to ${destination}`,
      description: `Comfortable private pre-paid sedan transfer navigating the gorgeous pine forests, valleys, and cascading streams.`,
      category: "Afternoon",
      icon: "home"
    };

    return [
      {
        dayNumber: 1,
        dateStr: "Sat, Oct 10",
        title: "The Winding Journey",
        activities: [
          firstActivity,
          secondActivity,
          { id: "co-3", time: "06:00 PM", title: "Ridge Cafe Dusk Watching", description: `Unwind with freshly roasted regional coffee at a ridge sunset patio in ${destination}, watching deep clouds turn orange.`, category: "Evening", icon: "sunset" }
        ]
      },
      {
        dayNumber: 2,
        dateStr: "Sun, Oct 11",
        title: "Vibe Exploration & Serenity",
        activities: [
          { id: "co-4", time: "08:30 AM", title: "Cottage Roasted Coffee", description: "Fresh morning drip espresso matching your quiet retreat guidelines.", category: "Morning", icon: "coffee" },
          { id: "co-5", time: "11:30 AM", title: "Guided Forest Trail Hike", description: "Trek up through emerald bamboo groves toward private scenic mountain overlooks with local guides.", category: "Afternoon", icon: "mountain" },
          { id: "co-6", time: "07:00 PM", title: "Hearth Cabin Dining", description: "Dine inside cozy log frame cabins. Local fresh organic farm specialties under soft ambient lighting.", category: "Evening", icon: "flame" }
        ]
      },
      {
        dayNumber: 3,
        dateStr: "Mon, Oct 12",
        title: "Mineral Spa & Rejuvenation",
        activities: [
          { id: "co-7", time: "09:00 AM", title: "Natural Stream Soaking", description: "Lying alongside cool mountain currents for continuous mental clarity.", category: "Morning", icon: "droplet" },
          { id: "co-8", time: "03:00 PM", title: "Eucalyptus Massage Session", description: "Therapeutic muscular rest prioritizing full physical recoverance in standard resort spa.", category: "Afternoon", icon: "smile" },
          { id: "co-9", time: "08:00 PM", title: "Stargazing Deck Session", description: "Unobstructed stellar sightings over the hills from your private villa deck.", category: "Evening", icon: "sparkles" }
        ]
      }
    ];
  }
}

export const useLeaveStore = create<LeaveState>((set, get) => {
  const syncWithBackend = async () => {
    const s = get();
    if (!s.isAuthenticated || !s.user.name) return;
    try {
      await fetch("/api/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: s.user.email,
          name: s.user.name,
          role: s.user.role,
          avatar: s.user.avatar,
          location: s.user.location,
          level: s.user.level,
          earnedLeave: s.leaveBalances.earnedLeave,
          earnedLeaveMax: s.leaveBalances.earnedLeaveMax,
          clCount: s.leaveBalances.clCount,
          slCount: s.leaveBalances.slCount,
          compOffCount: s.leaveBalances.compOffCount,
          compOffExpiryDays: s.leaveBalances.compOffExpiryDays,
          vibes: s.preferences.vibes.join(","),
          budgetLevel: s.preferences.budgetLevel,
          prioritizeROI: s.preferences.prioritizeROI,
          prioritizeLowestCost: s.preferences.prioritizeLowestCost,
          currentTripLocation: s.currentTripLocation,
          isTripLocked: s.isTripLocked,
          activeHolidaySwaps: JSON.stringify(s.activeHolidaySwaps),
        })
      });
    } catch (e) {
      console.warn("[ZenPlan Background Sync Failed]", e);
    }
  };

  const triggerSync = () => {
    setTimeout(syncWithBackend, 10);
  };

  return {
    isAuthenticated: false,
    currentTab: "gateway",
    user: {
      email: "alex@arrisesolutions.com",
      name: "Alex Singh",
      role: "Senior Engineering Specialist",
      avatar: "",
      location: "Noida",
      level: "Lv 4 Leave Optimizer",
    },
    leaveBalances: INITIAL_BALANCES,
    preferences: DEFAULT_PREFERENCES,
    chatHistory: [
      { id: "init-1", sender: "ai", text: "Welcome to OffGrid AI! I can calculate the optimal way to use your CL/SL and Comp-Off balance against upcoming regional Noida holidays. Try searching or asking me details of our 2026 policies.", timestamp: "11:00 AM" }
    ],
    achievements: INITIAL_ACHIEVEMENTS,
    isCommandPaletteOpen: false,
    
    activeHolidaySwaps: {},
    currentTripLocation: "",
    isTripLocked: false,
    activeStreakDays: [
      "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", 
      "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"
    ], // 9 days off (Oct 10 Saturday to Oct 18 Sunday), only requiring 2 days of real Earned Leaves
    itinerary: getDynamicFallbackItinerary("", 2),
    isGeneratingItinerary: false,
    budgetForecast: {
      flights: 14500,
      accommodation: 22000,
      transit: 4000,
      total: 40500,
      currency: "INR",
    },
    liveDeals: null,
    isFetchingDeals: false,

    // Sidebar layout states
    sidebarWidth: 72,
    isSidebarCollapsed: true,
    isMobileSidebarOpen: false,

    checkAutoLogin: async () => {
      try {
        const email = localStorage.getItem("zenplan_email");
        if (email) {
          const response = await fetch(`/api/employee?email=${encodeURIComponent(email)}`);
          if (response.ok) {
            const result = await response.json();
            if (result.exists && result.data) {
              get().finalizeLogin(result.data);
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Auto login via DB/auth failed", e);
      }
    },

    finalizeLogin: (dbEmp: any) => {
      let parsedVibes = ["Mountains"];
      if (dbEmp.vibes) {
        parsedVibes = dbEmp.vibes.split(",").map((v: string) => v.trim()).filter((v: string) => v !== "");
      }
      let parsedSwaps = {};
      if (dbEmp.activeHolidaySwaps) {
        try {
          parsedSwaps = JSON.parse(dbEmp.activeHolidaySwaps);
        } catch (pErr) {
          parsedSwaps = {};
        }
      }

      set({
        isAuthenticated: true,
        currentTab: "dashboard",
        user: {
          email: dbEmp.email,
          name: dbEmp.name,
          role: dbEmp.role,
          avatar: dbEmp.avatar,
          location: dbEmp.location as OfficeLocation,
          level: dbEmp.level,
        },
        leaveBalances: {
          earnedLeave: dbEmp.earnedLeave,
          earnedLeaveMax: dbEmp.earnedLeaveMax,
          clCount: dbEmp.clCount,
          slCount: dbEmp.slCount,
          compOffCount: dbEmp.compOffCount,
          compOffExpiryDays: dbEmp.compOffExpiryDays,
        },
        preferences: {
          vibes: parsedVibes,
          budgetLevel: dbEmp.budgetLevel,
          prioritizeROI: dbEmp.prioritizeROI,
          prioritizeLowestCost: dbEmp.prioritizeLowestCost,
        },
        currentTripLocation: dbEmp.currentTripLocation,
        isTripLocked: dbEmp.isTripLocked,
        activeHolidaySwaps: parsedSwaps,
      });
      localStorage.setItem("zenplan_email", dbEmp.email);
      get().generateItinerary(dbEmp.currentTripLocation);
    },

    login: async (location: OfficeLocation, name: string) => {
      const defaultUser = get().user;
      const cleanName = name.trim() || defaultUser.name;
      const initialRole = localStorage.getItem("zenplan_initial_role") || "Optimizer";
      
      const newEmp = {
        email: localStorage.getItem("zenplan_pending_email") || "temp@arrisesolutions.com",
        name: cleanName,
        role: initialRole,
        avatar: "",
        location: location as OfficeLocation,
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
        currentTripLocation: "",
        isTripLocked: false,
        activeHolidaySwaps: "{}"
      };
      
      try {
        const response = await fetch('/api/employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEmp)
        });
        if (response.ok) {
          const resObj = await response.json();
          if (resObj.success && resObj.data) {
             get().finalizeLogin(resObj.data);
             return;
          }
        }
      } catch (err) {}

      set({
        isAuthenticated: true,
        currentTab: "dashboard",
        user: {
          ...defaultUser,
          email: newEmp.email,
          name: cleanName,
          location,
        },
      });
      localStorage.setItem("zenplan_email", newEmp.email);
      triggerSync();
    },

    logout: async () => {
      localStorage.removeItem("zenplan_email");
      localStorage.removeItem("zenplan_pending_email");
      set({
        isAuthenticated: false,
        currentTab: "gateway",
        activeHolidaySwaps: {},
        isTripLocked: false,
      });
    },

    setTab: (tab: LeaveState['currentTab']) => set({ currentTab: tab }),

    updatePreferences: (prefs: Partial<TravelPreferences>) => {
      set((state) => {
        const updated = { ...state.preferences, ...prefs };
        
        // Dynamically recalculate estimated budgets depending on preferences
        const baseMult = updated.budgetLevel === 3 ? 2.5 : updated.budgetLevel === 1 ? 0.4 : 1.0;
        const isLowestCost = updated.prioritizeLowestCost;
        const finalMult = isLowestCost ? baseMult * 0.75 : baseMult;

        return {
          preferences: updated,
          budgetForecast: {
            flights: Math.round(14500 * finalMult),
            accommodation: Math.round(22000 * finalMult),
            transit: Math.round(4000 * finalMult),
            total: Math.round((14500 + 22000 + 4000) * finalMult),
            currency: "INR",
          }
        };
      });
      triggerSync();
    },

    toggleVibe: (vibe: string) => {
      set((state) => {
        const currentVibes = state.preferences.vibes;
        const exists = currentVibes.includes(vibe);
        let updatedVibes = [];
        if (exists) {
          updatedVibes = currentVibes.filter(v => v !== vibe);
        } else {
          updatedVibes = [...currentVibes, vibe];
        }
        if (updatedVibes.length === 0) {
          updatedVibes = [vibe];
        }
        return {
          preferences: {
            ...state.preferences,
            vibes: updatedVibes,
          }
        };
      });
      triggerSync();
    },

    resetPreferences: () => {
      set((state) => ({
        preferences: DEFAULT_PREFERENCES,
        budgetForecast: {
          flights: 14500,
          accommodation: 22000,
          transit: 4000,
          total: 40500,
          currency: "INR",
        }
      }));
      triggerSync();
    },

    addChatMessage: (msg: ChatMessage) => set((state) => ({
      chatHistory: [...state.chatHistory, msg],
    })),

    clearChat: () => set({ chatHistory: [] }),

    setCommandPalette: (open: boolean) => set({ isCommandPaletteOpen: open }),

    swapHoliday: (fixedHolidayDate: string, floaterName: string) => {
      set((state) => ({
        activeHolidaySwaps: {
          ...state.activeHolidaySwaps,
          [fixedHolidayDate]: floaterName,
        }
      }));
      triggerSync();
    },

    resetSwaps: () => {
      set({ activeHolidaySwaps: {} });
      triggerSync();
    },

    setTripLocation: (loc: string) => {
      set({ currentTripLocation: loc });
      triggerSync();
    },

    generateItinerary: async (destination: string) => {
      set({ isGeneratingItinerary: true, currentTripLocation: destination });
      triggerSync();
      try {
        const response = await fetch("/api/generate-itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination,
            days: 9, 
            baseLocation: get().user.location,
            vibe: get().preferences.vibes.join(", "),
            isLuxury: get().preferences.budgetLevel === 3,
            budgetLevel: get().preferences.budgetLevel,
          }),
        });

        if (!response.ok) throw new Error("API call failed");

        const data = await response.json();
        if (data && data.days) {
          set({ itinerary: data.days, isGeneratingItinerary: false });
        } else {
          throw new Error("Invalid structure returned");
        }
      } catch (err) {
        console.warn("Using high-fidelity pre-compiled recovery planner matrices (API key bypass).");
        const customizedDays = getDynamicFallbackItinerary(destination, get().preferences.budgetLevel);
        set({ itinerary: customizedDays, isGeneratingItinerary: false });
      }
    },

    fetchLiveDeals: async (destination: string) => {
      set({ isFetchingDeals: true });
      try {
        const response = await fetch("/api/live-deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination,
            origin: get().user.location,
            budgetLevel: get().preferences.budgetLevel,
            dates: "Upcoming long weekend",
          }),
        });

        if (!response.ok) throw new Error("Live deals API failed");

        const data = await response.json();
        if (data && (data.flights || data.hotels)) {
          set({ liveDeals: data, isFetchingDeals: false });
        } else {
          throw new Error("Invalid deals structure returned");
        }
      } catch (err) {
        console.warn("Using mock fallback deals for live-deals (API error or key bypass).");
        // We let the server API handle the standard fallback, but just in case of complete network failure:
        set({ isFetchingDeals: false });
      }
    },

    lockTrip: () => {
      set({ isTripLocked: true, currentTab: "sync" });
      triggerSync();
    },

    unlockTrip: () => {
      set({ isTripLocked: false });
      triggerSync();
    },

    setSidebarWidth: (w: number) => set({ sidebarWidth: w }),

    setSidebarCollapsed: (c: boolean) => set({ isSidebarCollapsed: c }),

    setMobileSidebarOpen: (open: boolean) => set({ isMobileSidebarOpen: open }),

    updateUserAvatar: (avatar: string) => {
      set((state) => ({ user: { ...state.user, avatar } }));
      triggerSync();
    },

    updateProfile: (profile: Partial<UserProfile>) => {
      set((state) => ({ user: { ...state.user, ...profile } }));
      triggerSync();
    },

    syncToHRMS: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      set((state) => {
        const appliedEL = 2;
        const newBalances = {
          ...state.leaveBalances,
          earnedLeave: Math.max(0, state.leaveBalances.earnedLeave - appliedEL),
        };
        
        const updatedAchievements = state.achievements.map((ach) =>
          ach.id === "a3" ? { ...ach, unlocked: true } : ach
        );

        return {
          leaveBalances: newBalances,
          achievements: updatedAchievements,
        };
      });

      triggerSync();
      return true;
    },
  };
});
