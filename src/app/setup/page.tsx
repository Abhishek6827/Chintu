"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

export default function SetupPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [jd, setJd] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
   const [isInitiating, setIsInitiating] = useState(false);
  const [userPlan, setUserPlan] = useState("free");
  const [isJdLocked, setIsJdLocked] = useState(false);
  const [saveJd, setSaveJd] = useState(false);
  const [showJdOnly, setShowJdOnly] = useState(false);
  const [showAppPrompt, setShowAppPrompt] = useState(false);
  
  const router = useRouter();
  const isElectron = typeof window !== "undefined" && (!!(window as any).electronAPI || navigator.userAgent.toLowerCase().includes('electron'));

  // Handle hydration / Initial load
  useEffect(() => {
    setMounted(true);

    const checkProfile = async () => {
      // Fetch profile via secure backend API
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile: profileRow } = await res.json();
          if (profileRow) {
            setUserPlan(profileRow.plan || "free");
            // Logic based on new requirements:
            // If Profile + JD exist -> go to room
            // If Profile exists but JD missing -> show JD only
            if (profileRow.profile_data && Object.keys(profileRow.profile_data).length > 0) {
              setHasProfile(true);
              if (profileRow.raw_profile) setAboutMe(profileRow.raw_profile);
              
              if (profileRow.current_jd) {
                setJd(profileRow.current_jd);
                sessionStorage.setItem("jobDescription", profileRow.current_jd);
                if ((profileRow.plan || "free") === "free") {
                  setIsJdLocked(true);
                }
                // Redirect directly if both exist
                router.push("/room");
                return;
              } else {
                // Profile exists but no JD saved
                setShowJdOnly(true);
              }
            } else {
              setHasProfile(false);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching profile via API:", err);
      }
    };


    if (isLoaded && isSignedIn && user) {
      // If we already have a JD in this session, jump straight to the room
      const sessionJd = sessionStorage.getItem("jobDescription");
      if (sessionJd && isElectron) {
        router.push("/room");
        return;
      }

      checkProfile().then(async () => {
        // Sync name if missing in profile_data
        try {
          const res = await fetch("/api/profile");
          const { profile: p } = await res.json();
          if (!p?.full_name && user.fullName) {
             await fetch("/api/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                full_name: user.fullName 
              }),
            });
          }
        } catch {}
        setIsLoadingProfile(false);
      });
    } else if (isLoaded && !isSignedIn) {
      setIsLoadingProfile(false);
    }
  }, [isLoaded, isSignedIn, user, isElectron, router]);



  // If not mounted or Clerk not loaded yet, show empty shell
  if (!mounted || !isLoaded) {
    return <div className="min-h-screen bg-[#0a0a0c]" />;
  }

  // Double check auth (Middleware should handle this, but for safety)
  if (!isSignedIn) {
    router.push("/sign-in");
    return null;
  }

  const handleStart = async () => {
    if (!jd.trim()) return;
    
    if (!isElectron) {
      // On web, we don't allow entering the room, but we can save the JD for the app
      setIsInitiating(true);
      setStatusText("☁️ Syncing configurations to cloud...");
      
      try {
        const profileUpdate: any = {};
        if (saveJd) {
          profileUpdate.current_jd = jd.trim();
        }
        
        if (Object.keys(profileUpdate).length > 0) {
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profileUpdate),
          });
        }
        
        // Save to sessionStorage for immediate use
        sessionStorage.setItem("jobDescription", jd.trim());
        
        setStatusText("✅ Config Synced.");
        setTimeout(() => {
          setIsInitiating(false);
          setShowAppPrompt(true);
          // Try to launch app via deep link
          window.location.href = "chintu://open";
        }, 1500);
      } catch (err) {
        console.error("Failed to sync JD:", err);
        setIsInitiating(false);
      }
      return;
    }

    setIsInitiating(true);
    setStatusText("🚀 Preparing your interview workspace...");

    if (aboutMe.trim() && !hasProfile) {
      setIsRefining(true);
      setStatusText("✨ AI is structuring your profile...");

      // Save JD to Supabase if toggle is ON
      if (saveJd) {
        fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current_jd: jd.trim() }),
        }).catch(err => console.error("Failed to save JD:", err));
      }

      try {
        await fetch("/api/refine-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText: aboutMe.trim() }),
        });
        
        setStatusText("🎯 Finalizing workspace...");
        sessionStorage.setItem("jobDescription", jd.trim());
        router.push("/room?jd=" + encodeURIComponent(jd.trim()));
      } catch (err) {
        console.error("Failed to start refinement:", err);
        sessionStorage.setItem("jobDescription", jd.trim());
        router.push("/room?jd=" + encodeURIComponent(jd.trim()));
      }
    } else {
      setStatusText("🎯 Synchronizing with neural network...");
      
      // Save JD to Supabase if toggle is ON (for electron/desktop too)
      if (saveJd) {
        fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current_jd: jd.trim() }),
        }).catch(err => console.error("Failed to save JD:", err));
      }
      
      sessionStorage.setItem("jobDescription", jd.trim());
      router.push("/room?jd=" + encodeURIComponent(jd.trim()));
    }
  };

  const handleSkipAndStart = () => {
    if (!isElectron) {
      return;
    }
    
    // Save JD to Supabase if toggle is ON
    if (saveJd) {
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_jd: jd.trim() }),
      }).catch(err => console.error("Failed to save JD on skip:", err));
    }
    
    sessionStorage.setItem("jobDescription", jd.trim());
    router.push("/room?jd=" + encodeURIComponent(jd.trim()));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] text-gray-900 overflow-x-hidden overflow-y-auto">


      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-[2rem] border border-gray-100 shadow-xl flex items-center justify-center p-3 relative overflow-hidden group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image 
                src="https://www.getchintu.com/icon.png" 
                alt="Chintu" 
                className="w-full h-full object-contain relative z-10" 
                width={80} 
                height={80} 
                unoptimized 
              />
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase text-gray-900 leading-none">Chintu</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-2 text-center">AI Interview Assistant</p>
            {showJdOnly && (
               <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
                 <p className="text-xs font-bold text-indigo-700">Welcome back!</p>
                 <p className="text-[10px] text-indigo-600/70 font-bold uppercase tracking-wider mt-1">Enter your Job Description to continue.</p>
               </div>
            )}
          </div>

          <div className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-600 font-bold animate-in fade-in slide-in-from-top-2">
                ⚠️ {error}
                <button onClick={() => setError(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
              </div>
            )}

            {isLoadingProfile ? (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite]" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-2 w-16 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
              </div>
            ) : !hasProfile ? (
              <div className="space-y-2 animate-in fade-in duration-500">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Candidate Profile</label>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Paste your resume or tell about your experience..."
                  className="w-full h-32 bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-gray-300 shadow-sm"
                />
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-3 shadow-sm animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-600 text-lg">✓</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Profile Status</p>
                      <p className="text-sm font-bold text-emerald-700">Identity Loaded</p>
                    </div>
                  </div>
                  {userPlan !== "free" && (
                    <button 
                      onClick={() => {
                        setHasProfile(false);
                        setAboutMe("");
                        setShowJdOnly(false);
                      }}
                      className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200"
                    >
                      Reset
                    </button>
                  )}
                </div>
                {userPlan === "free" && (
                  <div className="pt-2 border-t border-emerald-100/50">
                    <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest leading-relaxed">
                      Starter plan limited to one-time profile. <button onClick={() => router.push("/pricing")} className="text-emerald-600 underline">Upgrade</button> to edit.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Job Description Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Job Description</label>
                {userPlan !== "free" && jd && (
                  <button 
                    onClick={() => setJd("")}
                    className="text-[9px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest"
                  >
                    Clear
                  </button>
                )}
                {isJdLocked && (
                  <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                    🔒 STARTER LIMIT
                  </span>
                )}
              </div>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                readOnly={isJdLocked}
                placeholder={isJdLocked ? "Upgrade to Pro to change Job Description" : "Paste the job description you are interviewing for..."}
                className={`w-full h-40 bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-gray-300 shadow-sm ${isJdLocked ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}`}
              />
              
              <div className="flex items-center gap-2 mt-3 px-1">
                {!isJdLocked && (
                  <>
                    <button 
                      onClick={() => setSaveJd(!saveJd)}
                      className={`w-10 h-5 rounded-full transition-all relative ${saveJd ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${saveJd ? 'left-6' : 'left-1'}`} />
                    </button>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Save JD for future sessions?</span>
                  </>
                )}
              </div>

              {isJdLocked && (
                <button 
                  onClick={() => router.push("/pricing")}
                  className="w-full py-2 text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  ✨ Unlock Unlimited JDs with Pro
                </button>
              )}
            </div>

            {/* Action Button */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleStart}
                disabled={!jd.trim() || (!hasProfile && !aboutMe.trim()) || isRefining}
                className={`
                  w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden group
                  ${jd.trim() && (hasProfile || aboutMe.trim()) && !isRefining
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  }
                `}
              >
                <span className="relative z-10">
                  {isRefining ? statusText : (isElectron ? "Initiate Session →" : "Sync & Start in App →")}
                </span>
                {jd.trim() && (hasProfile || aboutMe.trim()) && !isRefining && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                )}
              </button>

              {!isElectron && (
                <a
                  href="https://www.getchintu.com/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 active:scale-95 border border-indigo-100 shadow-sm text-center"
                >
                  Download Desktop App
                </a>
              )}

              {isRefining && (
                <button
                  onClick={handleSkipAndStart}
                  className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 active:scale-95 border border-indigo-100 shadow-sm"
                >
                  Skip & Start Interview
                  <p className="text-[8px] font-medium text-indigo-400 mt-0.5 tracking-normal normal-case">Profile will refine in background</p>
                </button>
              )}
            </div>

            <button 
              onClick={async () => {
                try {
                  setStatusText("Opening Billing Portal...");
                  setIsInitiating(true);
                  const res = await fetch("/api/create-portal-session", { method: "POST" });
                  const data = await res.json();
                  if (data.url) {
                    window.location.href = data.url;
                  } else {
                    alert(data.error || "Failed to load portal.");
                    setIsInitiating(false);
                  }
                } catch (err) {
                  console.error(err);
                  alert("Error loading billing portal.");
                  setIsInitiating(false);
                }
              }}
              disabled={isRefining || isInitiating}
              className="w-full py-3 mt-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 text-gray-400 hover:text-gray-900 hover:bg-gray-200"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-6 text-center opacity-40">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500">Secure Mode • Ghost Overlay Active</p>
      </div>

      {/* Full Page Loading Animation (Refining or Initiating) */}
      {(isRefining || isInitiating) && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-600/10 animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-2 rounded-full border-[3px] border-t-purple-600 border-purple-600/10 animate-[spin_1.5s_ease-in-out_infinite_reverse]"></div>
            <div className="absolute inset-4 rounded-full border-[3px] border-b-cyan-500 border-cyan-500/10 animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">
              {isInitiating ? "🚀" : "✨"}
            </div>
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 animate-pulse tracking-tight mb-3 text-center px-6">
            {statusText}
          </h2>
          <div className="flex gap-2 items-center mb-10">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
          <p className="text-[10px] text-gray-400 font-black tracking-[0.3em] uppercase text-center max-w-xs leading-relaxed opacity-60">
            {isInitiating ? "Initializing Ghost Interface" : "Calibrating Neural Synthesis"}
          </p>
          {/* Skip Button — navigate immediately, refining continues in background */}
          {isRefining && jd.trim() && (
            <button
              onClick={handleSkipAndStart}
              className="mt-8 px-8 py-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95 shadow-sm flex flex-col items-center gap-1"
            >
              <span>Skip & Start Interview</span>
              <span className="text-[8px] font-medium text-indigo-400 tracking-normal normal-case">Profile will refine in background</span>
            </button>
          )}
        </div>
      )}

      {/* App Prompt Overlay */}
      {showAppPrompt && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-[#f8f9fa] animate-in fade-in zoom-in duration-500">
          <div className="max-w-sm w-full px-8 text-center">
             <div className="relative w-32 h-32 mx-auto mb-10">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-[2.5rem] animate-pulse" />
                <div className="absolute inset-4 bg-white rounded-[2rem] shadow-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                   <Image 
                    src="https://www.getchintu.com/icon.png" 
                    alt="Chintu" 
                    width={60} 
                    height={60} 
                    unoptimized 
                   />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white w-8 h-8 rounded-full border-4 border-white flex items-center justify-center animate-bounce">
                   <span className="text-sm font-bold">✓</span>
                </div>
             </div>
             
             <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase mb-2 leading-none">Sync Complete!</h2>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed mb-10">
               Your interview workspace is ready. Launch the desktop app to begin.
             </p>
             
             <div className="space-y-3">
               <button 
                 onClick={() => window.location.href = "chintu://open"}
                 className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all"
               >
                 Launch Desktop App
               </button>
               
               <a 
                 href="https://www.getchintu.com/download" 
                 target="_blank"
                 rel="noopener noreferrer"
                 className="block w-full py-4 bg-white text-gray-400 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
               >
                 Download Chintu App
               </a>
             </div>
             
             <button 
               onClick={() => setShowAppPrompt(false)}
               className="mt-12 text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-indigo-500 transition-colors"
             >
               Return to Setup
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
