import React from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { Sparkles, ArrowLeft, ArrowUpRight } from "lucide-react";

export const SharedItineraryView: React.FC = () => {
  const { currentTripLocation, setTab, itinerary } = useLeaveStore();

  return (
    <div id="shared-page-container" className="min-h-screen bg-[#fcf9f8] font-sans p-4 sm:p-6 flex flex-col items-center select-none pb-12">
      
      {/* Back to admin app dashboard link (since we render it inside the preview for sandbox experience) */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center text-xs">
        <button
          onClick={() => setTab("profile")}
          className="flex items-center gap-1 text-[#564337] hover:text-[#1c1b1b] font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Travel Report</span>
        </button>
        <span className="font-mono text-[#897365] bg-[#eae7e7] px-2.5 py-0.5 rounded text-[10px]">SHARED PREVIEW</span>
      </div>

      {/* Styled Mobile Simulator Frame Card */}
      <div id="shared-mock-mobile" className="w-full max-w-md bg-white border border-[#eae7e7] rounded-3xl shadow-lg overflow-hidden flex flex-col justify-between">
        
        {/* Top Header Card info */}
        <div className="relative p-6 bg-stone-950 text-white space-y-3.5 text-left">
          {/* Decorative neon streak */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#944a00]/30 blur-xl rounded-full" />
          
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-black text-[#ffbf00] tracking-widest uppercase">Shared Itinerary Preview</span>
            <span className="text-[9px] font-mono bg-[#ffbf00]/15 text-[#ffbf00] border border-[#ffbf00]/20 px-2 py-0.5 rounded font-bold uppercase">
              4.5x LOP ROI
            </span>
          </div>

          <div className="space-y-0.5">
            <h3 className="text-xl font-bold font-sans tracking-tight text-white">{currentTripLocation} Retreat</h3>
            <p className="text-xs text-stone-450 font-mono">Oct 12 &mdash; Oct 20 &bull; Continuous Rest Cycle</p>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-stone-300">Time Off Magic:</span>
            <span className="font-bold text-[#ffbf00] font-sans">9 Days Off / 2 Leaves Used</span>
          </div>
        </div>

        {/* Timeline Activities List */}
        <div id="shared-timeline-body" className="p-5 flex-1 min-h-[300px] overflow-y-auto space-y-6">
          <span className="text-[10px] font-mono font-bold text-[#897365] uppercase tracking-wider block mb-2 text-left">Hour-by-Hour Highlights</span>
          
          <div className="space-y-6 relative pl-1 text-left">
            {itinerary.map((day) => (
              <div key={day.dayNumber} className="space-y-3">
                {/* Day divider badge */}
                <div className="flex items-baseline gap-2 border-b border-[#eae7e7] pb-1.5">
                  <span className="text-xs font-black text-[#1c1b1b]">{day.dateStr}</span>
                  <span className="text-[10px] text-[#944a00] font-bold uppercase tracking-wide">{day.title}</span>
                </div>

                {/* Day highlights list */}
                <div className="space-y-2">
                  {day.activities.slice(0, 2).map((act) => (
                    <div key={act.id} className="p-3 bg-[#fcf9f8] border border-[#eae7e7] rounded-xl space-y-1 text-left">
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="text-[9px] font-mono font-bold text-stone-600 bg-[#f0eded] px-1.5 py-0.5 rounded leading-none">{act.time}</span>
                        <span className="text-[9px] font-mono opacity-65 text-[#564337]">{act.category}</span>
                      </div>
                      <h5 className="text-xs font-bold text-[#1c1b1b] leading-tight mt-1">{act.title}</h5>
                      <p className="text-[10px] text-[#564337] leading-normal font-sans font-medium">{act.description}</p>
                    </div>
                  ))}
                  {day.activities.length > 2 && (
                    <div className="text-center text-[10px] text-[#897365] font-mono italic">
                      + {day.activities.length - 2} more afternoon &amp; evening activities scheduled
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth-loop CTA container section */}
        <div className="p-5 bg-stone-950 text-white border-t border-white/5 space-y-3 text-center">
          <div className="space-y-1 text-center">
            <h4 className="text-sm font-bold tracking-tight text-white font-sans flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#ffbf00]" />
              <span>Optimize Your Corporate Leaves</span>
            </h4>
            <p className="text-[11px] text-stone-400 font-sans leading-normal">
              Unlock maximum long weekend streaks. Save accrued balances with absolute policy compliance automatically.
            </p>
          </div>

          <button
            onClick={() => setTab("gateway")}
            className="w-full py-2.5 bg-[#944a00] hover:bg-[#e67e22] transition-colors rounded-md text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm uppercase tracking-wide"
          >
            <span>Get Started Free</span>
            <ArrowUpRight className="w-4 h-4 text-[#ffdcc5]" />
          </button>
        </div>

      </div>

    </div>
  );
};
