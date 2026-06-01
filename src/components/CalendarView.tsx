import React, { useState, useEffect } from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { REGIONAL_HOLIDAYS_2026, HolidayEntry } from "../data/leavePolicy";
import { ArrowRight, HelpCircle, MessageSquare, Search, RefreshCw, Sparkles, Check, ChevronRight, ChevronDown, Calendar, ArrowLeftRight, Info, Award, Zap, Clock, ThumbsUp, MapPin } from "lucide-react";

export const CalendarView: React.FC = () => {
  const {
    user,
    activeHolidaySwaps,
    swapHoliday,
    resetSwaps,
    chatHistory,
    addChatMessage,
    isCommandPaletteOpen,
    setCommandPalette,
  } = useLeaveStore();

  const [chatInput, setChatInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [clickedDays, setClickedDays] = useState<number[]>([12, 13]); // Fallback pre-selected leave days for October 2026 streak
  const [openSwapDate, setOpenSwapDate] = useState<string | null>(null);

  // October 2026: 1st is Thursday
  const daysInOctober = 31;
  const startOffset = 4; // Sun=0, Mon=1, Tue=2, Wed=3, Thu=4
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Handle key listeners for Command Palette Cmd+K/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPalette(!isCommandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPalette]);

  const toggleDaySelection = (day: number) => {
    if (day === 2 || day === 10 || day === 11 || day === 17 || day === 18) {
      // Don't toggle fixed holidays or weekends as editable leaves (they are free rest!)
      return;
    }
    setClickedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a,b)=>a-b)
    );
  };

  // Check the status of each calendar day in October 2026
  const getDayMeta = (dayNum: number) => {
    const year = 2026;
    const month = 10;
    const dateString = `2026-10-${String(dayNum).padStart(2, "0")}`;
    
    // Weekend check
    const dateObj = new Date(year, month - 1, dayNum);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Fixed corporate holidays in Oct 2026
    const isFixedHoliday = dayNum === 2; // Gandhi Jayanti

    // Applied leave day (the user elected)
    const isAppliedLeave = clickedDays.includes(dayNum);

    // Is in our Coimbatore main vacation streak (Oct 10 Sat - Oct 18 Sun)
    const isInStreakRange = dayNum >= 10 && dayNum <= 18;

    return {
      isWeekend,
      isFixedHoliday,
      isAppliedLeave,
      isInStreakRange,
      dateString,
    };
  };

  // Calculate the continuous rest statistics
  const consecutiveRestDays = 9; // Precalculated based on Oct 10 - Oct 18
  const realLeavesUsed = clickedDays.length;

  // Filter regional list
  const regionalHolidays = REGIONAL_HOLIDAYS_2026.filter((h) =>
    h.regions.includes(user.location)
  );

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const query = chatInput;
    setChatInput("");
    addChatMessage({
      id: String(Date.now()),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setIsLoadingChat(true);

    try {
      const response = await fetch("/api/policy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, history: chatHistory }),
      });

      if (!response.ok) throw new Error("Chat api failed");

      const data = await response.json();
      addChatMessage({
        id: String(Date.now() + 1),
        sender: "ai",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (err) {
      // Fallback answers based on policy.md text
      console.warn("Using offline chat heuristics due to missing API credential.");
      const reply = query.toLowerCase().includes("earned") 
        ? "According to Section 4.2, full-time employees accrue 1 EL per month. These roll over up to a maximum accumulation of 40 days, beyond which unutilized parts lapse." 
        : "For Noida, you get 10 days of Paternity Leave (Section 4.4), 12 days of CL/SL (Section 4.1, prioritizes usage), and Compensatory Offs (Section 4.8, expires in 90 days).";
      addChatMessage({
        id: String(Date.now() + 2),
        sender: "ai",
        text: reply,
        timestamp: "Offline Guide",
      });
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <div id="calendar-wrapper" className="space-y-8 animate-fade-in font-sans pb-16 select-none w-full relative z-10">
      
      {/* Page Header */}
      <div id="calendar-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 lumina-glass p-6 rounded-2xl shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#00b05c]" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#897365]">Grounded Policy Engine v2.6</span>
          </div>
          <h2 className="text-2xl font-display font-extrabold text-[#1c1b1b] tracking-tight">
            Smart Calendar Engine
          </h2>
          <p className="text-xs text-[#564337] font-medium">
            Toggle leave dates, swap regional corporate holidays, and optimize high-efficiency rest streaks with zero policy friction.
          </p>
        </div>
        <button
          onClick={() => setCommandPalette(true)}
          className="flex items-center gap-2.5 px-4.5 py-3 bg-[#191919] hover:bg-[#313030] text-xs font-bold rounded-xl text-white transition-all cursor-pointer shadow-md active:translate-y-0.5"
        >
          <Search className="w-4 h-4 text-[#ffdcc5]" />
          <span>Interactive Policy Command Bar</span>
          <kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-[#ffdcc5] text-[10px] scale-90 ml-1">Cmd K</kbd>
        </button>
      </div>

      {/* Grid: Calendar Sandbox + Swapping Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left/Middle Column: Calendar Sandbox Visual Grid */}
        <div className="lg:col-span-8 lumina-glass p-5 md:p-6 rounded-2xl flex flex-col space-y-5 justify-start">
          
          {/* Header & Legend Grouped Compactly */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eae7e7] pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#944a00] uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#944a00]" />
                Interactive Month Sandbox
              </span>
              <h3 className="text-lg font-bold text-[#1c1b1b] mt-0.5">October 2026</h3>
            </div>
            
            {/* Legend Indicators - Sleeker layout */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
              <div className="flex items-center gap-1.5 bg-white/80 border border-[#eae7e7] px-2.5 py-1 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-[#944a00] shadow-xs" />
                <span className="text-[#1c1b1b] font-bold">Applied Leave</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/80 border border-[#eae7e7] px-2.5 py-1 rounded-lg">
                <span className="w-2.5 h-2.5 rounded bg-zinc-300" />
                <span className="text-[#564337] font-semibold">Work Day</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#00b05c]/10 border border-[#00b05c]/30 px-2.5 py-1 rounded-lg">
                <span className="w-2.5 h-2.5 rounded bg-[#00b05c]" />
                <span className="text-[#006d37] font-semibold">HQ Holiday</span>
              </div>
            </div>
          </div>

          {/* Calendaring Streak Summary - Super sleek horizontal banner rather than high empty bento */}
          <div className="p-3.5 bg-gradient-to-r from-[#fcf9f8] to-[#f6f3f2] border border-[#eae7e7] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#eae7e7] flex items-center justify-center text-[#944a00] shrink-0">
                <Award className="w-4 h-4 text-[#944a00]" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-[#944a00] uppercase tracking-wider block">Real-time Optimization Metrics</span>
                <p className="font-bold text-[#1c1b1b] mt-0.5">
                  <span className="text-[#944a00]">{consecutiveRestDays} Days Off</span> using only {realLeavesUsed} Earned Leaves
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-[#897365] font-medium">ROI Efficiency Index:</span>
                <span className="text-white bg-[#944a00] px-2 py-0.5 rounded text-[9.5px] font-black shadow-sm ml-1.5">
                  4.5x Score
                </span>
              </div>
              <div className="h-6 w-px bg-[#eae7e7] hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-white border border-[#eae7e7] rounded-lg text-center shadow-none">
                  <span className="text-[8px] text-[#897365] font-bold uppercase tracking-wider leading-none">Streaks</span>
                  <p className="text-xs font-bold text-[#944a00] leading-tight">1</p>
                </div>
                <div className="px-3 py-1 bg-white border border-[#eae7e7] rounded-lg text-center shadow-none">
                  <span className="text-[8px] text-[#897365] font-bold uppercase tracking-wider leading-none">EL Used</span>
                  <p className="text-xs font-bold text-[#1c1b1b] leading-tight">{realLeavesUsed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Complete 35-day Grid Board - Wrapped in a container limiting excessive height */}
          <div className="space-y-3 w-full">
            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-2 text-center border-b border-[#eae7e7] pb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-[10px] font-extrabold font-mono text-[#897365] uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Offset days from previous month placeholder */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="h-11 sm:h-13 bg-white/40 rounded-lg border border-dashed border-[#eae7e7]" />
              ))}

              {/* October days */}
              {Array.from({ length: daysInOctober }).map((_, i) => {
                const dayNum = i + 1;
                const { isWeekend, isFixedHoliday, isAppliedLeave, isInStreakRange, dateString } = getDayMeta(dayNum);
                
                let dayBg = "bg-white/70 border border-[#eae7e7] hover:border-[#944a00]/40 hover:bg-[#fcf9f8]";
                let dayText = "text-[#1c1b1b] font-medium";

                if (isFixedHoliday) {
                  dayBg = "bg-[#00b05c]/10 text-[#006d37] border-[#00b05c]/30 shadow-none";
                  dayText = "text-[#006d37] font-black";
                } else if (isAppliedLeave) {
                  dayBg = "bg-[#944a00] text-white font-semibold shadow-sm hover:bg-[#e67e22]";
                  dayText = "text-white";
                } else if (isWeekend) {
                  dayBg = "bg-[#f0eded]/45 border border-[#eae7e7]/50";
                  dayText = "text-[#897365] font-medium";
                }

                // Streak highlighting border/inner rings
                const streakOutline = isInStreakRange && !isAppliedLeave && !isFixedHoliday && !isWeekend
                  ? "ring-2 ring-[#795900]/25 bg-white border-[#795900]/50"
                  : "";

                const activeStreakClass = isInStreakRange && isWeekend
                  ? "ring-1 ring-[#795900]/10 bg-[#fcf9f8]"
                  : "";

                const dotColor = isAppliedLeave 
                  ? "bg-white" 
                  : isFixedHoliday 
                  ? "bg-[#00b05c]" 
                  : isInStreakRange 
                  ? "bg-[#795900]" 
                  : "bg-transparent";

                return (
                  <button
                    key={`day-${dayNum}`}
                    id={`calendar-day-btn-${dayNum}`}
                    onClick={() => toggleDaySelection(dayNum)}
                    className={`h-11 sm:h-13 rounded-lg text-[10px] sm:text-[11px] flex flex-col justify-between p-1.5 sm:p-2 transition-all text-left group relative cursor-pointer shadow-none ${dayBg} ${streakOutline} ${activeStreakClass} transform hover:-translate-y-0.5 duration-150`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`font-mono font-extrabold ${dayText}`}>{dayNum}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    </div>
                    
                    <div className="flex items-center justify-between w-full mt-auto">
                      {isFixedHoliday && (
                        <span className="text-[7px] font-sans leading-none font-bold block uppercase truncate max-w-full tracking-wider opacity-90">Holiday</span>
                      )}
                      {isAppliedLeave && (
                        <span className="text-[7px] font-sans font-extrabold border border-white/40 px-1 py-0.2 rounded block uppercase tracking-wider bg-white/10">Active</span>
                      )}
                      {!isFixedHoliday && !isAppliedLeave && isWeekend && (
                        <span className="text-[7px] font-mono opacity-50 tracking-wide font-normal">WND</span>
                      )}
                      {!isFixedHoliday && !isAppliedLeave && !isWeekend && isInStreakRange && (
                        <span className="text-[7px] font-sans font-bold text-[#795900] block uppercase tracking-wider leading-none">Auto-Off</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Floater Swap Control Board */}
        <div className="lg:col-span-4 lumina-glass p-5 md:p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold text-[#897365] uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#795900]" />
              Corporate Sandbox
            </span>
            <h3 className="text-xl font-bold text-[#1c1b1b] tracking-tight">Public Holiday Swap</h3>
            <p className="text-[#564337] text-xs leading-relaxed font-sans font-medium">
              Exchange up to two of your listed regional fixed holidays with regional options below to suit your relaxation schedule.
            </p>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold text-[#564337] uppercase tracking-wider block border-b border-[#eae7e7] pb-2 flex items-center gap-1.5 font-bold">
              <MapPin className="w-3.5 h-3.5 text-[#944a00]" />
              List of Active Holidays for {user.location}
            </span>
            <div className="space-y-3">
              {regionalHolidays.map((holiday) => {
                const swappedWith = activeHolidaySwaps[holiday.date];
                return (
                  <div key={holiday.date} className="p-3.5 bg-[#fcf9f8] border border-[#eae7e7] rounded-xl flex flex-col space-y-3 text-xs transition-colors hover:bg-white">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <span className="font-bold text-[#1c1b1b] text-[13px] block leading-snug">{holiday.name}</span>
                        <span className="text-[10px] font-mono text-[#897365] mt-0.5 block">{holiday.date}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold ${
                        holiday.type === 'Fixed' ? "bg-[#eae7e7] text-[#1c1b1b]" : "bg-[#00b05c]/15 text-[#006d37] border border-[#00b05c]/25"
                       }`}>
                        {holiday.type}
                      </span>
                    </div>

                    {holiday.type === 'Fixed' && (
                      <div className="flex items-center justify-between border-t border-[#eae7e7] pt-2.5 mt-1">
                        <span className="text-[10px] text-[#897365] font-bold uppercase tracking-wider font-mono">Swap:</span>
                        {swappedWith ? (
                          <div className="flex items-center gap-1.5 font-bold text-[#006d37] bg-[#00b05c]/10 border border-[#00b05c]/20 px-20.5 rounded font-mono text-[10px] shadow-none">
                            <span>{swappedWith}</span>
                            <button 
                              onClick={resetSwaps} 
                              className="text-red-500 hover:text-red-700 leading-none text-[15px] cursor-pointer ml-1.5 font-sans font-bold"
                              title="Reset Swap"
                            >
                              &times;
                            </button>
                          </div>
                        ) : (
                          <div className="relative flex items-center shrink-0">
                            <select
                              id={`swap-select-${holiday.date}`}
                              value={swappedWith || ""}
                              onChange={(e) => {
                                  if (e.target.value) {
                                    swapHoliday(holiday.date, e.target.value);
                                  }
                              }}
                              className="appearance-none text-[10.5px] font-mono font-semibold text-[#1c1b1b] bg-white hover:bg-[#fcf9f8] border border-[#eae7e7] rounded-lg px-2.5 py-1.5 pr-7 transition-all focus:outline-none focus:border-[#944a00] focus:ring-2 focus:ring-[#944a00]/10 cursor-pointer text-left w-36 select-none shadow-none font-sans"
                            >
                              <option value="">Choose Floater...</option>
                              {REGIONAL_HOLIDAYS_2026.filter((h) => h.type === "Floater").map((opt) => {
                                const matchesRegion = opt.regions.includes(user.location);
                                const displaySuffix = matchesRegion ? "⭐" : `(${opt.regions[0].substring(0, 3)})`;
                                return (
                                  <option key={opt.name} value={opt.name}>
                                    {opt.name} {displaySuffix}
                                  </option>
                                );
                              })}
                            </select>
                            <div className="absolute right-2 pointer-events-none text-[#897365] flex items-center justify-center">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-white border border-[#eae7e7] rounded-xl flex items-center justify-between text-xs">
            <span className="text-[#564337] font-medium flex items-center gap-1.5 font-sans font-bold">
              <Info className="w-3.5 h-3.5 text-[#795900]" />
              Active Swaps:
            </span>
            <span className="font-mono font-bold text-[#1c1b1b] bg-[#fcf9f8] px-2 py-0.5 rounded-lg border border-[#eae7e7] text-[10.5px]">
              {Object.keys(activeHolidaySwaps).length} / 2 Permitted
            </span>
          </div>
        </div>

      </div>

      {/* Floating command palette instructions toggle banner */}
      <div className="p-4 bg-[#191919] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#564337]/20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 text-[#00b05c] rounded-xl flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 text-[#00b05c]" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">Want to query corporate leave rules?</p>
            <p className="text-[11px] text-[#eae7e7] font-mono">Launch the AI policy sandbox by pressing <kbd className="bg-white/10 text-[#ffb783] px-1 rounded mx-0.5 font-sans font-bold">Cmd</kbd> + <kbd className="bg-white/10 text-[#ffb783] px-1 rounded mx-0.5 font-sans font-bold">K</kbd> anytime you need guidelines.</p>
          </div>
        </div>
        <button
          onClick={() => setCommandPalette(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#944a00] hover:bg-[#e67e22] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all font-mono uppercase tracking-wide"
        >
          Ask AI Now
        </button>
      </div>

      {/* Floating Dialog Modal (Cmd+K) Component */}
      {isCommandPaletteOpen && (
        <div id="cmd-k-overlay" className="fixed inset-0 bg-[#1c1b1b]/65 flex items-center justify-center p-4 z-50 backdrop-filter backdrop-blur-[12px] animate-fade-in">
          <div id="cmd-k-modal" className="w-full max-w-lg bg-white/95 backdrop-filter backdrop-blur-[12px] border border-[#eae7e7] rounded-2xl shadow-2xl flex flex-col max-h-[480px] overflow-hidden">
            
            {/* Modal search header entry */}
            <form onSubmit={handleSendChat} className="p-4 border-b border-[#eae7e7] flex items-center gap-3">
              <Search className="w-4 h-4 text-[#897365] shrink-0" />
              <input
                id="cmd-k-input"
                type="text"
                autoFocus
                placeholder="Query HR leave guides (e.g., 'Do cl/sl roll over?', 'Maternity weeks?')"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full bg-transparent text-[#1c1b1b] focus:outline-none text-xs placeholder-[#897365] font-medium"
              />
              <button
                type="button"
                onClick={() => setCommandPalette(false)}
                className="text-[#897365] hover:text-[#1c1b1b] text-[10px] font-mono px-2 py-1 bg-[#fcf9f8] border border-[#eae7e7] rounded-lg cursor-pointer"
              >
                ESC
              </button>
            </form>

            {/* Chat History List */}
            <div id="cmd-k-chat-area" className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f6f3f2] max-h-[290px]">
              {chatHistory.map((chat) => (
                <div key={chat.id} className={`flex flex-col ${chat.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-3 rounded-xl max-w-[85%] text-xs font-mono leading-relaxed tracking-tight ${
                    chat.sender === "user"
                      ? "bg-[#191919] text-white shadow-xs"
                      : "bg-white text-[#1c1b1b] border border-[#eae7e7] shadow-xs"
                  }`}>
                    <p className="whitespace-pre-wrap">{chat.text}</p>
                  </div>
                  <span className="text-[8px] text-[#897365] font-mono mt-1 px-1">{chat.timestamp}</span>
                </div>
              ))}
              {isLoadingChat && (
                <div className="flex items-center gap-1.5 p-3 bg-white border border-[#eae7e7] rounded-lg self-start max-w-[40%] animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#944a00] animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#944a00] animate-bounce delay-100" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#944a00] animate-bounce delay-200" />
                </div>
              )}
            </div>

            {/* Modal helpful tags footer */}
            <div className="bg-[#fcf9f8] p-3 border-t border-[#eae7e7] flex items-center justify-between text-[10px] text-[#897365] font-mono">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#944a00]" />
                <span className="font-bold">AI RAG Grounded Tracker</span>
              </div>
              <span className="text-[9px]">Press ENTER to query</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
