import React from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { AppLogo } from "./AppLogo";
import { Avatar } from "./Avatar";
import { 
  LayoutGrid, 
  Calendar, 
  Map, 
  User, 
  Sliders, 
  CheckSquare, 
  Sparkles, 
  LogOut, 
  X
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { 
    currentTab, 
    setTab, 
    user, 
    logout, 
    leaveBalances, 
    isMobileSidebarOpen,
    setMobileSidebarOpen
  } = useLeaveStore();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid, count: null },
    { id: "calendar", label: "Calendar Engine", icon: Calendar, count: leaveBalances.compOffCount },
    { id: "itinerary", label: "Itinerary Board", icon: Map, count: null },
    { id: "profile", label: "Travel Report", icon: User, count: null },
    { id: "sync", label: "Finalize & Sync", icon: CheckSquare, count: null },
    { id: "settings", label: "AI & Preferences", icon: Sliders, count: null },
  ] as const;

  // On desktop, the sidebar is always styled as collapsed (just icons).
  // Inside the mobile sliding drawer, it is displayed as expanded for best visibility and navigation.
  const collapsed = !isMobileSidebarOpen;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-35 transition-opacity pointer-events-auto"
        />
      )}

      {/* Main Sidebar Wrapper */}
      <aside 
        id="sidebar-container" 
        className={`fixed top-0 left-0 h-screen bg-white/95 backdrop-blur-md border-r border-[#eae7e7] shadow-none flex flex-col justify-between z-40 select-none transition-all duration-300 ease-out md:sticky
          ${isMobileSidebarOpen ? "translate-x-0 w-[280px]" : "-translate-x-full md:translate-x-0 md:w-[72px]"}
        `}
      >
        <div>
          {/* Brand Header */}
          <div 
            id="sidebar-logo-area" 
            className={`flex items-center gap-3 py-6 px-4 cursor-pointer border-b border-[#f0eded] transition-all ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div 
              onClick={() => {
                setTab("dashboard");
                setMobileSidebarOpen(false);
              }}
              className="flex items-center gap-3 min-w-0"
            >
              <AppLogo size="md" />
              {!collapsed && (
                <div className="min-w-0">
                  <h1 className="text-sm font-display font-extrabold text-[#191919] tracking-tight leading-none animate-fade-in flex items-center gap-1">
                    OffGrid <span className="bg-[#944a00] text-white text-[8px] font-mono px-1 py-0.5 rounded font-bold">PRO</span>
                  </h1>
                  <p className="text-[9px] font-mono text-[#944a00] font-extrabold tracking-widest uppercase mt-0.5 animate-fade-in">Leave Optimizer</p>
                </div>
              )}
            </div>

            {/* Mobile close button inside header */}
            {!collapsed && (
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-[#564337] hover:text-[#191919] hover:bg-stone-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Menu Links */}
          <nav id="sidebar-nav" className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              
              return (
                <button
                   key={item.id}
                   id={`sidebar-link-${item.id}`}
                   onClick={() => {
                     setTab(item.id);
                     setMobileSidebarOpen(false);
                   }}
                   className={`w-full group relative flex items-center rounded-lg text-xs transition-all cursor-pointer ${
                     collapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                   } ${
                     isActive
                       ? "bg-[#944a00] text-white font-semibold shadow-md active:translate-y-0.5"
                       : "text-[#564337] hover:bg-[#eae7e7] hover:text-[#191919] font-medium"
                   }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-all ${
                      isActive ? "text-white" : "text-[#897365] group-hover:text-[#191919]"
                    }`} />
                    {!collapsed && (
                      <span className="truncate tracking-tight animate-fade-in">{item.label}</span>
                    )}
                  </div>

                  {!collapsed && item.count !== null && (
                    <span className="text-[9px] font-mono leading-none px-1.5 py-0.5 rounded font-bold bg-[#ffbf00]/15 text-[#795900] animate-fade-in">
                      {item.count} Active
                    </span>
                  )}

                  {/* Floating tooltip on Hover (ONLY shown when Collapsed on Desktop) */}
                  {collapsed && (
                    <div className="absolute left-16 bg-[#191919] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap tracking-wide border border-zinc-800">
                      {item.label}
                      {item.count !== null && ` (${item.count} Active)`}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area with user credential states */}
        <div id="sidebar-footer" className="p-3 border-t border-[#f0eded] space-y-3">
          {/* Region Headquarter Indicator */}
          <div className={`p-2.5 bg-[#f6f3f2] rounded-lg flex items-center gap-2 border border-[#eae7e7] text-xs ${
            collapsed ? "justify-center" : "justify-between"
          }`}>
            {!collapsed ? (
              <>
                <span className="text-[#897365] font-bold uppercase tracking-wider text-[8px] animate-fade-in font-mono">Regional HQ:</span>
                <span id="sidebar-region-badge" className="font-mono bg-white text-[#191919] border border-[#eae7e7] px-2 py-0.5 rounded font-black text-[9px] uppercase animate-fade-in shadow-sm">
                  {user.location}
                </span>
              </>
            ) : (
              <span 
                className="font-mono bg-white text-[#191919] border border-[#eae7e7] font-black px-1.5 py-0.5 rounded text-[10px] uppercase group relative cursor-help shadow-sm"
              >
                {user.location.substring(0, 2).toUpperCase()}
                
                {/* Collapsed HQ Tooltip */}
                <div className="absolute left-12 bg-[#191919] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap tracking-wide">
                  Office Location: {user.location}
                </div>
              </span>
            )}
          </div>

          {/* User account widget */}
          <div className={`flex items-center gap-2 min-w-0 ${
            collapsed ? "flex-col justify-center gap-3" : "justify-between px-1"
          }`}>
            <div className={`flex items-center gap-2 min-w-0 ${collapsed ? "flex-col text-center" : ""}`}>
              <div id="sidebar-user-avatar">
                <Avatar
                  name={user.name}
                  avatarUrl={user.avatar}
                  className="w-8 h-8 text-xs border border-[#eae7e7] ring-2 ring-[#f0eded] shadow-sm"
                />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#191919] truncate leading-none mb-1 animate-fade-in">{user.name}</h4>
                  <span className="text-[10px] font-mono text-[#897365] block truncate font-medium animate-fade-in">{user.level}</span>
                </div>
              )}
            </div>

            <button
              id="sidebar-btn-logout"
              onClick={logout}
              className={`p-1.5 hover:bg-rose-50 text-[#897365] hover:text-rose-600 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-100 duration-200 shrink-0 ${
                collapsed ? "w-8 h-8 flex items-center justify-center relative group" : ""
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              {collapsed && (
                <div className="absolute left-12 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xl pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap tracking-wide">
                  Sign Out
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
