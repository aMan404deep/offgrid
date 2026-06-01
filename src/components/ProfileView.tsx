import React, { useRef, useState } from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { Copy, Download, Trophy, CheckCircle, ExternalLink, Camera } from "lucide-react";
import { Avatar } from "./Avatar";

export const ProfileView: React.FC = () => {
  const { user, achievements, currentTripLocation, updateUserAvatar } = useLeaveStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generate a shareable mock link representing Page 6
  const shareableURL = "https://zenplan.com/itinerary/alex-coimbatore-retreat";

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableURL);
    setCopiedLink(true);
    triggerToast("Shareable link copied to clipboard successfully!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadReport = () => {
    triggerToast("Generating your high-resolution Infographic Report Card PDF report...");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          updateUserAvatar(event.target.result);
          triggerToast("Profile picture updated successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResourceClick = (name: string) => {
    triggerToast(`Exporting local resource: ${name}...`);
  };

  return (
    <div id="profile-wrapper" className="space-y-6 animate-fade-in font-sans pb-16 select-none relative">
      
      {/* Global Toast HUD */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1b1b] text-white border border-[#eae7e7]/10 rounded-lg p-4 shadow-xl flex items-center gap-3 animate-fade-in font-mono text-xs">
          <CheckCircle className="w-4 h-4 text-[#00b05c] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div id="profile-header">
        <h2 className="text-xl font-bold text-[#1c1b1b] tracking-tight">Gamification &amp; Profile</h2>
        <p className="text-xs text-[#564337] mt-0.5 font-medium">
          Unlock achievements, inspect your optimization statistics, and download digital travel reports.
        </p>
      </div>

      {/* Grid: User Stats + Infographic Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Stats & Badges shelf */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User Profile Summary */}
          <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <Avatar
                name={user.name}
                avatarUrl={user.avatar}
                className="w-20 h-20 text-2xl border-2 border-[#944a00] group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarChange} 
              />
            </div>
            <div className="space-y-2 text-center sm:text-left font-sans">
              <span className="text-[10px] font-mono text-[#944a00] font-bold uppercase tracking-wider bg-[#ffdcc5]/30 px-2.5 py-1 rounded">
                Active Tier Status
              </span>
              <h3 className="text-lg font-black text-[#1c1b1b] mt-2 leading-none">{user.name}</h3>
              <p className="text-xs text-[#564337] font-medium">{user.role} &bull; {user.location} Regional Office</p>
              <div className="mt-1">
                <span className="text-[10px] font-mono font-bold text-[#795900] bg-[#ffbf00]/10 border border-[#ffbf00]/30 px-2.5 py-1 rounded-md">
                  {user.level} (Top 3% of Arrise FTEs)
                </span>
              </div>
            </div>
          </div>

          {/* Lifetime impact stats */}
          <div className="grid grid-cols-3 gap-4 font-sans">
            {[
              { label: "Rest Days Won", value: "32 Days", desc: "Consecutive off optimization cycles" },
              { label: "Leaves Preserved", value: "14 Days", desc: "Under corporate policy guidelines" },
              { label: "Streak ROI Ratio", value: "4.5x Max", desc: "Consecutive vacation quotient" }
            ].map((stat, idx) => (
              <div key={idx} className="p-4 bg-white border border-[#eae7e7] rounded-xl text-center space-y-1.5 shadow-sm">
                <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider block">{stat.label}</span>
                <p className="text-xl font-black text-[#1c1b1b] leading-none">{stat.value}</p>
                <p className="text-[9px] text-[#564337] font-normal leading-tight">{stat.desc}</p>
              </div>
            ))}
          </div>

          {/* Achievements badge shelf */}
          <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-base font-bold text-[#1c1b1b] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#ffbf00]" />
              <span>Optimization Milestones</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((ach) => {
                return (
                  <div
                    key={ach.id}
                    className={`p-4 border rounded-xl flex gap-3.5 transition-all ${
                      ach.unlocked
                        ? "bg-white border-[#eae7e7]"
                        : "bg-white/50 border-[#eae7e7]/60 opacity-60"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      ach.unlocked 
                        ? "bg-[#ffbf00]/10 text-[#795900] border border-[#ffbf00]/30" 
                        : "bg-[#f6f3f2] text-stone-400"
                    }`}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-[#1c1b1b] text-xs">
                        <span>{ach.title}</span>
                        {ach.unlocked && (
                          <CheckCircle className="w-3.5 h-3.5 text-[#00b05c]" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#564337] mt-1 leading-normal font-medium">{ach.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Official Document Resources Box */}
          <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-base font-bold text-[#1c1b1b]">Approved Arrise Resource Center</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
              <a
                href="#download-policy"
                onClick={(e) => { e.preventDefault(); handleResourceClick("Arrise_Leave_Policy_India_2026.pdf"); }}
                className="p-3 bg-white border border-[#eae7e7] hover:bg-[#f6f3f2] transition-colors rounded-md flex items-center justify-between text-xs font-semibold text-[#564337]"
              >
                <span>Download Arrise Leave Policy (India)</span>
                <Download className="w-4 h-4 text-stone-400" />
              </a>
              <a
                href="#download-guides"
                onClick={(e) => { e.preventDefault(); handleResourceClick("Travel_Optimization_Tactics_v1.pdf"); }}
                className="p-3 bg-white border border-[#eae7e7] hover:bg-[#f6f3f2] transition-colors rounded-md flex items-center justify-between text-xs font-semibold text-[#564337]"
              >
                <span>Read Travel Optimization Guide</span>
                <ExternalLink className="w-4 h-4 text-stone-400" />
              </a>
            </div>
          </div>

        </div>

        {/* Right Column: Masterpiece Infographic Postcard Card */}
        <div>
          <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider block mb-0.5">Shareable Asset</span>
              <h3 className="text-base font-bold text-[#1c1b1b]">Trip Masterpiece Card</h3>
              <p className="text-xs text-[#564337] mt-1 leading-normal">
                An optimized visual ticket representing your high-efficiency Coimbatore itinerary. Zero sensitive leave balance details shown.
              </p>
            </div>

            {/* Poster Framer design */}
            <div className="p-5 bg-stone-950 text-white rounded-2xl border border-[#eae7e7]/10 relative overflow-hidden flex flex-col justify-between h-96 shadow-sm leading-none font-sans">
              
              {/* Dynamic top-right neon highlight */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#944a00]/30 blur-2xl rounded-full" />
              {/* Decorative dotted layout */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              <div className="flex justify-between items-start z-10">
                <div>
                  <h4 className="text-xs font-black tracking-widest text-[#ffbf00] font-mono">ZENPLAN TICKET</h4>
                  <p className="text-[9px] text-[#897365] font-mono mt-0.5">ID: ALEX-COIMBATORE-2026</p>
                </div>
                <div className="bg-[#00b05c]/10 border border-[#00b05c]/30 text-[#00b05c] px-2 py-1 rounded text-[10px] font-mono font-bold uppercase">
                  4.5x ROI
                </div>
              </div>

              <div className="space-y-4 z-10 text-left">
                <div>
                  <span className="text-[9px] font-mono font-semibold text-[#897365] tracking-wider uppercase block mb-1">Destination</span>
                  <p className="text-xl font-black text-white tracking-tight leading-tight">{currentTripLocation} Retreat</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-[#eae7e7]/10 py-3 font-mono">
                  <div>
                    <span className="text-[8px] text-[#897365] uppercase">Duration</span>
                    <p className="text-xs font-bold text-stone-200 mt-0.5">9 Rest Days</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-[#897365] uppercase">Leave Deduct</span>
                    <p className="text-xs font-bold text-[#ffbf00] mt-0.5">2 EL Days</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-semibold text-[#897365] uppercase block">Travel Vibes Selected</span>
                  <p className="text-xs text-stone-300 font-sans mt-1">Mountains, Local Culinary, Quiet Retreat</p>
                </div>
              </div>

              {/* Barcode line */}
              <div className="z-10 flex items-center justify-between border-t border-[#eae7e7]/10 pt-3">
                <div className="w-1/2 flex items-center gap-[1px]">
                  {/* barcode block */}
                  {[3,1,4,2,1,1,3,2,4,1,2].map((w,i) => (
                    <span key={i} className="bg-stone-500 h-6 block" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-mono text-[#897365]">OPTIMIZATION ENGINE</span>
                  <p className="text-[9px] text-[#ffbf00] font-bold font-mono mt-0.5 uppercase">ARRISE DELHI HQ</p>
                </div>
              </div>

            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 font-sans">
              <button
                id="profile-btn-copy"
                onClick={handleCopyLink}
                className="w-full py-2.5 bg-white hover:bg-[#f6f3f2] border border-[#eae7e7] transition-all text-xs font-bold text-[#564337] rounded-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-stone-400" />
                <span>{copiedLink ? "Link Copied!" : "Copy Shareable Link"}</span>
              </button>
              <button
                id="profile-btn-download"
                onClick={handleDownloadReport}
                className="w-full py-2.5 bg-[#944a00] hover:bg-[#e67e22] text-white text-xs font-bold rounded-md flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wide"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res Report</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
