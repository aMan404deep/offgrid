import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { ARRISE_LEAVE_POLICY_TEXT } from "./src/data/leavePolicy.js";
import { getEmployeeByEmail, upsertEmployee } from "./src/db/repo.ts";
import crypto from "crypto";
import { getTransitDetails } from "./src/utils/transit.ts";

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
    return "I am Ziggy, your chill offGrid guide, and I can only help with corporate HR and travel matters.";
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
  const transitInfo = getTransitDetails("Delhi", resolvedDestination || "Manali", budgetLevel);
  let defaultDays = [];

  if (budgetLevel === 1) {
    // Budget / economy fallback
    const firstActivity = transitInfo.isDirect ? {
      id: "1a",
      time: "08:00 AM",
      title: `Direct Flight Arrival`,
      description: `Arrive at the ${resolvedDestination} terminal terminal. Pre-paid bus transfer towards retreat.`,
      category: "Morning",
      icon: "flight_land"
    } : {
      id: "1a",
      time: "08:00 AM",
      title: `Flight to Hub: ${transitInfo.hubName}`,
      description: `Fly in to ${transitInfo.hubName} Hub airport. Layover preparation for mountaineering ground vehicle transfer.`,
      category: "Morning",
      icon: "flight_land"
    };

    const secondActivity = transitInfo.isDirect ? {
      id: "1b",
      time: "01:00 PM",
      title: "Cozy Backpacker Hostel",
      description: "Settle into a neat, shared bunk cabin or budget guesthouse with community self-cook kitchens.",
      category: "Afternoon",
      icon: "hotel"
    } : {
      id: "1b",
      time: "01:15 PM",
      title: `Scenic Overland Coach Transfer`,
      description: `Board the regional mountain link travelling through gorgeous pine loops and cascading water falls.`,
      category: "Afternoon",
      icon: "hotel"
    };

    defaultDays = [
      {
        dayNumber: 1,
        dateStr: "Day 1",
        title: "The Multi-Modal Transit",
        activities: [
          firstActivity,
          secondActivity,
          { id: "1c", time: "06:30 PM", title: "Street Food Crawl", description: `Sample steaming hot parottas, local dumplings, and spiced cardamom tea near your budget stay at ${resolvedDestination}.`, category: "Evening", icon: "restaurant" }
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
    const firstActivity = transitInfo.isDirect ? {
      id: "1a",
      time: "08:00 AM",
      title: `First-Class Airport Welcome`,
      description: `VIP runway assistance to a private chauffeur-driven luxury SUV towards ${resolvedDestination}.`,
      category: "Morning",
      icon: "flight_land"
    } : {
      id: "1a",
      time: "08:00 AM",
      title: `First-Class Air Flight to ${transitInfo.hubName}`,
      description: `Elite air transition connecting to regional gate hub ${transitInfo.hubName}. Private butler lounge baggage clearance.`,
      category: "Morning",
      icon: "flight_land"
    };

    const secondActivity = transitInfo.isDirect ? {
      id: "1b",
      time: "01:00 PM",
      title: "Helipool Villa Settle",
      description: "Check into your high-end woodland villa equipped with a heated infinity-edge plunge pool and sensory aroma steam baths.",
      category: "Afternoon",
      icon: "hotel"
    } : {
      id: "1b",
      time: "12:45 PM",
      title: `Luxury Private Cruiser Transfer`,
      description: `Chauffeur transfer up the valley toward ${resolvedDestination} inside an advanced four-wheel drive cruiser stocked with organic health juices.`,
      category: "Afternoon",
      icon: "hotel"
    };

    defaultDays = [
      {
        dayNumber: 1,
        dateStr: "Day 1",
        title: "Elite Runway Escort & Private Villa",
        activities: [
          firstActivity,
          secondActivity,
          { id: "1c", time: "06:30 PM", title: "Sommelier Dusk Reception", description: "Exclusive champagne toast curated by the cellarmaster overlooking sunset clouds.", category: "Evening", icon: "restaurant" }
        ]
      },
      {
        dayNumber: 2,
        dateStr: "Day 2",
        title: "Helicopter Peaks & Glass Observatory Dine",
        activities: [
          { id: "2a", time: "08:30 AM", title: "Artisanal Butler Room Service", description: "Fresh morning single-origin estate coffee accompanied by signature direct-from-oven pastries.", category: "Morning", icon: "local_cafe" },
          { id: "2b", time: "02:00 PM", title: "Private helicopter Sightseeing", description: `Exhilarating helicopter flight tour soaring above jagging snowy summits near ${resolvedDestination} with landing rights for panoramic peak-side high teas.`, category: "Afternoon", icon: "landscape" },
          { id: "2c", time: "06:30 PM", title: "Glass Roof degustation Menu", description: "Multi-course premium local fusion dinner served under architectural glass dome with individual live violin backdrops.", category: "Evening", icon: "restaurant" }
        ]
      }
    ];
  } else {
    // Mid-Range standard fallback
    const firstActivity = transitInfo.isDirect ? {
      id: "1a",
      time: "08:00 AM",
      title: `Pre-paid Transit Settle`,
      description: `Comfortable airport sedan pickup arranged with direct transfer to ${resolvedDestination}.`,
      category: "Morning",
      icon: "flight_land"
    } : {
      id: "1a",
      time: "08:30 AM",
      title: `Air Flight connection: Hub ${transitInfo.hubName}`,
      description: `Smooth flight transition landing at regional gate hub ${transitInfo.hubName}. Transition coordinate assistance on board.`,
      category: "Morning",
      icon: "flight_land"
    };

    const secondActivity = transitInfo.isDirect ? {
      id: "1b",
      time: "01:00 PM",
      title: "Warm Forest Cottage",
      description: "Check-in to your comfortable individual timber cottage with direct garden layouts.",
      category: "Afternoon",
      icon: "hotel"
    } : {
      id: "1b",
      time: "01:15 PM",
      title: `Winding Valley Highway Sedan Ride`,
      description: `Comfortable private sedan ground transfer climbing majestic pine-scented hills, forest vistas, and pristine riversides.`,
      category: "Afternoon",
      icon: "hotel"
    };

    defaultDays = [
      {
        dayNumber: 1,
        dateStr: "Day 1",
        title: "Cab Pickup & Timber Cottage Layout",
        activities: [
          firstActivity,
          secondActivity,
          { id: "1c", time: "06:30 PM", title: "Scenic Ridge Sunset", description: `Savor spiced hot tea at a scenic viewpoint cabin in ${resolvedDestination} while watching the sunset colors.`, category: "Evening", icon: "restaurant" }
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

  return { days: defaultDays, note: `Loaded segment-aware path matrix for ${resolvedDestination}.` };
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

// Temporary endpoint to list & delete dummy database columns and entries
app.get("/api/admin/cleanup", async (req, res) => {
  try {
    const { db, dbStatus } = await import("./src/db/index.ts");
    const { employees } = await import("./src/db/schema.ts");
    const { sql } = await import("drizzle-orm");

    if (!dbStatus.isConfigured) {
      return res.json({
        success: false,
        message: "Database is not configured/offline."
      });
    }

    // Unordered fetch before deletion
    const beforeList = await db.select({ id: employees.id, email: employees.email, name: employees.name, role: employees.role }).from(employees);

    // Delete dummy rows (startsWith 'dummy' or is 'temp@arrisesolutions.com')
    const result = await db.execute(sql`
      DELETE FROM employees 
      WHERE email LIKE 'dummy%' 
         OR email = 'temp@arrisesolutions.com'
    `);

    const afterList = await db.select({ id: employees.id, email: employees.email, name: employees.name, role: employees.role }).from(employees);

    return res.json({
      success: true,
      message: `Database pruned successfully. Deleted ${result.rowCount || 0} dummy rows.`,
      deletedCount: result.rowCount || 0,
      before: beforeList,
      after: afterList
    });
  } catch (err: any) {
    console.error("[Cleanup Endpoint Error]", err);
    return res.status(500).json({ error: err.message });
  }
});


// 1.2. Custom Code-Level Authentication endpoints (uses Supabase strictly as a PostgreSQL database)
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[ZenPlan API - Signup] Received signup request for: "${email || "N/A"}". Password length: ${password ? password.length : 0} chars.`);

  if (!email || !password) {
    console.warn("[ZenPlan API - Signup] Rejected: Email and password are required.");
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const normEmail = email.trim().toLowerCase();
    console.log(`[ZenPlan API - Signup] Checking if account already exists for "${normEmail}"...`);
    const existingEmployee = await getEmployeeByEmail(normEmail);

    if (existingEmployee && existingEmployee.passwordHash) {
      console.warn(`[ZenPlan API - Signup] Rejected: Account already exists with password for "${normEmail}".`);
      return res.status(400).json({ error: "An account with this email already exists. Please login." });
    }

    console.log(`[ZenPlan API - Signup] Creating password credentials hash & salt...`);
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
      currentTripLocation: "",
      isTripLocked: false,
      activeHolidaySwaps: "{}",
      passwordHash: hash,
      passwordSalt: salt,
    };

    console.log(`[ZenPlan API - Signup] Upserting signup record into database...`);
    await upsertEmployee(baseEmp);

    console.log(`[ZenPlan API - Signup] Signup successful for "${normEmail}".`);
    return res.json({ success: true, needsSetup: true, email: normEmail });
  } catch (error: any) {
    console.error(`[ZenPlan API - Signup] [ERROR] Handled exception:`, error);
    return res.status(500).json({ error: "Signup failed.", details: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[ZenPlan API - Login] Received login request for: "${email || "N/A"}".`);

  if (!email || !password) {
    console.warn("[ZenPlan API - Login] Rejected: Email and password are required.");
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const normEmail = email.trim().toLowerCase();
    console.log(`[ZenPlan API - Login] Fetching employee profile for "${normEmail}"...`);
    const employee = await getEmployeeByEmail(normEmail);

    if (!employee) {
      console.warn(`[ZenPlan API - Login] Rejected: Account not found for "${normEmail}".`);
      return res.status(400).json({ error: "Account not found. Please click 'Create Account' to sign up first." });
    }

    if (!employee.passwordHash || !employee.passwordSalt) {
      console.warn(`[ZenPlan API - Login] Rejected: "${normEmail}" has no login credentials registered.`);
      return res.status(400).json({ error: "This email exists but does not have password credentials. Please sign up to set your password." });
    }

    console.log(`[ZenPlan API - Login] Re-hashing & verifying salt & password...`);
    const isValid = verifyPassword(password, employee.passwordSalt, employee.passwordHash);
    if (!isValid) {
      console.warn(`[ZenPlan API - Login] Rejected: Incorrect password for "${normEmail}".`);
      return res.status(400).json({ error: "Incorrect password. Please try again." });
    }

    // Success! Return user profile
    console.log(`[ZenPlan API - Login] Successfully authenticated employee "${normEmail}" (ID: ${employee.id || "N/A"}).`);
    return res.json({ success: true, data: employee });
  } catch (error: any) {
    console.error(`[ZenPlan API - Login] [ERROR] Handled exception:`, error);
    return res.status(500).json({ error: "Login failed.", details: error.message });
  }
});


// 1.5. DB Employee records synchronization endpoints (Cloud SQL PostgreSQL integration)
app.get("/api/employee", async (req, res) => {
  const email = req.query.email;
  console.log(`[ZenPlan API - GET Employee] Fetching employee for profile synchronization: "${email || "N/A"}"`);

  if (!email || typeof email !== "string") {
    console.warn("[ZenPlan API - GET Employee] Rejected: Email is missing or not a string.");
    return res.status(400).json({ error: "Employee email is required as a query parameter." });
  }

  try {
    const employee = await getEmployeeByEmail(email);
    if (!employee) {
      console.log(`[ZenPlan API - GET Employee] Profile not found for "${email}". Returning { exists: false }.`);
      return res.json({ exists: false });
    }
    console.log(`[ZenPlan API - GET Employee] Found profile for "${email}"!`);
    return res.json({ exists: true, data: employee });
  } catch (error: any) {
    console.error(`[ZenPlan API - GET Employee] [ERROR] Handled exception:`, error);
    return res.status(500).json({
      error: "Failed to retrieve employee record from PostgreSQL.",
      details: error.message
    });
  }
});

app.post("/api/employee", async (req, res) => {
  const { email, name } = req.body;
  console.log(`[ZenPlan API - POST Employee] Update request received for: "${email || "N/A"}" (Name: "${name || "N/A"}").`);

  if (!email || !name) {
    console.warn("[ZenPlan API - POST Employee] Rejected: missing email or name in request body.");
    return res.status(400).json({ error: "Employee email and name is required in request body." });
  }

  try {
    console.log(`[ZenPlan API - POST Employee] Initiating upsert operation...`);
    const result = await upsertEmployee(req.body);
    console.log(`[ZenPlan API - POST Employee] Successfully saved updated profile row!`);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error(`[ZenPlan API - POST Employee] [ERROR] Handled exception:`, error);
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
      model: "gemini-2.5-flash",
      contents: [
        ...formattedHistory,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are Ziggy, the chill and smart offGrid mascot and automated HR leave assistant for Arrise Solutions (India) Pvt. Ltd. Your objective is to answer employee queries regarding the company's official leave policies accurately, empathetically, and with a friendly, laid-back yet intelligent tone.
        
        Strictly refer to the official leave guidelines below:
        ${ARRISE_LEAVE_POLICY_TEXT}

        Guidelines & Context rules:
        - Noida, Hyderabad, Kolkata regional holiday mappings.
        - Encourage priority burn of CL/SL before EL because CL/SL does not roll over.
        - Advise on the 90-day validity constraint of Comp-Offs.
        - Advise on the 40-day rollover cap limit of Earned Leaves.
        - Present answers using clear bullet lists and bold text. If requested, cite sections of the policy. Make sure answers are humble, direct, and completely free of blue-themed aesthetic references.
        - DOMAIN CONSTRAINT: You must only answer queries regarding HR policies, leaves, travel, and wellness. Do not answer off-topic queries (e.g., asking about history, recipes, generic trivia). Say: "I am Ziggy, your chill offGrid guide, and I can only help with corporate HR and travel matters."`,
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

// 3. Generate travel itinerary (Structured Multi-Layered Hierarchical Agentic Architecture)
app.post("/api/generate-itinerary", async (req, res) => {
  const { destination, days = 9, baseLocation, vibe = "Mountains", isLuxury = false, budgetLevel = 2 } = req.body;

  const resolvedDestination = destination || "Goa";
  const resolvedBaseLocation = baseLocation || "Delhi";
  const resolvedDays = Math.min(14, Math.max(1, parseInt(days) || 9));

  const ai = getGeminiClient();

  if (!ai) {
    // Elegant dynamic budget-aware fallback itinerary structured response
    console.log(`[ZenPlan] Sandbox fallback logic triggered for travel itinerary. Level: ${budgetLevel}`);
    return res.json(getFallbackItineraryMatrix(resolvedDestination, vibe, isLuxury, budgetLevel));
  }

  try {
    console.log(`[ZenPlan agent] Starting Multi-Layer Agentic Generation for: ${resolvedDestination} / Base: ${resolvedBaseLocation} / Vibe: ${vibe} / Days: ${resolvedDays} / Budget: ${budgetLevel}`);

    // ==========================================
    // LAYER 1: Gateway Node (Intent Parsing & Normalization)
    // ==========================================
    const gatewayPrompt = `Analyze this travel request:
- Destination: "${resolvedDestination}"
- Days: ${resolvedDays}
- Base Location: "${resolvedBaseLocation}"
- Vibe: "${vibe}"
- Budget Level: ${budgetLevel}

Identify if it's a valid travel/wellness query. If it is, output the normalized parameters as a JSON object of this structure:
{
  "isValid": true,
  "normalizedDestination": "Title Case Destination Name",
  "normalizedBaseLocation": "Title Case Base Name",
  "vibe": "vibe",
  "days": number,
  "budgetLevel": number
}
If the destination name is invalid, gibberish, empty, or dangerous, return:
{ "isValid": false }
Return ONLY raw JSON, do not wrap in markdown quotes.`;

    const gatewayResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: gatewayPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    let gatewayResult = { isValid: true, normalizedDestination: resolvedDestination, normalizedBaseLocation: resolvedBaseLocation, vibe, days: resolvedDays, budgetLevel };
    try {
      if (gatewayResponse.text) {
        const parsedG = JSON.parse(gatewayResponse.text.trim());
        if (parsedG.isValid === false) {
          console.warn("[ZenPlan agent] Gateway rejected itinerary query as invalid or gibberish. Utilizing standard fallbacks.");
          return res.json(getFallbackItineraryMatrix(resolvedDestination, vibe, isLuxury, budgetLevel));
        }
        gatewayResult = { ...gatewayResult, ...parsedG };
      }
    } catch (gErr) {
      console.warn("[ZenPlan agent] Gateway JSON parsing failed, using request defaults:", gErr);
    }

    const finalDest = gatewayResult.normalizedDestination;
    const finalBase = gatewayResult.normalizedBaseLocation;

    // ==========================================
    // LAYER 2: Divisional Management Router (Parallel API Ingestion)
    // ==========================================
    console.log(`[ZenPlan agent] Divisional Management: Dispatching parallel deterministic data fetches for geocode, weather, events...`);

    let lat = 15.2993; // Default Goa
    let lon = 74.1240; // Default Goa
    if (finalDest.toLowerCase().includes("manali")) {
      lat = 32.2396; lon = 77.1887;
    } else if (finalDest.toLowerCase().includes("delhi")) {
      lat = 28.6139; lon = 77.2090;
    } else if (finalDest.toLowerCase().includes("shimla")) {
      lat = 31.1048; lon = 77.1734;
    } else if (finalDest.toLowerCase().includes("ooty")) {
      lat = 11.4102; lon = 76.6950;
    } else if (finalDest.toLowerCase().includes("kerala") || finalDest.toLowerCase().includes("munnar")) {
      lat = 10.0889; lon = 77.0595;
    } else if (finalDest.toLowerCase().includes("jaipur")) {
      lat = 26.9124; lon = 75.7873;
    }

    let rawWeatherData: any = null;

    try {
      // 1. Geocoding Engine via Nominatim API (with User-Agent)
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(finalDest)}&format=json&limit=1`;
      const geoRes = await fetch(geoUrl, {
        headers: { "User-Agent": "ZenPlanTravelWizard/1.0 (amandeep101003@gmail.com)" }
      });
      if (geoRes.ok) {
        const geoJSON: any = await geoRes.json();
        if (geoJSON && geoJSON[0]) {
          lat = parseFloat(geoJSON[0].lat);
          lon = parseFloat(geoJSON[0].lon);
          console.log(`[ZenPlan agent] Nominatim geocoding succeeded for "${finalDest}": Lat=${lat}, Lon=${lon}`);
        }
      }
    } catch (geoErr: any) {
      console.warn("[ZenPlan agent] Nominatim fetching failed, using default coordinates:", geoErr.message);
    }

    // Call Meteorology API
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

      const weatherRes = await fetch(weatherUrl);

      if (weatherRes.ok) {
        rawWeatherData = await weatherRes.json();
        console.log("[ZenPlan agent] Weather API loaded successfully.");
      } else {
        console.warn("[ZenPlan agent] Weather API fetch failed.");
      }
    } catch (parallelErr: any) {
      console.warn("[ZenPlan agent] External API fetch failed:", parallelErr.message);
    }

    // ==========================================
    // LAYER 3: Cognitive Specialist Workers (Parallel LLM Inferences)
    // ==========================================
    console.log(`[ZenPlan agent] Dispatching parallel Specialist workers via Promise.all...`);

    const weatherPrompt = `You are a professional Meteorology & Environmental Analyst.
Given Raw Weather Forecast for latitude/longitude: ${lat}/${lon}:
${rawWeatherData ? JSON.stringify(rawWeatherData.daily || rawWeatherData) : "No raw data available"}
Analyze this forecast for destination: "${finalDest}" over a period of ${resolvedDays} days. 
Determine:
1. Overall climatology (sunny, rainy, sub-zero, humid, chilly etc.).
2. Vibe compatibility: is it suitable for a '${vibe}' travel itinerary?
3. Daily direct weather summaries and actionable micro-directives (e.g. bring warm liners, pack umbrellas, optimal morning trek windows).
Output ONLY brief, high-impact information in a structured JSON schema:
{
  "summary": "climatology summary",
  "vibeSuitability": "rating out of 5",
  "directives": ["directive 1", "directive 2", "directive 3"]
}
Do not write conversational introductory text. Output valid raw JSON.`;

    const eventPrompt = `You are an Event Sniper. Your objective is to find real, live events, festivals, concerts, or local experiences in "${finalDest}".
Target, evaluate, and extract the best live sports matches, music concerts, theatrical gigs, or local festivals that align with a '${vibe}' vibe and a budget level of ${budgetLevel} (1=budget, 2=mid-range, 3=luxury).
Use Google Search Grounding to locate 3-4 highly plausible and actual local events occurring near or in ${finalDest}.
Heuristic rules:
- Provide exact names, dates, locations, times, and brief details for REAL events if possible; otherwise highly representative seasonal events in the region.
Return ONLY a structured JSON output:
{
  "recommendedEvents": [
    { "name": "Event Name", "date": "Date of event", "time": "Time of event", "description": "Short matching details", "priceCategory": "economy/mid/luxury" }
  ]
}
Return only raw JSON.`;

    const foodPrompt = `You are an elite Michelin-starred Culinary Guide. 
Develop a curated gastronomy guide for "${finalDest}" catering to a budget level of ${budgetLevel} (1=budget street food/local dhabas, 2=mid-range bistros/cozy gardens, 3=luxury fine dining/spectacular view reservation venues) and matching a vibe of '${vibe}'.
Recommend 3-4 top food establishments, signature local dishes to sample, and coffee lounges.
Return ONLY structured JSON:
{
  "culinaryHotspots": [
    { "establishmentName": "Name", "specialty": "Traditional signature dish", "description": "Atmospheric review", "priceRange": "₹/₹₹/₹₹₹" }
  ]
}
Return only raw JSON.`;

    const routePrompt = `You are a Geospatial Sequence Router.
Origin base: "${finalBase}".
Destination: "${finalDest}" (coordinates: ${lat}, ${lon}).
Optimize the travel routing paths for the trip:
1. Long-distance transition routes from origin to destination (e.g., flight alignments, high-way roadways, rail links) optimized for budget level ${budgetLevel}.
2. Intraday local transport options (scooter rentals, auto rickshaw rates, pre-paid private cab alignments) inside the destination.
Return ONLY structured JSON:
{
  "transitRoute": { "type": "flight/rail/drive", "detail": "Transition details from base to dest" },
  "localTransit": ["transport tip 1", "transport tip 2"]
}
Return only raw JSON.`;

    const [weatherWorkerRes, eventWorkerRes, foodWorkerRes, routeWorkerRes] = await Promise.all([
      ai.models.generateContent({ model: "gemini-2.5-flash", contents: weatherPrompt, config: { responseMimeType: "application/json", temperature: 0.3 } }),
      ai.models.generateContent({ model: "gemini-2.5-flash", contents: eventPrompt, config: { responseMimeType: "application/json", temperature: 0.3, tools: [{ googleSearch: {} }] } }),
      ai.models.generateContent({ model: "gemini-2.5-flash", contents: foodPrompt, config: { responseMimeType: "application/json", temperature: 0.3 } }),
      ai.models.generateContent({ model: "gemini-2.5-flash", contents: routePrompt, config: { responseMimeType: "application/json", temperature: 0.3 } })
    ]);

    const weatherWorkerOutput = weatherWorkerRes.text || "{}";
    const eventWorkerOutput = eventWorkerRes.text || "{}";
    const foodWorkerOutput = foodWorkerRes.text || "{}";
    const routeWorkerOutput = routeWorkerRes.text || "{}";

    console.log("[ZenPlan agent] Layer 3 specialist workers completed compilation successfully.");

    // ==========================================
    // LAYER 4: Editor-in-Chief (Quality Synthesis, Google Search Grounding & Schema Validation)
    // ==========================================
    console.log("[ZenPlan agent] Layer 4: Booting Editor-in-Chief summary engine (Gemini 2.5 Pro with Search Grounding)...");

    const eicPrompt = `You are the Editor-in-Chief of a premium, hyper-personalized corporate wellness travel planner. 
Your objective is to compile the reports from your four specialized field workers into a seamless, hour-by-hour travel timeline for a ${resolvedDays}-day itinerary in "${finalDest}" (Base location: "${finalBase}", Vibe: "${vibe}", Budget level ${budgetLevel}).

Below are the raw files submitted by your specialist workers:
=== WEATHER ANALYST REPORT ===
${weatherWorkerOutput}

=== EVENT SNIPER TARGET LIST ===
${eventWorkerOutput}

=== CULINARY MATRIX ===
${foodWorkerOutput}

=== GEOSPATIAL PATH ANALYSIS ===
${routeWorkerOutput}

Task directives:
1. Synthesize a unified, consecutive travel schedule for exactly ${resolvedDays} days. Ensure every single day has a clear dayNumber, dayTitle (brief highlight), and exactly 3 activities (one "Morning", one "Afternoon", and one "Evening") mapped to appropriate timeline slots.
2. Ensure you naturally fuse the transit routes, culinary recommendations, events, and weather protection directives directly into the activities' titles and descriptions.
3. Keep the pricing and experience level perfectly in sync with budget level ${budgetLevel} (1=Budget/Economy, 2=Mid-Range, 3=Luxury/Five-Star).
4. Utilize Google Search grounding to verify the general names and accuracy of local attractions or events in "${finalDest}".
5. Ensure the final response is generated in strict conformance to the requested JSON layout schema.

Schema contracts to follow:
{
  "days": [
    {
      "dayNumber": number,
      "dateStr": "e.g. Day 1, Day 2",
      "title": "Day Highlight Title",
      "activities": [
        {
          "id": "unique string token e.g. 1a, 1b",
          "time": "e.g. 08:30 AM",
          "title": "Activity name",
          "description": "Explanatory activity description incorporating weather/transit/culinary guides",
          "category": "Exactly 'Morning', 'Afternoon', or 'Evening'",
          "icon": "Material Icon name (e.g. flight_land, hotel, restaurant, landscape, local_cafe)"
        }
      ]
    }
  ],
  "note": "A summary note about the weather, transit, and features used of the trip"
}

Do not add outer Markdown blocks like \`\`\`json. Return pure JSON. Ensure it parses cleanly.`;

    const eicResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: eicPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        temperature: 0.4
      }
    });

    const finalResultStr = eicResponse.text || "";
    const jsonMatch = finalResultStr.match(/\{.*\}/s) || [finalResultStr];
    let cleanedJson = jsonMatch[0].replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const finalItinerary = JSON.parse(cleanedJson);
      if (finalItinerary.days && Array.isArray(finalItinerary.days) && finalItinerary.days.length > 0) {
        console.log(`[ZenPlan agent] Success! Itinerary synthesis complete for "${finalDest}". ${finalItinerary.days.length} days successfully structured.`);
        return res.json(finalItinerary);
      } else {
        throw new Error("Invalid itinerary structure or empty days array from EIC model.");
      }
    } catch (parseError: any) {
      console.warn("[ZenPlan agent] Editor-in-Chief JSON validation failed. Initiating unbreakable fallback matrix:", parseError.message);
      return res.json(getFallbackItineraryMatrix(resolvedDestination, vibe, isLuxury, budgetLevel));
    }
  } catch (outerError: any) {
    console.error("[ZenPlan Server] Outer handler exception inside Multi-Agent Itinerary Generator:", outerError);
    return res.json(getFallbackItineraryMatrix(resolvedDestination, vibe, isLuxury, budgetLevel));
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
    app.use(vite.middlewares as express.RequestHandler);
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
