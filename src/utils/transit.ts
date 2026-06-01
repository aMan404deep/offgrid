export interface TransitSegment {
  type: "flight" | "drive" | "train" | "bus" | "ferry";
  from: string;
  to: string;
  duration: string;
  distance: string;
  description: string;
  costEstimate: string;
}

export interface TransitConnectionInfo {
  isDirect: boolean;
  hubName: string;
  hubCoords: { x: number; y: number; lat: string; lon: string };
  segments: TransitSegment[];
  tips: string[];
}

export function getCoordsForName(name: string, isOrigin: boolean = false) {
  const norm = (name || "").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash += norm.charCodeAt(i) * (i + 1);
  }
  
  if (isOrigin) {
    if (norm.includes("noida") || norm.includes("delhi")) {
      return { x: 100, y: 110, lat: "28.5355° N", lon: "77.3910° E" };
    }
    if (norm.includes("mumbai")) {
      return { x: 80, y: 210, lat: "19.0760° N", lon: "72.8777° E" };
    }
    if (norm.includes("bangalore") || norm.includes("bengaluru")) {
      return { x: 140, y: 250, lat: "12.9716° N", lon: "77.5946° E" };
    }
    const x = 80 + (hash % 60);
    const y = 100 + (hash % 100);
    return { x, y, lat: `${(12 + (hash % 15)).toFixed(4)}° N`, lon: `${(72 + (hash % 10)).toFixed(4)}° E` };
  } else {
    if (norm.includes("manali")) {
      return { x: 120, y: 40, lat: "32.2396° N", lon: "77.1887° E" };
    }
    if (norm.includes("ooty")) {
      return { x: 130, y: 255, lat: "11.4102° N", lon: "76.6950° E" };
    }
    if (norm.includes("goa")) {
      return { x: 90, y: 200, lat: "15.2993° N", lon: "74.1240° E" };
    }
    if (norm.includes("leh") || norm.includes("ladakh")) {
      return { x: 130, y: 20, lat: "34.1526° N", lon: "77.5770° E" };
    }
    if (norm.includes("srinagar")) {
      return { x: 100, y: 25, lat: "34.0837° N", lon: "74.7973° E" };
    }
    const x = 160 + (hash % 150);
    const y = 80 + (hash % 160);
    return { x, y, lat: `${(8 + (hash % 24)).toFixed(4)}° N`, lon: `${(74 + (hash % 14)).toFixed(4)}° E` };
  }
}

export function getTransitDetails(origin: string, dest: string, budgetLevel: number): TransitConnectionInfo {
  const normOrigin = (origin || "Delhi").trim().toLowerCase();
  const normDest = (dest || "Manali").trim().toLowerCase();
  
  const originCoords = getCoordsForName(origin, true);
  const destCoords = getCoordsForName(dest, false);

  // Directly connected places with commercial runways
  const directCities = [
    "mumbai", "delhi", "noida", "bangalore", "bengaluru", "goa", "london", "paris", 
    "tokyo", "singapore", "dubai", "kolkata", "chennai", "hyderabad", "kochi", "pune", "srinagar"
  ];
  const isDirect = directCities.some(city => normDest.includes(city));

  if (isDirect) {
    const flightCost = budgetLevel === 3 ? "₹18,500" : budgetLevel === 1 ? "₹4,200" : "₹8,500";
    const metroCost = budgetLevel === 3 ? "₹1,500" : budgetLevel === 1 ? "₹120" : "₹450";
    return {
      isDirect: true,
      hubName: "",
      hubCoords: { x: 0, y: 0, lat: "", lon: "" },
      segments: [
        {
          type: "flight",
          from: origin,
          to: dest,
          duration: "2h 15m",
          distance: "1,150 km",
          description: `Direct commercial flight from ${origin} to ${dest} Intl. Airport (Direct jet bridge access).`,
          costEstimate: flightCost
        },
        {
          type: "drive",
          from: `${dest} Airport`,
          to: "Your Wellness Retreat",
          duration: "45m",
          distance: "25 km",
          description: budgetLevel === 3 
            ? "Chauffeur escort in a premier zero-emission luxury sedan." 
            : "Comfortable pre-paid toll cab or green airport link.",
          costEstimate: metroCost
        }
      ],
      tips: [
        "Direct flight path minimizes layover friction – perfect for quick 1-2 day re-energizer breaks.",
        budgetLevel === 3 ? "Access the designated executive wellness departure lounge at your origin gate list." : "Precheck baggage parameters to skip peak seasonal counter desk queues."
      ]
    };
  }

  // INDIRECT/REMOTE destinations without direct commercial runways (Hill stations & deep sanctuaries)
  let hubName = "Chandigarh Terminal";
  let hubX = Math.round((originCoords.x + destCoords.x) / 2 + 10);
  let hubY = Math.round((originCoords.y + destCoords.y) / 2 - 20);
  let connectionMode: "bus" | "train" | "drive" = "drive";
  let connectionText = "Himalayan Ridge Tourist SUV";
  let segment2Duration = "6h 45m";
  let segment2Distance = "280 km";
  let tipList = [
    "No primary commercial airport. Flying to Chandigarh followed by scenic mountain transit is the fastest path.",
    "Road transfer features substantial curves. Please consider motion remedies."
  ];

  if (normDest.includes("manali") || normDest.includes("kasol")) {
    hubName = "Chandigarh (IXC)";
    connectionMode = budgetLevel === 1 ? "bus" : "drive";
    connectionText = budgetLevel === 1 
      ? "Volvo Super-Sleeper Mountain bus" 
      : budgetLevel === 3 
        ? "Private 4x4 Luxury Escort SUV" 
        : "Pre-paid Climate Controlled Cab";
    segment2Duration = "6h 30m";
    segment2Distance = "270 km";
    tipList = [
      "No direct flights exist. The road from Mandi climbs through magnificent deep river canyons and pine loops.",
      "Volvo mountain buses depart regularly. Pre-select passenger seats on the left side to enjoy scenic river vistas.",
      budgetLevel === 3 
        ? "Your luxury ride features custom Himalayan spring water decanters and panoramic rest-stops." 
        : "Pack essential travel cookies and offline tunes for tunnels."
    ];
  } else if (normDest.includes("ooty")) {
    hubName = "Coimbatore (CJB)";
    connectionMode = "train";
    connectionText = "Historic Nilgiri Mountain Toy Train (UNESCO NMR)";
    segment2Duration = "3h 20m";
    segment2Distance = "88 km";
    tipList = [
      "No direct runway. Flight lands at Coimbatore, followed by a beautiful highland ascent.",
      "The Nilgiri Toy Train curves through 16 tunnels and 250 scenic vertical stone bridges.",
      "Reserve NMR train tickets 30 days prior. It is an legendary, extremely popular narrow-gauge excursion."
    ];
  } else if (normDest.includes("leh") || normDest.includes("ladakh")) {
    hubName = "Srinagar (SXR)";
    connectionMode = "drive";
    connectionText = "Equipped High-Altitude Oxygen SUV";
    segment2Duration = "11h 30m";
    segment2Distance = "410 km";
    tipList = [
      "No direct jet commercial links on active weather calendars. Land at Srinagar to climb gradually.",
      "Strict physical acclimatization required for high pass altitudes above 11,000 feet.",
      "Carry active warm layers, continuous hydration bottles, and a personal pulse oximeter."
    ];
  } else if (normDest.includes("munnar")) {
    hubName = "Kochi (COK)";
    connectionMode = "drive";
    connectionText = "Cardamom Hills Scenic Shuttle";
    segment2Duration = "3h 40m";
    segment2Distance = "120 km";
    tipList = [
      "Fly to Kochi Airport (COK), then transition to a gorgeous spice-forest cab climb.",
      "Pause brief at Valara and Cheeyappara Waterfalls for fresh coconut juice and high-vantage photography.",
      "Western Ghat curves can be intense. Avoid reading screens during road curls."
    ];
  } else if (normDest.includes("rishikesh")) {
    hubName = "Dehradun Jolly Grant (DED)";
    connectionMode = "drive";
    connectionText = "Ganga Expressway CNG Cab";
    segment2Duration = "1h 15m";
    segment2Distance = "42 km";
    tipList = [
      "Fly into Dehradun, followed by a smooth lower Himachal forest road drive.",
      "Local forest rules restrict noise polluting horns. Cabs utilize eco-CNG parameters.",
      "Stunning Ganges river paths align with early-evening sunset rituals."
    ];
  } else if (normDest.includes("cherrapunji")) {
    hubName = "Guwahati (GAU)";
    connectionMode = "drive";
    connectionText = "Clouds Peak Luxury State Cab";
    segment2Duration = "4h 15m";
    segment2Distance = "155 km";
    tipList = [
      "Guwahati serves as the primary eastern air link hub.",
      "Drive displays spectacular rolling hills, deep pine ridges, and gorgeous Umiam lake viewpoints.",
      "Mist is very frequent in Meghalaya hills. Keep vehicle fog headlights active throughout."
    ];
  } else {
    // Deterministic procedural hub for any custom user input
    let hash = 0;
    for (let i = 0; i < normDest.length; i++) {
      hash += normDest.charCodeAt(i);
    }
    const hubs = [
      { name: "Chandigarh Int'l (IXC)", x: originCoords.x + 10, y: originCoords.y + 20, code: "IXC" },
      { name: "Dehradun (DED)", x: originCoords.x + 25, y: originCoords.y + 15, code: "DED" },
      { name: "Guwahati (GAU)", x: originCoords.x + 50, y: originCoords.y + 40, code: "GAU" },
      { name: "Kochi International (COK)", x: originCoords.x - 15, y: originCoords.y + 60, code: "COK" },
      { name: "Coimbatore Regional (CJB)", x: originCoords.x - 5, y: originCoords.y + 70, code: "CJB" }
    ];
    const hubItem = hubs[hash % hubs.length];
    hubName = hubItem.name;
    hubX = Math.round((originCoords.x + destCoords.x) / 2 + (hash % 15) - 7);
    hubY = Math.round((originCoords.y + destCoords.y) / 2 - (hash % 20) - 5);

    const modes: ("drive" | "bus" | "train")[] = ["drive", "bus", "train"];
    connectionMode = modes[hash % 3];
    connectionText = connectionMode === "train" 
      ? "Regional Scenic Link Train" 
      : connectionMode === "bus" 
        ? "Luxury Express coaches" 
        : "Eco-Friendly Regional Sedan";
    
    segment2Duration = `${2 + (hash % 4)}h ${(hash % 4) * 15}m`;
    segment2Distance = `${70 + (hash % 12) * 15} km`;

    tipList = [
      "No direct flight strip exists. Integrated multi-modal air and highway corridors are pre-calculated.",
      "Your transition incorporates stunning regional back-roads, perfect for deep corporate disconnect journeys.",
      "Check with your wellness host for any specific seasonal pass permits needed."
    ];
  }

  const flightCost = budgetLevel === 3 ? "₹14,200" : budgetLevel === 1 ? "₹3,900" : "₹7,800";
  const groundCost = budgetLevel === 3 ? "₹6,500" : budgetLevel === 1 ? "₹450" : "₹1,800";

  return {
    isDirect: false,
    hubName,
    hubCoords: { x: hubX, y: hubY, lat: `${(15 + (destCoords.x % 10)).toFixed(4)}° N`, lon: `${(75 + (destCoords.y % 10)).toFixed(4)}° E` },
    segments: [
      {
        type: "flight",
        from: origin,
        to: hubName,
        duration: "1h 50m",
        distance: "640 km",
        description: `Direct commercial air flight connecting your home office to ${hubName}.`,
        costEstimate: flightCost
      },
      {
        type: connectionMode,
        from: hubName,
        to: dest,
        duration: segment2Duration,
        distance: segment2Distance,
        description: `Scenic overland continuation via ${connectionText} traversing beautiful mountain loops.`,
        costEstimate: groundCost
      }
    ],
    tips: tipList
  };
}
