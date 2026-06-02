import React, { useState, useEffect } from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { Download, MapPin, Calendar, Compass, ShieldAlert, Sparkles, AlertCircle, DollarSign, Lock, Play, RefreshCw, Layers, GitCompare, ArrowRightLeft, ZoomIn, ZoomOut, RotateCcw, Plane, Car, Bus, Train, Info } from "lucide-react";
import { LiveDealsCard } from "./LiveDealsCard";
import { WeatherOverlay } from "./WeatherOverlay";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getCoordsForName, getTransitDetails } from "../utils/transit";
import { generateICS, downloadICS } from "../utils/calendarExport";

// Helper to estimate budget & leave days for any destination deterministically based on its name hash
function getDestinationStats(name: string, budgetLevel: number, prioritizeLowestCost: boolean) {
  const normalized = (name || "").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash += normalized.charCodeAt(i);
  }
  
  // Base multipliers depending on budgetLevel
  const baseMult = budgetLevel === 3 ? 2.5 : budgetLevel === 1 ? 0.45 : 1.0;
  const finalMult = prioritizeLowestCost ? baseMult * 0.8 : baseMult;
  
  // Deterministic variety factor (0.75 to 1.35) based on hash
  const variety = 0.75 + ((hash % 7) / 10); 
  
  const flights = Math.round(12800 * finalMult * variety);
  const accommodation = Math.round(19500 * finalMult * (2 - variety));
  const transit = Math.round(3200 * finalMult * (variety > 1 ? 0.85 : 1.15));
  const total = flights + accommodation + transit;
  
  // Leave days required (2, 3, or 4) based on name length or hash
  const leaveDays = 2 + (hash % 3); // results in 2, 3, or 4
  const daysOff = 9; // standard 9-day streak
  const roi = (daysOff / leaveDays).toFixed(1);

  return {
    flights,
    accommodation,
    transit,
    total,
    leaveDays,
    daysOff,
    roi
  };
}

// Curated list of retreat destinations representing diverse regional characteristics
interface LocationSuggestion {
  name: string;
  category: string;
  region: string;
  country: string;
  desc: string;
  costEstimate: string;
}

const POPULAR_DESTINATIONS: LocationSuggestion[] = [
  { name: "Manali", category: "Hill Station", region: "Himachal Pradesh", country: "India", desc: "Snowy peaks & scenic mountain rivers", costEstimate: "₹14,500 avg" },
  { name: "Ooty", category: "Hill Station", region: "Tamil Nadu", country: "India", desc: "Serene tea plantations & botanical lakes", costEstimate: "₹11,200 avg" },
  { name: "Goa", category: "Coastal Beach", region: "Goa State", country: "India", desc: "Golden sands, historic churches & seafood in shacks", costEstimate: "₹9,800 avg" },
  { name: "Leh Ladakh", category: "High Desert Peaks", region: "Ladakh UT", country: "India", desc: "Pangong lake trails & ancient monasteries", costEstimate: "₹24,000 avg" },
  { name: "Srinagar", category: "Lake Valley", region: "Jammu & Kashmir", country: "India", desc: "Floating gardens of Dal Lake with houseboats", costEstimate: "₹18,500 avg" },
  { name: "Coorg", category: "Coffee Hills", region: "Karnataka", country: "India", desc: "Misty evergreen forest & aromatic coffee walks", costEstimate: "₹8,500 avg" },
  { name: "Munnar", category: "Western Ghats", region: "Kerala", country: "India", desc: "Plentiful mist, wild forests & tea shrubs", costEstimate: "₹9,200 avg" },
  { name: "Shimla", category: "Colonial Peak Town", region: "Himachal Pradesh", country: "India", desc: "Pine forests with high mall shopping walks", costEstimate: "₹13,200 avg" },
  { name: "Rishikesh", category: "Holy River Valley", region: "Uttarakhand", country: "India", desc: "Ganges white water rafting & yoga ashrams", costEstimate: "₹6,800 avg" },
  { name: "Alleppey", category: "Lagoon Backwaters", region: "Kerala", country: "India", desc: "Houseboat cruises & lush palm water-lanes", costEstimate: "₹10,500 avg" },
  { name: "Dharamshala", category: "Himalayan Sanctuary", region: "Himachal Pradesh", country: "India", desc: "Scenic mountain views & beautiful Monasteries", costEstimate: "₹12,800 avg" },
  { name: "Wayanad", category: "Spices Wilderness", region: "Kerala", country: "India", desc: "Pristine waterfalls, caves & treehouse stays", costEstimate: "₹7,900 avg" },
  { name: "Pondicherry", category: "French Riviera", region: "Pondicherry UT", country: "India", desc: "Sunken yellow architecture & seaside boardwalks", costEstimate: "₹8,800 avg" },
  { name: "Darjeeling", category: "East Himalayan Range", region: "West Bengal", country: "India", desc: "Sprawling tea gardens of Mt. Kanchenjunga", costEstimate: "₹15,400 avg" },
];

export const ItineraryView: React.FC = () => {
  const {
    currentTripLocation,
    itinerary,
    weatherForecast,
    isGeneratingItinerary,
    generateItinerary,
    budgetForecast,
    preferences,
    updatePreferences,
    lockTrip,
    user,
    leaveBalances,
  } = useLeaveStore();

  const [destInput, setDestInput] = useState(currentTripLocation);
  
  // Comparison Mode States
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [destA, setDestA] = useState(currentTripLocation);
  const [destB, setDestB] = useState("");

  // Autocomplete Focus Active field: 'main' | 'destA' | 'destB' | null
  const [activeSuggestionsField, setActiveSuggestionsField] = useState<"main" | "destA" | "destB" | null>(null);

  const [mainSuggestions, setMainSuggestions] = useState<any[]>([]);
  const [destASuggestions, setDestASuggestions] = useState<any[]>([]);
  const [destBSuggestions, setDestBSuggestions] = useState<any[]>([]);

  // Open-Meteo Geocoding search engine for instant GPS searches across the globe
  const fetchPredictions = async (
    input: string,
    setResults: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    const trimmed = (input || "").trim();
    if (!trimmed) {
      setResults(POPULAR_DESTINATIONS.slice(0, 5).map(d => ({ ...d, isCustom: false })));
      return;
    }

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`
      );
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          const mapped = data.results.map((item: any) => {
            const name = item.name;
            const region = item.admin1 || "";
            const country = item.country || "";
            const stats = getDestinationStats(name, preferences.budgetLevel, preferences.prioritizeLowestCost);
            const costEstimate = `₹${stats.total.toLocaleString()} avg`;

            return {
              name,
              category: "City",
              region: region,
              country: country,
              desc: `${region ? region + ", " : ""}${country}`,
              costEstimate,
              latitude: item.latitude,
              longitude: item.longitude,
              isCustom: true
            };
          });
          setResults(mapped);
          return;
        }
      }
    } catch (err) {
      console.warn("Open-Meteo Geocoding failed, falling back to local list.", err);
    }

    // Direct local fallback safely if API is rate-limited or offline
    setResults(getLocalFiltered(trimmed));
  };

  const getLocalFiltered = (query: string) => {
    const trimmed = query.toLowerCase();
    return POPULAR_DESTINATIONS.filter(item => 
      item.name.toLowerCase().includes(trimmed) || 
      item.region.toLowerCase().includes(trimmed) ||
      item.category.toLowerCase().includes(trimmed)
    ).slice(0, 5).map(d => ({ ...d, isCustom: false }));
  };

  // Run reactive triggers to query predictions when inputs type with safety debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPredictions(destInput, setMainSuggestions);
    }, 350);
    return () => clearTimeout(timer);
  }, [destInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPredictions(destA, setDestASuggestions);
    }, 350);
    return () => clearTimeout(timer);
  }, [destA]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPredictions(destB, setDestBSuggestions);
    }, 350);
    return () => clearTimeout(timer);
  }, [destB]);

  // Interactive Map State variables
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<{
    name: string;
    info: string;
    type: "origin" | "destination" | "checkpoint";
  } | null>(null);

  const mapRef = React.useRef<HTMLDivElement>(null);
  const panRef = React.useRef(pan);
  const dragStartRef = React.useRef(dragStart);
  const isDraggingRef = React.useRef(isDragging);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    dragStartRef.current = dragStart;
  }, [dragStart]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const mapEl = mapRef.current;
    if (!mapEl) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX - panRef.current.x, y: e.touches[0].clientY - panRef.current.y });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    mapEl.addEventListener("touchstart", handleTouchStart, { passive: false });
    mapEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    mapEl.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      mapEl.removeEventListener("touchstart", handleTouchStart);
      mapEl.removeEventListener("touchmove", handleTouchMove);
      mapEl.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Keep Primary destination (destA) in sync with the global store travel base
  useEffect(() => {
    setDestA(currentTripLocation);
  }, [currentTripLocation]);

  const handleSetActive = (destName: string) => {
    if (!destName.trim()) return;
    setDestInput(destName);
    generateItinerary(destName);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destInput.trim()) return;
    generateItinerary(destInput);
  };

  const handleLevelChange = (level: number) => {
    updatePreferences({ budgetLevel: level as any });
    generateItinerary(currentTripLocation);
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById("itinerary-printable-content");
      if (!element) return;
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Itinerary_${currentTripLocation}.pdf`);
    } catch (error) {
      console.warn("PDF generation failed or blocked by iframe sandbox. Downloading text-based itinerary fallback...", error);
      
      // Beautiful offline-ready high-fidelity text itinerary fallback
      let textItinerary = `============================================================\n`;
      textItinerary += `          OFFGRID DETAILED OPTIMIZED ITINERARY WITH ZIGGY   \n`;
      textItinerary += `============================================================\n`;
      textItinerary += `Employee Name : ${user.name}\n`;
      textItinerary += `Home Terminal : ${user.location}\n`;
      textItinerary += `Destination   : ${currentTripLocation} Retreat\n`;
      textItinerary += `Total Duration: 9 Consecutive Rest Days\n`;
      textItinerary += `Leaves Used   : 2 Earned Leaves (EL) Days\n`;
      textItinerary += `LOP ROI Ratio : 4.5x Optimization Multiplier\n`;
      textItinerary += `============================================================\n\n`;
      
      itinerary.forEach((day) => {
        textItinerary += `------------------------------------------------------------\n`;
        textItinerary += `DAY ${day.dayNumber} - ${day.dateStr} | ${day.title}\n`;
        textItinerary += `------------------------------------------------------------\n`;
        day.activities.forEach((act) => {
          textItinerary += `[${act.time}] (${act.category}) ${act.title}\n`;
          textItinerary += `  ${act.description}\n\n`;
        });
      });
      
      textItinerary += `============================================================\n`;
      textItinerary += `Generated via offGrid Ziggy Mascot & Noida HQ HRMS Registries\n`;
      textItinerary += `============================================================\n`;
      
      const blob = new Blob([textItinerary.trim()], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Itinerary_${currentTripLocation}_Detailed_Schedule.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportCalendar = () => {
    if (!itinerary || itinerary.length === 0) return;
    const originLocation = user?.location || "Delhi";
    const icsContent = generateICS(itinerary, currentTripLocation, originLocation);
    downloadICS(icsContent, `OffGrid_${currentTripLocation}_Sync.ics`);
  };

  return (
    <div id="itinerary-wrapper" className="space-y-8 animate-fade-in font-sans pb-16 select-none">
      
      {/* Page Header */}
      <div id="itinerary-header" className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Travel Itinerary Board</h2>
          <p className="text-sm text-stone-500 mt-1 font-medium font-sans">
            Grounded hour-by-hour vacation scheduling computed dynamically based on regional leave constraints.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-3 w-full xl:w-auto">
          {/* Destination form box */}
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative w-full sm:w-[280px]">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
              <input
                id="itinerary-dest-input"
              type="text"
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              onFocus={() => setActiveSuggestionsField("main")}
              onBlur={() => setTimeout(() => setActiveSuggestionsField(null), 250)}
              className="pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-[#1c1b1b] text-xs font-semibold focus:outline-none focus:border-[#944a00] focus:ring-2 focus:ring-[#944a00]/10 w-full transition-all placeholder-[#897365]"
              placeholder="Type or select a destination..."
            />

            {/* Google Maps Style Autocomplete dropdown */}
            {activeSuggestionsField === "main" && (
              <div className="absolute left-0 mt-1.5 w-full bg-white border border-stone-200 rounded-2xl shadow-xl z-55 overflow-hidden text-left py-2 font-mono">
                <div className="px-3.5 py-1.5 flex justify-between items-center text-[9px] font-mono font-bold text-[#897365] tracking-wider">
                  <span>GOOGLE MAPS RETREATS</span>
                  <span className="text-[#944a00] bg-[#ffdcc5] px-1.5 py-0.5 rounded-lg font-bold">GPS SUGGEST</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {mainSuggestions.map((item, idx) => (
                    <button
                      key={`main-suggest-${item.name}-${idx}`}
                      type="button"
                      onMouseDown={() => {
                        setDestInput(item.name);
                        generateItinerary(item.name);
                        setActiveSuggestionsField(null);
                      }}
                      className="w-full px-3 py-2.5 hover:bg-stone-50 transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex items-center min-w-0">
                        <div className="w-7.5 h-7.5 rounded-xl bg-[#ffdcc5]/15 text-[#944a00] flex items-center justify-center shrink-0 mr-2.5 border border-[#ffdcc5]/30">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-stone-900 leading-none font-sans flex items-center gap-1">
                            <span>{item.name}</span>
                            <span className="text-[9px] font-normal text-stone-400 font-mono">({item.category})</span>
                          </p>
                          <p className="text-[9px] text-stone-500 mt-1 truncate leading-none">{item.region}{item.country ? `, ${item.country}` : ""}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-stone-400 shrink-0 select-none bg-stone-50 border border-stone-200/50 px-1.5 py-0.5 rounded ml-2 font-bold">
                        {item.costEstimate}
                      </span>
                    </button>
                  ))}
                  {mainSuggestions.length === 0 && (
                    <div className="p-4 text-center text-[10px] text-stone-400 font-medium font-sans">
                      No coordinates match "{destInput}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            id="itinerary-btn-generate"
            disabled={isGeneratingItinerary}
            className="px-4 py-2.5 bg-stone-950 text-white hover:bg-stone-900 active:translate-y-0.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 w-full sm:w-auto shrink-0"
          >
            {isGeneratingItinerary ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Compass className="w-4 h-4" />
            )}
            <span>Generate Itinerary</span>
          </button>
        </form>
        
        <div className="flex gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading || isGeneratingItinerary}
            className="flex-1 lg:flex-none px-4 py-2.5 bg-white text-stone-900 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 active:translate-y-0.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isDownloading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="whitespace-nowrap">Download PDF</span>
          </button>
          
          <button
            type="button"
            onClick={handleExportCalendar}
            disabled={isGeneratingItinerary}
            className="flex-1 lg:flex-none px-4 py-2.5 bg-white text-stone-900 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 active:translate-y-0.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Download .ics for Google Calendar or Outlook"
          >
            <Calendar className="w-4 h-4" />
            <span className="whitespace-nowrap">Export to Calendar</span>
          </button>
        </div>
      </div>
      </div>

      {/* Printable Content for PDF Download */}
      <div id="itinerary-printable-content" className="space-y-8 bg-white p-2 rounded-xl">
        {/* Comparison View Segment Toggle */}
      <div id="itinerary-compare-action-section" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#f6f3f2] border border-[#eae7e7] p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white border border-[#eae7e7] text-[#944a00] rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <GitCompare className="w-5 h-5 text-[#944a00] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#1c1b1b] uppercase tracking-wider font-mono">Comparative Decision Matrix</h4>
              <span className="text-[9px] font-mono font-bold bg-[#ffdcc5] text-[#944a00] px-1.5 py-0.5 rounded-lg leading-none uppercase">Dual Mode</span>
            </div>
            <p className="text-xs text-[#564337] mt-0.5 font-medium leading-tight">
              Compare budget estimates, evaluate rest ROI ratios, and see the exact leave cost side-by-side.
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={() => {
            setIsCompareMode(!isCompareMode);
            // Sync destA to current trip location on toggle
            setDestA(currentTripLocation);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs ${
            isCompareMode 
              ? "bg-[#944a00] hover:bg-[#e67e22] text-white border-[#944a00]" 
              : "bg-white hover:bg-[#fcf9f8] text-[#1c1b1b] border-[#eae7e7]"
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>{isCompareMode ? "Collapse Comparison" : "Compare Dual Destinations"}</span>
        </button>
      </div>

      {/* Side-by-Side Comparison Box */}
      {isCompareMode && (
        <div id="itinerary-compare-deck" className="bg-[#fcf9f8] border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eae7e7] pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#944a00] uppercase tracking-widest">Decision Board</span>
              <h3 className="text-base font-bold text-[#1c1b1b] mt-0.5">Primary vs. Comparison Destination Selection</h3>
            </div>
            <div className="text-xs font-mono text-[#564337] bg-white border border-[#eae7e7] px-2.5 py-1 rounded-lg">
              Corridor Tier: <span className="font-bold text-[#1c1b1b] uppercase">{preferences.budgetLevel === 3 ? "Luxury" : preferences.budgetLevel === 1 ? "Budget" : "Mid-Range"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card A */}
            {(() => {
              const activeA = currentTripLocation.toLowerCase().trim() === destA.toLowerCase().trim();
              const statsA = getDestinationStats(destA, preferences.budgetLevel, preferences.prioritizeLowestCost);
              const remainingA = Math.max(0, leaveBalances.earnedLeave - statsA.leaveDays);
              return (
                <div 
                  id="compare-card-a"
                  className={`p-6 rounded-2xl border transition-all relative ${
                    activeA 
                      ? "bg-[#ffdcc5]/10 border-[#944a00] shadow-sm ring-1 ring-[#944a00]/10" 
                      : "bg-white border-[#eae7e7]"
                  }`}
                >
                  {activeA && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-[#944a00] rounded-full text-[9px] font-mono font-black text-white tracking-wider uppercase shadow-sm">
                      Active Target Plan
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-[#897365] uppercase tracking-wider block mb-1">Destination A (Primary)</span>
                        <div className="relative">
                          <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#897365]" />
                          <input
                            type="text"
                            value={destA}
                            onChange={(e) => setDestA(e.target.value)}
                            onFocus={() => setActiveSuggestionsField("destA")}
                            onBlur={() => setTimeout(() => setActiveSuggestionsField(null), 250)}
                            className="pl-8 pr-3 py-1.5 bg-[#f6f3f2] hover:bg-[#eae7e7]/50 focus:bg-white border border-[#eae7e7] rounded-md text-xs text-[#1c1b1b] font-bold focus:outline-none focus:border-[#944a00] w-full"
                            placeholder="Enter primary town..."
                          />

                          {/* Autocomplete sugerences for Card A */}
                          {activeSuggestionsField === "destA" && (
                            <div className="absolute left-0 mt-1 w-full bg-white border border-[#eae7e7] rounded-lg shadow-lg z-55 overflow-hidden text-left py-1.5 font-mono">
                              <div className="px-2.5 py-1 text-[8px] font-mono font-bold text-[#897365] tracking-wider">
                                GPS SUGGESTIONS
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {destASuggestions.map((item, idx) => (
                                  <button
                                    key={`desta-suggest-${item.name}-${idx}`}
                                    type="button"
                                    onMouseDown={() => {
                                      setDestA(item.name);
                                      setActiveSuggestionsField(null);
                                    }}
                                    className="w-full px-2.5 py-1.5 hover:bg-stone-50 transition-colors flex items-center justify-between text-left"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-bold text-[#1c1b1b] leading-none font-sans">
                                        {item.name} <span className="text-[8px] font-normal text-[#897365] font-mono">({item.category})</span>
                                      </p>
                                      <p className="text-[8px] text-[#897365] mt-0.5 truncate leading-none">{item.region}{item.country ? `, ${item.country}` : ""}</p>
                                    </div>
                                    <span className="text-[8px] font-mono text-[#897365] shrink-0 font-bold bg-[#f6f3f2] px-1 py-0.5 rounded leading-none">
                                      {item.costEstimate}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pt-1">
                        {activeA ? (
                          <span className="inline-flex items-center gap-1.5 text-[#944a00] font-mono text-[9px] uppercase font-bold px-2 py-1 bg-[#ffdcc5]/15 border border-[#944a00]/30 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#944a00] animate-pulse" />
                            Active Plan
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetActive(destA)}
                            className="px-3 py-1.5 bg-[#1c1b1b] hover:bg-[#313030] text-white font-mono text-[9px] uppercase font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cost headline */}
                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-[#eae7e7] font-mono text-[#1c1b1b]">
                      <div>
                        <span className="text-[10px] text-[#897365] uppercase tracking-wider block font-medium">Estimated Budget</span>
                        <span className="text-lg font-black font-sans text-[#1c1b1b]">₹{statsA.total.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#897365] uppercase tracking-wider block font-medium">Leave Days Cost</span>
                        <span className="text-sm font-bold text-[#944a00]">{statsA.leaveDays} Earned Leaves</span>
                      </div>
                    </div>

                    {/* Itemized list */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-[11px] text-[#564337]">
                        <span className="font-sans">Flight / Logistics:</span>
                        <span className="font-bold text-[#1c1b1b]">₹{statsA.flights.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#564337]">
                        <span className="font-sans">Stay &amp; Lodging:</span>
                        <span className="font-bold text-[#1c1b1b]">₹{statsA.accommodation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#564337]">
                        <span className="font-sans">Transit / Commuting:</span>
                        <span className="font-bold text-[#1c1b1b]">₹{statsA.transit.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="p-3 bg-[#f6f3f2] rounded-2xl border border-[#eae7e7] space-y-2 font-sans">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#564337] font-semibold text-[11px]">Holiday Rest ROI:</span>
                        <span className="font-black text-[#944a00]">{statsA.roi}x ROI Ratio</span>
                      </div>
                      <div className="w-full bg-[#eae7e7] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#944a00] h-full rounded-full" 
                          style={{ width: `${Math.min(100, (parseFloat(statsA.roi) / 5) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#897365] font-mono">
                        <span>{statsA.daysOff} Days off block</span>
                        <span>Post-trip EL Balance: <strong className="text-[#1c1b1b] font-bold">{remainingA} Leaves</strong></span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* Card B */}
            {(() => {
              const activeB = currentTripLocation.toLowerCase().trim() === destB.toLowerCase().trim();
              const statsB = getDestinationStats(destB, preferences.budgetLevel, preferences.prioritizeLowestCost);
              const remainingB = Math.max(0, leaveBalances.earnedLeave - statsB.leaveDays);
              return (
                <div 
                  id="compare-card-b"
                  className={`p-6 rounded-2xl border transition-all relative ${
                    activeB 
                      ? "bg-[#ffdcc5]/10 border-[#944a00] shadow-sm ring-1 ring-[#944a00]/10" 
                      : "bg-white border-[#eae7e7]"
                  }`}
                >
                  {activeB && (
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-[#944a00] rounded-full text-[9px] font-mono font-black text-white tracking-wider uppercase shadow-sm">
                      Active Target Plan
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-[#897365] uppercase tracking-wider block mb-1">Destination B (Comparison)</span>
                        <div className="relative">
                          <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#897365]" />
                          <input
                            type="text"
                            value={destB}
                            onChange={(e) => setDestB(e.target.value)}
                            onFocus={() => setActiveSuggestionsField("destB")}
                            onBlur={() => setTimeout(() => setActiveSuggestionsField(null), 250)}
                            className="pl-8 pr-3 py-1.5 bg-[#f6f3f2] hover:bg-[#eae7e7]/50 focus:bg-white border border-[#eae7e7] rounded-md text-xs text-[#1c1b1b] font-bold focus:outline-none focus:border-[#944a00] w-full"
                            placeholder="Enter comparison town..."
                          />

                          {/* Autocomplete sugerences for Card B */}
                          {activeSuggestionsField === "destB" && (
                            <div className="absolute left-0 mt-1 w-full bg-white border-[#eae7e7] rounded-lg shadow-lg z-55 overflow-hidden text-left py-1.5 font-mono">
                              <div className="px-2.5 py-1 text-[8px] font-mono font-bold text-[#897365] tracking-wider">
                                GPS SUGGESTIONS
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {destBSuggestions.map((item, idx) => (
                                  <button
                                    key={`destb-suggest-${item.name}-${idx}`}
                                    type="button"
                                    onMouseDown={() => {
                                      setDestB(item.name);
                                      setActiveSuggestionsField(null);
                                    }}
                                    className="w-full px-2.5 py-1.5 hover:bg-stone-50 transition-colors flex items-center justify-between text-left"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-bold text-[#1c1b1b] leading-none font-sans">
                                        {item.name} <span className="text-[8px] font-normal text-[#897365] font-mono">({item.category})</span>
                                      </p>
                                      <p className="text-[8px] text-[#897365] mt-0.5 truncate leading-none">{item.region}{item.country ? `, ${item.country}` : ""}</p>
                                    </div>
                                    <span className="text-[8px] font-mono text-[#897365] shrink-0 font-bold bg-[#f6f3f2] px-1 py-0.5 rounded leading-none">
                                      {item.costEstimate}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pt-1">
                        {activeB ? (
                          <span className="inline-flex items-center gap-1.5 text-[#944a00] font-mono text-[9px] uppercase font-bold px-2 py-1 bg-[#ffdcc5]/15 border border-[#944a00]/30 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#944a00] animate-pulse" />
                            Active Plan
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetActive(destB)}
                            className="px-3 py-1.5 bg-[#1c1b1b] hover:bg-[#313030] text-white font-mono text-[9px] uppercase font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cost headline */}
                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-[#eae7e7] font-mono text-[#1c1b1b]">
                      <div>
                        <span className="text-[10px] text-[#897365] uppercase tracking-wider block font-medium">Estimated Budget</span>
                        <span className="text-lg font-black font-sans text-[#1c1b1b]">₹{statsB.total.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#897365] uppercase tracking-wider block font-medium">Leave Days Cost</span>
                        <span className="text-sm font-bold text-[#944a00]">{statsB.leaveDays} Earned Leaves</span>
                      </div>
                    </div>

                    {/* Itemized list */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-[11px] text-[#564337]">
                        <span className="font-sans">Flight / Logistics:</span>
                        <span className="font-bold text-[#1c1b1b]">₹{statsB.flights.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#564337]">
                        <span className="font-sans">Stay &amp; Lodging:</span>
                        <span className="font-bold text-[#1c1b1b]">₹{statsB.accommodation.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#564337]">
                        <span className="font-sans">Transit / Commuting:</span>
                        <span className="font-bold text-[#1c1b1b]">₹{statsB.transit.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="p-3 bg-[#f6f3f2] rounded-2xl border border-[#eae7e7] space-y-2 font-sans">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#564337] font-semibold text-[11px]">Holiday Rest ROI:</span>
                        <span className="font-black text-[#944a00]">{statsB.roi}x ROI Ratio</span>
                      </div>
                      <div className="w-full bg-[#eae7e7] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#944a00] h-full rounded-full" 
                          style={{ width: `${Math.min(100, (parseFloat(statsB.roi) / 5) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#897365] font-mono">
                        <span>{statsB.daysOff} Days off block</span>
                        <span>Post-trip EL Balance: <strong className="text-[#1c1b1b] font-bold">{remainingB} Leaves</strong></span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Itinerary Timeline), Right Column (Budget & Map widget) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
        
        {/* Left Columns: Timeline Board */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Feasibility Alert Block */}
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-3.5 shadow-sm">
            <div className="p-2 bg-emerald-600/10 text-emerald-800 rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-emerald-800 tracking-widest uppercase">Arrise Feasibility Checklist: ALL CLEAR </span>
              <h4 className="text-sm font-bold text-stone-900 mt-0.5">9-Day Rest Duration Compatible</h4>
              <p className="text-stone-500 text-xs mt-0.5 leading-relaxed font-medium">
                The itinerary timeline matches your <strong>9-day Oct 10 - Oct 18</strong> block perfectly. No Loss of Pay (LOP) flags triggered. Swaps validated with zero scheduling conflicts from Noida HQ.
              </p>
            </div>
          </div>

          {/* Dynamic Timeline Render */}
          <div className="bg-white border border-[#eae7e7] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#eae7e7] pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#944a00] uppercase tracking-widest">Optimized Journey Matrix</span>
                <h3 className="text-lg font-black text-[#1c1b1b]">{currentTripLocation} Retreat Itinerary</h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#f6f3f2] text-[10px] font-mono font-bold text-[#564337] border border-[#eae7e7]">
                <Sparkles className="w-3.5 h-3.5 text-[#944a00]" />
                <span>AI-Assisted Plan</span>
              </div>
            </div>

            {isGeneratingItinerary ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-[#ffdcc5] border-t-[#944a00] animate-spin" />
                <p className="text-sm font-mono font-bold text-[#564337] uppercase tracking-widest">Compiling Hour-by-Hour Matrix with Gemini...</p>
                <p className="text-xs text-[#897365]">Balancing sensory restoration score with policy constraints.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {itinerary.map((day) => (
                  <div key={day.dayNumber} className="space-y-4">
                    {/* Day division */}
                    <div className="flex items-baseline gap-2.5 border-b border-dotted border-[#eae7e7] pb-1">
                      <h4 className="font-black text-sm text-[#1c1b1b]">{day.dateStr}</h4>
                      <span className="text-xs text-[#944a00] font-semibold uppercase">{day.title}</span>
                    </div>

                    {/* Activities stack */}
                    <div className="grid grid-cols-1 gap-6 border-l-2 border-[#eae7e7] ml-3 pl-5 py-2">
                      {["Morning", "Afternoon", "Evening"].map((category) => {
                        const items = day.activities.filter(act => act.category === category);
                        if (items.length === 0) return null;
                        return (
                          <div key={category} className="space-y-3 relative">
                            <div className="absolute -left-[27px] top-1 bg-white p-0.5 rounded-full">
                               <div className="w-2.5 h-2.5 rounded-full bg-[#944a00] border-2 border-[#fcf9f8]" />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#897365] uppercase tracking-widest block">{category}</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {items.map((act) => (
                                <div key={act.id} className="p-4 bg-[#fcf9f8] border border-[#eae7e7] rounded-2xl hover:border-[#dcd9d9] hover:bg-white hover:shadow-xs transition-all space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono font-bold text-[#564337] bg-[#eae7e7] px-2 py-1 rounded-md leading-none">{act.time}</span>
                                  </div>
                                  <h5 className="text-sm font-bold text-[#1c1b1b] leading-tight">{act.title}</h5>
                                  <p className="text-xs text-[#564337] leading-relaxed font-sans">{act.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lock in selector */}
            {!isGeneratingItinerary && (
              <div className="border-t border-[#eae7e7] pt-6 flex items-center justify-between">
                <span className="text-xs text-[#564337]">Agree to terms & deduct leaves accordingly inside check box</span>
                <button
                  id="itinerary-btn-lock"
                  onClick={lockTrip}
                  className="px-5 py-3.5 bg-[#944a00] hover:bg-[#e67e22] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#944a00]/10 cursor-pointer transition-colors"
                >
                  <Lock className="w-4 h-4 text-[#ffdcc5]" />
                  <span>Lock & Apply Leave</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Live Estimator & Mini Map */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          
          {/* Live budget estimator box */}
          <div id="itinerary-budget-card" className="bg-white border border-[#eae7e7] rounded-2xl shadow-sm p-6 space-y-6">
            <div>
              <span className="text-xs font-mono text-[#897365] font-bold uppercase tracking-widest block mb-0.5">Automated Tracker</span>
              <h3 className="text-lg font-black text-[#1c1b1b]">Live Budget Estimator</h3>
              <p className="text-xs text-[#564337] mt-1 leading-normal font-sans">
                Real-time projection for standard travel corridors. Values recalculate on preferences.
              </p>
            </div>

            {/* Budget Toggle buttons */}
            <div className="grid grid-cols-3 gap-2 bg-[#eae7e7] p-1 rounded-lg border border-[#eae7e7]">
              {[
                { level: 1, label: "Budget" },
                { level: 2, label: "Mid-Range" },
                { level: 3, label: "Luxury" }
              ].map((tier) => (
                <button
                  key={tier.level}
                  id={`budget-tier-btn-${tier.level}`}
                  onClick={() => handleLevelChange(tier.level)}
                  className={`py-2 text-[11px] font-bold rounded-md cursor-pointer transition-all ${
                    preferences.budgetLevel === tier.level
                      ? "bg-[#944a00] text-white shadow-sm"
                      : "text-[#564337] hover:text-[#1c1b1b]"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3.5 font-mono text-xs">
              <div className="flex justify-between items-center text-[#564337]">
                <span className="flex items-center gap-1.5 font-sans font-medium">Flights Transfer</span>
                <span className="font-semibold text-[#1c1b1b]">₹{budgetForecast.flights.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[#564337]">
                <span className="flex items-center gap-1.5 font-sans font-medium">Stay / Lodge</span>
                <span className="font-semibold text-[#1c1b1b]">₹{budgetForecast.accommodation.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[#564337]">
                <span className="flex items-center gap-1.5 font-sans font-medium">Local Commute</span>
                <span className="font-semibold text-[#1c1b1b]">₹{budgetForecast.transit.toLocaleString()}</span>
              </div>
              <div className="border-t border-[#eae7e7] pt-3.5 flex justify-between items-center text-[#1c1b1b] font-bold">
                <span className="font-sans text-sm">Estimated Total Cost</span>
                <span className="text-sm">₹{budgetForecast.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-[#ffbf00]/30 text-[10px] text-stone-900 flex gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-[#795900] shrink-0 mt-0.5" />
              <p className="leading-normal">
                Costs estimated using historic Indian corridors originating from {user.location}. Subject to localized seasonal airfare swings.
              </p>
            </div>
          </div>

          {/* Smart Multi-Segment Connection Planner */}
          {(() => {
            const transitInfo = getTransitDetails(user.location, currentTripLocation, preferences.budgetLevel);
            const totalDurationStr = transitInfo.isDirect ? "3h 00m Total" : "8h 30m Total";
            const totalCostStr = preferences.budgetLevel === 3 ? "₹24,500 est." : preferences.budgetLevel === 1 ? "₹5,800 est." : "₹11,000 est.";
            return (
              <div id="smart-transit-planner-card" className="bg-white border border-[#eae7e7] rounded-2xl shadow-sm p-6 space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-[#eae7e7]/60 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider block mb-0.5">Route Guide</span>
                    <h4 className="text-sm font-bold text-[#1c1b1b] flex items-center gap-1.5">
                      <Layers className="text-[#944a00] w-4 h-4 shrink-0" />
                      <span>{transitInfo.isDirect ? "Direct Journey Route" : "Multi-Segment Connection"}</span>
                    </h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    transitInfo.isDirect
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                      : "bg-[#ffdcc5] text-[#944a00] border border-[#ffbf00]/30"
                  }`}>
                    {transitInfo.isDirect ? "DIRECT ROUTE" : "CONNECTED HUB"}
                  </span>
                </div>

                {/* Duration and total estimated transit pricing */}
                <div className="grid grid-cols-2 gap-3.5 pb-1">
                  <div className="bg-[#f6f3f2] p-2.5 rounded-xl border border-[#eae7e7]/60">
                    <span className="text-[9px] font-mono text-[#897365] block font-bold">EST. JOURNEY TIME</span>
                    <span className="text-xs font-bold text-stone-900 font-mono">{totalDurationStr}</span>
                  </div>
                  <div className="bg-[#f6f3f2] p-2.5 rounded-xl border border-[#eae7e7]/60">
                    <span className="text-[9px] font-mono text-[#897365] block font-bold">TOTAL COMMUTE COST</span>
                    <span className="text-xs font-bold text-[#944a00] font-mono">{totalCostStr}</span>
                  </div>
                </div>

                {/* Journey Segment Timeline */}
                <div className="space-y-4 pt-1">
                  {transitInfo.segments.map((segment, idx) => {
                    const isLast = idx === transitInfo.segments.length - 1;
                    return (
                      <div key={`transit-seg-${idx}`} className="flex gap-3 relative">
                        {/* Connecting Line */}
                        {!isLast && (
                          <div className="absolute left-[13px] top-6 bottom-[-20px] w-0.5 border-l-2 border-dashed border-[#eae7e7]" />
                        )}
                        
                        {/* Segment Icon */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border shadow-xs ${
                          segment.type === "flight"
                            ? "bg-blue-50 border-blue-200 text-blue-600"
                            : segment.type === "drive"
                            ? "bg-amber-50 border-amber-200 text-amber-600"
                            : segment.type === "bus"
                            ? "bg-teal-50 border-teal-200 text-teal-600"
                            : "bg-indigo-50 border-indigo-200 text-indigo-600"
                        }`}>
                          {segment.type === "flight" && <Plane className="w-3.5 h-3.5" />}
                          {segment.type === "drive" && <Car className="w-3.5 h-3.5" />}
                          {segment.type === "bus" && <Bus className="w-3.5 h-3.5" />}
                          {segment.type === "train" && <Train className="w-3.5 h-3.5" />}
                        </div>

                        {/* Segment Meta */}
                        <div className="flex-1 min-w-0 text-left font-sans">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                              Segment {idx + 1} &bull; {segment.type.toUpperCase()}
                            </span>
                            <span className="text-xs font-bold text-stone-800 font-mono">{segment.duration}</span>
                          </div>
                          <p className="text-xs font-bold text-stone-900 mt-0.5">
                            {segment.from} &rarr; {segment.to}
                          </p>
                          <p className="text-[11px] text-stone-650 mt-1 leading-normal text-stone-600">
                            {segment.description}
                          </p>
                          {segment.costEstimate && (
                            <p className="text-[9px] font-mono text-[#944a00] font-bold mt-1">
                              Fare share: {segment.costEstimate}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Indirect Helper Banner */}
                {!transitInfo.isDirect && (
                  <div className="p-3 bg-[#ffdcc5]/20 rounded-xl border border-[#ffbf00]/20 text-[10px] text-stone-850 flex items-start gap-2 text-left">
                    <Info className="w-3.5 h-3.5 text-[#944a00] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900">Transfer advice for {transitInfo.hubName}</p>
                      <p className="leading-normal text-[9.5px] text-stone-600 mt-0.5">
                        No direct flight exists for {currentTripLocation}. Transit connects securely at {transitInfo.hubName}. We recommend arranging ground pickup in advance.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Mini Destination Map widget */}
          <div className="bg-white border border-[#eae7e7] rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between font-sans">
              <div>
                <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider block mb-0.5">Atmosphere Coordinate</span>
                <h4 className="text-sm font-bold text-[#1c1b1b] flex items-center gap-1.5">
                  <MapPin className="text-[#944a00] w-4 h-4" />
                  <span>{currentTripLocation}, India</span>
                </h4>
              </div>
              <div className="flex gap-1.5 font-mono text-[9px] text-[#564337] bg-[#f6f3f2] border border-[#eae7e7] px-2.5 py-1 rounded-md items-center">
                <span>ZOOM:</span>
                <span className="font-bold text-[#1c1b1b]">{zoom.toFixed(2)}x</span>
              </div>
            </div>

            {/* Highly Interactive Vector SVG Radar Map representing origin, destination and itinerary checkpoints */}
            <div 
              id="interactive-radar-map-box"
              ref={mapRef}
              className="w-full h-80 rounded-2xl bg-stone-950 border border-stone-850 relative overflow-hidden select-none cursor-grab active:cursor-grabbing group shadow-inner font-mono"
              onMouseDown={(e) => {
                setIsDragging(true);
                setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                setPan({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y
                });
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              {/* Map SVG container transform group - Rendered first with z-10 to stay under HUD elements */}
              <div 
                className="absolute z-20 w-full h-full inset-0"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                <svg className="w-full h-full" viewBox="0 0 400 300">
                  {/* Radar coordinate grid overlay */}
                  {Array.from({ length: 11 }).map((_, i) => (
                    <line key={`v-${i}`} x1={i * 40} y1={0} x2={i * 40} y2={300} stroke="#1f1d1c" strokeWidth="0.5" strokeDasharray="1 3" />
                  ))}
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line key={`h-${i}`} x1={0} y1={i * 35} x2={400} y2={i * 35} stroke="#1f1d1c" strokeWidth="0.5" strokeDasharray="1 3" />
                  ))}

                  {/* Topographic contour vector rings representing mountains/terrains inside region */}
                  <path d="M 40,80 Q 80,110 60,160 T 120,220 T 180,180" fill="none" stroke="#00b05c" strokeWidth="0.5" strokeOpacity="0.08" />
                  <path d="M 120,40 Q 150,90 220,70 T 320,120" fill="none" stroke="#00b05c" strokeWidth="0.5" strokeOpacity="0.08" />
                  <path d="M 200,220 A 45,45 0 0,0 290,240" fill="none" stroke="#00b05c" strokeWidth="0.5" strokeOpacity="0.06" />

                  {/* Geolocation nodes mapping */}
                  {(() => {
                    const coordsOrigin = getCoordsForName(user.location, true);
                    const coordsDest = getCoordsForName(currentTripLocation, false);
                    const transitInfo = getTransitDetails(user.location, currentTripLocation, preferences.budgetLevel);
                    
                    let curvePath1 = "";
                    let curvePath2 = "";
                    
                    if (transitInfo.isDirect) {
                      const ctrlX = (coordsOrigin.x + coordsDest.x) / 2 + 35;
                      const ctrlY = (coordsOrigin.y + coordsDest.y) / 2 - 50;
                      curvePath1 = `M ${coordsOrigin.x} ${coordsOrigin.y} Q ${ctrlX} ${ctrlY} ${coordsDest.x} ${coordsDest.y}`;
                    } else {
                      // Origin to Hub
                      const ctrlX1 = (coordsOrigin.x + transitInfo.hubCoords.x) / 2 + 10;
                      const ctrlY1 = (coordsOrigin.y + transitInfo.hubCoords.y) / 2 - 20;
                      curvePath1 = `M ${coordsOrigin.x} ${coordsOrigin.y} Q ${ctrlX1} ${ctrlY1} ${transitInfo.hubCoords.x} ${transitInfo.hubCoords.y}`;

                      // Hub to Destination
                      const ctrlX2 = (transitInfo.hubCoords.x + coordsDest.x) / 2 - 5;
                      const ctrlY2 = (transitInfo.hubCoords.y + coordsDest.y) / 2 + 10;
                      curvePath2 = `M ${transitInfo.hubCoords.x} ${transitInfo.hubCoords.y} Q ${ctrlX2} ${ctrlY2} ${coordsDest.x} ${coordsDest.y}`;
                    }

                    // Daily checkpoint nodes nearby destination with offset spreading angles
                    const dayNodes = itinerary.map((day, idx) => {
                      const angle = (idx * 2 * Math.PI) / Math.max(1, itinerary.length);
                      const radius = 32 + (idx % 2) * 8; // spread radius out a bit
                      return {
                        ...day,
                        x: coordsDest.x + Math.cos(angle) * radius,
                        y: coordsDest.y + Math.sin(angle) * radius,
                      };
                    });

                    return (
                      <g>
                        {/* Connecting trajectory trail flight arc */}
                        <path
                          d={curvePath1}
                          fill="none"
                          stroke="#ffbf00"
                          strokeWidth="2"
                          strokeOpacity="0.85"
                          strokeDasharray="4 4"
                        />

                        {/* Connecting overland road/train arc */}
                        {!transitInfo.isDirect && (
                          <path
                            d={curvePath2}
                            fill="none"
                            stroke="#944a00"
                            strokeWidth="1.8"
                            strokeOpacity="0.9"
                            strokeDasharray="1 1.5"
                          />
                        )}

                        {/* Origin Node Anchor */}
                        <g 
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredNode({
                            name: `Origin Node: ${user.location}`,
                            info: `${user.role} base office hub`,
                            type: 'origin'
                          })}
                          onMouseLeave={() => setHoveredNode(null)}
                        >
                          <circle cx={coordsOrigin.x} cy={coordsOrigin.y} r="8" fill="#ffbf00" fillOpacity="0.25" />
                          <circle cx={coordsOrigin.x} cy={coordsOrigin.y} r="4" fill="#ffbf00" />
                          <text x={coordsOrigin.x - 14} y={coordsOrigin.y - 10} fill="#ffbf00" fontSize="8" fontFamily="monospace" fontWeight="bold">
                            {user.location.toUpperCase()}
                          </text>
                        </g>

                        {/* Transit Hub Node Anchor */}
                        {!transitInfo.isDirect && (
                          <g 
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredNode({
                              name: `Transit Hub: ${transitInfo.hubName}`,
                              info: `Overland departure point to destination ${currentTripLocation}`,
                              type: 'checkpoint'
                            })}
                            onMouseLeave={() => setHoveredNode(null)}
                          >
                            <circle cx={transitInfo.hubCoords.x} cy={transitInfo.hubCoords.y} r="10" fill="#00b05c" fillOpacity="0.15" />
                            <circle cx={transitInfo.hubCoords.x} cy={transitInfo.hubCoords.y} r="4.5" fill="#00b05c" />
                            <text x={transitInfo.hubCoords.x + 8} y={transitInfo.hubCoords.y - 4} fill="#00b05c" fontSize="7" fontFamily="monospace" fontWeight="bold">
                              {transitInfo.hubName.replace(/\(.*?\)/g, "").trim().split(" ")[0].toUpperCase()} HUB
                            </text>
                          </g>
                        )}

                        {/* Destination Node Anchor */}
                        <g 
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredNode({
                            name: `Destination: ${currentTripLocation}`,
                            info: `${preferences.budgetLevel === 3 ? "Luxury" : "Continuous Restoration"} Trip Node`,
                            type: 'destination'
                          })}
                          onMouseLeave={() => setHoveredNode(null)}
                        >
                          <circle cx={coordsDest.x} cy={coordsDest.y} r="16" fill="#944a00" fillOpacity="0.15" />
                          <circle cx={coordsDest.x} cy={coordsDest.y} r="8" fill="#944a00" fillOpacity="0.3" />
                          <circle cx={coordsDest.x} cy={coordsDest.y} r="4" fill="#944a00" />
                          <text x={coordsDest.x + 12} y={coordsDest.y - 4} fill="#944a00" fontSize="9" fontFamily="monospace" fontWeight="bold">
                            {currentTripLocation.toUpperCase()}
                          </text>
                        </g>

                        {/* Day stops checkpoints plotted nearby */}
                        {dayNodes.map((day, idx) => (
                          <g key={`day-node-${day.dayNumber}`}>
                            {/* Line from destination to sub stop */}
                            <line 
                              x1={coordsDest.x} 
                              y1={coordsDest.y} 
                              x2={day.x} 
                              y2={day.y} 
                              stroke="#944a00" 
                              strokeWidth="0.8" 
                              strokeDasharray="1 2"
                              strokeOpacity="0.5"
                            />
                            {/* Checkpoint circular hub marker */}
                            <circle
                              cx={day.x}
                              cy={day.y}
                              r="3.5"
                              fill="#00b05c"
                              stroke="#00b05c"
                              strokeWidth="1"
                              fillOpacity="0.3"
                              className="cursor-pointer hover:scale-150 transition-all duration-150"
                              onMouseEnter={() => setHoveredNode({
                                name: `Day ${day.dayNumber}: ${day.title}`,
                                info: day.activities[0]?.title || "Sensory unwind activity state",
                                type: 'checkpoint'
                              })}
                              onMouseLeave={() => setHoveredNode(null)}
                            />
                            {/* Little number tags for first and last days */}
                            {(day.dayNumber === 1 || day.dayNumber === itinerary.length) && (
                              <text x={day.x + 5} y={day.y + 3} fill="#a8a29e" fontSize="6" fontFamily="monospace">
                                D{day.dayNumber}
                              </text>
                            )}
                          </g>
                        ))}
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Absolutes for Compass rose & status logs inside map */}
              <div className="absolute top-3 right-3 pointer-events-none z-50 flex flex-col items-end gap-1">
                <div className="w-10 h-10 border border-stone-800 rounded-full flex items-center justify-center bg-stone-950/80 backdrop-blur-xs animate-pulse-slow">
                  <Compass className="w-5 h-5 text-[#944a00]/70 animate-[spin_20s_linear_infinite]" />
                </div>
                <span className="text-[8px] font-mono text-stone-500">BEARING ACTIVE</span>
              </div>

              {/* Dynamic bottom telemetry HUD console */}
              <div className="absolute bottom-3 left-3 right-3 z-50 bg-stone-950/85 backdrop-blur-md rounded-xl p-2.5 border border-[#eae7e7]/10 flex items-center justify-between text-[10px] gap-2">
                {hoveredNode ? (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${hoveredNode.type === 'origin' ? 'bg-[#ffbf00]' : hoveredNode.type === 'destination' ? 'bg-[#944a00]' : 'bg-[#00b05c]'} animate-pulse`} />
                      <span className="font-mono font-bold text-stone-400 uppercase leading-none text-[8px]">{hoveredNode.type} tracker</span>
                    </div>
                    <p className="font-bold text-white font-sans mt-0.5 leading-none truncate">{hoveredNode.name}</p>
                    <p className="text-[9px] text-stone-400 mt-1 truncate max-w-[190px]">{hoveredNode.info}</p>
                  </div>
                ) : (
                  <div className="text-left">
                    <p className="text-[9px] font-mono font-bold text-[#ffdcc5] uppercase leading-none tracking-widest gap-1 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#944a00] animate-pulse" />
                      Active Route Matrix / Map
                    </p>
                    <p className="text-[11px] font-sans font-semibold text-stone-200 mt-1 leading-none">{user.location} &rarr; {currentTripLocation}</p>
                    <p className="text-[8px] font-mono text-stone-500 mt-1 leading-none">Drag context to pan &bull; Click + / - to Zoom</p>
                  </div>
                )}
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-stone-400 font-mono font-bold">LAT: {getCoordsForName(currentTripLocation, false).lat}</p>
                  <p className="text-[9px] text-stone-400 font-mono font-bold">LON: {getCoordsForName(currentTripLocation, false).lon}</p>
                </div>
              </div>

              {/* Floating interactive zoom and pan controls panel - High z-index (z-50) & dark glass HUD theme */}
              <div className="absolute top-3 left-3 z-50 flex items-center gap-1 bg-stone-950/90 backdrop-blur-md p-1.5 rounded-xl border border-stone-800 shadow-2xl">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom(z => Math.min(3.5, z + 0.25));
                  }}
                  title="Zoom In"
                  className="p-1.5 bg-stone-900/80 hover:bg-stone-805 hover:text-white text-stone-300 rounded-lg border border-stone-800/50 active:scale-95 cursor-pointer transition-all duration-150 flex items-center justify-center"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom(z => Math.max(0.6, z - 0.25));
                  }}
                  title="Zoom Out"
                  className="p-1.5 bg-stone-900/80 hover:bg-stone-805 hover:text-white text-stone-300 rounded-lg border border-stone-800/50 active:scale-95 cursor-pointer transition-all duration-150 flex items-center justify-center"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  title="Recenter Map"
                  className="p-1.5 bg-stone-900/80 hover:bg-stone-805 hover:text-white text-stone-300 rounded-lg border border-stone-800/50 active:scale-95 cursor-pointer transition-all duration-150 flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Weather Overlay for 5-day forecast inline positioned */}
              <WeatherOverlay forecast={weatherForecast} />
            </div>
          </div>

        </div>

      </div>

      {/* Live Deals Section appended at bottom */}
      <div className="mt-8 w-full">
        <LiveDealsCard />
      </div>

      </div>

    </div>
  );
};
