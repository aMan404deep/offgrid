import React, { useState } from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { ShieldCheck, Calendar, Download, Printer, RefreshCw, Smile, ArrowLeft, CheckCircle } from "lucide-react";

export const FinalizeSyncView: React.FC = () => {
  const {
    currentTripLocation,
    syncToHRMS,
    leaveBalances,
    setTab,
    unlockTrip,
    user
  } = useLeaveStore();

  const [syncingState, setSyncingState] = useState<'idle' | 'syncing' | 'completed'>('idle');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const downloadFile = (filename: string, content: string, mimeType: string = "text/plain") => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSummary = () => {
    triggerToast("Downloading trip overview summary...");
    
    const summaryText = `============================================================
              ZENPLAN OFFGRID TRIP SUMMARY
============================================================
Reference ID   : ID-4428
Employee Name  : ${user.name}
Email Address  : ${user.email}
Regional Office: Noida HQ
Trip Location  : ${currentTripLocation} Retreat

9-DAY CALENDAR LOOP BREAKDOWN:
------------------------------------------------------------
- Sat, Oct 10 : Weekend Rest (Free Day)
- Sun, Oct 11 : Weekend Rest (Free Day)
- Mon, Oct 12 : Earned Leave (EL) (Applied)
- Tue, Oct 13 : Earned Leave (EL) (Applied)
- Wed, Oct 14 : Dussehra Corporate Holiday (Public)
- Thu, Oct 15 : Corporate Holiday Swap (for May Day)
- Fri, Oct 16 : Compnce Off Day (Used Balance)
- Sat, Oct 17 : Weekend Rest (Free Day)
- Sun, Oct 18 : Weekend Rest (Free Day)

TRANSACTION SAFETY SUMMARY:
- Loss of Pay (LOP) check: Passed / Clean
- Accrual safety boundary: Safe (Under 40 EL limit)
- Noida regional configuration matched and synced.
- Overall Multiplier: 4.5x LOP ROI

Status: READY TO EXECUTE SYNC TO HRMS
Generated on: ${new Date().toISOString().split('T')[0]}
============================================================`;

    downloadFile(`Trip_Summary_${currentTripLocation}.txt`, summaryText.trim());
  };

  const handlePrint = () => {
    window.print();
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSyncClick = async () => {
    setSyncingState('syncing');
    setSyncLogs(["Initializing secure API link...", "Verifying Noida employee ID..."]);
    
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSyncLogs(prev => [...prev, "Checking leave balances for LOP safeguards...", "No scheduling conflicts detected."]);
    
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSyncLogs(prev => [...prev, "Applying weekend swaps inside HRMS database...", "Writing transaction log..."]);
    
    await new Promise((resolve) => setTimeout(resolve, 900));
    await syncToHRMS();
    
    setSyncingState('completed');
    setSyncLogs(prev => [...prev, "Success! 2 EL deducted. New Balance: 12 EL.", "Mascot state updated: REST MODE READY!"]);
  };

  const handleGoBack = () => {
    unlockTrip();
    setTab("itinerary");
  };

  return (
    <div id="sync-root-wrapper" className="space-y-6 animate-fade-in font-sans pb-16 select-none relative">
      
      {/* Dynamic Non-blocking Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1b1b] text-white border border-[#eae7e7]/10 rounded-lg p-4 shadow-xl flex items-center gap-3 animate-fade-in font-mono text-xs">
          <CheckCircle className="w-4 h-4 text-[#00b05c] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div id="sync-header" className="flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className="p-2 bg-white hover:bg-[#f6f3f2] rounded-md border border-[#eae7e7] transition-colors cursor-pointer"
          title="Back to Itinerary"
        >
          <ArrowLeft className="w-4 h-4 text-[#1c1b1b]" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-[#1c1b1b] tracking-tight">Finalize &amp; Sync Leave</h2>
          <p className="text-xs text-[#564337] mt-0.5 font-medium font-sans">
            Review calendar breakdowns, execute payroll safety protocols, and commit vacation schedules directly to the official database.
          </p>
        </div>
      </div>

      {syncingState === 'completed' ? (
        /* Success Celebrating State */
        <div id="sync-success-board" className="max-w-xl mx-auto p-8 bg-white border border-[#00b05c]/30 rounded-2xl text-center space-y-6 shadow-sm my-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#00b05c]/10 flex items-center justify-center text-[#003a1a] border border-[#00b05c]/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-[#1c1b1b] font-sans tracking-tight">Official Sync Completed!</h3>
            <p className="text-xs text-[#564337] font-sans font-medium px-4 leading-normal">
              Your 9-day <strong>{currentTripLocation} Retreat</strong> leave dates have been registered inside Noida HQ registries successfully.
            </p>
          </div>

          {/* Quick specs summary */}
          <div className="bg-[#fcf9f8] border border-[#eae7e7] p-4.5 rounded-xl text-left space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-[#564337]">
              <span>Primary Transaction status:</span>
              <span className="font-bold text-[#003a1a] uppercase bg-[#00b05c]/10 px-2 py-0.5 rounded text-[10px]">COMMITTED</span>
            </div>
            <div className="flex justify-between items-center text-[#564337]">
              <span>Earned Leaves deducted:</span>
              <span className="font-bold text-[#1c1b1b]">2 Days (Mon, Oct 12 - Tue, Oct 13)</span>
            </div>
            <div className="flex justify-between items-center text-[#564337] border-t border-[#eae7e7] pt-3">
              <span>Updated EL Reserve balance:</span>
              <span className="font-black text-[#944a00] text-sm">{leaveBalances.earnedLeave} Days</span>
            </div>
          </div>

          <div className="p-4 bg-[#1c1b1b] rounded-xl flex items-center gap-4 text-left text-white">
            <Smile className="w-10 h-10 text-[#ffbf00] shrink-0" />
            <div>
              <span className="text-[10px] font-mono font-bold text-[#ffbf00] uppercase tracking-widest leading-none block">Mascot Celebration Line</span>
              <p className="text-xs text-stone-300 leading-normal mt-1 font-medium font-sans">
                “Excellent planning, Alex! Your upcoming vacation is approved and aligned. Enjoy maximum relaxation time!”
              </p>
            </div>
          </div>

          <button
            onClick={() => setTab("profile")}
            className="w-full py-3.5 bg-[#944a00] hover:bg-[#e67e22] text-white font-bold text-xs rounded-md transition-all cursor-pointer shadow-sm uppercase tracking-wide"
          >
            Go inspect My Travel Report
          </button>
        </div>
      ) : (
        /* Regular Confirmation Bento layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Summary and break downs */}
          <div className="lg:col-span-2 bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <span className="text-[10px] font-mono text-[#897365] font-bold uppercase tracking-wider block mb-0.5">Summary breakdown</span>
              <h3 className="text-lg font-bold text-[#1c1b1b]">{currentTripLocation} Retreat Trip Summary</h3>
              <p className="text-xs text-[#564337] mt-1 leading-normal font-sans">
                Review specific date parameters, weekend combinations, and holiday exchanges.
              </p>
            </div>

            {/* Structured Leave Breakdown Grid Column list */}
            <div className="space-y-3 font-mono text-xs text-[#564337]">
              <span className="text-[11px] font-bold text-[#897365] uppercase tracking-wide block mb-2 font-sans">9-Day Calendar Loop Breakdown:</span>
              
              <div className="divide-y divide-[#eae7e7]">
                {[
                  { date: "Sat, Oct 10", label: "Weekend Rest", type: "Free Day", style: "text-[#897365]" },
                  { date: "Sun, Oct 11", label: "Weekend Rest", type: "Free Day", style: "text-[#897365]" },
                  { date: "Mon, Oct 12", label: "Earned Leave (EL)", type: "Applied", style: "text-[#944a00] font-bold" },
                  { date: "Tue, Oct 13", label: "Earned Leave (EL)", type: "Applied", style: "text-[#944a00] font-bold" },
                  { date: "Wed, Oct 14", label: "Dussehra Corporate Holiday", type: "Public", style: "text-[#006d37] font-bold" },
                  { date: "Thu, Oct 15", label: "Corporate Holiday Swap (Swapped for May Day)", type: "Swapped", style: "text-[#795900] font-semibold" },
                  { date: "Fri, Oct 16", label: "Compence Off Day (Used balance)", type: "Comp-off", style: "text-[#006d37] font-bold" },
                  { date: "Sat, Oct 17", label: "Weekend Rest", type: "Free Day", style: "text-[#897365]" },
                  { date: "Sun, Oct 18", label: "Weekend Rest", type: "Free Day", style: "text-[#897365]" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2.5">
                    <span className="font-semibold text-[#1c1b1b]">{item.date}</span>
                    <span className={item.style}>{item.label}</span>
                    <span className="text-[10px] bg-[#f6f3f2] border border-[#eae7e7] px-2 py-0.5 rounded uppercase font-bold text-[#897365]">{item.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="border-t border-[#eae7e7] pt-5 flex items-center justify-between font-sans">
              <div className="flex gap-2.5">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white hover:bg-[#f6f3f2] border border-[#eae7e7] text-[#564337] rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Details</span>
                </button>
                <button
                  onClick={handleDownloadSummary}
                  className="px-4 py-2 bg-white hover:bg-[#f6f3f2] border border-[#eae7e7] text-[#564337] rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Summary</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-[#897365]">Transaction Registry: ID-4428</span>
            </div>
          </div>

          {/* Right Column: Safety checks and Main sync button */}
          <div className="space-y-6">
            
            {/* Safety checkpoints */}
            <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-[#1c1b1b] flex items-center gap-2 font-sans">
                <ShieldCheck className="text-[#00b05c] w-5 h-5 animate-pulse" />
                <span>Payroll Safety Checks</span>
              </h4>

              <div className="space-y-3.5 text-xs text-[#564337] font-sans font-medium">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#00b05c]" />
                  <span><strong>Loss of Pay (LOP) check:</strong> Clear. Sufficient EL reserves in place.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#00b05c]" />
                  <span><strong>Accrual safety boundary:</strong> Under 40 EL limit. No accruals will lapse.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#00b05c]" />
                  <span><strong>Region validation:</strong> Checked with Noida registry. All holidays match.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#00b05c]" />
                  <span><strong>Compence check:</strong> 2 days approved. Exploit within 45 days.</span>
                </div>
              </div>
            </div>

            {/* Mascot and Sync Trigger block */}
            <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Mascot container details */}
              <div className="p-4 bg-[#ffdcc5]/15 border border-[#eae7e7] rounded-xl flex gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#ffdcc5]/30 text-[#944a00] flex items-center justify-center shrink-0">
                  <Smile className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-mono font-black text-[#944a00] uppercase tracking-widest leading-none block">Engine Mascot Advice</span>
                  <p className="text-[11px] text-[#564337] leading-normal mt-1 font-medium font-sans">
                    “Everything looks fully verified! Clicking the sync button binds dates to Noida's Official HRMS instantly.”
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              {syncingState === 'syncing' ? (
                <div className="space-y-3.5 text-xs font-sans font-medium">
                  <div className="flex items-center gap-2 text-[#1c1b1b] font-bold">
                    <RefreshCw className="w-4 h-4 text-[#944a00] animate-spin" />
                    <span>Syncing in Progress...</span>
                  </div>
                  <div className="bg-[#1c1b1b] text-stone-100 p-3 rounded-lg font-mono text-[10px] space-y-1 select-none">
                    {syncLogs.map((log, i) => (
                      <p key={i} className="leading-relaxed opacity-90">&gt; {log}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  id="sync-btn-execute"
                  onClick={handleSyncClick}
                  className="w-full bg-[#944a00] hover:bg-[#e67e22] active:translate-y-0.5 text-white font-bold h-12 rounded-lg text-xs flex items-center justify-center gap-2.5 shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
                >
                  <ShieldCheck className="w-5 h-5 text-[#ffdcc5]" />
                  <span>Sync Directly to HRMS</span>
                </button>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
