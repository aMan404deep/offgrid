import React, { useState } from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { OfficeLocation } from "../types";
import { AppLogo } from "./AppLogo";
import { Sparkles, ShieldCheck, MapPin } from "lucide-react";
import { MascotDoodle } from "./MascotDoodle";

export const GatewayView: React.FC = () => {
  const { login } = useLeaveStore();
  const [selectedLocation, setSelectedLocation] = useState<OfficeLocation>("Noida");
  const [employeeName, setEmployeeName] = useState("Alex Chowdhury");

  const locations: { id: OfficeLocation; city: string; description: string; code: string }[] = [
    { id: "Noida", city: "Noida", code: "DEL-HQ", description: "Arrise North Office (Uttar Pradesh)" },
    { id: "Hyderabad", city: "Hyderabad", code: "HYD-TECH", description: "Arrise South Technical Hub (Telangana)" },
    { id: "Kolkata", city: "Kolkata", code: "CCU-OPS", description: "Arrise East Operations Center (Bengal)" },
  ];

  const handleSSO = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedLocation, employeeName);
  };

  return (
    <div id="gateway-root-container" className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Animated slow-moving mesh background blurs */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-[#944a00]/8 blur-[140px] -top-96 -left-48 animate-mesh-slow" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#ffbf00]/8 blur-[120px] -bottom-48 -right-24 animate-mesh-slow" style={{ animationDelay: '5s' }} />
      
      {/* Glassmorphic Onboarding Dashboard Card */}
      <div id="gateway-card" className="w-full max-w-xl lumina-glass-high rounded-3xl p-8 z-10 space-y-8 shadow-2xl">
        
        {/* Brand Display Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <AppLogo size="lg" />
          </div>
          <h2 id="gateway-app-title" className="text-3xl font-display font-extrabold tracking-tight text-[#1c1b1b]">OffGrid Core</h2>
          <p className="text-sm text-[#564337] font-medium max-w-sm mx-auto">
            Maximize continuous rest days and minimize leave deductions under Arrise corporate guidelines.
          </p>
        </div>

        {/* Mascot Rest Doodle Illustration */}
        <div id="gateway-mascot-area" className="w-full py-4 px-6 bg-[#f6f3f2]/90 border border-[#eae7e7] rounded-2xl flex items-center gap-4">
          <MascotDoodle type="suitcase" size={48} className="shrink-0" />
          <div>
            <span className="text-[10px] font-mono text-[#795900] font-bold tracking-wider uppercase">Optimizer Mascot Nudge</span>
            <p className="text-xs text-[#564337] leading-normal mt-0.5 font-medium">
              “Hey there! I am your AI assistant. Select your primary office region to query custom policy snapshots and find long-weekend streaks.”
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSSO} className="space-y-6">
          {/* Employee Name */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-[#564337] tracking-wider uppercase block">Employee Directory Identity</label>
            <input
              id="gateway-employee-name"
              type="text"
              required
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full bg-white/90 border border-[#eae7e7] rounded-xl px-4 py-3 text-[#1c1b1b] text-sm focus:outline-none focus:border-[#944a00] font-medium transition-colors"
              placeholder="e.g. Alex Chowdhury"
            />
          </div>

          {/* Location Picker */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-[#564337] tracking-wider uppercase block">Regional Office Registry</label>
            <div className="grid grid-cols-1 gap-2.5">
              {locations.map((loc) => {
                const isSelected = selectedLocation === loc.id;
                return (
                  <button
                    type="button"
                    key={loc.id}
                    id={`gateway-loc-btn-${loc.id}`}
                    onClick={() => setSelectedLocation(loc.id)}
                    className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "bg-[#944a00]/5 border-[#944a00] lumina-lift"
                        : "bg-white/40 border-[#eae7e7] hover:border-[#dcd9d9] hover:bg-white/65"
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-[#944a00] text-[#944a00]" : "border-[#eae7e7]"
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#944a00]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1c1b1b]">{loc.city}</span>
                        <span className="text-[10px] font-mono font-bold bg-[#eae7e7] px-1.5 py-0.5 rounded text-[#564337]">
                          {loc.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#564337]/80 mt-0.5 font-medium">{loc.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            id="gateway-btn-sso"
            className="w-full bg-[#944a00] hover:bg-[#e67e22] active:translate-y-0.5 duration-100 font-semibold text-white px-5 py-4 rounded-xl flex items-center justify-center gap-2 text-sm tracking-wide cursor-pointer shadow-md"
          >
            <ShieldCheck className="w-5 h-5 text-white" />
            <span>Authenticated Secure Single Sign-On</span>
          </button>
        </form>

        <div className="text-center">
          <span className="text-[10px] font-mono text-[#564337]/60 tracking-wider uppercase">
            Secured Corporate SSO &bull; GDPR Compliant &bull; V1.0
          </span>
        </div>
      </div>
    </div>
  );
};
