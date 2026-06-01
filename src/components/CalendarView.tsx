import React, { useState, useEffect, useMemo } from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { REGIONAL_HOLIDAYS_2026, HolidayEntry } from "../data/leavePolicy";
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Info, MapPin, Zap, ChevronDown, Award } from "lucide-react";

export const CalendarView: React.FC = () => {
  const {
    user,
    activeHolidaySwaps,
    swapHoliday,
    resetSwaps,
  } = useLeaveStore();

  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // start at October 2026
  
  // Storing clicked dates as YYYY-MM-DD
  const [clickedDates, setClickedDates] = useState<Set<string>>(new Set(["2026-10-12", "2026-10-13"]));

  const regionalHolidays = useMemo(() => {
    return REGIONAL_HOLIDAYS_2026.filter((h) => h.regions.includes(user.location));
  }, [user.location]);

  const toggleDateSelection = (dateString: string) => {
    const d = new Date(dateString);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return; // Prevent clicking on weekends
    
    // Check if fixed holiday
    const isFixed = regionalHolidays.some(h => h.date === dateString && h.type === 'Fixed');
    if (isFixed) return;

    setClickedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateString)) next.delete(dateString);
      else next.add(dateString);
      return next;
    });
  };

  const getDayMeta = (dateString: string, d: Date) => {
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holiday = regionalHolidays.find(h => h.date === dateString);
    const isFixedHoliday = holiday?.type === "Fixed";
    const isAppliedLeave = clickedDates.has(dateString);
    return { isWeekend, isFixedHoliday, isAppliedLeave, holiday };
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else {
      setCurrentDate(new Date(currentYear - 1, currentMonth, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else {
      setCurrentDate(new Date(currentYear + 1, currentMonth, 1));
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1));
  };

  const renderMonthGrid = (year: number, month: number, isMini = false) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });

    return (
      <div className={`flex flex-col ${isMini ? 'space-y-1' : 'space-y-3'} w-full`}>
        {isMini && <h4 className="text-sm font-bold text-[#1c1b1b] text-center mb-1">{monthName}</h4>}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysOfWeek.map(day => (
             <div key={day} className={`${isMini ? 'text-[8px]' : 'text-[10px] pb-2 border-b'} font-extrabold font-mono text-[#897365] uppercase tracking-widest border-[#eae7e7]`}>
              {isMini ? day[0] : day}
            </div>
          ))}
        </div>
        <div className={`grid grid-cols-7 ${isMini ? 'gap-1' : 'gap-2'}`}>
          {Array.from({ length: startDay }).map((_, i) => (
             <div key={`empty-${i}`} className={`${isMini ? 'h-5' : 'h-11 sm:h-13'} bg-transparent rounded-lg`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const d = new Date(year, month, dayNum);
            const { isWeekend, isFixedHoliday, isAppliedLeave } = getDayMeta(dateString, d);

            let dayBg = isMini ? "bg-white border-[#eae7e7]" : "bg-white border border-[#eae7e7] hover:border-[#944a00]/40 hover:bg-[#fcf9f8] shadow-sm";
            let dayText = "text-[#1c1b1b] font-medium";

            if (isFixedHoliday) {
              dayBg = isMini ? "bg-[#00b05c]/20" : "bg-[#00b05c]/10 border-[#00b05c]/30 shadow-none";
              dayText = isMini ? "text-[#006d37]" : "text-[#006d37] font-black";
            } else if (isAppliedLeave) {
              dayBg = "bg-[#944a00] shadow-sm";
              dayText = "text-white";
            } else if (isWeekend) {
              dayBg = isMini ? "bg-transparent" : "bg-[#f0eded]/45 border border-[#eae7e7]/50";
              dayText = isMini ? "text-[#897365]" : "text-[#897365] font-medium";
            }

            if (isMini) {
               return (
                 <button
                   key={dateString}
                   onClick={() => {
                     setCurrentDate(new Date(year, month, 1));
                     setViewMode('month');
                   }}
                   className={`h-5 w-full rounded-md text-[9px] flex items-center justify-center transition-all cursor-pointer ${dayBg} ${dayText} ${!isWeekend && !isFixedHoliday && !isAppliedLeave ? 'hover:bg-stone-100 border border-stone-200' : ''}`}
                 >
                   {dayNum}
                 </button>
               )
            }

            return (
              <button
                key={dateString}
                onClick={() => toggleDateSelection(dateString)}
                className={`h-11 sm:h-13 rounded-lg text-[10px] sm:text-[11px] flex flex-col justify-between p-1.5 sm:p-2 transition-all text-left group relative cursor-pointer ${dayBg} transform hover:-translate-y-0.5 duration-150`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`font-mono font-extrabold ${dayText}`}>{dayNum}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAppliedLeave ? 'bg-white' : isFixedHoliday ? 'bg-[#00b05c]' : 'bg-transparent'}`} />
                </div>
                <div className="flex items-center justify-between w-full mt-auto">
                  {isFixedHoliday && <span className="text-[7px] font-sans leading-none font-bold block uppercase truncate max-w-full tracking-wider opacity-90">Holiday</span>}
                  {isAppliedLeave && <span className="text-[7px] font-sans font-extrabold border border-white/40 px-1 py-0.2 rounded block uppercase tracking-wider bg-white/10">Active</span>}
                  {!isFixedHoliday && !isAppliedLeave && isWeekend && <span className="text-[7px] font-mono opacity-50 tracking-wide font-normal">WND</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="calendar-wrapper" className="space-y-6 animate-fade-in font-sans pb-16 select-none w-full relative z-10">
      
      {/* Sleek Header */}
      <div id="calendar-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#eae7e7] p-4 md:p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-[#fcf9f8] rounded-xl shrink-0 border border-[#eae7e7]">
             <CalendarIcon className="w-5 h-5 text-[#944a00]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1c1b1b] tracking-tight">Time Off Sandbox</h2>
            <p className="text-xs text-[#564337] mt-0.5 font-medium">Smart planning engine based on regional policies.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggles */}
          <div className="flex p-1 bg-[#f0eded]/60 rounded-xl border border-[#eae7e7]">
            <button
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-[#1c1b1b]' : 'text-[#897365] hover:text-[#1c1b1b]'}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'year' ? 'bg-white shadow-sm text-[#1c1b1b]' : 'text-[#897365] hover:text-[#1c1b1b]'}`}
              onClick={() => setViewMode('year')}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Main Calendar View Area */}
        <div className="xl:col-span-8 bg-white border border-[#eae7e7] p-5 md:p-6 rounded-2xl flex flex-col space-y-6 shadow-sm">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex items-center gap-2">
               <button onClick={handlePrev} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors">
                 <ArrowLeft className="w-4 h-4" />
               </button>
               <h3 className="text-lg font-bold text-[#1c1b1b] min-w-[140px] text-center">
                 {viewMode === 'month' ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : currentDate.getFullYear()}
               </h3>
               <button onClick={handleNext} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors">
                 <ArrowRight className="w-4 h-4" />
               </button>
             </div>

             {/* Selectors */}
             <div className="flex gap-2">
               {viewMode === 'month' && (
                 <select 
                   value={currentMonth} 
                   onChange={handleMonthChange}
                   className="appearance-none text-xs font-bold text-[#1c1b1b] bg-[#fcf9f8] border border-[#eae7e7] rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-[#944a00]"
                 >
                   {Array.from({length: 12}).map((_, i) => (
                     <option key={i} value={i}>{new Date(2000, i, 1).toLocaleString('default', { month: 'short' })}</option>
                   ))}
                 </select>
               )}
               <select
                 value={currentYear}
                 onChange={handleYearChange}
                 className="appearance-none text-xs font-bold text-[#1c1b1b] bg-[#fcf9f8] border border-[#eae7e7] rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-[#944a00]"
               >
                 <option value={2025}>2025</option>
                 <option value={2026}>2026</option>
                 <option value={2027}>2027</option>
               </select>
             </div>
          </div>

          {viewMode === 'month' ? (
             renderMonthGrid(currentYear, currentMonth)
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
               {Array.from({ length: 12 }).map((_, i) => (
                 <div key={i} className="hover:scale-[1.02] transition-transform">
                   {renderMonthGrid(currentYear, i, true)}
                 </div>
               ))}
             </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#eae7e7] text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#944a00]" />
              <span className="text-[#1c1b1b] font-bold">Leave Applied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-zinc-200" />
              <span className="text-[#564337] font-semibold">Work Day / Weekend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#00b05c]" />
              <span className="text-[#006d37] font-semibold">Fixed Holiday</span>
            </div>
          </div>

        </div>

        {/* Right Column: Swap Control Board */}
        <div className="xl:col-span-4 flex flex-col space-y-6">
          
          {/* Quick Metrics */}
          <div className="bg-gradient-to-br from-[#1c1b1b] to-stone-900 border border-stone-800 p-5 rounded-2xl flex items-center justify-between shadow-sm text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                <Award className="w-5 h-5 text-[#ffbf00]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">Efficiency Index</span>
                <p className="font-bold text-white mt-1">Leaves Used: {clickedDates.size}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#eae7e7] p-5 rounded-2xl flex flex-col space-y-5 shadow-sm xl:sticky xl:top-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#1c1b1b] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#944a00]" />
                Public Holiday Swap
              </h3>
              <p className="text-[#564337] text-xs font-medium">
                Exchange up to two regional fixed holidays with floater options to suit your personal schedule.
              </p>
            </div>

            <div className="space-y-3">
               <div className="text-[10px] font-mono font-bold text-[#564337] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#eae7e7] pb-2">
                 <MapPin className="w-3.5 h-3.5 text-[#944a00]" />
                 {user.location} Holidays ({currentYear})
               </div>
               
               <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                 {regionalHolidays.filter(h => h.date.startsWith(currentYear.toString())).length === 0 ? (
                    <div className="py-4 text-center text-xs text-stone-400 font-medium">No region holidays recorded for this year.</div>
                 ) : regionalHolidays.filter(h => h.date.startsWith(currentYear.toString())).map((holiday) => {
                   const swappedWith = activeHolidaySwaps[holiday.date];
                   return (
                     <div key={holiday.date} className="p-3 bg-[#fcf9f8] border border-[#eae7e7] rounded-xl flex flex-col space-y-2 text-xs">
                       <div className="flex items-start justify-between">
                         <div className="min-w-0 pr-2">
                           <span className="font-bold text-[#1c1b1b] block truncate">{holiday.name}</span>
                           <span className="text-[10px] font-mono text-[#897365] mt-0.5 block">{holiday.date}</span>
                         </div>
                         <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold shrink-0 ${
                           holiday.type === 'Fixed' ? "bg-white border border-stone-200 text-[#1c1b1b]" : "bg-[#00b05c]/10 text-[#006d37]"
                          }`}>
                           {holiday.type}
                         </span>
                       </div>

                       {holiday.type === 'Fixed' && (
                         <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#eae7e7]/60">
                           <span className="text-[9px] text-[#897365] font-bold uppercase tracking-wider font-mono">Swap:</span>
                           {swappedWith ? (
                             <div className="flex items-center gap-1 font-bold text-[#006d37] bg-[#00b05c]/10 px-2 py-1 rounded text-[10px]">
                               <span>{swappedWith}</span>
                               <button 
                                 onClick={resetSwaps} 
                                 className="text-[#006d37] hover:text-[#004d27] font-bold ml-1 text-sm leading-none"
                               >
                                 &times;
                               </button>
                             </div>
                           ) : (
                             <div className="relative flex items-center shrink-0">
                               <select
                                 value={swappedWith || ""}
                                 onChange={(e) => {
                                     if (e.target.value) swapHoliday(holiday.date, e.target.value);
                                 }}
                                 className="appearance-none text-[10px] font-bold text-[#1c1b1b] bg-white border border-[#eae7e7] rounded-lg px-2 py-1.5 pr-6 cursor-pointer focus:outline-none focus:border-[#944a00] w-28 sm:w-32"
                               >
                                 <option value="">Floater...</option>
                                 {REGIONAL_HOLIDAYS_2026.filter((h) => h.type === "Floater").map((opt) => (
                                   <option key={opt.name} value={opt.name}>
                                     {opt.name}
                                   </option>
                                 ))}
                               </select>
                               <ChevronDown className="w-3 h-3 absolute right-2 pointer-events-none text-stone-400" />
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
            </div>

            <div className="p-3 bg-[#fcf9f8] border border-[#eae7e7] rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#564337] font-medium flex items-center gap-1.5 font-bold">
                <Info className="w-3.5 h-3.5 text-[#795900]" />
                Swaps Done
              </span>
              <span className="font-mono font-bold text-[#1c1b1b] bg-white px-2.5 py-1 rounded-lg border border-[#eae7e7] text-[10px]">
                {Object.keys(activeHolidaySwaps).length} / 2
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
