import React from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  Clock,
  Compass
} from "lucide-react";

// Mock data for Zen Graph (Stress/Work ratio vs Recovery days)
const ZEN_GRAPH_DATA = [
  { name: "Jul 01", stressLevel: 65, restTime: 10, label: "Work Block" },
  { name: "Jul 15", stressLevel: 80, restTime: 5, label: "Stress Peak" },
  { name: "Jul 20", stressLevel: 30, restTime: 90, label: "Short Rest Weekend" },
  { name: "Aug 05", stressLevel: 85, restTime: 0, label: "On Call" },
  { name: "Aug 20", stressLevel: 90, restTime: 10, label: "Burnout Risk Zone" },
  { name: "Sep 10", stressLevel: 45, restTime: 30, label: "Normal Working" },
  { name: "Oct 12", stressLevel: 10, restTime: 95, label: "Projected Coimbatore Trip (9 days of Rest)" },
  { name: "Nov 01", stressLevel: 40, restTime: 50, label: "Steady State" }
];

export const DashboardView: React.FC = () => {
  const { user, leaveBalances, setTab, generateItinerary } = useLeaveStore();

  const handleExploreNudge = () => {
    generateItinerary("Coimbatore");
    setTab("itinerary");
  };

  return (
    <div id="dashboard-wrapper" className="space-y-6 animate-fade-in font-sans pb-12 select-none relative z-10">
      
      {/* 1. Professional Modern Workspace Header */}
      <div id="dashboard-toolbar" className="lumina-glass rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[10px] font-mono font-bold text-[#944a00] uppercase tracking-widest block font-bold">Core Optimization Board</span>
          <h2 className="text-2xl font-display font-extrabold text-[#1c1b1b] tracking-tight">Leave Sandbox &amp; Optimizer</h2>
          <p className="text-xs text-[#564337] font-medium">Verify balances, request policy guidelines, and map vacation sequences seamlessly.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-white/85 border border-[#eae7e7] px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#00b05c]" />
            <span className="text-[#1c1b1b] font-bold">92% Optimized</span>
          </div>
        </div>
      </div>

      {/* 2. Sleek Modern Dark Accent Banner */}
      <div id="dashboard-ai-nudge" className="relative p-6 bg-[#191919] rounded-2xl text-white shadow-lg overflow-hidden border border-[#564337]/25">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#944a00]/20 border border-[#944a00]/40 text-[10px] font-mono font-bold text-[#ffdcc5] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#ffb783]" />
              <span>Smart Fatigue Analysis</span>
            </div>
            <h3 className="text-xl font-display font-black tracking-tight text-white leading-tight">Potential Fatigue Threshold Exceeded</h3>
            <p className="text-[#e5e2e1] text-[12.5px] leading-relaxed font-normal">
              An optimal <strong className="text-white font-bold">9-day high-efficiency vacation window</strong> is available during 
              <span className="text-[#ffb783] font-semibold"> October Dussehra Holidays </span>. 
              By utilizing only <strong className="text-white">2 Earned Leaves</strong> combined with fixed regional holidays, you unlock a continuous 9-day active recovery sequence automatically.
            </p>
          </div>

          <button
            id="dashboard-btn-explore-nudge"
            onClick={handleExploreNudge}
            className="px-5 py-3 bg-[#944a00] hover:bg-[#e67e22] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start lg:self-auto cursor-pointer shadow-md active:translate-y-0.5 shrink-0"
          >
            <Compass className="w-4 h-4 text-white" />
            <span>Auto-Generate Coimbatore Blueprint</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* 3. Bento Grid Leave Balances */}
      <div id="dashboard-bento-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bento Card 1: Earned Leave Progress */}
        <div id="bento-earned-leave" className="lumina-glass p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-[#944a00]/40 transition-colors duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider">Balance Panel</span>
              <h4 className="text-sm font-bold text-[#1c1b1b]">Earned Leave Reserve</h4>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#fcf9f8] border border-[#eae7e7] flex items-center justify-center text-[#944a00]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#1c1b1b] font-mono">{leaveBalances.earnedLeave}</span>
              <span className="text-[10px] font-mono text-[#897365]">/ {leaveBalances.earnedLeaveMax} Max Pool</span>
            </div>
            {/* Standard Rounded fine progress bar */}
            <div className="w-full h-2 bg-[#eae7e7] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#944a00] to-[#e67e22] rounded-full" 
                style={{ width: `${(leaveBalances.earnedLeave / leaveBalances.earnedLeaveMax) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-[#564337] leading-relaxed border-t border-[#eae7e7] pt-2.5 font-normal">
            Leaves carry over. Accumulations above <strong className="text-[#1c1b1b]">40 days fall off</strong> automatically. Rest is crucial.
          </div>
        </div>

        {/* Bento Card 2: Casual / Sick Leave */}
        <div id="bento-casual-leave" className="lumina-glass p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-[#944a00]/40 transition-colors duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider">Priority Burn</span>
              <h4 className="text-sm font-bold text-[#1c1b1b]">Casual &amp; Sick (CL/SL)</h4>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#fcf9f8] border border-[#eae7e7] flex items-center justify-center text-[#795900]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-[#1c1b1b] font-mono">{leaveBalances.clCount + leaveBalances.slCount}</span>
              <span className="text-[13px] text-[#564337] font-medium">Allocated Days Left</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] mt-1.5 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbf00]" />
                <span className="text-[#564337]">{leaveBalances.clCount} Casual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#944a00]" />
                <span className="text-[#564337]">6 Sick</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-[#ba1a1a]/5 rounded-xl border border-[#ba1a1a]/15 flex gap-1.5 items-start">
            <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#93000a] leading-relaxed font-sans font-medium">
              CL/SL balances lapse in December. Prioritize burning these before Earned Leave.
            </p>
          </div>
        </div>

        {/* Bento Card 3: Comp-Off Expiry Countdown */}
        <div id="bento-compoff-leave" className="lumina-glass p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-[#944a00]/40 transition-colors duration-200">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider">Expiration Loop</span>
              <h4 className="text-sm font-bold text-[#1c1b1b]">Weekend Comp-Offs</h4>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#fcf9f8] border border-[#eae7e7] flex items-center justify-center text-[#006d37]">
              <RefreshCw className="w-4 h-4 animate-spin-slow text-[#00b05c]" />
            </div>
          </div>

          <div className="flex items-center gap-4 animate-fade-in">
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#f0eded]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#00b05c]"
                  strokeWidth="3.5"
                  strokeDasharray="50, 100"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-[#1c1b1b] leading-none font-mono">{leaveBalances.compOffCount}</span>
                <span className="text-[7.5px] text-[#897365] uppercase tracking-wider mt-0.5 font-bold">Qty</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-[#1c1b1b] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#00b05c]" /> Expiry Alert:
              </span>
              <p className="text-[10px] text-[#ba1a1a] font-bold font-mono uppercase tracking-tight">Expiring in 45 days</p>
              <p className="text-[9.5px] text-[#897365] leading-tight">Must claim swap within 90 days of work schedule.</p>
            </div>
          </div>

          <div className="text-[11px] text-[#564337] leading-relaxed border-t border-[#eae7e7] pt-2.5">
            Claimable automatically. Sync with the regional calendar on the sidebar.
          </div>
        </div>

      </div>

      {/* 4. Zen Stress Graph */}
      <div id="bento-zen-graph" className="lumina-glass p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider">Inspection Canvas</span>
            <h3 className="text-base font-bold text-[#1c1b1b] tracking-tight flex items-center gap-2 mt-0.5">
              <TrendingUp className="w-4.5 h-4.5 text-[#944a00]" />
              <span>Stress Index Vs. Travel Restoration Arc</span>
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#944a00]" />
              <span className="text-[#564337] text-[10px]">Stress Score (1-100)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#00b05c]" />
              <span className="text-[#564337] text-[10px]">Rest recovery Index (%)</span>
            </div>
          </div>
        </div>

        {/* Recharts container styled as custom grid */}
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ZEN_GRAPH_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#897365" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#897365" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#191919] text-white p-3.5 rounded-xl text-[10.5px] space-y-1.5 shadow-xl border border-[#eae7e7]/10">
                        <p className="font-bold text-white font-sans">{data.name}</p>
                        <p className="font-mono text-[#ffb783]">Stress: {data.stressLevel}%</p>
                        <p className="font-mono text-[#00b05c]">Rest Factor: {data.restTime}%</p>
                        <p className="text-[8.5px] text-[#ffb783] uppercase tracking-wider font-bold mt-1 bg-white/10 px-1.5 py-0.5 rounded border border-white/5">{data.label}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="stressLevel" 
                stroke="#944a00" 
                fillOpacity={0.06} 
                fill="url(#colorStress)" 
                strokeWidth={1.5}
              />
              <Area 
                type="monotone" 
                dataKey="restTime" 
                stroke="#00b05c" 
                fillOpacity={0.08} 
                fill="url(#colorRest)" 
                strokeWidth={1.5}
              />
              <defs>
                <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#944a00" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#944a00" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b05c" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#00b05c" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#f6f3f2] p-3.5 rounded-xl border border-[#eae7e7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="text-[#564337] font-normal leading-relaxed font-sans font-medium">
            💡 <strong className="text-[#1c1b1b]">Precision Intelligence:</strong> Rest holds above 80% with sustained stress scores under 40% during offgrid times. Generating the destination travel blueprint restores stress down to 10% instantly.
          </div>
          <button 
            onClick={() => setTab("calendar")}
            className="text-[#944a00] font-bold hover:text-[#e67e22] shrink-0 flex items-center gap-1 cursor-pointer hover:underline text-[11px] font-mono uppercase tracking-wide"
          >
            <span>Launch Canvas Grid</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>

    </div>
  );
};
