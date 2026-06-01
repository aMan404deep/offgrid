import React, { useState, useEffect } from "react";
import { useLeaveStore } from "../store/useLeaveStore";
import { OfficeLocation } from "../types";
import { AppLogo } from "./AppLogo";
import { ShieldCheck } from "lucide-react";
import { MascotDoodle } from "./MascotDoodle";
import { supabase } from "../utils/supabase";

export const GatewayView: React.FC = () => {
  const { login } = useLeaveStore();
  const [step, setStep] = useState<"auth" | "setup">("auth");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<OfficeLocation>("Noida");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const locations: { id: OfficeLocation; city: string; description: string; code: string }[] = [
    { id: "Noida", city: "Noida", code: "DEL-HQ", description: "Arrise North Office" },
    { id: "Hyderabad", city: "Hyderabad", code: "HYD-TECH", description: "Arrise South Technical Hub" },
    { id: "Kolkata", city: "Kolkata", code: "CCU-OPS", description: "Arrise East Operations Center" },
  ];

  useEffect(() => {
    // Check for an existing session (useful after Google OAuth redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user && session.user.email) {
        checkInternalUser(session.user.email);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        checkInternalUser(session.user.email);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkInternalUser = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/employee?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      localStorage.setItem("zenplan_pending_email", userEmail);
      setEmail(userEmail); // Fill email in case they go to setup

      if (data.exists && data.data) {
        // Exists in DB, login successfully
        login(data.data.location || "Noida", data.data.name || "Employee");
      } else {
        // Doesn't exist, proceed to setup
        setStep("setup");
      }
    } catch (err: any) {
      console.error("Check user error", err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setErrorMsg("");
    
    try {
      let authResponse;
      if (authMode === "signup") {
        authResponse = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (!authResponse.error && !authResponse.data.session) {
          setErrorMsg("Account created! Please check your email for a confirmation link (if required by your Supabase project).");
          setLoading(false);
          return;
        }
      } else {
        authResponse = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (authResponse.error) {
        if (authResponse.error.message === "Invalid login credentials" && authMode === "login") {
          throw new Error("Invalid login credentials. If you haven't created an account yet, please click 'Create Account'.");
        }
        throw authResponse.error;
      }
      // Auth change listener will trigger checkInternalUser
    } catch (err: any) {
      console.error("Auth error", err);
      setErrorMsg(err.message || "Failed to authenticate.");
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await fetch("/api/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: employeeName, location: selectedLocation, role: employeeRole })
      });
      localStorage.setItem("zenplan_initial_role", employeeRole);
      login(selectedLocation, employeeName);
    } catch (err) {
      setErrorMsg("Failed to setup profile.");
    }
    setLoading(false);
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
              “Hey there! I am your AI assistant. Log in to query custom policy snapshots and find long-weekend streaks.”
            </p>
          </div>
        </div>

        {/* Login/Signup Form Flow */}
        {step === "auth" && (
          <form onSubmit={handleAuthSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-[#564337] tracking-wider uppercase">
                <span>Corporate Credentials</span>
                <button type="button" onClick={() => setAuthMode(m => m === "login" ? "signup" : "login")} className="text-[#944a00] hover:underline">
                  {authMode === "login" ? "Create Account" : "Back to Login"}
                </button>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/90 border border-[#eae7e7] rounded-xl px-4 py-3 text-[#1c1b1b] text-sm focus:outline-none focus:border-[#944a00] font-medium transition-colors"
                placeholder="you@arrisesolutions.com"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/90 border border-[#eae7e7] rounded-xl px-4 py-3 text-[#1c1b1b] text-sm focus:outline-none focus:border-[#944a00] font-medium transition-colors"
                placeholder="Password"
              />
            </div>
            {errorMsg && <p className="text-red-500 text-xs font-medium">{errorMsg}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#944a00] hover:bg-[#e67e22] active:translate-y-0.5 disabled:opacity-50 duration-100 font-semibold text-white px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm tracking-wide cursor-pointer shadow-md"
            >
              <ShieldCheck className="w-5 h-5 text-white" />
              <span>{loading ? "Authenticating..." : (authMode === "login" ? "Login" : "Sign Up")}</span>
            </button>
          </form>
        )}

        {step === "setup" && (
          <form onSubmit={handleSetupSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#564337] tracking-wider uppercase block">Employee Directory Identity</label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full bg-white/90 border border-[#eae7e7] rounded-xl px-4 py-3 text-[#1c1b1b] text-sm focus:outline-none focus:border-[#944a00] font-medium transition-colors"
                placeholder="Full Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#564337] tracking-wider uppercase block">Corporate Role</label>
              <input
                type="text"
                required
                value={employeeRole}
                onChange={(e) => setEmployeeRole(e.target.value)}
                className="w-full bg-white/90 border border-[#eae7e7] rounded-xl px-4 py-3 text-[#1c1b1b] text-sm focus:outline-none focus:border-[#944a00] font-medium transition-colors"
                placeholder="e.g. Engineering Specialist"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#564337] tracking-wider uppercase block">Regional Office</label>
              <div className="grid grid-cols-1 gap-2.5">
                {locations.map((loc) => {
                  const isSelected = selectedLocation === loc.id;
                  return (
                    <button
                      type="button"
                      key={loc.id}
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
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {errorMsg && <p className="text-red-500 text-xs font-medium">{errorMsg}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#944a00] hover:bg-[#e67e22] active:translate-y-0.5 disabled:opacity-50 duration-100 font-semibold text-white px-5 py-4 rounded-xl flex items-center justify-center gap-2 text-sm tracking-wide cursor-pointer shadow-md"
            >
              <span>{loading ? "Completing..." : "Complete Setup & Login"}</span>
            </button>
          </form>
        )}

        <div className="text-center">
          <span className="text-[10px] font-mono text-[#564337]/60 tracking-wider uppercase">
            Secured Corporate MFA &bull; GDPR Compliant &bull; V1.0
          </span>
        </div>
      </div>
    </div>
  );
};

