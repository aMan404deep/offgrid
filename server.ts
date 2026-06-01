import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { ARRISE_LEAVE_POLICY_TEXT } from "./src/data/leavePolicy.js";
import { getEmployeeByEmail, upsertEmployee } from "./src/db/repo.ts";
import crypto from "crypto";

function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, correctHash: string): boolean {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(correctHash, "hex"));
  } catch (err) {
    return false;
  }
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    console.warn("[ZenPlan Server] GEMINI_API_KEY is not defined or is a placeholder. API will run in sandbox fallback mode.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback helpers
function getFallbackPolicyChat(message: string) {
  const lower = message.toLowerCase();
  
  // Basic out-of-domain check
  const domainKeywords = ["leave", "holiday", "policy", "cl", "el", "sick", "casual", "comp", "floater", "swap", "maternity", "paternity", "arrise", "vacation", "trip", "travel", "itinerary", "date", "day", "calendar", "work", "time off"];
  
  const isDomain = domainKeywords.some(kw => lower.includes(kw)) || message.length < 5;
  if (!isDomain) {
    return "I am ZenPlan Assistant, I can only help with corporate HR and travel matters.";
  }

  let reply = "Based on the Arrise Leave Policy, ";
  if (lower.includes("cl") || lower.includes("casual") || lower.includes("sick")) {
    reply += "you are entitled to **12 CL/SL days per year** credited in advance. They do not roll over or encash, and lapse at the end of the financial year. You should utilize these first before Earned Leaves.";
  } else if (lower.includes("earned") || lower.includes("el")) {
    reply += "full-time employees accrue **1 Earned Leave (EL) per month**. These roll over and accumulate up to a maximum of **40 days**. Any leaves beyond 40 automatically lapse at the end of the year. During F&F, up to 40 days are encashable.";
  } else if (lower.includes("comp") || lower.includes("compensatory")) {
    reply += "Compensatory Offs (Comp-Offs) are earned by working weekends/holidays with manager approval. They **expire exactly 90 days** from the date they are earned, and unutilized days lapse automatically.";
  } else if (lower.includes("floater") || lower.includes("swap")) {
    reply += "you can exchange up to **two (2) fixed public holidays** map-listed by the company with choices from the approved floater calendars based on regional/personal preferences.";
  } else if (lower.includes("maternity")) {
    reply += "**26 weeks of paid Maternity Leave** for eligible female employees (first 2 children). Supporting medical documents must be submitted, and you must give 2 months' advance notice.";
  } else if (lower.includes("paternity")) {
    reply += "male employees can claim **10 working days of Paternity Leave** within 6 months of the child's birth (full pay). It can be clubbed with others.";
  } else {
    reply += `Thank you for asking: "${message}". I can help with questions about Casual/Sick Leave, Earned Leave, Comp-Offs, Holidays, or Maternity/Paternity queries. What would you like to know?`;
  }
  return reply;
}

function getFallbackItineraryMatrix(resolvedDestination: string, vibe: string, isLuxury: boolean, budgetLevel: number) {
  let defaultDays = [];
  if (budgetLevel === 1) {
    // Budget / economy fallback
    defaultDays = [
      {
        dayNumber: 1,
        dateStr: "Day 1",
        title: "Thrifty Depot Transit & Settle",
        activities: [
          { id: "1a", time: "08:00 AM", title: `Arrive in ${resolvedDestination}`, description: "Local bus transfer arranged from the regional depot with gorgeous valley views.", category: "Morning", icon: "flight_land" },
          { id: "1b", time: "01:00 PM", title: "Cozy Backpacker Hostel", description: "Settle into a neat, shared bunk cabin or budget guesthouse with community self-cook kitchens.", category: "Afternoon", icon: "hotel" },
          { id: "1c", time: "06:30 PM", title: "Street Food Crawl", description: "Sample steaming hot parottas, momos, and hot spiced cardamom chai at nominal rates.", category: "Evening", icon: "restaurant" }
        ]
      },
      {
        dayNumber: 2,
        dateStr: "Day 2",
        title: "Free Nature Vibe Trails",
        activities: [
          { id: "2a", time: "08:30 AM", title: "Self-Brewed Local Drip Tea", description: "Learn local brewing methods with budget self-pack accessories.", category: "Morning", icon: "local_cafe" },
          { id: "2b", time: "02:00 PM", title: "DIY Slopes Trek", description: "Trek up public ridge trails overlooking deep emerald peaks with self-packed standard trail lunches.", category: "Afternoon", icon: "landscape" },
          { id: "2c", time: "06:30 PM", title: "Backpacker Circle Bonfire", description: "Join open hearth fires, swapping routes and regional stories with fellow budget searchers.", category: "Evening", icon: "restaurant" }
        ]
      }
    ];
  } else if (budgetLevel === 3) {
    // Luxury / five-star fallback
    defaultDays = [
      {
        dayNumber: 1,
        dateStr: "Day 1",
        title: "Elite Runway Escort & Private Villa",
        activities: [
          { id: "1a", time: "08:00 AM", title: `First-Class Airport Welcome`, description: `VIP runway assistance to a private chauffeur-driven luxury SUV stocked with cold towels and gourmet snacks towards ${resolvedDestination}.`, category: "Morning", icon: "flight_land" },
          { id: "1b", time: "01:00 PM", title: "Helipool Villa Settle", description: "Check into your high-end woodland villa equipped with a heated infinity-edge plunge pool and sensory aroma steam baths.", category: "Afternoon", icon: "hotel" },
          { id: "1c", time: "06:30 PM", title: "Sommelier Dusk Reception", description: "Exclusive champagne toast curated by the cellarmaster overlooking sunset clouds.", category: "Evening", icon: "restaurant" }
        ]
      },
      {
        dayNumber: 2,
        dateStr: "Day 2",
        title: "Helicopter Peaks & Glass Observatory Dine",
        activities: [
          { id: "2a", time: "08:30 AM", title: "Artisanal Butler Room Service", description: "Fresh morning single-origin estate coffee accompanied by signature direct-from-oven pastries.", category: "Morning", icon: "local_cafe" },
          { id: "2b", time: "02:00 PM", title: "Private helicopter Sightseeing", description: "Exhilarating helicopter flight tour soaring above jagging snowy summits with landing rights for panoramic peak-side high teas.", category: "Afternoon", icon: "landscape" },
          { id: "2c", time: "06:30 PM", title: "Glass Roof degustation Menu", description: "Multi-course premium local fusion dinner served under architectural glass dome with individual live violin backdrops.", category: "Evening", icon: "restaurant" }
        ]
      }
    ];
  } else {
    // Mid-Range standard fallback
    defaultDays = [
      {
        dayNumber: 1,
        dateStr: "Day 1",
        title: "Cab Pickup & Timber Cottage Layout",
        activities: [
          { id: "1a", time: "08:00 AM", title: `Pre-paid Transit Settle`, description: `Comfortable airport sedan pickup arranged with direct transfer to ${resolvedDestination}.`, category: "Morning", icon: "flight_land" },
          { id: "1b", time: "01:00 PM", title: "Warm Forest Cottage", description: "Check-in to your comfortable individual timber cottage with direct garden layouts.", category: "Afternoon", icon: "hotel" },
          { id: "1c", time: "06:30 PM", title: "Scenic Ridge Sunset", description: "Savor spiced hot tea at a scenic viewpoint cafe while watching the sunset colors.", category: "Evening", icon: "restaurant" }
        ]
      },
      {
        dayNumber: 2,
        dateStr: "Day 2",
        title: "Guided Forest Trails & Cozy Hearth Dining",
        activities: [
          { id: "2a", time: "08:30 AM", title: "Fresh Coffee Brewing", description: "Fresh morning drip espresso matching your quiet retreat guidelines.", category: "Morning", icon: "local_cafe" },
          { id: "2b", time: "02:00 PM", title: "Guided Valley Trek", description: vibe.includes("Mountains") ? "Enjoy beautiful forest tours around pine-covered ridges with a local naturalist." : "Explore historical architecture and sacred regional monuments.", category: "Afternoon", icon: vibe.includes("Mountains") ? "landscape" : "temple_hindu" },
          { id: "2c", time: "06:30 PM", title: "Fireside Dining Room", description: "Warm dining inside comfortable wood-paneled local establishment.", category: "Evening", icon: "restaurant" }
        ]
      }
    ];
  }
  return { days: defaultDays, note: `Loaded dynamic ${isLuxury ? "luxury" : "standard"} matrix.` };
}

// 1. Health check & credentials report
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiConfigured: hasKey,
  });
});


// 1.2. Custom Code-Level Authentication endpoints (uses Supabase strictly as a PostgreSQL database)
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const normEmail = email.trim().toLowerCase();
    const existingEmployee = await getEmployeeByEmail(normEmail);

    if (existingEmployee && existingEmployee.passwordHash) {
      return res.status(400).json({ error: "An account with this email already exists. Please login." });
    }

    const { salt, hash } = hashPassword(password);

    const baseEmp = {
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
      passwordHash: hash,
      passwordSalt: salt,
    };

    // If existing record was a legacy record or mock without password, this will preserve credentials on upsert
    await upsertEmployee(baseEmp);

    return res.json({ success: true, needsSetup: true, email: normEmail });
  } catch (error: any) {
    console.error("[ZenPlan Server] Sign up error:", error);
    return res.status(500).json({ error: "Signup failed.", details: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const normEmail = email.trim().toLowerCase();
    const employee = await getEmployeeByEmail(normEmail);

    if (!employee) {
      return res.status(400).json({ error: "Account not found. Please click 'Create Account' to sign up first." });
    }

    if (!employee.passwordHash || !employee.passwordSalt) {
      return res.status(400).json({ error: "This email exists but does not have password credentials. Please sign up to set your password." });
    }

    const isValid = verifyPassword(password, employee.passwordSalt, employee.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: "Incorrect password. Please try again." });
    }

    // Success! Return user profile
    return res.json({ success: true, data: employee });
  } catch (error: any) {
    console.error("[ZenPlan Server] Login error:", error);
    return res.status(500).json({ error: "Login failed.", details: error.message });
  }
});


// 1.5. DB Employee records synchronization endpoints (Cloud SQL PostgreSQL integration)
app.get("/api/employee", async (req, res) => {
  const email = req.query.email;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Employee email is required as a query parameter." });
  }

  try {
    const employee = await getEmployeeByEmail(email);
    if (!employee) {
      return res.json({ exists: false });
    }
    return res.json({ exists: true, data: employee });
  } catch (error: any) {
    console.error("[ZenPlan Server] Error in GET /api/employee route:", error);
    return res.status(500).json({
      error: "Failed to retrieve employee record from PostgreSQL.",
      details: error.message
    });
  }
});

app.post("/api/employee", async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Employee email and name is required in request body." });
  }

  try {
    const result = await upsertEmployee(req.body);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[ZenPlan Server] Error in POST /api/employee route:", error);
    return res.status(500).json({
      error: "Failed to save employee records into PostgreSQL database.",
      details: error.message
    });
  }
});

// 2. Chat with policy (RAG)
app.post("/api/policy-chat", async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const ai = getGeminiClient();

  if (!ai) {
    console.log("[ZenPlan] Sandbox fallback logic triggered for chatbot.");
    return res.json({ text: getFallbackPolicyChat(message), sources: ["Section 4: Arrise Leave Policy.md"] });
  }

  try {
    const formattedHistory = history.map((h: any) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    }));

    // Perform the RAG call with system instruction including the entire Leave Policy
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are ZenPlan AI, an automated corporate HR leave assistant for Arrise Solutions (India) Pvt. Ltd. Your objective is to answer employee queries regarding the company's official leave policies accurately and empathetically.
        
        Strictly refer to the official leave guidelines below:
        ${ARRISE_LEAVE_POLICY_TEXT}

        Guidelines & Context rules:
        - Noida, Hyderabad, Kolkata regional holiday mappings.
        - Encourage priority burn of CL/SL before EL because CL/SL does not roll over.
        - Advise on the 90-day validity constraint of Comp-Offs.
        - Advise on the 40-day rollover cap limit of Earned Leaves.
        - Present answers using clear bullet lists and bold text. If requested, cite sections of the policy. Make sure answers are humble, direct, and completely free of blue-themed aesthetic references.
        - DOMAIN CONSTRAINT: You must only answer queries regarding HR policies, leaves, travel, and wellness. Do not answer off-topic queries (e.g., asking about history, recipes, generic trivia). Say: "I am ZenPlan Assistant, I can only help with corporate HR and travel matters."`,
        temperature: 0.2,
      },
    });

    const replyText = response.text || "I was unable to retrieve a response from the model. Please try again.";
    
    // Simple source detection
    const sources: string[] = ["Arrise Leave Policy.md"];
    if (message.toLowerCase().includes("comp")) sources.push("Section 4.8: Compensatory Off");
    if (message.toLowerCase().includes("earned") || message.toLowerCase().includes("el")) sources.push("Section 4.2: Earned Leave");
    if (message.toLowerCase().includes("casual") || message.toLowerCase().includes("cl")) sources.push("Section 4.1: Casual/Sick Leave");
    if (message.toLowerCase().includes("maternity")) sources.push("Section 4.3: Maternity Leave");

    return res.json({ text: replyText, sources });
  } catch (error: any) {
    if (error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("UNAVAILABLE") || error?.status === "UNAVAILABLE" || error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.status === "RESOURCE_EXHAUSTED") {
      console.log("[ZenPlan] Returning fallback for chatbot due to API availability or quota limits. (Graceful fallback)");
      return res.json({ text: getFallbackPolicyChat(message), sources: ["Section 4: Arrise Leave Policy.md"] });
    }
    console.error("[ZenPlan Server] Gemini API policy chat error:", error);
    return res.status(500).json({
      error: "Error generating AI response. Please check your API key or connection.",
      details: error.message,
    });
  }
});

// 3. Generate travel itinerary (Structured)
app.post("/api/generate-itinerary", async (req, res) => {
  const { destination, days = 9, baseLocation, vibe = "Mountains", isLuxury = false, budgetLevel = 2 } = req.body;

  const resolvedDestination = destination || "Coimbatore";
  
  const ai = getGeminiClient();

  if (!ai) {
    // Elegant dynamic budget-aware fallback itinerary structured response
    console.log(`[ZenPlan] Sandbox fallback logic triggered for travel itinerary. Level: ${budgetLevel}`);
    
    let defaultDays = [];
    
    if (budgetLevel === 1) {
      // Budget / economy fallback
      defaultDays = [
        {
          dayNumber: 1,
          dateStr: "Day 1",
          title: "Thrifty Depot Transit & Settle",
          activities: [
            { id: "1a", time: "08:00 AM", title: `Arrive in ${resolvedDestination}`, description: "Local bus transfer arranged from the regional depot with gorgeous valley views.", category: "Morning", icon: "flight_land" },
            { id: "1b", time: "01:00 PM", title: "Cozy Backpacker Hostel", description: "Settle into a neat, shared bunk cabin or budget guesthouse with community self-cook kitchens.", category: "Afternoon", icon: "hotel" },
            { id: "1c", time: "06:30 PM", title: "Street Food Crawl", description: "Sample steaming hot parottas, momos, and hot spiced cardamom chai at nominal rates.", category: "Evening", icon: "restaurant" }
          ]
        },
        {
          dayNumber: 2,
          dateStr: "Day 2",
          title: "Free Nature Vibe Trails",
          activities: [
            { id: "2a", time: "08:30 AM", title: "Self-Brewed Local Drip Tea", description: "Learn local brewing methods with budget self-pack accessories.", category: "Morning", icon: "local_cafe" },
            { id: "2b", time: "02:00 PM", title: "DIY Slopes Trek", description: "Trek up public ridge trails overlooking deep emerald peaks with self-packed standard trail lunches.", category: "Afternoon", icon: "landscape" },
            { id: "2c", time: "06:30 PM", title: "Backpacker Circle Bonfire", description: "Join open hearth fires, swapping routes and regional stories with fellow budget searchers.", category: "Evening", icon: "restaurant" }
          ]
        }
      ];
    } else if (budgetLevel === 3) {
      // Luxury / five-star fallback
      defaultDays = [
        {
          dayNumber: 1,
          dateStr: "Day 1",
          title: "Elite Runway Escort & Private Villa",
          activities: [
            { id: "1a", time: "08:00 AM", title: `First-Class Airport Welcome`, description: `VIP runway assistance to a private chauffeur-driven luxury SUV stocked with cold towels and gourmet snacks towards ${resolvedDestination}.`, category: "Morning", icon: "flight_land" },
            { id: "1b", time: "01:00 PM", title: "Helipool Villa Settle", description: "Check into your high-end woodland villa equipped with a heated infinity-edge plunge pool and sensory aroma steam baths.", category: "Afternoon", icon: "hotel" },
            { id: "1c", time: "06:30 PM", title: "Sommelier Dusk Reception", description: "Exclusive champagne toast curated by the cellarmaster overlooking sunset clouds.", category: "Evening", icon: "restaurant" }
          ]
        },
        {
          dayNumber: 2,
          dateStr: "Day 2",
          title: "Helicopter Peaks & Glass Observatory Dine",
          activities: [
            { id: "2a", time: "08:30 AM", title: "Artisanal Butler Room Service", description: "Fresh morning single-origin estate coffee accompanied by signature direct-from-oven pastries.", category: "Morning", icon: "local_cafe" },
            { id: "2b", time: "02:00 PM", title: "Private helicopter Sightseeing", description: "Exhilarating helicopter flight tour soaring above jagging snowy summits with landing rights for panoramic peak-side high teas.", category: "Afternoon", icon: "landscape" },
            { id: "2c", time: "06:30 PM", title: "Glass Roof degustation Menu", description: "Multi-course premium local fusion dinner served under architectural glass dome with individual live violin backdrops.", category: "Evening", icon: "restaurant" }
          ]
        }
      ];
    } else {
      // Mid-Range standard fallback
      defaultDays = [
        {
          dayNumber: 1,
          dateStr: "Day 1",
          title: "Cab Pickup & Timber Cottage Layout",
          activities: [
            { id: "1a", time: "08:00 AM", title: `Pre-paid Transit Settle`, description: `Comfortable airport sedan pickup arranged with direct transfer to ${resolvedDestination}.`, category: "Morning", icon: "flight_land" },
            { id: "1b", time: "01:00 PM", title: "Warm Forest Cottage", description: "Check-in to your comfortable individual timber cottage with direct garden layouts.", category: "Afternoon", icon: "hotel" },
            { id: "1c", time: "06:30 PM", title: "Scenic Ridge Sunset", description: "Savor spiced hot tea at a scenic viewpoint cafe while watching the sunset colors.", category: "Evening", icon: "restaurant" }
          ]
        },
        {
          dayNumber: 2,
          dateStr: "Day 2",
          title: "Guided Forest Trails & Cozy Hearth Dining",
          activities: [
            { id: "2a", time: "08:30 AM", title: "Fresh Coffee Brewing", description: "Fresh morning drip espresso matching your quiet retreat guidelines.", category: "Morning", icon: "local_cafe" },
            { id: "2b", time: "02:00 PM", title: "Guided Valley Trek", description: vibe.includes("Mountains") ? "Enjoy beautiful forest tours around pine-covered ridges with a local naturalist." : "Explore historical architecture and sacred regional monuments.", category: "Afternoon", icon: vibe.includes("Mountains") ? "landscape" : "temple_hindu" },
            { id: "2c", time: "06:30 PM", title: "Fireside Dining Room", description: "Warm dining inside comfortable wood-paneled local establishment.", category: "Evening", icon: "restaurant" }
          ]
        }
      ];
    }

    return res.json({ days: defaultDays, note: `Loaded dynamic ${isLuxury ? "luxury" : "standard"} matrix.` });
  }

  try {
    const budgetTierText = budgetLevel === 3 ? "Luxury / Elite five-star experience with helicopter rides, gourmet Michelin-level dining, and chauffeured service" : budgetLevel === 1 ? "Budget / Economy experience prioritizing hostels, public transport, free trails, and local street stalls" : "Standard / Mid-Range experience with comfortable cottages, cozy cafes, pre-paid private cabs, and guided walks";
    
    const prompt = `Generate an hour-by-hour travel itinerary timeline for a trip to "${resolvedDestination}" for ${days} days. 
    User current base location is "${baseLocation}".
    Preffered atmosphere / Travel vibe: "${vibe}".
    Budget level: "${budgetTierText}".
    
    Please return your response in structured JSON with high-quality, fun specific corporate wellness activities (maximum relaxation, minimum leaves) styled perfectly to fit this budget level.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            days: {
              type: Type.ARRAY,
              description: "Array of timeline days ordered",
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  dateStr: { type: Type.STRING, description: "Formatted day title e.g. Oct 12" },
                  title: { type: Type.STRING, description: "Brief highlight style name e.g. Local Flavors" },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        time: { type: Type.STRING, description: "e.g. 09:00 AM" },
                        title: { type: Type.STRING, description: "Name of the item" },
                        description: { type: Type.STRING, description: "Action details" },
                        category: { type: Type.STRING, description: "Must be exactly 'Morning', 'Afternoon', or 'Evening'" },
                        icon: { type: Type.STRING, description: "Material Icons glyph name e.g. restaurant, local_cafe, hotel, landscape, flight_land" }
                      },
                      required: ["id", "time", "title", "description", "category", "icon"]
                    }
                  }
                },
                required: ["dayNumber", "dateStr", "title", "activities"]
              }
            }
          },
          required: ["days"]
        },
        temperature: 0.3
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText);
      return res.json(parsed);
    } else {
      throw new Error("No response text returned from Gemini API");
    }
  } catch (error: any) {
    if (error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("UNAVAILABLE") || error?.status === "UNAVAILABLE" || error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.status === "RESOURCE_EXHAUSTED") {
      console.log("[ZenPlan] Returning fallback for itinerary due to API availability or quota limits. (Graceful fallback)");
      return res.json(getFallbackItineraryMatrix(resolvedDestination, vibe, isLuxury, budgetLevel));
    }
    console.error("[ZenPlan Server] Gemini Travel Itinerary Generator Error:", error);
    return res.status(500).json({
      error: "Error generating travel schedule dynamically.",
      details: error.message
    });
  }
});

// 4. Get Search-Grounded Live Deals (Flights, Hotels, Offers)
app.post("/api/live-deals", async (req, res) => {
  const { destination, origin, dates = "upcoming dates", budgetLevel = 2 } = req.body;
  const resolvedDestination = destination || "Goa";
  const resolvedOrigin = origin || "Delhi";

  const ai = getGeminiClient();

  if (!ai) {
    console.log("[ZenPlan] Sandbox fallback logic triggered for live deals.");
    // Fallback Mock Deals
    return res.json({
      flights: [
        { title: `Budget Flight to ${resolvedDestination}`, provider: "MakeMyTrip Sandbox", price: "₹4,500", url: "https://www.makemytrip.com/flights/", rating: "4/5" },
        { title: `Direct Flight from ${resolvedOrigin}`, provider: "IndiGo Sandbox", price: "₹5,200", url: "https://www.goindigo.in/", rating: "4.5/5" }
      ],
      hotels: [
        { title: `Premium Stay in ${resolvedDestination}`, provider: "Booking.com Sandbox", price: "₹2,500/night", url: "https://www.booking.com/", rating: "4.8/5" },
        { title: `Cozy Hostel`, provider: "Agoda Sandbox", price: "₹800/night", url: "https://www.agoda.com/", rating: "4.2/5" }
      ],
      offers: [
        { title: "Flat 10% Off on Flights", provider: "Cleartrip", code: "CTFLY10", url: "https://www.cleartrip.com/" },
        { title: "Bank Credit Card Discount 15%", provider: "Yatra", code: "YATRA15", url: "https://www.yatra.com/" }
      ]
    });
  }

  try {
    const budgetTierText = budgetLevel === 3 ? "Luxury / Elite five-star experience" : budgetLevel === 1 ? "Budget / Economy experience" : "Standard / Mid-Range experience";
    
    // We cannot reliably force complex JSON schema with googleSearch grounding enabled in all SDK versions,
    // so we prompt for strict JSON and manually parse it, OR we use function calling. Let's try responseSchema with search grounding.
    // However, googleSearch grounding might conflict with JSON schema directly. Let's ask Gemini to just return JSON.
    const prompt = `You are a Live Travel API. Find current, real-world deals for flights and hotels traveling from ${resolvedOrigin} to ${resolvedDestination} for ${dates} catering to a ${budgetTierText}.
Search for legitimate travel websites (MakeMyTrip, Booking.com, Agoda, Skyscanner, Kayak, etc.).
Also find general travel coupon codes that are currently active in India (like MMTFLY, GOIBIBO etc).
Find the current upcoming weather and a brief safety tip for ${resolvedDestination}.
    
Return EXACTLY a JSON object with this structure (no markdown, just JSON):
{
  "flights": [ { "title": "Flight Name/Route", "provider": "Website Name", "price": "Price in ₹", "url": "Actual URL to book", "rating": "Rating or review count" } ],
  "hotels": [ { "title": "Hotel Name", "provider": "Platform", "price": "Price/night", "url": "Actual URL to book", "rating": "Out of 5" } ],
  "offers": [ { "title": "Discount info", "provider": "Platform", "code": "COUPONCODE", "url": "URL to apply" } ],
  "weather": "25°C, Partly Cloudy, Best time to visit...",
  "safety": "General safety advisory..."
}
Be sure to include actual URLs (links) from your search results. Limit to top 3 for each category.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3
      }
    });

    const resultText = response.text || "";
    // Extract JSON block in case it comes with markdown
    const jsonMatch = resultText.match(/\\{.*\\}/s) || [resultText];
    let cleanedJson = jsonMatch[0].replace(/\\`\\`\\`json/g, '').replace(/\\`\\`\\`/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanedJson);
      // Validate structure minimally
      if (!parsed.flights && !parsed.hotels) throw new Error("Invalid structure from Search API");
      return res.json(parsed);
    } catch (parseErr) {
      console.error("[ZenPlan Server] Failed to parse grounded JSON:", cleanedJson);
      // Fallback if parsing fails but grounding worked (Gemini might have returned conversational text)
      throw new Error("Could not parse deals into structured format. Retry later.");
    }
  } catch (error: any) {
    // Generic simple fallback so app doesn't crash
    if (error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("UNAVAILABLE") || error?.status === "UNAVAILABLE" || error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.status === "RESOURCE_EXHAUSTED") {
         console.log("[ZenPlan] Returning fallback for live deals due to API availability or quota limits. (Graceful fallback)");
         return res.json({
            flights: [{ title: `Budget Flight to ${resolvedDestination}`, provider: "MakeMyTrip Sandbox", price: "₹4,500", url: "https://www.makemytrip.com/", rating: "4/5" }],
            hotels: [{ title: `Premium Stay in ${resolvedDestination}`, provider: "Booking.com Sandbox", price: "₹2,500/night", url: "https://www.booking.com/", rating: "4.8/5" }],
            offers: [{ title: "Flat 10% Off on Flights", provider: "Cleartrip", code: "CTFLY10", url: "https://www.cleartrip.com/" }],
            weather: "28°C, Clear Sky",
            safety: "Safe, exercise normal precautions."
         });
    }
    console.error("[ZenPlan Server] Live Deals Search Error:", error);
    return res.status(500).json({
      error: "Error fetching live deals from verified sources.",
      details: error.message
    });
  }
});

// Setup Vite Dev server as a middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ZenPlan Server] running on http://localhost:${PORT} under NODE_ENV=${process.env.NODE_ENV}`);
  });
}

startServer();
