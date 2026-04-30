"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserButton, useUser } from "@clerk/nextjs";
import { createClient } from "@/utils/supabase/client";

export default function SetupPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const supabase = createClient();
  const [jd, setJd] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);
  
  const router = useRouter();

  // Handle hydration / Initial load
  useEffect(() => {
    setMounted(true);

    const checkProfile = async () => {
      // Fetch profile via secure backend API
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile: profileRow } = await res.json();
          if (profileRow?.profile_data && Object.keys(profileRow.profile_data).length > 0) {
            setHasProfile(true);
            if (profileRow.raw_profile) setAboutMe(profileRow.raw_profile);
          } else {
            setHasProfile(false);
          }
        }
      } catch (err) {
        console.error("Error fetching profile via API:", err);
      }
    };


    if (isLoaded && isSignedIn) {
      checkProfile().finally(() => setIsLoadingProfile(false));
    } else if (isLoaded && !isSignedIn) {
      setIsLoadingProfile(false);
    }
  }, [isLoaded, isSignedIn, user?.id, supabase]);

  const handleMinimize = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.minimize) {
      (window as any).electronAPI.minimize();
    }
  };

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
    setIsInitiating(true);
    setStatusText("🚀 Preparing your interview workspace...");

    if (aboutMe.trim() && !hasProfile) {
      setIsRefining(true);
      setStatusText("✨ AI is structuring your profile...");

      try {
        const res = await fetch("/api/refine-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText: aboutMe.trim() }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            // Save structured profile to Supabase via secure API
            await fetch("/api/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                profile_data: data.profile,
                raw_profile: aboutMe.trim(),
              })
            });
            setHasProfile(true);
          }
        } else {
          console.error("Profile refine API returned:", res.status);
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw_profile: aboutMe.trim() })
          });
        }
      } catch (err) {
        console.error("Profile refinement failed:", err);
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw_profile: aboutMe.trim() })
        });
      }

      setIsRefining(false);
    }
    
    setStatusText("🎯 Synchronizing with neural network...");
    // ALWAYS navigate to room — pass JD via URL param (sessionStorage is unreliable in Electron)
    window.location.href = "/room?jd=" + encodeURIComponent(jd.trim());
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] text-gray-900 overflow-x-hidden overflow-y-auto">
      {/* Header / Drag Region */}
      <div className="drag-region h-12 w-full shrink-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">System Online</span>
        </div>
        <div className="no-drag flex items-center gap-3">
          <button 
            onClick={handleMinimize}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-all active:scale-90"
            title="Minimize"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <div className="w-[1px] h-4 bg-gray-200 mx-1" />
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 drop-shadow-2xl">
              <Image src="/icon.png" alt="Chintu" width={80} height={80} className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-gray-900">Chintu</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 text-center">AI Interview Assistant</p>
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
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm animate-in zoom-in-95 duration-500">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 text-lg">✓</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Profile Status</p>
                  <p className="text-sm font-bold text-emerald-700">Identity Successfully Loaded</p>
                </div>
              </div>
            )}

            {/* Job Description Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Job Description</label>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description you are interviewing for..."
                className="w-full h-40 bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-gray-300 shadow-sm"
              />
            </div>

            {/* Action Button */}
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
              <span className="relative z-10">{isRefining ? statusText : "Initiate Session →"}</span>
              {jd.trim() && (hasProfile || aboutMe.trim()) && !isRefining && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              )}
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
        </div>
      )}
    </div>
  );
}
