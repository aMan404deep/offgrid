import React, { useEffect } from "react";
import { useLeaveStore } from "./store/useLeaveStore";
import { Sidebar } from "./components/Sidebar";
import { GatewayView } from "./components/GatewayView";
import { DashboardView } from "./components/DashboardView";
import { CalendarView } from "./components/CalendarView";
import { ItineraryView } from "./components/ItineraryView";
import { ProfileView } from "./components/ProfileView";
import { SettingsView } from "./components/SettingsView";
import { FinalizeSyncView } from "./components/FinalizeSyncView";
import { SharedItineraryView } from "./components/SharedItineraryView";
import { AppLogo } from "./components/AppLogo";
import { Menu, Sparkles } from "lucide-react";

export default function App() {
  const { 
    isAuthenticated, 
    currentTab, 
    sidebarWidth, 
    isSidebarCollapsed, 
    isMobileSidebarOpen, 
    setMobileSidebarOpen 
  } = useLeaveStore();

  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // If we are showing the public read-only preview, render it full screen instantly
  if (currentTab === "shared") {
    return <SharedItineraryView />;
  }

  // If the user is unauthenticated, show the beautiful entry onboarding gate
  if (!isAuthenticated) {
    return <GatewayView />;
  }

  const renderActiveTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardView />;
      case "calendar":
        return <CalendarView />;
      case "itinerary":
        return <ItineraryView />;
      case "profile":
        return <ProfileView />;
      case "settings":
        return <SettingsView />;
      case "sync":
        return <FinalizeSyncView />;
      default:
        return <DashboardView />;
    }
  };

  // Determine the left padding for the main desktop panel
  const desktopPaddingLeft = isSidebarCollapsed ? "72px" : `${sidebarWidth}px`;

  return (
    <div id="app-viewport-frame" className="min-h-screen bg-[#fcf9f8] text-[#191919] font-sans flex flex-col md:flex-row antialiased relative">
      {/* Lumina Corporate base layer slow-moving mesh background blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[800px] h-[800px] rounded-full bg-[#944a00]/7 blur-[150px] -top-[300px] -left-[200px] animate-mesh-slow" />
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[#ffbf00]/7 blur-[130px] bottom-[100px] right-[-100px] animate-mesh-slow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-5 h-16 bg-white/85 backdrop-blur-md border-b border-[#eae7e7] sticky top-0 z-30 shadow-none relative z-10">
        <div className="flex items-center gap-2.5">
          <AppLogo size="sm" />
          <span className="font-display font-extrabold text-[#191919] tracking-tight text-sm flex items-center gap-1">OffGrid <span className="bg-[#944a00] text-white text-[8px] font-mono px-1 py-0.5 rounded font-bold">PRO</span></span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-1.5 rounded-lg border border-[#e5e2e1] bg-white text-[#564337] cursor-pointer transition-colors active:scale-95 hover:text-[#191919]"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Sidebar Section */}
      <Sidebar />

      {/* Main Content Area */}
      <main 
        id="app-main-pane" 
        className="flex-1 min-w-0 transition-all duration-300 ease-out relative z-10"
        style={{
          paddingLeft: !isMobile ? desktopPaddingLeft : "0px"
        }}
      >
        <div className="w-full p-4 sm:p-6 lg:p-8">
          {renderActiveTabContent()}
        </div>
      </main>
    </div>
  );
}
