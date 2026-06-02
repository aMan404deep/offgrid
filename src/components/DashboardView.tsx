import React from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { REGIONAL_HOLIDAYS_2026 } from "../data/leavePolicy";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  Cell
} from "recharts";
import { 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  Clock,
  Compass,
  Plus,
  Minus,
  Activity,
  CheckCircle2
} from "lucide-react";

// Mock data for Zen Graph (Stress/Work ratio vs Recovery days)
export const DashboardView: React.FC = () => {
  const { user, leaveBalances, setTab, generateItinerary, currentTripLocation } = useLeaveStore();

  // Interactive Calendar Year Leave Simulation & Optimizer state
  const [simulatedLeaves, setSimulatedLeaves] = React.useState({
    earnedLeave: 0,
    cl: 0,
    sl: 0,
    compOff: 0
  });

  const [chartType, setChartType] = React.useState<'stacked' | 'grouped'>('stacked');

  const [isOptimizing, setIsOptimizing] = React.useState(false);
  const [optimizedSuggestion, setOptimizedSuggestion] = React.useState<{
    title: string;
    description: React.ReactNode;
    days: number;
    leavesUsed: number;
    dates: string;
  } | null>(null);

  const handleOptimizeRest = () => {
    setIsOptimizing(true);
    
    setTimeout(() => {
      let bestWindow = { leavesNeeded: 999, start: new Date(), end: new Date(), days: 0, holidayNames: [] as string[] };
      const regionalHolidays = REGIONAL_HOLIDAYS_2026.filter((h) => h.regions.includes(user.location) && h.type === 'Fixed');
      
      const year = 2026;
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 6) continue; // Start on a Saturday
        
        for (let length of [4, 5, 9, 10, 11]) { // E.g., 9-day window (Sat to next Sun)
          const wStart = new Date(d);
          const wEnd = new Date(wStart);
          wEnd.setDate(wStart.getDate() + length - 1);
          
          let leavesNeeded = 0;
          let hNames = new Set<string>();
          for (let curr = new Date(wStart); curr <= wEnd; curr.setDate(curr.getDate() + 1)) {
            const dow = curr.getDay();
            const dateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
            const isWeekend = dow === 0 || dow === 6;
            const hol = regionalHolidays.find(h => h.date === dateStr);
            if (hol) hNames.add(hol.name);
            
            if (!isWeekend && !hol) {
              leavesNeeded++;
            }
          }
          
          if (hNames.size > 0 && leavesNeeded > 0 && leavesNeeded <= leaveBalances.earnedLeave) {
            const currentRatio = bestWindow.leavesNeeded === 999 ? 0 : bestWindow.days / bestWindow.leavesNeeded;
            const newRatio = length / leavesNeeded;
            
            if (newRatio > currentRatio || (newRatio === currentRatio && length > bestWindow.days)) {
              bestWindow = { 
                 leavesNeeded, 
                 start: new Date(wStart), 
                 end: new Date(wEnd), 
                 days: length, 
                 holidayNames: Array.from(hNames) 
              };
            }
          }
        }
      }

      if (bestWindow.leavesNeeded !== 999) {
        const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        setOptimizedSuggestion({
          title: "Strategic Holiday Bridge Found",
          description: (
            <span>
              An optimal <strong className="text-white font-bold">{bestWindow.days}-day high-efficiency vacation window</strong> is available around the <span className="text-[#ffb783] font-semibold">{bestWindow.holidayNames.join(' & ')} Holidays</span>. By utilizing only <strong className="text-white">{bestWindow.leavesNeeded} Earned Leave{bestWindow.leavesNeeded > 1 ? 's' : ''}</strong> combined with fixed regional holidays and weekends, you unlock a continuous {bestWindow.days}-day active recovery sequence perfectly tailored for {user.location}.
            </span>
          ),
          days: bestWindow.days,
          leavesUsed: bestWindow.leavesNeeded,
          dates: `${bestWindow.start.toLocaleDateString(undefined, formatOptions)} - ${bestWindow.end.toLocaleDateString(undefined, formatOptions)}`
        });
      } else {
        setOptimizedSuggestion({
          title: "Optimal Strategy Currently Unavailable",
          description: (
             <span>
               No highly efficient bridge windows were found based on your current location ({user.location}) and leave balances. Try exploring a shorter micro-trip or check the calendar for floater holiday swaps.
             </span>
          ),
          days: 0,
          leavesUsed: 0,
          dates: "Review Balance"
        });
      }
      setIsOptimizing(false);
    }, 1500);
  };

  const handleExploreNudge = () => {
    generateItinerary(currentTripLocation);
    setTab("itinerary");
  };

  const dynamicGraphData = [
    { name: "Jul 01", stressLevel: 65, restTime: 10, label: "Work Block" },
    { name: "Jul 15", stressLevel: 80, restTime: 5, label: "Stress Peak" },
    { name: "Jul 20", stressLevel: 30, restTime: 90, label: "Short Rest Weekend" },
    { name: "Aug 05", stressLevel: 85, restTime: 0, label: "On Call" },
    { name: "Aug 20", stressLevel: 90, restTime: 10, label: "Burnout Risk Zone" },
    { name: "Sep 10", stressLevel: 45, restTime: 30, label: "Normal Working" },
    { name: "Oct 12", stressLevel: 10, restTime: 95, label: `Projected ${currentTripLocation} Trip` },
    { name: "Nov 01", stressLevel: 40, restTime: 50, label: "Steady State" }
  ];

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
          {!optimizedSuggestion ? (
            <>
              <div className="space-y-2.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#944a00]/20 border border-[#944a00]/40 text-[10px] font-mono font-bold text-[#ffdcc5] uppercase tracking-wider">
                  <Activity className="w-3 h-3 text-[#ffb783]" />
                  <span>Leave Optimizer</span>
                </div>
                <h3 className="text-xl font-display font-black tracking-tight text-white leading-tight">Maximize your continuous time off</h3>
                <p className="text-[#e5e2e1] text-[12.5px] leading-relaxed font-normal">
                  Our system can analyze your current <strong className="text-white font-bold">{leaveBalances.earnedLeave} Earned Leaves</strong> and cross-reference them with regional public holidays to find the most efficient multi-day vacation windows.
                </p>
              </div>

              <button
                id="btn-optimize-rest"
                onClick={handleOptimizeRest}
                disabled={isOptimizing}
                className="px-5 py-3 bg-[#944a00] hover:bg-[#e67e22] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start lg:self-auto cursor-pointer shadow-md active:translate-y-0.5 shrink-0"
              >
                {isOptimizing ? <RefreshCw className="w-4 h-4 text-white animate-spin" /> : <Sparkles className="w-4 h-4 text-white" />}
                <span>{isOptimizing ? "Analyzing Calendar..." : "Optimize Rest Sequence"}</span>
              </button>
            </>
          ) : (
            <>
              <div className="space-y-2.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#944a00]/20 border border-[#944a00]/40 text-[10px] font-mono font-bold text-[#ffdcc5] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-[#ffb783]" />
                  <span>Smart Fatigue Analysis</span>
                </div>
                <h3 className="text-xl font-display font-black tracking-tight text-white leading-tight">{optimizedSuggestion.title}</h3>
                <p className="text-[#e5e2e1] text-[12.5px] leading-relaxed font-normal">
                  {optimizedSuggestion.description}
                </p>
              </div>

              <button
                id="dashboard-btn-explore-nudge"
                onClick={handleExploreNudge}
                className="px-5 py-3 bg-[#944a00] hover:bg-[#e67e22] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-start lg:self-auto cursor-pointer shadow-md active:translate-y-0.5 shrink-0"
              >
                <Compass className="w-4 h-4 text-white" />
                <span>Auto-Generate {currentTripLocation} Blueprint</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </>
          )}
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

          <div className="space-y-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-3xl font-black text-[#1c1b1b] font-mono">{leaveBalances.earnedLeave}</span>
              <span className="text-[10px] font-mono text-[#897365]">Remaining Balance</span>
            </div>
            
            {/* Used vs Remaining Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-medium text-[#897365]">
                <span>8 Used</span>
                <span>{8 + leaveBalances.earnedLeave} Total</span>
              </div>
              <div className="w-full h-2.5 flex rounded-full overflow-hidden bg-[#eae7e7]">
                <div 
                  className="h-full bg-stone-500" 
                  style={{ width: `${(8 / (8 + leaveBalances.earnedLeave)) * 100}%` }}
                  title="Used Leaves"
                />
                <div 
                  className="h-full bg-gradient-to-r from-[#944a00] to-[#e67e22]" 
                  style={{ width: `${(leaveBalances.earnedLeave / (8 + leaveBalances.earnedLeave)) * 100}%` }}
                  title="Remaining Leaves"
                />
              </div>
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

      {/* 3.5 Dynamic Leave Consumption & Simulation Chart */}
      {(() => {
        const simEL_Remaining = Math.max(0, leaveBalances.earnedLeave - simulatedLeaves.earnedLeave);
        const simEL_Used = 8 + simulatedLeaves.earnedLeave;
        const simEL_Overdrawn = Math.max(0, simulatedLeaves.earnedLeave - leaveBalances.earnedLeave);

        const simCL_Remaining = Math.max(0, leaveBalances.clCount - simulatedLeaves.cl);
        const simCL_Used = 6 + simulatedLeaves.cl;
        const simCL_Overdrawn = Math.max(0, simulatedLeaves.cl - leaveBalances.clCount);

        const simSL_Remaining = Math.max(0, leaveBalances.slCount - simulatedLeaves.sl);
        const simSL_Used = 4 + simulatedLeaves.sl;
        const simSL_Overdrawn = Math.max(0, simulatedLeaves.sl - leaveBalances.slCount);

        const simCO_Remaining = Math.max(0, leaveBalances.compOffCount - simulatedLeaves.compOff);
        const simCO_Used = 3 + simulatedLeaves.compOff;
        const simCO_Overdrawn = Math.max(0, simulatedLeaves.compOff - leaveBalances.compOffCount);

        const leaveChartData = [
          {
            name: "Earned Leaves",
            "Used So Far": 8,
            "Simulated Request": simulatedLeaves.earnedLeave - simEL_Overdrawn,
            "Remaining Balance": simEL_Remaining,
            "Overdraft Days": simEL_Overdrawn,
            total: 8 + leaveBalances.earnedLeave
          },
          {
            name: "Casual Leaves",
            "Used So Far": 6,
            "Simulated Request": simulatedLeaves.cl - simCL_Overdrawn,
            "Remaining Balance": simCL_Remaining,
            "Overdraft Days": simCL_Overdrawn,
            total: 6 + leaveBalances.clCount
          },
          {
            name: "Sick Leaves",
            "Used So Far": 4,
            "Simulated Request": simulatedLeaves.sl - simSL_Overdrawn,
            "Remaining Balance": simSL_Remaining,
            "Overdraft Days": simSL_Overdrawn,
            total: 4 + leaveBalances.slCount
          },
          {
            name: "Comp-Offs",
            "Used So Far": 3,
            "Simulated Request": simulatedLeaves.compOff - simCO_Overdrawn,
            "Remaining Balance": simCO_Remaining,
            "Overdraft Days": simCO_Overdrawn,
            total: 3 + leaveBalances.compOffCount
          }
        ];

        const totalSimulated = simulatedLeaves.earnedLeave + simulatedLeaves.cl + simulatedLeaves.sl + simulatedLeaves.compOff;

        const getZiggyDiagnostic = () => {
          if (totalSimulated === 0) {
            return "Yo! I'm Ziggy, your chill offGrid guide. Click [+] below to simulate taking some leaves! I'll test the balance thresholds and give you some smart feedback.";
          }
          
          if (simEL_Overdrawn > 0 || simCL_Overdrawn > 0 || simSL_Overdrawn > 0 || simCO_Overdrawn > 0) {
            return "Whoa, watch out! You have overdrawn your available balances. 🚨 Taking these dates will result in Loss of Pay (LOP) or require manual HR escalation. Let's optimize a different weekend or request a Holiday Swap first!";
          }
          
          if (simulatedLeaves.cl > 0 && simCL_Remaining === 0) {
            return "Epic match. You fully drained your Casual Leave reserve! CL has a strict 'use-it-or-lose-it' policy by Dec 31st, so this is 100% optimized energy.";
          }

          if (simulatedLeaves.compOff > 0) {
            return "Smart play! Using your Compensatory Offs first protects your Earned Leaves and keeps you clear of the 90-day expiry tracker.";
          }

          if (simulatedLeaves.earnedLeave >= 5) {
            return `Solid wood-vibe planning! 🌲 An EL run of ${simulatedLeaves.earnedLeave} days unlocks deep wellness recovery. I will structure the travel blueprint for matching offGrid days.`;
          }
          
          return `Looking stellar! You've simulated ${totalSimulated} offGrid days. Perfect recovery pacing, and your remaining buffer is perfectly balanced. Let's make it real!`;
        };

        return (
          <div id="leave-consumption-card" className="lumina-glass p-6 rounded-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#eae7e7]/65 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider">Interactive Breakdown</span>
                <h3 className="text-lg font-bold text-[#1c1b1b] tracking-tight flex items-center gap-2">
                  <Activity className="text-[#944a00] w-5 h-5 animate-pulse shrink-0" />
                  <span>Leave Types Used vs. Remaining Balances ({new Date().getFullYear()})</span>
                </h3>
                <p className="text-xs text-[#564337] font-medium leading-relaxed">
                  Analyze calendar year balances, track used quotas, and plan future travel limits with real-time feedback.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#f6f3f2] p-1 rounded-xl border border-[#eae7e7] self-start md:self-auto">
                <button
                  onClick={() => setChartType('stacked')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono uppercase tracking-wide cursor-pointer transition-all duration-150 ${
                    chartType === 'stacked'
                      ? 'bg-white text-stone-900 shadow-sm border border-[#eae7e7]'
                      : 'text-[#897365] hover:text-stone-905'
                  }`}
                >
                  Stacked Quotas
                </button>
                <button
                  onClick={() => setChartType('grouped')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono uppercase tracking-wide cursor-pointer transition-all duration-150 ${
                    chartType === 'grouped'
                      ? 'bg-white text-stone-900 shadow-sm border border-[#eae7e7]'
                      : 'text-[#897365] hover:text-stone-905'
                  }`}
                >
                  Side-by-Side
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Chart Column */}
              <div id="leave-chart-container" className="lg:col-span-8 space-y-4">
                <div className="w-full h-80 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                    <BarChart
                      data={leaveChartData}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#eae7e7" />
                      <XAxis type="number" stroke="#897365" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#897365" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} width={100} />
                      <Tooltip
                        cursor={{ fill: '#eae7e7', fillOpacity: 0.2 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#191919] text-white p-4 rounded-xl shadow-xl text-xs space-y-1.5 border border-white/10 text-left min-w-[200px]">
                                <p className="font-bold border-b border-white/10 pb-1.5 text-sm">{payload[0].payload.name}</p>
                                {payload.map((entry: any, idx) => {
                                  if (entry.value === 0) return null;
                                  return (
                                    <div key={idx} className="flex justify-between items-center gap-4">
                                      <span className="text-[#eae2de] flex items-center gap-1.5 capitalize font-medium">
                                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                                        {entry.name}:
                                      </span>
                                      <span className="font-mono font-bold text-white">{entry.value} days</span>
                                    </div>
                                  );
                                })}
                                <div className="text-[10px] text-stone-400 pt-1 flex justify-between uppercase border-t border-white/5 font-mono">
                                  <span>Total Allocated:</span>
                                  <span className="text-white font-bold">{payload[0].payload.total} days</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle" 
                        iconSize={10}
                        wrapperStyle={{ fontSize: '10.5px', fontFamily: 'monospace', fontWeight: 'bold' }} 
                      />
                      
                      {chartType === 'stacked' ? (
                        <>
                          <Bar dataKey="Used So Far" stackId="a" fill="#d0c9c5" name="Used So Far" />
                          <Bar dataKey="Simulated Request" stackId="a" fill="#ffb783" name="Simulated Days" />
                          <Bar dataKey="Remaining Balance" stackId="a" fill="#00b05c" name="Remaining Balance" />
                          <Bar dataKey="Overdraft Days" stackId="a" fill="#ba1a1a" name="Deficit / LOP" />
                        </>
                      ) : (
                        <>
                          <Bar dataKey="Used So Far" fill="#d0c9c5" name="Used So Far" maxBarSize={14} />
                          <Bar dataKey="Simulated Request" fill="#ffb783" name="Simulated Days" maxBarSize={14} />
                          <Bar dataKey="Remaining Balance" fill="#00b05c" name="Remaining Balance" maxBarSize={14} />
                          <Bar dataKey="Overdraft Days" fill="#ba1a1a" name="Deficit / LOP" maxBarSize={14} />
                        </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Quick Chart Legends/Meta */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono font-bold text-[#897365] bg-[#fcfaf8] p-3 rounded-xl border border-[#eae7e7]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#00b05c] rounded" />
                    <span>Green indicates active available recovery bank.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#ffb783] rounded" />
                    <span>Amber shows simulated/pending vacation projections.</span>
                  </div>
                </div>
              </div>

              {/* Controls & Ziggy's Speech Bubble Column */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                
                {/* Mascot advice bubble */}
                <div id="mascot-calibrator" className="bg-[#191919] text-white p-4 rounded-2xl relative shadow-lg space-y-3.5 border border-[#564337]/35 text-left">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                    {/* SVG Mascot (Ziggy with leaf & sunglasses!) */}
                    <div className="w-10 h-10 rounded-full bg-white border border-stone-800 flex items-center justify-center text-[#1c1b1b] shrink-0">
                      <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
                        <rect x="22" y="28" width="56" height="52" rx="18" fill="#fcfaf8" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M50 28 C50 16 58 12 62 14 C62 20 54 26 50 28Z" fill="#00b05c" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M50 28 C50 20 44 16 40 18 C40 24 46 27 50 28Z" fill="#00b05c" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="30" y="44" width="16" height="12" rx="6" fill="#1c1b1b" stroke="currentColor" strokeWidth="3.5" />
                        <rect x="54" y="44" width="16" height="12" rx="6" fill="#1c1b1b" stroke="currentColor" strokeWidth="3.5" />
                        <path d="M46 48 H54" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                        <path d="M43 62 Q50 71 57 62" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#ffb783] uppercase tracking-wide">Ziggy's Guidance</h4>
                      <p className="text-[9px] text-[#e5e2e1] font-mono">CALIBRATION ENGINE ACTIVE</p>
                    </div>
                  </div>

                  <div className="relative">
                    <p className="text-[12px] leading-relaxed text-stone-100 font-medium">
                      {getZiggyDiagnostic()}
                    </p>
                  </div>

                  {totalSimulated > 0 && (
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-[#ffb783] border-t border-white/10">
                      <span>Total Simulated Days:</span>
                      <span className="font-bold underline">{totalSimulated} Days</span>
                    </div>
                  )}
                </div>

                {/* Simulated Controllers */}
                <div className="bg-white border border-[#eae7e7] p-4 rounded-2xl space-y-3 shadow-sm text-left">
                  <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider block border-b border-[#eae7e7]/50 pb-2">
                    Vacation Simulator
                  </span>

                  {/* Earned Leave Controller */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#1c1b1b]">Earned Leaves</p>
                      <p className="text-[9px] text-[#897365] font-mono">Bal: {simEL_Remaining} left &bull; {simEL_Used} used</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSimulatedLeaves(s => ({ ...s, earnedLeave: Math.max(0, s.earnedLeave - 1) }))}
                        disabled={simulatedLeaves.earnedLeave <= 0}
                        className="w-7 h-7 bg-stone-50 border border-[#eae7e7] text-stone-600 rounded-lg flex items-center justify-center hover:bg-stone-100 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center font-bold font-mono text-xs text-[#1c1b1b]">{simulatedLeaves.earnedLeave}</span>
                      <button
                        onClick={() => setSimulatedLeaves(s => ({ ...s, earnedLeave: s.earnedLeave + 1 }))}
                        className="w-7 h-7 bg-[#944a00] hover:bg-[#e67e22] text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Casual Leave Controller */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#1c1b1b]">Casual Leaves</p>
                      <p className="text-[9px] text-[#897365] font-mono">Bal: {simCL_Remaining} left &bull; {simCL_Used} used</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSimulatedLeaves(s => ({ ...s, cl: Math.max(0, s.cl - 1) }))}
                        disabled={simulatedLeaves.cl <= 0}
                        className="w-7 h-7 bg-stone-50 border border-[#eae7e7] text-stone-600 rounded-lg flex items-center justify-center hover:bg-stone-100 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center font-bold font-mono text-xs text-[#1c1b1b]">{simulatedLeaves.cl}</span>
                      <button
                        onClick={() => setSimulatedLeaves(s => ({ ...s, cl: s.cl + 1 }))}
                        className="w-7 h-7 bg-[#944a00] hover:bg-[#e67e22] text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sick Leave Controller */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#1c1b1b]">Sick Leaves</p>
                      <p className="text-[9px] text-[#897365] font-mono">Bal: {simSL_Remaining} left &bull; {simSL_Used} used</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSimulatedLeaves(s => ({ ...s, sl: Math.max(0, s.sl - 1) }))}
                        disabled={simulatedLeaves.sl <= 0}
                        className="w-7 h-7 bg-stone-50 border border-[#eae7e7] text-stone-600 rounded-lg flex items-center justify-center hover:bg-stone-100 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center font-bold font-mono text-xs text-[#1c1b1b]">{simulatedLeaves.sl}</span>
                      <button
                        onClick={() => setSimulatedLeaves(s => ({ ...s, sl: s.sl + 1 }))}
                        className="w-7 h-7 bg-[#944a00] hover:bg-[#e67e22] text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Comp-Off Controller */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-[#1c1b1b]">Comp-Offs</p>
                      <p className="text-[9px] text-[#897365] font-mono">Bal: {simCO_Remaining} left &bull; {simCO_Used} used</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSimulatedLeaves(s => ({ ...s, compOff: Math.max(0, s.compOff - 1) }))}
                        disabled={simulatedLeaves.compOff <= 0}
                        className="w-7 h-7 bg-stone-50 border border-[#eae7e7] text-stone-600 rounded-lg flex items-center justify-center hover:bg-stone-100 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center font-bold font-mono text-xs text-[#1c1b1b]">{simulatedLeaves.compOff}</span>
                      <button
                        onClick={() => setSimulatedLeaves(s => ({ ...s, compOff: s.compOff + 1 }))}
                        className="w-7 h-7 bg-[#944a00] hover:bg-[#e67e22] text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {totalSimulated > 0 && (
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => setSimulatedLeaves({ earnedLeave: 0, cl: 0, sl: 0, compOff: 0 })}
                        className="w-full py-1.5 border border-[#eae7e7] hover:bg-stone-50 text-stone-700 text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {
                          setTab("calendar");
                        }}
                        className="w-full py-1.5 bg-[#00b05c] hover:bg-[#008f49] text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all gap-1 flex items-center justify-center cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                        <span>Go to Grid</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}

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
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={288}>
            <AreaChart data={dynamicGraphData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
