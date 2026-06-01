import React from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { Coffee, RotateCcw, Sliders, ShieldCheck, Activity } from "lucide-react";

export const SettingsView: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    toggleVibe,
    resetPreferences,
    budgetForecast,
  } = useLeaveStore();

  const vibesOptions = [
    { id: "Mountains", label: "Mountains", desc: "Elevation hikes, crisp morning air & evergreen ridges", icon: "mountain" },
    { id: "Beaches", label: "Beaches", desc: "Surf soundscape, sandy trails & coastal climate", icon: "waves" },
    { id: "Historical", label: "Historical", desc: "Ancient stones, architectural loops & museum tours", icon: "book-open" },
    { id: "Quiet Retreat", label: "Quiet Retreat", desc: "Organic estates, silent spas & meditative spaces", icon: "coffee" }
  ];

  return (
    <div id="settings-wrapper" className="space-y-6 animate-fade-in font-sans pb-16 select-none">
      
      {/* Page Header */}
      <div id="settings-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1c1b1b] tracking-tight">AI &amp; Travel Preferences</h2>
          <p className="text-xs text-[#564337] mt-0.5 font-medium">
            Fine-tune recommendations, adjust budget parameters, and change optimization priorities.
          </p>
        </div>
        
        <button
          id="settings-btn-reset"
          onClick={resetPreferences}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#f6f3f2] border border-[#eae7e7] text-xs font-semibold rounded-md text-[#1c1b1b] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default</span>
        </button>
      </div>

      {/* Grid: AI Controls + Policy Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Config Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Engine learning status card */}
          <div className="p-4 bg-[#ffdcc5]/10 border border-[#eae7e7] rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 bg-[#ffdcc5]/30 text-[#944a00] rounded-xl relative shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#944a00] absolute -top-0.5 -right-0.5 animate-ping" />
                <Activity className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#944a00] uppercase tracking-widest leading-none block">System Learning status</span>
                <p className="text-sm font-bold text-[#1c1b1b] mt-0.5">Engine Status: Learning from your habits...</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#003a1a] bg-[#00b05c]/10 border border-[#00b05c]/30 px-2.5 py-1 rounded">
              ONLINE
            </span>
          </div>

          {/* Travel Vibe Selector */}
          <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1c1b1b]">Atmosphere Preference</h3>
              <p className="text-xs text-[#564337] mt-0.5">Select preferred environment profiles to tailor recommended destinations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {vibesOptions.map((vibe) => {
                const isSelected = preferences.vibes.includes(vibe.id);
                return (
                  <button
                    key={vibe.id}
                    id={`vibe-card-${vibe.id}`}
                    onClick={() => toggleVibe(vibe.id)}
                    className={`p-4 border text-left rounded-xl flex items-start gap-4 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#ffdcc5]/15 border-[#944a00] shadow-sm"
                        : "bg-white border-[#eae7e7] hover:bg-[#f6f3f2]/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "bg-[#944a00] text-white" : "bg-[#f6f3f2] text-[#897365]"
                    }`}>
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="text-xs font-bold text-[#1c1b1b]">{vibe.label}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#944a00]" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#564337] mt-1 font-medium leading-normal">{vibe.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive sliders for Optimization Weightings */}
          <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#1c1b1b]">OffGrid Priority Weights</h3>
              <p className="text-xs text-[#564337] mt-0.5">Influence recommendations by adjusting key priorities of the calendar engine solver.</p>
            </div>

            <div className="space-y-6 text-xs font-semibold">
              {/* Weight 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#1c1b1b]">Prioritize Consecutive Rest Days Off</span>
                  <span className="text-[#944a00] font-mono font-bold uppercase">{preferences.prioritizeROI ? "ACTIVE" : "INACTIVE"}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="settings-toggle-roi"
                    type="checkbox"
                    checked={preferences.prioritizeROI}
                    onChange={(e) => updatePreferences({ prioritizeROI: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#eae7e7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#eae7e7] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#944a00]"></div>
                  <span className="ml-3 text-[#564337] font-medium leading-normal">Ensure maximum continuous recovery periods.</span>
                </label>
              </div>

              {/* Weight 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#1c1b1b]">Prioritize Lowest Corporate Travel cost</span>
                  <span className="text-[#944a00] font-mono font-bold uppercase">{preferences.prioritizeLowestCost ? "ACTIVE" : "INACTIVE"}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    id="settings-toggle-cost"
                    type="checkbox"
                    checked={preferences.prioritizeLowestCost}
                    onChange={(e) => updatePreferences({ prioritizeLowestCost: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#eae7e7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#eae7e7] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#944a00]"></div>
                  <span className="ml-3 text-[#564337] font-medium leading-normal">Filter only cost-effective flight corridors.</span>
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Policy Snapshot box */}
        <div className="space-y-6">
          
          {/* Snapshot Board */}
          <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-base font-bold text-[#1c1b1b] flex items-center gap-2 font-sans">
              <ShieldCheck className="w-5 h-5 text-[#00b05c]" />
              <span>Policy Snapshot</span>
            </h4>
            <div className="space-y-3.5 text-xs text-[#564337] font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#944a00] shrink-0" />
                <span>Basic CL/SL entitling covers 12 working days.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#944a00] shrink-0" />
                <span>Earned Leave roll cap threshold: 40 active days.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#944a00] shrink-0" />
                <span>Comp-off validity expirations: 90 days.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#944a00] shrink-0" />
                <span>Male Paternity limit: 10 working days.</span>
              </div>
            </div>
            <div className="border-t border-[#eae7e7] pt-3.5 text-[11px] text-[#897365] font-mono">
              *Rules retrieved directly from <strong>July 28, 2025 Arrise Solutions Leave Policy.md</strong> file context.
            </div>
          </div>

          {/* Budget Defaults Slider */}
          <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-base font-bold text-[#1c1b1b] flex items-center gap-2 font-sans">
              <Sliders className="w-5 h-5 text-[#944a00]" />
              <span>Budget Estimations</span>
            </h4>
            <div className="space-y-3">
              <span className="text-[11px] font-mono font-bold text-[#897365] uppercase tracking-wider block">Estimated Total Cost Projection:</span>
              <p className="text-2xl font-black text-[#1c1b1b]">₹{budgetForecast.total.toLocaleString()}</p>
              <div className="p-3 bg-[#f6f3f2] rounded-xl text-[10px] text-[#564337] leading-normal font-sans">
                Includes flights, double accommodation package, and taxi transfers matched for the region. Matches <strong>{preferences.budgetLevel === 3 ? "Luxury" : preferences.budgetLevel === 1 ? "Budget" : "Mid-Range"}</strong> standards.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
